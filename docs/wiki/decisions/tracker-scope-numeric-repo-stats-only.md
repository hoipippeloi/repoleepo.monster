---
type: Decision
title: "Tracker scope: numeric repo stats only"
description: "**Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork/archived flags, Git"
tags: [scope, data-model]
status: accepted
supersedes: "[]"
timestamp: "2026-10-05T17:42:57.887Z"
---

# Tracker scope: numeric repo stats only

**Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork/archived flags, GitHub created date, last push date. The user clarified the goal: only numeric repo popularity/collaboration stats over time — collaborators, stars, forks, "these kind of stats" — explicitly not dev/commit activity.

**Decision.** 2026-10-05: scope the tracker to numeric stats only.

- `repos` is a slim identity registry (GitHub id, full_name, owner, name, html_url, timestamps).
- `repo_snapshots` carries only numbers: stars, forks, open_issues, watchers, collaborators, size_kb.
- Collaborators is sourced as the public **contributor count** (per_page=1 + Link-header page count, 1 req/repo), because GitHub's true collaborator list requires push access to the repo.
- `FETCH_DETAILS` defaults ON so watchers + collaborators are captured by default; documented tradeoff (~1,600 repos/hour API budget) and off-switch for very large sets.
- Idempotent `DROP COLUMN IF EXISTS` / `ADD COLUMN IF NOT EXISTS` migrations keep any already-initialized DB in sync.

**Alternatives considered.**

- Keep metadata columns "just in case" — rejected: user explicitly excluded non-stat data; columns cost storage and dilute the stats-only contract.
- Use the true `collaborators` endpoint with contributor fallback — rejected: doubles request cost for every repo the account has no push access to (403s still count against rate limits).

**Consequences.** Dropped fields can't be recovered from history (nothing was ever written back), so re-adding later is safe if requirements change. Analysis queries and docs updated to match.
