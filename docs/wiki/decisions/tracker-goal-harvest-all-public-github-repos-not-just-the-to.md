---
type: Decision
title: "Tracker goal: harvest ALL public GitHub repos, not just the token account's"
description: Context
tags: [github, repo-tracker, scope, data-source, railway]
status: accepted
supersedes: "["pages/entities/github-repo-tracker"]"
timestamp: "2026-10-05T17:49:55.442Z"
---

# Tracker goal: harvest ALL public GitHub repos, not just the token account's

## Context

The user first asked to "store all public repos from https://api.github.com/user/repos each week", which was implemented as the `GITHUB_SOURCE_SELF=1` source (commit `f72a9b9`): fetch all public repos of the **token's own account**, same upsert + snapshot pipeline. The user then corrected the intent: **"no i want to get all github repos public from all users"** — the goal is every public repo on GitHub, not just their account's.

## The choice

Redefine [[github-repo-tracker]]'s source scope from "token account's repos" to **all public repos from all users**. `GITHUB_SOURCE_SELF` (f72a9b9) was built on a misread of intent and is demoted from "the chosen source" to, at most, an optional extra source — the primary source must target the whole public-repo space. Implementation is **pending** as of this decision.

## Alternatives considered

- **Keep `/user/repos` as the source** — rejected: it returns only what the token can access (own + collaborator + accessible org repos), fundamentally narrower than "all users".
- **Enumerate `/users/{owner}/repos` per owner** — rejected as primary: requires knowing every login up front; no way to enumerate all users via that endpoint.

## Rationale / hard constraint

GitHub offers **no endpoint that lists all public repos** (see learning *GitHub repo-list endpoint semantics*). The only global-ish surface is `GET /search/repositories`, which GitHub **hard-caps at 1,000 results per query**. So "all public repos" can only be approximated — e.g. many batched search queries (by stars ranges, creation dates, languages) or an external enumeration stream. The 1k/query ceiling is the binding constraint any implementation must design around; "fetch everything" is not literally achievable via the REST API.

## Consequences

- The tracker's "Sources" contract changes: search-query-based coverage becomes the primary mechanism, sized by how complete the user wants coverage to be vs. API rate limits.
- The [[github-repo-tracker]] entity page must be updated once the all-repos source is implemented (it currently documents `GITHUB_SOURCE_SELF` as "user's chosen source").
- Expect many more repos in `repos`/`repo_snapshots` — snapshot volume and runtime per weekly cron run need a size estimate before choosing query batching.
