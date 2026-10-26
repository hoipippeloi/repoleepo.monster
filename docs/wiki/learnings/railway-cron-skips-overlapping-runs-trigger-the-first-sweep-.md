---
type: Learning
title: Railway cron skips overlapping runs — trigger the first sweep with a temporary */5 schedule
description: "**Discovered 2026-10-05** while writing the first-deployment runbook for the [[github-repo-tracker]] (the "get the data live in our db" checklist)."
tags: [railway, cron, ops, github-repo-tracker]
timestamp: "2026-10-05T18:17:16.898Z"
---

# Railway cron skips overlapping runs — trigger the first sweep with a temporary */5 schedule

**Discovered 2026-10-05** while writing the first-deployment runbook for the [[github-repo-tracker]] (the "get the data live in our db" checklist).

**Gotcha — Railway cron skips overlapping runs:** if a scheduled run is still `Active` when the next schedule fires, Railway skips the new run entirely (it does not queue it). Consequences:
- Never leave a high-frequency schedule (e.g. `*/5 * * * *`) running while the ~65–75 min sweep is in progress — most firings would be silently skipped.
- The weekly `0 3 * * 0` (Sunday 03:00 UTC) schedule is safe as long as sweeps finish well within a week.

**Trick — trigger the first run immediately:** after creating the service and setting variables, don't wait for the first scheduled Sunday. Temporarily set the cron to `*/5 * * * *`; the run starts within 5 minutes (watch `Deployments → Logs` for slice/progress lines). Then set `0 3 * * 0` back — but only after the run completes, per the skip quirk above.

**Supporting runbook facts** (already on the tracker entity page, verified this turn):
- A classic GitHub PAT with **no scopes** suffices (public data only) and is what lifts search from 10 to 30 req/min.
- The DB schema self-creates on first run — nothing to run in Postgres manually.
- `DATABASE_URL` is set as a Railway reference (`${{ Postgres.DATABASE_URL }}`) so traffic goes over private networking — see [[railway-cron-internal-networking]].
