---
type: Learning
title: Railway cron skip-warning is cosmetic here — stuck "Running..." execution display doesn't block new runs (verified live)
description: "**Verified live 2026-10-12** on the [[github-repo-tracker]] (project 03d94f9a), after the user spotted Railway's "Recent Executions" panel listing the Oct 11 ru"
tags: [railway, cron, ops, gotcha, verified-live, github-repo-tracker]
timestamp: "2026-10-12T08:04:06.447Z"
---

# Railway cron skip-warning is cosmetic here — stuck "Running..." execution display doesn't block new runs (verified live)

**Verified live 2026-10-12** on the [[github-repo-tracker]] (project 03d94f9a), after the user spotted Railway's "Recent Executions" panel listing the Oct 11 run as "Running... 1d 4h" despite logs + DB proving it finished.

**Finding: the stuck "Running..." execution display is cosmetic and does NOT block new cron executions.**

- Railway's docs warn: *"if a previous execution is still running when the next scheduled execution is due, Railway will skip the new cron job."*
- Empirically that warning did not bite: the Oct 11 run fired even though Oct 5's deployment was still listed as "Running", and a live test fired a run within 10 minutes of a schedule change (`run 2026-10-12 started` at 08:00 UTC) while the panel still showed the last execution as "Running... 1d 4h".
- Why: the job process genuinely exits ([[railway-cron-containers-exit-by-design-deployment-uptime-is-not-job-runtime]]); only the deployment *record* stays "Running". Railway restarts the deployment on schedule regardless of that display.

**This relaxes the earlier caveat** in [[railway-cron-skips-overlapping-runs-trigger-the-first-sweep-with-a-temporary-5-schedule]]: you do NOT need to wait for a triggered run to finish before reverting the schedule. The safe manual-trigger procedure is: temporarily set a short schedule (e.g. `*/5 * * * *`) → watch logs for `run <date> started` → immediately revert to `0 3 * * 0`. The in-flight run completes fine afterward.

**Side effect observed:** the test triggered a bonus full sweep (`run 2026-10-12`, ~3.4h). Harmless and useful — logs showed `created=0, updated=500`: every repo already existed, so the run purely added a second weekly snapshot point (Oct 5 → Oct 11 → Oct 12 → weekly). Idempotency prevents duplicates by design.

**Ops source of truth:** ignore the execution panel's "Running..." state between runs; judge by the logs (`run <date> success`) and the `runs` table.

Complements [[railway-cron-internal-networking]] (the pattern page whose skip-bullet this empirically nuances).
