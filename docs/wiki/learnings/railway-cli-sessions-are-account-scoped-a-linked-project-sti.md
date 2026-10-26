---
type: Learning
title: Railway CLI sessions are account-scoped — a linked project still fails all ops when logged in as the wrong account
description: "**Discovered 2026-10-05** while configuring [[github-repo-tracker]] via Railway CLI v5.62.1 (project 03d94f9a)."
tags: [railway, cli, devops, auth, gotcha]
timestamp: "2026-10-05T18:28:57.194Z"
---

# Railway CLI sessions are account-scoped — a linked project still fails all ops when logged in as the wrong account

**Discovered 2026-10-05** while configuring [[github-repo-tracker]] via Railway CLI v5.62.1 (project 03d94f9a).

**Gotcha:** the CLI session was logged in as a *different account* ("Patrick") that had no access to the project. `railway link` / `railway status` still worked (services listed fine: `repoleepo.monster` + `Postgres`), but log access was denied **and** variable operations were blocked — which looked like a stale or scope-limited token.

**Fix:** `railway login` re-auth in the browser as the workspace owner (**Hoi Pippeloi**) — everything worked immediately after.

**Rule of thumb:** after linking a project, "access denied" on logs + variables is NOT a token-scope problem — run `railway whoami` first and verify it's the workspace-owner account before debugging anything else. A linked project with a wrong-account session fails all project ops with misleading errors.
