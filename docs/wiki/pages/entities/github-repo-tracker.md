---
type: Entity
title: GitHub Repo Tracker
description: Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing 
tags: [backend, data, railway, github]
timestamp: "2026-10-26T10:47:57.456Z"
---

# GitHub Repo Tracker

Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing to the project's Postgres over Railway private networking. Remote: https://github.com/hoipippeloi/repoleepo.monster

Scope: **numeric repo stats only** — stars, forks, watchers, open issues (+ size). No repo metadata, no dev/commit activity, no collaborator data (dropped 2026-10-05). See [tracker-scope-numeric-repo-stats-only](../../decisions/tracker-scope-numeric-repo-stats-only.md) and [tracker-coverage-threshold-all-public-repos-with-50-stars](../../decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md).

Every Sunday (`0 3 * * 0` UTC) it pulls repos from the configured sources, upserts identity into `repos`, and writes one `repo_snapshots` row per repo per run (stars, forks, open_issues, watchers, size_kb; unique `(repo_id, run_id)`). **Identity is the GitHub repo id alone** — same-day reruns are idempotent, and since 2026-10-26 `full_name` is intentionally NOT unique (plain index only): a repo deleted+recreated under the same name legitimately lands as a second row. Batch writes are blast-radius-proof: a failed batch rolls back and retries row-by-row under SAVEPOINTs, skipping + logging bad repos into `runs.repos_skipped` instead of aborting the sweep — see [repo-identity-is-the-github-id-alone-full-name-is-not-unique](../../decisions/repo-identity-is-the-github-id-alone-full-name-is-not-unique.md) and [bulk-ingestion-one-bad-row-must-never-abort-the-batch-or-the](../../rules/bulk-ingestion-one-bad-row-must-never-abort-the-batch-or-the.md).

## Details

- **Location**: repo root of `E:/repoleepo.monster` — `src/` (6 modules), `sql/`, `Dockerfile`, `railway.json`, `README.md`
- **Sources** (combinable):
  - `GITHUB_SLICED_SEARCH` — broad sweeps beyond the 1,000-result search cap: queries with a `created:>=DATE` (or `A..B`) bound are recursively split into date ranges until every slice has ≤ ~950 results. Added commit `b0f111e`; validated live: Jun-2025 `stars:>=100` → slices 592+542+(1092→570+522) = 2,226 repos, exact match
  - `GITHUB_SOURCE_SELF=1` → `/user/repos?visibility=public` — public repos of the token's account; requires `GITHUB_TOKEN`
  - `GITHUB_OWNERS` → `/users/{owner}/repos` (fallback `/orgs/{owner}/repos`) — any login, no cap
  - `GITHUB_SEARCH_QUERIES` → capped at 1,000 results/query by GitHub
- **Search pacing**: 30 req/min with token, 10/min without (auto-adjusts). A full 142k-repo sweep ≈ 1,900 search calls ≈ 65–75 min/week — see [sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro](../../learnings/sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro.md)
- **Write path**: `src/db.js` `flushBuffer` — 500-row batch insert; on any batch failure: rollback → per-row `SAVEPOINT row_sp` replay → skip + log the bad repo, count it in `runs.repos_skipped`, keep sweeping (commit `438ca3f`, 2026-10-26)
- **Interface**: `MODE=cron` (default) runs once and exits cleanly. `MODE=web` serves `/healthz` + `POST /run` (Bearer `RUN_TOKEN`)
- **Configuration**: `DATABASE_URL` (reference `${{ Postgres.DATABASE_URL }}`), `GITHUB_TOKEN`, source vars, `FETCH_DETAILS` (opt-in, watchers-only, 1 call/repo — keep off for big sweeps)
- **Dependencies**: Node ≥ 20, single runtime dep `pg`; Dockerfile `node:22-slim`; ON_FAILURE restart policy (max 3)
- [railway-cron-internal-networking](../concepts/railway-cron-internal-networking-pattern.md) — deployment pattern it relies on

## Lifecycle

- First added: 2026-10-05 — built to track repo metrics over time for repoleepo.monster
- 2026-10-05: scope narrowed to stats-only (`2b6099d`); `/user/repos` self source added (`f72a9b9`)
- 2026-10-05: collaborators stat dropped (per user); `GITHUB_SLICED_SEARCH` added for the ≥100★-since-2022 sweep (`b0f111e`)
- 2026-10-11: first automatic weekly cron run succeeded end-to-end (fired 03:00 UTC, done 06:22, 3.4h, 260,093 snapshots; +3,145 new repos, 256,948 refreshed) — DB totals 517,856 snapshots / 260,908 distinct repos, both runs `success`. Tracker is proven hands-off. DB queries from a laptop go via `railway ssh` into the Postgres service (dedicated `repoleepo-tracker` SSH key registered to the account for this)
- 2026-10-18 → 10-25: six consecutive weekly runs failed at the identical ~78.5k-repo mark — one repo deleted+recreated under the same `full_name` tripped `UNIQUE(full_name)` and killed its whole 500-row batch every time (see [github-delete-recreate-same-full-name-new-repo-id-and-the-de](../../learnings/github-delete-recreate-same-full-name-new-repo-id-and-the-de.md))
- 2026-10-26: fix deployed (`438ca3f`, deployment `3da111c0`) — `UNIQUE(full_name)` dropped for plain `repos_full_name_idx`, SAVEPOINT row-by-row batch retry added, `runs.repos_skipped` added; constraint drop verified live. Recovery sweep `run 2026-10-26` started 10:40 UTC via temporary `*/10` schedule (then reverted and verified: Sundays 03:00 UTC, next Nov 1). Data note: last complete snapshot before the recovery run was Oct 12 — the recovery run refills everything as of Oct 26, so the weekly series continues cleanly from there
- Verification: live GitHub dry-runs for all four source types, sliced-search exact-count validation, web-mode auth checks; DB write path first exercised on first Railway deploy
