---
type: Learning
title: "Querying the internal-only Railway Postgres: ssh into the Postgres service; keys are account-scoped, ~ paths don't expand"
description: "**Discovered 2026-10-11** while trying to query run durations for the [[github-repo-tracker]] from a laptop against the Railway Postgres (project 03d94f9a):"
tags: [railway, ssh, postgres, windows, github-repo-tracker, diagnostics]
timestamp: "2026-10-12T07:46:15.143Z"
---

# Querying the internal-only Railway Postgres: ssh into the Postgres service; keys are account-scoped, ~ paths don't expand

**Discovered 2026-10-11** while trying to query run durations for the [[github-repo-tracker]] from a laptop against the Railway Postgres (project 03d94f9a):

- **The database is internal-only**: the Postgres service exposes no `DATABASE_PUBLIC_URL`, so no direct psql from outside. Intentional (private networking per [[railway-cron-internal-networking-pattern]]) — good posture, but it means DB queries must go through Railway.
- **`railway ssh` into the tracker container fails after a cron run** — the container is `exited` (see [[railway-cron-containers-exit-by-design-deployment-uptime-is-not-job-runtime]]). 
- **The reliable path: `railway ssh` into the Postgres service itself.** That container is always online and ships with `psql` inside, so you can run read queries against the internal DB without any public URL.
- **SSH keys are account-scoped.** `railway ssh` requires a public key registered to the *currently logged-in Railway account*; the machine's existing keys belonged to other accounts and were rejected. Generate a fresh dedicated key per account.
- **`~` does not expand in Railway CLI key-path arguments on Windows Git-Bash** — pass the Windows-native path (e.g. `C:\Users\<user>\.ssh\id_ed25519_railway`) instead of `~/.ssh/...`.

So the standing recipe for "query the prod DB from a laptop": register a dedicated ssh key on the right account → `railway ssh` the Postgres service → run psql inside.
