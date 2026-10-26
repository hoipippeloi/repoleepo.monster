---
type: Decision
title: Tracker drops collaborators; FETCH_DETAILS back to opt-in watchers-only
description: "**Context.** [tracker-scope-numeric-repo-stats-only](../decisions/tracker-scope-numeric-repo-stats-only.md) (earlier the same day) kept a `collaborators` snapsh"
tags: [github-repo-tracker, scope, data-model, schema-change]
status: accepted
supersedes: tracker-scope-numeric-repo-stats-only
timestamp: "2026-10-05T18:12:02.554Z"
---

# Tracker drops collaborators; FETCH_DETAILS back to opt-in watchers-only

**Context.** [tracker-scope-numeric-repo-stats-only](../decisions/tracker-scope-numeric-repo-stats-only.md) (earlier the same day) kept a `collaborators` snapshot stat — sourced as the public contributor count — and set `FETCH_DETAILS` to default-ON (2 calls/repo: watchers + contributors). The user then instructed: "drop collaborators only repo data" — remove collaborators, keep the rest of the numeric-stats contract.

**Decision.** 2026-10-05 (commit `b0f111e`):

- `collaborators` is removed from the schema and code; an idempotent `DROP COLUMN IF EXISTS` migration keeps any already-initialized DB in sync.
- `FETCH_DETAILS` reverts to **opt-in** (`0` default) and now fetches **watchers only** (1 call/repo, no contributor-count Link-header trick).
- Snapshot contract is now exactly: **stars, forks, open_issues, watchers, size_kb** — five numbers, zero per-repo detail calls by default.

**Alternatives considered.**

- Keep the contributor-count fallback — rejected: the user explicitly excluded collaborator data, and dropping it saves 1 req/repo on every detail pass.
- Keep the column but stop writing it — rejected: dead columns mislead analysis queries and dilute the stats-only contract (same reasoning as the original metadata drop).

**Consequences.** For the planned 142k-repo sweep, `FETCH_DETAILS=0` keeps the weekly run at ~1,900 search calls (~65–75 min); the detail pass at scale remains infeasible (~28h/week), so big sweeps must keep details off. As before, re-adding a dropped stat later cannot backfill history — snapshots are write-once per run.
