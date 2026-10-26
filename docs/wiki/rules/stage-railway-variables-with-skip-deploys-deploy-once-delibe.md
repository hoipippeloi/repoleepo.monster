---
type: Rule
title: Stage Railway variables with --skip-deploys; deploy once deliberately after config is complete
description: "**Guideline:** when configuring a Railway service whose deploy immediately *executes the job* (cron-style runners like the [[github-repo-tracker]]), stage varia"
tags: [railway, cli, devops, deployment, sequencing]
timestamp: "2026-10-05T18:28:57.195Z"
---

# Stage Railway variables with --skip-deploys; deploy once deliberately after config is complete

**Guideline:** when configuring a Railway service whose deploy immediately *executes the job* (cron-style runners like the [[github-repo-tracker]]), stage variables with `railway variable set KEY=VALUE --skip-deploys` and trigger the deploy once, deliberately, after ALL config is in place.

**When it applies:** any Railway config session on this project where a mid-config deploy would start the job in a known-bad state.

**Rationale (2026-10-05 go-live):** deploying right after setting `DATABASE_URL` + `GITHUB_SLICED_SEARCH` but *before* `GITHUB_TOKEN` would have launched a ~1.5–2h sweep running unauthenticated — GitHub search allows 10 searches/min with a PAT but only a trickle unauthenticated, so the run would crawl or mostly fail. One clean deploy with the token set is faster and avoids a wasted partial run polluting the snapshot table.

**Corollary:** order of operations is (1) stage all variables `--skip-deploys`, (2) get secrets in place, (3) single deploy, (4) only then set the production cron schedule in the dashboard.
