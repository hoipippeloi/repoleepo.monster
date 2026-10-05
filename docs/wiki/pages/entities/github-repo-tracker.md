---
type: Entity
title: GitHub Repo Tracker
description: Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing 
tags: [backend, data, railway, github]
timestamp: "2026-10-05T17:42:57.891Z"
---

# GitHub Repo Tracker

Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing to the project's Postgres over Railway private networking.

Scope (narrowed 2026-10-05): **numeric repo stats only** — collaborators, stars, forks, watchers, open issues (+ size). No repo metadata (description/language/topics), no dev/commit activity (push dates etc.). See [tracker-scope-numeric-repo-stats-only](../../decisions/tracker-scope-numeric-repo-stats-only.md).

Every Sunday (`0 3 * * 0` UTC) it pulls repos from configured sources, upserts identity into `repos`, and writes one `repo_snapshots` row per repo per run. Keyed by GitHub's stable repo id; same-day reruns are idempotent.

## Details

- **Location**: repo root of `E:/repoleepo.monster` — `src/` (6 modules), `sql/`, `Dockerfile`, `railway.json`, `README.md`. Remote: https://github.com/hoipippeloi/repoleepo.monster
- **Data model**: `repos` = slim identity registry (id, full_name, owner, name, html_url, timestamps); `repo_snapshots` = time series (stars, forks, open_issues, watchers, collaborators, size_kb; unique `(repo_id, run_id)`); `runs` = audit. Schema auto-applies with idempotent migrations (`DROP COLUMN IF EXISTS` / `ADD COLUMN IF NOT EXISTS`)
- **Collaborators stat**: GitHub gates true collaborator lists behind push access, so the app counts public **contributors** — one request via `contributors?per_page=1` + `Link` header `rel="last"` page number. Verified live: sindresorhus/awesome → 435, earendil-works/pi → 291
- **Interface**: `MODE=cron` (default) runs one harvest and exits cleanly (Railway cron requirement). `MODE=web` serves `/healthz` + `POST /run` (Bearer `RUN_TOKEN`)
- **Configuration**: `DATABASE_URL` (reference `${{ Postgres.DATABASE_URL }}`), `GITHUB_TOKEN`, `GITHUB_OWNERS` (no cap) / `GITHUB_SEARCH_QUERIES` (GitHub caps search at 1,000/query), `FETCH_DETAILS` (default ON — watchers + collaborators, 2 extra calls/repo ≈ 1,600 repos/hour)
- **Dependencies**: Node ≥ 20, single runtime dep `pg`; Dockerfile `node:22-slim`; ON_FAILURE restart policy (max 3)
- [railway-cron-internal-networking-pattern](../concepts/railway-cron-internal-networking-pattern.md) — deployment pattern it relies on

## Lifecycle

- First added: 2026-10-05 — built to track repo metrics over time for repoleepo.monster
- 2026-10-05 (later): scope narrowed to stats-only; metadata columns dropped, collaborators added (commit `2b6099d`)
- Verification: live GitHub dry-runs (owner + search sources, fork filtering, pagination), live fetchStats (watchers + contributor counts), web-mode auth checks; DB write path first exercised on first Railway deploy
