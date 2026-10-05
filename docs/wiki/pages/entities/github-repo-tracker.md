---
type: Entity
title: GitHub Repo Tracker
description: Weekly GitHub repo harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing to the
tags: [backend, data, railway, github]
timestamp: "2026-10-05T17:27:30.135Z"
---

# GitHub Repo Tracker

Weekly GitHub repo harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing to the project's Postgres over Railway private networking.

Its role: turn GitHub repo metrics into a time series. Every Sunday (`0 3 * * 0` UTC) it pulls repos from configured sources, upserts them into `repos`, writes one `repo_snapshots` row per repo (stars, forks, open_issues, watchers, size_kb), and logs the run in `runs`. Keyed by GitHub's stable repo id, so renames and cross-source duplicates are deduplicated; same-day reruns are idempotent.

## Details

- **Location**: repo root of `E:/repoleepo.monster` — `src/` (6 modules), `sql/`, `Dockerfile`, `railway.json`, `README.md`
- **Interface**: `MODE=cron` (default) runs one harvest and exits cleanly (Railway cron requirement: process terminates, DB pool closed). `MODE=web` serves `/healthz` and `POST /run` (Bearer `RUN_TOKEN`) for manual triggering
- **Data model**: `repos` (current state), `repo_snapshots` (time series, unique `(repo_id, run_id)`), `runs` (audit). Schema auto-applies via `CREATE TABLE IF NOT EXISTS` — see `sql/schema.sql`, analysis recipes in `sql/queries.sql`
- **Configuration**: all env — `DATABASE_URL` (Railway reference `${{ Postgres.DATABASE_URL }}` for internal networking), `GITHUB_TOKEN`, `GITHUB_OWNERS` (org/user listing, no cap), `GITHUB_SEARCH_QUERIES` (capped at 1,000 results/query by GitHub), `FETCH_DETAILS`, `DRY_RUN`, `INCLUDE_FORKS`/`INCLUDE_ARCHIVED`
- **Dependencies**: Node ≥ 20, single runtime dep `pg`. Dockerfile on `node:22-slim`; `railway.json` sets ON_FAILURE restart policy (max 3) so a failed weekly run retries instead of waiting a week
- [railway-cron-internal-networking](../concepts/railway-cron-internal-networking-pattern.md) — deployment pattern it relies on

## Lifecycle

- First added: 2026-10-05 — built to track repo metrics over time for repoleepo.monster
- Verification: live GitHub dry-runs (owner + search sources, fork filtering, pagination), web-mode auth checks; DB path not exercised locally (no Docker/Postgres on the build machine) — first Railway deploy is the e2e test
