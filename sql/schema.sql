-- Reference copy of the database schema.
-- The app auto-applies this on every run (idempotent), so you normally never
-- run this by hand. Keep in sync with src/db.js SCHEMA.

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

-- Slim identity registry: GitHub repo id -> stable identity. All stats live
-- in repo_snapshots; nothing else about a repo is stored.
CREATE TABLE IF NOT EXISTS repos (
  id            BIGINT PRIMARY KEY,            -- GitHub repo id (stable across renames)
  full_name     TEXT NOT NULL UNIQUE,
  owner         TEXT NOT NULL,
  name          TEXT NOT NULL,
  html_url      TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS repos_owner_idx ON repos (owner);

-- The time series: one row per repo per run, numeric stats only.
CREATE TABLE IF NOT EXISTS repo_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  repo_id       BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  run_id        TEXT   NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  stars         INT NOT NULL DEFAULT 0,
  forks         INT NOT NULL DEFAULT 0,
  open_issues   INT NOT NULL DEFAULT 0,
  watchers      INT,                           -- subscribers; only when FETCH_DETAILS=1
  collaborators INT,                           -- contributor count proxy; only when FETCH_DETAILS=1
  size_kb       INT
);
CREATE UNIQUE INDEX IF NOT EXISTS repo_snapshots_repo_run_uq ON repo_snapshots (repo_id, run_id);
CREATE INDEX IF NOT EXISTS repo_snapshots_captured_idx ON repo_snapshots (repo_id, captured_at DESC);

-- Migrations for installs created before the stats-only scope (all idempotent).
ALTER TABLE repos DROP COLUMN IF EXISTS description;
ALTER TABLE repos DROP COLUMN IF EXISTS language;
ALTER TABLE repos DROP COLUMN IF EXISTS license;
ALTER TABLE repos DROP COLUMN IF EXISTS topics;
ALTER TABLE repos DROP COLUMN IF EXISTS is_fork;
ALTER TABLE repos DROP COLUMN IF EXISTS is_archived;
ALTER TABLE repos DROP COLUMN IF EXISTS github_created_at;
ALTER TABLE repos DROP COLUMN IF EXISTS last_pushed_at;
ALTER TABLE repo_snapshots ADD COLUMN IF NOT EXISTS collaborators INT;
