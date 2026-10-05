---
type: Rule
title: Verify endpoint semantics match the user's stated goal before building a data source
description: The guideline
tags: [github-api, requirements, data-source, communication, repo-tracker]
timestamp: "2026-10-05T17:49:55.442Z"
---

# Verify endpoint semantics match the user's stated goal before building a data source

## The guideline

When a user request names or pastes a specific API endpoint as the requirement, verify what that endpoint **actually returns** against the goal the user **describes** before implementing. Name similarity ≠ semantic match. If the two diverge, confirm the intended scope in one sentence before writing code.

## When it applies

Any time a user request translates into a data source or integration surface — especially configuring sources for the [[github-repo-tracker]], where sources are defined by GitHub endpoints and env vars.

## Rationale / evidence

2026-10-05, twice in one day on the same endpoint: the user asked for "all public repos from https://api.github.com/user/repos". `/user/repos` actually answers "*what can this token see*" (own + collaborator + accessible org repos) — it sounds like "repos of users" but isn't. The assistant implemented `GITHUB_SOURCE_SELF` (f72a9b9) fetching the token account's repos; the user then corrected: "no i want to get all github repos public from all users" — a fundamentally different scope. An earlier session had already produced the endpoint-semantics learning for the same confusion. Checking semantics-against-intent up front (one clarifying sentence) would have saved a built-and-reversed commit.

Rule of thumb from the learning: `/user/repos` = "what *I* can see", `/users/{owner}/repos` = "what *that login* publicly has", `/search/repositories` = "what matches this query (max 1,000)".
