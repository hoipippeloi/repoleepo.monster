---
type: Artifact
title: GitHub Repo Tracker go-live runbook
description: GitHub Repo Tracker go-live runbook
tags: [devops, railway, deployment, runbook]
timestamp: "2026-10-05T18:20:38.985Z"
---

# GitHub Repo Tracker go-live runbook

Step-by-step first-deployment checklist that puts the [github-repo-tracker](../entities/github-repo-tracker.md) live on Railway and starts the snapshot time series. Code is already pushed to `main` (remote: github.com/hoipippeloi/repoleepo.monster) — going live is purely Railway configuration.

## What it documents

- [github-repo-tracker](../entities/github-repo-tracker.md) — the service this runbook deploys and verifies
- [railway-cron-internal-networking-pattern](../concepts/railway-cron-internal-networking-pattern.md) — why `DATABASE_URL` is a Railway variable reference instead of a literal connection string

## The runbook

### A. Service already created? Just update the band

1. Service → **Variables** tab → `GITHUB_SLICED_SEARCH` = `created:>=2022-01-01 stars:50..5000`
2. Saving the variable triggers an automatic redeploy — no manual action needed. (Note: a redeploy ≠ a run; see the schedule step below.)

### B. Service not created yet — 4 steps inside the existing project

1. **+ New → GitHub Repo** → pick `repoleepo.monster`
2. **Variables** (3):
   - `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}` (autocomplete the DB's real service name)
   - `GITHUB_TOKEN` = a PAT (30 req/min search pacing; 10/min without)
   - `GITHUB_SLICED_SEARCH` = `created:>=2022-01-01 stars:50..5000`
3. **Settings → Cron Schedule** = `*/5 * * * *` temporarily — Railway cron skips overlapping runs, so a frequent temp schedule is the only way to fire the first sweep now (see learnings/railway-cron-skips-overlapping-runs)
4. **Deployments → Logs**: watch until `run … complete` — expect **~1.5–2h** for the first sweep of the ~257k-repo corpus. Then set the schedule to the production value `0 3 * * 0` (Sundays 03:00 UTC); from then on it's fully hands-off.

### C. Post-first-run verification

Postgres service → **Data** tab → `SELECT COUNT(*) FROM repo_snapshots;` — the count should be climbing toward ~257k. That confirms the DB write path end-to-end (first time it's exercised outside local dry-runs).

- **Format**: runbook checklist (markdown), this wiki page
- Generated from: 2026-10-05 go-live Q&A session ("how to get it live?")
