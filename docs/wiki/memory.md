---
okf_version: "0.1"
---

<!-- wiki-memory:start -->
# Memory — the live contract

Auto-generated digest of the most recent conventions, decisions, rules and
development patterns, plus architecture and global patterns — newest first.
The actual files live in the wiki subfolders; follow the links (clickable in /wiki).
Regenerated on every wiki write and on wiki_mark_synced. Generated 2026-10-05T17:44:42.826Z.

## Recent Decisions

- [Tracker scope: numeric repo stats only](decisions/tracker-scope-numeric-repo-stats-only.md) — **Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork… (2026-10-05)

## Recent Learnings — development patterns

- [GitHub repo-list endpoint semantics: /user/repos vs /users/{owner}/repos vs /search](learnings/github-repo-list-endpoint-semantics-user-repos-vs-users-owne.md) — **Discovered 2026-10-05** when the user asked "are we fetching all repos from https://api.github.com/user/repos?" — these three endpoints lo… (2026-10-05)
- [Edit batches are atomic — a failed edit means nothing in that batch landed](learnings/edit-batches-are-atomic-a-failed-edit-means-nothing-in-that-.md) — **Gotcha observed 2026-10-05** (scope-slim session on `src/db.js` + README): a multi-edit batch in which 2 of 4 edits failed to match left t… (2026-10-05)
- [Git remote: github.com/hoipippeloi/repoleepo.monster](learnings/git-remote.md) — The workspace is published at **https://github.com/hoipippeloi/repoleepo.monster** — first push on 2026-10-05 created the `main` branch with… (2026-10-05)

## Architecture

- [File tree](architecture/file-tree.md) — Complete project file listing with per-file descriptions. (2026-10-05)

## Global Patterns

- [Railway Cron + Internal Networking Pattern](pages/concepts/railway-cron-internal-networking-pattern.md) — The Railway deployment pattern this project's tracker uses: services in the same project + environment can talk over private networking with… (2026-10-05)

<!-- wiki-memory:end -->
