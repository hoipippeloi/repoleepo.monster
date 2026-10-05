-- Reference copy of the database schema.
-- The app auto-applies this on every run (CREATE TABLE IF NOT EXISTS), so you
-- normally never run this by hand. Keep in sync with src/db.js SCHEMA.

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
  id                BIGINT PRIMARY KEY,          -- GitHub repo id (stable across renames)
  full_name         TEXT NOT NULL UNIQUE,
  owner             TEXT NOT NULL,
  name              TEXT NOT NULL,
  html_url          TEXT,
  description       TEXT,
  language          TEXT,
  license           TEXT,                        -- SPDX id, e.g. MIT
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

-- One row per repo per run: this is the time series of all numerical data.
CREATE TABLE IF NOT EXISTS repo_snapshots (
  id           BIGSERIAL PRIMARY KEY,
  repo_id      BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  run_id       TEXT   NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  stars        INT NOT NULL DEFAULT 0,
  forks        INT NOT NULL DEFAULT 0,
  open_issues  INT NOT NULL DEFAULT 0,
  watchers     INT,                             -- only populated when FETCH_DETAILS=1
  size_kb      INT
);
CREATE UNIQUE INDEX IF NOT EXISTS repo_snapshots_repo_run_uq ON repo_snapshots (repo_id, run_id);
CREATE INDEX IF NOT EXISTS repo_snapshots_captured_idx ON repo_snapshots (repo_id, captured_at DESC);
