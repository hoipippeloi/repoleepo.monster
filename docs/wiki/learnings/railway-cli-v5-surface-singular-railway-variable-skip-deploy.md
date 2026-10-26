---
type: Learning
title: "Railway CLI v5 surface: singular `railway variable`, --skip-deploys flag, GraphQL `api` command, cron schedules via GraphQL"
description: "**Discovered 2026-10-05** while setting [[github-repo-tracker]] variables via Railway CLI v5.62.1; cron claim corrected same day."
tags: [railway, cli, devops, cron, graphql, reference]
timestamp: "2026-10-05T18:28:57.195Z"
---

# Railway CLI v5 surface: singular `railway variable`, --skip-deploys flag, GraphQL `api` command, cron schedules via GraphQL

**Discovered 2026-10-05** while setting [[github-repo-tracker]] variables via Railway CLI v5.62.1.

- **Singular command**: CLI v5 uses `railway variable` (the old plural `railway variables` form fails).
- **Stage without redeploying**: `railway variable set KEY=VALUE --skip-deploys` sets a variable *without* triggering the automatic redeploy that the dashboard editor always does.
- **Raw GraphQL escape hatch**: the CLI has a `railway api` command for arbitrary GraphQL against the Railway API — useful to probe what the CLI surface doesn't wrap.
- **Cron schedules ARE settable via GraphQL** (corrected 2026-10-05T18:38Z — an earlier version of this note claimed "dashboard-only, not exposed in the CLI or API at all"; that was wrong). There is no dedicated CLI subcommand, but `railway api` + the `serviceInstanceUpdate` mutation accepts a `cronSchedule` field (standard crontab string, UTC, 0 = Sunday) and returns `Boolean!`. Recipe: discover the field via introspection (`ServiceInstance.cronSchedule`), mutate it, then verify by querying `cronSchedule` + `nextCronRunAt` — Railway computes the next fire time itself (returned `2026-10-11T03:00:00.000Z` for `0 3 * * 0`), which confirms the schedule registered without touching the dashboard. Used to set the [[github-repo-tracker]] production schedule `0 3 * * 0` (see [[railway-cron-internal-networking-pattern]]).
- **Cron deploy timing** (confirmed live): a deploy of a cron service with **no schedule set** runs the job immediately; once a schedule exists, deploys wait for the next scheduled slot (here: Sundays 03:00 UTC) — consistent with the runbook's "a redeploy ≠ a run".
