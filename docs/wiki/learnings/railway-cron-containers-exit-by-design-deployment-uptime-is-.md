---
type: Learning
title: Railway cron containers exit by design — deployment uptime is not job runtime
description: "**Gotcha observed 2026-10-11** when the user reported the [[github-repo-tracker]] "running for 28 hours and going" on Railway (project 03d94f9a):"
tags: [railway, cron, gotcha, diagnostics, github-repo-tracker]
timestamp: "2026-10-12T07:46:15.144Z"
---

# Railway cron containers exit by design — deployment uptime is not job runtime

**Gotcha observed 2026-10-11** when the user reported the [[github-repo-tracker]] "running for 28 hours and going" on Railway (project 03d94f9a):

The alarm was a misreading of the dashboard. Ground truth, in diagnosis order:

1. **Logs showed the job already finished**: `run 2026-10-11 success` — the Sunday cron sweep completed at 06:22 UTC with 260,093 snapshots, well inside the expected ~4h window.
2. **Container status `exited` is the healthy end-state for a cron service**, not a failure. The job container starts, runs the sweep, writes to Postgres, and exits. There is no long-lived process to find.
3. **Railway's displayed deployment uptime is how long the deployment has been live, not how long the job ran.** A weekly cron deployment sits "running"/live 24/7 between runs while the container inside it sits exited.

Complements [[railway-deploy-success-means-live-stable-not-job-done-and-old-deployments-crash-lines-linger]] (deploy status semantics): that one is about deploy status; this one is about container state and uptime between cron runs.

Verification pattern: check logs for a `run <date> success` line first, then confirm via run history in the DB — don't treat dashboard uptime as job progress.
