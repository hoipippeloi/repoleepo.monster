---
type: Learning
title: "GitHub delete+recreate: same full_name, new repo id — and the deterministic death-zone tell"
description: "**Discovered 2026-10-26** while post-morteming six consecutive failed sweeps of the [[github-repo-tracker]] (Oct 18/19/20/23/24/25, each dying at ~78–79k repos)"
tags: [github, data-quality, diagnostics, github-repo-tracker]
timestamp: "2026-10-26T10:47:36.122Z"
---

# GitHub delete+recreate: same full_name, new repo id — and the deterministic death-zone tell

**Discovered 2026-10-26** while post-morteming six consecutive failed sweeps of the [[github-repo-tracker]] (Oct 18/19/20/23/24/25, each dying at ~78–79k repos).

- GitHub permits a repo to be **deleted and recreated under the same `full_name`**; the recreated repo gets a brand-new repo id. Any pipeline treating `full_name` as a stable key will eventually break — identity must be the repo id (see the identity decision).
- **Diagnostic tell:** when repeated runs fail at the *exact same offset/record*, that is a data signature, not an infra one. Rate limits, network blips, and OOMs land at random points; a poisoned record lands in the same place every time. Six runs dying at the identical ~78.5k mark pinpointed one specific repo immediately.
- Fixed in commit `438ca3f`: `UNIQUE(full_name)` dropped, SAVEPOINT row-by-row batch retry added, `runs.repos_skipped` tracks skips.
