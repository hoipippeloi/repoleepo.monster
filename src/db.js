// Postgres layer: schema auto-creation, repo upserts, weekly metric snapshots,
// and a run log. One snapshot set per UTC day (run_id = date) makes reruns
// on the same day idempotent.

import pg from 'pg';
import { config } from './config.js';

const log = (...a) => console.log(new Date().toISOString(), '[db]', ...a);

let pool;

export function getPool() {
  if (!pool) {
    const url = config.databaseUrl;
    const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
    const isInternal = url.includes('.railway.internal');
    pool = new pg.Pool({
      connectionString: url,
      max: 5,
      // Railway's internal network needs no TLS; the public TCP proxy does.
      ssl: isInternal || isLocal ? false : { rejectUnauthorized: false },
    });
    pool.on('error', (err) => log('idle client error:', err.message));
  }
  return pool;
}

export async function close() {
  if (pool) {
    await pool.end();
    pool = undefined;
    log('pool closed');
  }
}

// Keep sql/schema.sql in sync with this string — this one is what actually runs.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS runs (
  run_id            TEXT PRIMARY KEY,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at       TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'running',
  repos_seen        INT NOT NULL DEFAULT 0,
  repos_created     INT NOT NULL DEFAULT 0,
  repos_updated     INT NOT NULL DEFAULT 0,
  repos_skipped     INT NOT NULL DEFAULT 0,
  snapshots_written INT NOT NULL DEFAULT 0,
  error             TEXT
);

-- Slim identity registry: GitHub repo id -> stable identity. All stats live in
-- repo_snapshots; nothing else about a repo is stored.
-- full_name is NOT unique: GitHub repos can be deleted and recreated under the
-- same name (new id, same name). Identity is the GitHub id alone.
CREATE TABLE IF NOT EXISTS repos (
  id            BIGINT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  owner         TEXT NOT NULL,
  name          TEXT NOT NULL,
  html_url      TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS repos_owner_idx ON repos (owner);
CREATE INDEX IF NOT EXISTS repos_full_name_idx ON repos (full_name);

-- The time series: one row per repo per run, numeric stats only.
CREATE TABLE IF NOT EXISTS repo_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  repo_id       BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  run_id        TEXT   NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  stars         INT NOT NULL DEFAULT 0,
  forks         INT NOT NULL DEFAULT 0,
  open_issues   INT NOT NULL DEFAULT 0,
  watchers      INT,
  size_kb       INT
);
CREATE UNIQUE INDEX IF NOT EXISTS repo_snapshots_repo_run_uq ON repo_snapshots (repo_id, run_id);
CREATE INDEX IF NOT EXISTS repo_snapshots_captured_idx ON repo_snapshots (repo_id, captured_at DESC);

-- Migrations for installs created before later changes (all idempotent).
ALTER TABLE repos DROP CONSTRAINT IF EXISTS repos_full_name_key;
CREATE INDEX IF NOT EXISTS repos_full_name_idx ON repos (full_name);
ALTER TABLE repos DROP COLUMN IF EXISTS description;
ALTER TABLE repos DROP COLUMN IF EXISTS language;
ALTER TABLE repos DROP COLUMN IF EXISTS license;
ALTER TABLE repos DROP COLUMN IF EXISTS topics;
ALTER TABLE repos DROP COLUMN IF EXISTS is_fork;
ALTER TABLE repos DROP COLUMN IF EXISTS is_archived;
ALTER TABLE repos DROP COLUMN IF EXISTS github_created_at;
ALTER TABLE repos DROP COLUMN IF EXISTS last_pushed_at;
ALTER TABLE repo_snapshots DROP COLUMN IF EXISTS collaborators;
ALTER TABLE runs ADD COLUMN IF NOT EXISTS repos_skipped INT NOT NULL DEFAULT 0;
`;

export async function ensureSchema() {
  await getPool().query(SCHEMA);
  log('schema ensured');
}

const UPSERT_REPO = `
INSERT INTO repos (id, full_name, owner, name, html_url, last_seen_at)
VALUES ($1,$2,$3,$4,$5, now())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  owner = EXCLUDED.owner,
  name = EXCLUDED.name,
  html_url = EXCLUDED.html_url,
  last_seen_at = now(),
  updated_at = now()
RETURNING (xmax = 0) AS inserted
`;

const UPSERT_SNAPSHOT = `
INSERT INTO repo_snapshots (repo_id, run_id, stars, forks, open_issues, watchers, size_kb)
VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (repo_id, run_id) DO UPDATE SET
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks,
  open_issues = EXCLUDED.open_issues,
  watchers = EXCLUDED.watchers,
  size_kb = EXCLUDED.size_kb,
  captured_at = now()
`;

// GitHub API repo object -> repos row values (identity only)
export function toRepoRow(r) {
  return [
    r.id,
    r.full_name,
    (r.owner && r.owner.login) || '',
    r.name,
    r.html_url ?? null,
  ];
}

// list response (+ optional stats pass) -> snapshot metrics. Numeric only.
export function toMetrics(r, extra) {
  const e = extra || {};
  return {
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    openIssues: r.open_issues_count ?? 0,
    watchers: e.watchers ?? null,
    sizeKb: r.size ?? null,
  };
}

// Upsert a batch (repo rows + snapshots) in one transaction. If any single row
// fails the batch (e.g. a full_name that switched GitHub id after a
// delete+recreate), roll back and retry row-by-row so one odd repo can never
// kill the whole sweep — bad rows are skipped and reported.
export async function flushBuffer(entries, runId) {
  if (!entries.length) return { created: 0, updated: 0, skipped: 0 };
  const client = await getPool().connect();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const writeOne = async ({ repoRow, metrics }) => {
    const { rows } = await client.query(UPSERT_REPO, repoRow);
    if (rows[0].inserted) created++;
    else updated++;
    await client.query(UPSERT_SNAPSHOT, [
      repoRow[0],
      runId,
      metrics.stars,
      metrics.forks,
      metrics.openIssues,
      metrics.watchers,
      metrics.sizeKb,
    ]);
  };

  try {
    await client.query('BEGIN');
    try {
      for (const entry of entries) await writeOne(entry);
      await client.query('COMMIT');
    } catch (batchErr) {
      await client.query('ROLLBACK');
      created = 0;
      updated = 0;
      log(`batch write failed (${batchErr.message.split('\n')[0]}) — retrying ${entries.length} rows individually`);
      await client.query('BEGIN');
      for (const entry of entries) {
        await client.query('SAVEPOINT row_sp');
        try {
          await writeOne(entry);
          await client.query('RELEASE SAVEPOINT row_sp');
        } catch (rowErr) {
          await client.query('ROLLBACK TO SAVEPOINT row_sp');
          skipped++;
          log(`skipped repo ${entry.repoRow[1]} (id ${entry.repoRow[0]}): ${rowErr.message.split('\n')[0]}`);
        }
      }
      await client.query('COMMIT');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
  return { created, updated, skipped };
}

export async function startRun(runId) {
  await getPool().query(
    `INSERT INTO runs (run_id, status) VALUES ($1, 'running')
     ON CONFLICT (run_id) DO UPDATE SET
       status = 'running', started_at = now(), finished_at = NULL, error = NULL,
       repos_seen = 0, repos_created = 0, repos_updated = 0, repos_skipped = 0, snapshots_written = 0`,
    [runId]
  );
  log(`run ${runId} started`);
}

export async function finishRun(runId, status, stats, error) {
  await getPool().query(
    `UPDATE runs SET status = $2, finished_at = now(), repos_seen = $3,
       repos_created = $4, repos_updated = $5, repos_skipped = $6,
       snapshots_written = $7, error = $8
     WHERE run_id = $1`,
    [runId, status, stats.seen, stats.created, stats.updated, stats.skipped, stats.snapshots, error ?? null]
  );
  log(`run ${runId} ${status}`);
}
