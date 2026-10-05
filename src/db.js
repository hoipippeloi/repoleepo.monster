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
  snapshots_written INT NOT NULL DEFAULT 0,
  error             TEXT
);

CREATE TABLE IF NOT EXISTS repos (
  id                BIGINT PRIMARY KEY,
  full_name         TEXT NOT NULL UNIQUE,
  owner             TEXT NOT NULL,
  name              TEXT NOT NULL,
  html_url          TEXT,
  description       TEXT,
  language          TEXT,
  license           TEXT,
  topics            TEXT[] NOT NULL DEFAULT '{}',
  is_fork           BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived       BOOLEAN NOT NULL DEFAULT FALSE,
  github_created_at TIMESTAMPTZ,
  last_pushed_at    TIMESTAMPTZ,
  first_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS repos_owner_idx ON repos (owner);

CREATE TABLE IF NOT EXISTS repo_snapshots (
  id           BIGSERIAL PRIMARY KEY,
  repo_id      BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  run_id       TEXT   NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  stars        INT NOT NULL DEFAULT 0,
  forks        INT NOT NULL DEFAULT 0,
  open_issues  INT NOT NULL DEFAULT 0,
  watchers     INT,
  size_kb      INT
);
CREATE UNIQUE INDEX IF NOT EXISTS repo_snapshots_repo_run_uq ON repo_snapshots (repo_id, run_id);
CREATE INDEX IF NOT EXISTS repo_snapshots_captured_idx ON repo_snapshots (repo_id, captured_at DESC);
`;

export async function ensureSchema() {
  await getPool().query(SCHEMA);
  log('schema ensured');
}

const UPSERT_REPO = `
INSERT INTO repos (
  id, full_name, owner, name, html_url, description, language, license,
  topics, is_fork, is_archived, github_created_at, last_pushed_at, last_seen_at
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, now())
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  owner = EXCLUDED.owner,
  name = EXCLUDED.name,
  html_url = EXCLUDED.html_url,
  description = EXCLUDED.description,
  language = EXCLUDED.language,
  license = EXCLUDED.license,
  topics = EXCLUDED.topics,
  is_fork = EXCLUDED.is_fork,
  is_archived = EXCLUDED.is_archived,
  github_created_at = EXCLUDED.github_created_at,
  last_pushed_at = EXCLUDED.last_pushed_at,
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

// GitHub API repo object -> repos row values
export function toRepoRow(r) {
  const license = r.license && r.license.spdx_id && r.license.spdx_id !== 'NOASSERTION'
    ? r.license.spdx_id
    : null;
  return [
    r.id,
    r.full_name,
    (r.owner && r.owner.login) || '',
    r.name,
    r.html_url ?? null,
    r.description ?? null,
    r.language ?? null,
    license,
    r.topics ?? [],
    !!r.fork,
    !!r.archived,
    r.created_at ?? null,
    r.pushed_at ?? null,
  ];
}

// list response (+ optional detail response) -> snapshot metrics
export function toMetrics(r, detail) {
  const d = detail || {};
  return {
    stars: d.stargazers_count ?? r.stargazers_count ?? 0,
    forks: d.forks_count ?? r.forks_count ?? 0,
    openIssues: d.open_issues_count ?? r.open_issues_count ?? 0,
    watchers: d.subscribers_count ?? null,
    sizeKb: d.size ?? r.size ?? null,
  };
}

// Upsert a batch (repo rows + snapshots) in one transaction.
export async function flushBuffer(entries, runId) {
  if (!entries.length) return { created: 0, updated: 0 };
  const client = await getPool().connect();
  let created = 0;
  let updated = 0;
  try {
    await client.query('BEGIN');
    for (const { repoRow, metrics } of entries) {
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
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { created, updated };
}

export async function startRun(runId) {
  await getPool().query(
    `INSERT INTO runs (run_id, status) VALUES ($1, 'running')
     ON CONFLICT (run_id) DO UPDATE SET
       status = 'running', started_at = now(), finished_at = NULL, error = NULL,
       repos_seen = 0, repos_created = 0, repos_updated = 0, snapshots_written = 0`,
    [runId]
  );
  log(`run ${runId} started`);
}

export async function finishRun(runId, status, stats, error) {
  await getPool().query(
    `UPDATE runs SET status = $2, finished_at = now(), repos_seen = $3,
       repos_created = $4, repos_updated = $5, snapshots_written = $6, error = $7
     WHERE run_id = $1`,
    [runId, status, stats.seen, stats.created, stats.updated, stats.snapshots, error ?? null]
  );
  log(`run ${runId} ${status}`);
}
