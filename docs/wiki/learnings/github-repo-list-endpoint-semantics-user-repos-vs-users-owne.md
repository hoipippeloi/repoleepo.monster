---
type: Learning
title: "GitHub repo-list endpoint semantics: /user/repos vs /users/{owner}/repos vs /search"
description: "**Discovered 2026-10-05** when the user asked "are we fetching all repos from https://api.github.com/user/repos?" — these three endpoints look interchangeable b"
tags: [github-api, endpoints, gotcha, repo-tracker]
timestamp: "2026-10-05T17:44:42.821Z"
---

# GitHub repo-list endpoint semantics: /user/repos vs /users/{owner}/repos vs /search

**Discovered 2026-10-05** when the user asked "are we fetching all repos from https://api.github.com/user/repos?" — these three endpoints look interchangeable but mean very different things:

- `GET /user/repos` — repos the **authenticated token itself** can access (own + collaborated-on + org repos, depending on token scope); **can include private repos**. The tracker does NOT use this.
- `GET /users/{owner}/repos?type=all&per_page=100&page=N` (fallback `GET /orgs/{owner}/repos`) — **public** repo list of a named login. Any login works, no special scope. This is what `GITHUB_OWNERS` drives (`collectRepos` in `src/github.js`). No result cap.
- `GET /search/repositories?q=...` — public search results, hard-capped by GitHub at **1,000 results per query**. This is what `GITHUB_SEARCH_QUERIES` drives.

**Implication if private repos are ever wanted**: would need a switch to `/user/repos` with a `repo`-scoped token (e.g. a `GITHUB_SOURCE_SELF=1` source type — proposed, not decided). Knock-on effects: the collaborators stat comes from the public **contributors** endpoint, which likely returns nothing for private repos, and private-repo stats would land in the same Postgres tables as public ones.

**Rule of thumb**: `/user/repos` answers "what can *I* see", `/users/{owner}/repos` answers "what does *that login* publicly have".
