# Rules

- [Verify endpoint semantics match the user's stated goal before building a data source](./verify-endpoint-semantics-match-the-user-s-stated-goal-befor.md) - The guideline
- [Stage Railway variables with --skip-deploys; deploy once deliberately after config is complete](./stage-railway-variables-with-skip-deploys-deploy-once-delibe.md) - **Guideline:** when configuring a Railway service whose deploy immediately *executes the job* (cron-style runners like the [[github-repo-tracker]]), stage varia
- [Bulk ingestion: one bad row must never abort the batch or the sweep](./bulk-ingestion-one-bad-row-must-never-abort-the-batch-or-the.md) - **Guideline.** Any bulk upsert/insert pipeline that sweeps an external source must be written so a single malformed or conflicting row cannot destroy throughput
