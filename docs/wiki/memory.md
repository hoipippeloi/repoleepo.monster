---
okf_version: "0.1"
---

<!-- wiki-memory:start -->
# Memory — the live contract

Auto-generated digest of the most recent conventions, decisions, rules and
development patterns, plus architecture and global patterns — newest first.
The actual files live in the wiki subfolders; follow the links (clickable in /wiki).
Regenerated on every wiki write and on wiki_mark_synced. Generated 2026-10-05T17:59:05.171Z.

## Recent Decisions

- [Tracker coverage threshold: all public repos with >50 stars](decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md) — Context (2026-10-05)
- [Tracker goal: harvest ALL public GitHub repos, not just the token account's](decisions/tracker-goal-harvest-all-public-github-repos-not-just-the-to.md) — Context (2026-10-05)
- [Tracker scope: numeric repo stats only](decisions/tracker-scope-numeric-repo-stats-only.md) — **Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork… (2026-10-05)

## Active Rules

- [Verify endpoint semantics match the user's stated goal before building a data source](rules/verify-endpoint-semantics-match-the-user-s-stated-goal-befor.md) — The guideline (2026-10-05)

## Recent Learnings — development patterns

- [GitHub search results: watchers_count equals stargazers_count (not real watchers)](learnings/github-search-results-watchers-count-equals-stargazers-count.md) — **Discovered 2026-10-05** while auditing the user's example fetch script for the [[github-repo-tracker]]. (2026-10-05)
- [Sliced-search sweep numbers: 142k-repo corpus fits weekly cron only with FETCH_DETAILS=0](learnings/sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro.md) — **Discovered 2026-10-05** during live feasibility measurement of the proposed large-corpus sweep (`created:>=2022-01-01 stars:>=100`) for th… (2026-10-05)
- [GitHub repo-list endpoint semantics: /user/repos vs /users/{owner}/repos vs /search](learnings/github-repo-list-endpoint-semantics-user-repos-vs-users-owne.md) — **Discovered 2026-10-05** when the user asked "are we fetching all repos from https://api.github.com/user/repos?" — these three endpoints lo… (2026-10-05)
- [Edit batches are atomic — a failed edit means nothing in that batch landed](learnings/edit-batches-are-atomic-a-failed-edit-means-nothing-in-that-.md) — **Gotcha observed 2026-10-05** (scope-slim session on `src/db.js` + README): a multi-edit batch in which 2 of 4 edits failed to match left t… (2026-10-05)
- [Git remote: github.com/hoipippeloi/repoleepo.monster](learnings/git-remote.md) — The workspace is published at **https://github.com/hoipippeloi/repoleepo.monster** — first push on 2026-10-05 created the `main` branch with… (2026-10-05)

## Architecture

- [File tree](architecture/file-tree.md) — Complete project file listing with per-file descriptions. (2026-10-05)

## Global Patterns

- [Railway Cron + Internal Networking Pattern](pages/concepts/railway-cron-internal-networking-pattern.md) — The Railway deployment pattern this project's tracker uses: services in the same project + environment can talk over private networking with… (2026-10-05)

<!-- wiki-memory:end -->
