---
type: Decision
title: Repo identity is the GitHub id alone — full_name is not unique
description: "**Context.** On 2026-10-26, six consecutive weekly sweeps of the [[github-repo-tracker]] (Oct 18, 19, 20, 23, 24, 25) had failed at the same ~78,500-repo mark. "
tags: [schema, database, github, identity, github-repo-tracker]
status: accepted
timestamp: "2026-10-26T10:47:36.121Z"
---

# Repo identity is the GitHub id alone — full_name is not unique

**Context.** On 2026-10-26, six consecutive weekly sweeps of the [[github-repo-tracker]] (Oct 18, 19, 20, 23, 24, 25) had failed at the same ~78,500-repo mark. Root cause: a GitHub repo was deleted and recreated under the same name — the new repo got a **new id with the same `full_name`**. The upsert conflicted on `id` only, but `repos_full_name_key` (UNIQUE on `full_name`) rejected the entire 500-row batch, and the atomic batch aborted each sweep.

**Choice.** Identity is the GitHub repo id, alone. `UNIQUE(full_name)` was dropped (idempotent migration: `ALTER TABLE repos DROP CONSTRAINT IF EXISTS repos_full_name_key`) and replaced with a plain index `repos_full_name_idx`. A delete+recreate now simply becomes a second row in `repos`; nothing can crash on a name collision. Commit `438ca3f`, deployment `3da111c0`, constraint drop verified live in the DB.

**Alternatives considered.**
- Keep `UNIQUE(full_name)` and add a second conflict target to the upsert — rejected: Postgres `ON CONFLICT` handles one target per statement, and any reject-able constraint remains a latent sweep-killer.
- Reconcile by rewriting the old row's id when a name collision appears — rejected: GitHub's id is the authoritative identity; fabricating continuity would corrupt the per-repo snapshot series.

**Consequences.**
- `repos` may hold multiple rows sharing a `full_name` (stale id + live id after a delete+recreate; old name row after a rename).
- Consumers must join `repo_snapshots` by `repo_id` and treat the most recently `last_seen_at` row as live for a given name; name lookups use the plain index.
- Data quality from skipped rows is now visible via `runs.repos_skipped` — see the bulk-ingestion blast-radius rule.
