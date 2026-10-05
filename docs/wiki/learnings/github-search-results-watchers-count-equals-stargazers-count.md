---
type: Learning
title: "GitHub search results: watchers_count equals stargazers_count (not real watchers)"
description: "**Discovered 2026-10-05** while auditing the user's example fetch script for the [[github-repo-tracker]]."
tags: [github, gotcha, search-api, data-quality, github-repo-tracker]
timestamp: "2026-10-05T17:59:05.163Z"
---

# GitHub search results: watchers_count equals stargazers_count (not real watchers)

**Discovered 2026-10-05** while auditing the user's example fetch script for the [[github-repo-tracker]].

In GitHub **search results** (`GET /search/repositories`), the `watchers_count` field is a long-standing GitHub quirk: it **always equals `stargazers_count`** — it is not the real watcher/subscriber count.

Consequences for this project:

- Do not read `watchers_count` from search payloads and store it as the `watchers` snapshot value — it would silently duplicate `stars` in `repo_snapshots`.
- True watchers (subscribers) are only available from the **per-repo detail endpoint** (`GET /repos/{owner}/{repo}`, field `subscribers_count`), i.e. only when `FETCH_DETAILS` is on.

Same class of trap as the collaborators gating recorded in [[tracker-scope-numeric-repo-stats-only]]: GitHub's list/search endpoints report placeholder values that look real but aren't — verify field semantics against the detail endpoint before storing them.
