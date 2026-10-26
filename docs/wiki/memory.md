---
okf_version: "0.1"
---

<!-- wiki-memory:start -->
# Memory — the live contract

Auto-generated digest of the most recent conventions, decisions, rules and
development patterns, plus architecture and global patterns — newest first.
The actual files live in the wiki subfolders; follow the links (clickable in /wiki).
Regenerated on every wiki write and on wiki_mark_synced. Generated 2026-10-12T08:04:06.455Z.

## Recent Decisions

- [Tracker coverage band: 50–5,000 stars (stars:50..5000)](decisions/tracker-coverage-band-50-5-000-stars-stars-50-5000.md) — **Context.** [[github-repo-tracker]] had a coverage threshold of "all public repos with >50 stars" (implemented as `GITHUB_SLICED_SEARCH=cre… (2026-10-05)
- [GITHUB_SLICED_SEARCH: date-window sliced search beats the 1,000-result cap](decisions/github-sliced-search-date-window-sliced-search-beats-the-1-0.md) — **Context.** [tracker-coverage-threshold-all-public-repos-with-50-stars](../decisions/tracker-coverage-threshold-all-public-repos-with-50-st… (2026-10-05)
- [Tracker drops collaborators; FETCH_DETAILS back to opt-in watchers-only](decisions/tracker-drops-collaborators-fetch-details-back-to-opt-in-wat.md) — **Context.** [tracker-scope-numeric-repo-stats-only](../decisions/tracker-scope-numeric-repo-stats-only.md) (earlier the same day) kept a `c… (2026-10-05)
- [Tracker coverage threshold: all public repos with >50 stars](decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md) — Context (2026-10-05)
- [Tracker goal: harvest ALL public GitHub repos, not just the token account's](decisions/tracker-goal-harvest-all-public-github-repos-not-just-the-to.md) — Context (2026-10-05)
- [Tracker scope: numeric repo stats only](decisions/tracker-scope-numeric-repo-stats-only.md) — **Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork… (2026-10-05)

## Active Rules

- [Stage Railway variables with --skip-deploys; deploy once deliberately after config is complete](rules/stage-railway-variables-with-skip-deploys-deploy-once-delibe.md) — **Guideline:** when configuring a Railway service whose deploy immediately *executes the job* (cron-style runners like the [[github-repo-tra… (2026-10-05)
- [Verify endpoint semantics match the user's stated goal before building a data source](rules/verify-endpoint-semantics-match-the-user-s-stated-goal-befor.md) — The guideline (2026-10-05)

## Recent Learnings — development patterns

- [Railway cron skip-warning is cosmetic here — stuck "Running..." execution display doesn't block new runs (verified live)](learnings/railway-cron-skip-warning-is-cosmetic-here-stuck-running-exe.md) — **Verified live 2026-10-12** on the [[github-repo-tracker]] (project 03d94f9a), after the user spotted Railway's "Recent Executions" panel l… (2026-10-12)
- [Railway cron containers exit by design — deployment uptime is not job runtime](learnings/railway-cron-containers-exit-by-design-deployment-uptime-is-.md) — **Gotcha observed 2026-10-11** when the user reported the [[github-repo-tracker]] "running for 28 hours and going" on Railway (project 03d94… (2026-10-12)
- [Querying the internal-only Railway Postgres: ssh into the Postgres service; keys are account-scoped, ~ paths don't expand](learnings/querying-the-internal-only-railway-postgres-ssh-into-the-pos.md) — **Discovered 2026-10-11** while trying to query run durations for the [[github-repo-tracker]] from a laptop against the Railway Postgres (pr… (2026-10-12)
- [First live sweep baseline: 257.6k repos at ~1,000/min → 3.5–4.5h full sweep](learnings/first-live-sweep-baseline-257-6k-repos-at-1-000-min-3-5-4-5h.md) — **Measured 2026-10-05** during the [[github-repo-tracker]]'s first production sweep (query `created:>=2022-01-01 stars:50..5000`, deployment… (2026-10-05)
- [Railway: deploy SUCCESS means live/stable, not job done — and old deployments' crash lines linger](learnings/railway-deploy-success-means-live-stable-not-job-done-and-ol.md) — **Gotcha observed 2026-10-05** while verifying the [[github-repo-tracker]]'s first live sweep on Railway (deployment `229160de`): (2026-10-05)
- [Railway CLI v5 surface: singular `railway variable`, --skip-deploys flag, GraphQL `api` command, cron schedules via GraphQL](learnings/railway-cli-v5-surface-singular-railway-variable-skip-deploy.md) — **Discovered 2026-10-05** while setting [[github-repo-tracker]] variables via Railway CLI v5.62.1; cron claim corrected same day. (2026-10-05)
- [Railway CLI sessions are account-scoped — a linked project still fails all ops when logged in as the wrong account](learnings/railway-cli-sessions-are-account-scoped-a-linked-project-sti.md) — **Discovered 2026-10-05** while configuring [[github-repo-tracker]] via Railway CLI v5.62.1 (project 03d94f9a). (2026-10-05)
- [Changing the sliced-search band freezes out-of-band repos — snapshots stop, history retained](learnings/changing-the-sliced-search-band-freezes-out-of-band-repos-sn.md) — **Discovered 2026-10-05** while moving the [[github-repo-tracker]] query from `stars:>=50` to the `stars:50..5000` band. (2026-10-05)
- [Railway cron skips overlapping runs — trigger the first sweep with a temporary */5 schedule](learnings/railway-cron-skips-overlapping-runs-trigger-the-first-sweep-.md) — **Discovered 2026-10-05** while writing the first-deployment runbook for the [[github-repo-tracker]] (the "get the data live in our db" chec… (2026-10-05)
- [GitHub search results: watchers_count equals stargazers_count (not real watchers)](learnings/github-search-results-watchers-count-equals-stargazers-count.md) — **Discovered 2026-10-05** while auditing the user's example fetch script for the [[github-repo-tracker]]. (2026-10-05)
- [Sliced-search sweep numbers: 142k-repo corpus fits weekly cron only with FETCH_DETAILS=0](learnings/sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro.md) — **Discovered 2026-10-05** during live feasibility measurement of the proposed large-corpus sweep (`created:>=2022-01-01 stars:>=100`) for th… (2026-10-05)
- [GitHub repo-list endpoint semantics: /user/repos vs /users/{owner}/repos vs /search](learnings/github-repo-list-endpoint-semantics-user-repos-vs-users-owne.md) — **Discovered 2026-10-05** when the user asked "are we fetching all repos from https://api.github.com/user/repos?" — these three endpoints lo… (2026-10-05)
- [Edit batches are atomic — a failed edit means nothing in that batch landed](learnings/edit-batches-are-atomic-a-failed-edit-means-nothing-in-that-.md) — **Gotcha observed 2026-10-05** (scope-slim session on `src/db.js` + README): a multi-edit batch in which 2 of 4 edits failed to match left t… (2026-10-05)
- [Git remote: github.com/hoipippeloi/repoleepo.monster](learnings/git-remote.md) — The workspace is published at **https://github.com/hoipippeloi/repoleepo.monster** — first push on 2026-10-05 created the `main` branch with… (2026-10-05)

## Architecture

- [File tree](architecture/file-tree.md) — Complete project file listing with per-file descriptions. (2026-10-12)

## Global Patterns

- [Railway Cron + Internal Networking Pattern](pages/concepts/railway-cron-internal-networking-pattern.md) — The Railway deployment pattern this project's tracker uses: services in the same project + environment can talk over private networking with… (2026-10-05)

<!-- wiki-memory:end -->
