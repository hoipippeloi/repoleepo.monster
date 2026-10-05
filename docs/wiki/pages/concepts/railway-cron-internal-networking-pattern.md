---
type: Concept
title: Railway Cron + Internal Networking Pattern
description: "The Railway deployment pattern this project's tracker uses: services in the same project + environment can talk over private networking with zero config via int"
tags: [railway, devops, deployment]
timestamp: "2026-10-05T17:27:30.135Z"
---

# Railway Cron + Internal Networking Pattern

The Railway deployment pattern this project's tracker uses: services in the same project + environment can talk over private networking with zero config via internal DNS (`<service>.railway.internal`, Wireguard-encrypted, no public exposure, no egress cost).

## Key facts (verified against docs.railway.com, 2026-10-05)

- **Reference variables**: `${{ SERVICE_NAME.VAR }}` — e.g. set `DATABASE_URL = ${{ Postgres.DATABASE_URL }}` on the app service; the variables editor autocompletes. This copies the DB service's connection string, which uses the internal hostname.
- **Cron services**: Settings → "Cron Schedule", standard crontab, **UTC** (0 = Sunday). The service is expected to execute its task and **exit leaving no open resources** (close DB connections!) — otherwise subsequent scheduled runs are skipped while a deployment is `Active`.
- **Runs must be ≥ 5 minutes apart**; execution time can vary by a few minutes.
- **No "run now" button** for cron services — to trigger off-schedule, temporarily set the schedule to `* * * * *`, or run locally against the DB's `DATABASE_PUBLIC_URL`.
- **Restart policy**: `ON_FAILURE` with retries makes sense for cron (a failed weekly run retries immediately; idempotent runs make this safe), `NEVER` would wait a whole week.
- **TLS**: internal Postgres connections need no SSL; the public TCP proxy does (`ssl: { rejectUnauthorized: false }` in node-postgres).

## Source

- `https://docs.railway.com/cron-jobs.md` (docs pages are fetchable by appending `.md`)
- `src/db.js` (pool closes cleanly), `src/index.js` (exits after run), `railway.json`, `README.md` deploy guide
