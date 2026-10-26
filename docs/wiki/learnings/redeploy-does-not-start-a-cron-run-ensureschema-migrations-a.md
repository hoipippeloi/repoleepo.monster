---
type: Learning
title: Redeploy does not start a cron run; ensureSchema migrations apply only at job start
description: "**Verified 2026-10-26** on the [[github-repo-tracker]] (Railway project `03d94f9a`, deployment `3da111c0`)."
tags: [railway, cron, migrations, ops, github-repo-tracker]
timestamp: "2026-10-26T10:47:36.122Z"
---

# Redeploy does not start a cron run; ensureSchema migrations apply only at job start

**Verified 2026-10-26** on the [[github-repo-tracker]] (Railway project `03d94f9a`, deployment `3da111c0`).

- With a cron schedule configured, **a redeploy does not immediately execute the job** — the new deployment waits for the next scheduled slot. (Distinct from the existing redeploy-kicks-a-run behavior when no schedule is set.)
- Schema migrations that live in the job's `ensureSchema` therefore apply **only when a run actually starts**. On Oct 26 the `DROP CONSTRAINT repos_full_name_key` migration was live in the deployment but the constraint still existed in the DB until a run was forced.
- Ops playbook that worked: deploy the migration → trigger one run via a temporary `*/10` schedule (same playbook as the `*/5` first-sweep trick; fires immediately) → verify the migration applied and writes flowing → revert to the production schedule (Sundays 03:00 UTC) and verify the revert.
- Same-day rerun idempotency makes this safe: the forced run doesn't corrupt data, it just applies the migration and starts the sweep.
