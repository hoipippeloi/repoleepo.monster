---
type: Entity
title: GitHub Repo Tracker
description: Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing 
tags: [backend, data, railway, github]
timestamp: "2026-10-05T17:46:52.095Z"
---

# GitHub Repo Tracker

Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing to the project's Postgres over Railway private networking. Remote: https://github.com/hoipippeloi/repoleepo.monster

Scope: **numeric repo stats only** — collaborators, stars, forks, watchers, open issues (+ size). No repo metadata, no dev/commit activity. See [tracker-scope-numeric-repo-stats-only](./tracker-scope-numeric-repo-stats-only.md).

Every Sunday (`0 3 * * 0` UTC) it pulls repos from the configured sources, upserts identity into `repos`, and writes one `repo_snapshots` row per repo per run (stars, forks, open_issues, watchers, collaborators, size_kb; unique `(repo_id, run_id)`). Keyed by GitHub's stable repo id; same-day reruns are idempotent.

## Details

- **Location**: repo root of `E:/repoleepo.monster` — `src/` (6 modules), `sql/`, `Dockerfile`, `railway.json`, `README.md`
- **Sources** (combinable):
  - `GITHUB_SOURCE_SELF=1` → `GET /user/repos?visibility=public` — all public repos of the token's account (owned + collaborator + accessible org repos), paginated, no cap; requires `GITHUB_TOKEN` (validated at startup). Added commit `f72a9b9`
  - `GITHUB_OWNERS` → `/users/{owner}/repos` (fallback `/orgs/{owner}/repos`) — public repos of any login, no cap
  - `GITHUB_SEARCH_QUERIES` → `/search/repositories` — capped at 1,000 results/query by GitHub
- **Collaborators stat**: GitHub gates true collaborator lists behind push access, so the app counts public **contributors** — one request via `contributors?per_page=1` + `Link` header `rel="last"` page number. Verified live: sindresorhus/awesome → 435, earendil-works/pi → 291
- **Interface**: `MODE=cron` (default) runs one harvest and exits cleanly (Railway cron requirement). `MODE=web` serves `/healthz` + `POST /run` (Bearer `RUN_TOKEN`)
- **Configuration**: `DATABASE_URL` (reference `${{ Postgres.DATABASE_URL }}`), `GITHUB_TOKEN`, source vars above, `FETCH_DETAILS` (default ON — watchers + collaborators, 2 extra calls/repo ≈ 1,600 repos/hour)
- **Dependencies**: Node ≥ 20, single runtime dep `pg`; Dockerfile `node:22-slim`; ON_FAILURE restart policy (max 3)
- [railway-cron-internal-networking](./railway-cron-internal-networking.md) — deployment pattern it relies on

## Lifecycle

- First added: 2026-10-05 — built to track repo metrics over time for repoleepo.monster
- 2026-10-05: scope narrowed to stats-only; metadata columns dropped, collaborators added (`2b6099d`)
- 2026-10-05: `GITHUB_SOURCE_SELF` added — user's chosen source for weekly storage of their public repos (`f72a9b9`)
- Verification: live GitHub dry-runs (owner + search sources, fork filtering, pagination), live fetchStats (watchers + contributor counts), web-mode auth checks, endpoint sanity (`/user/repos` → 401 unauthenticated as expected). `/user/repos` live fetch pending the user's `GITHUB_TOKEN` in Railway; DB write path first exercised on first Railway deploy
