---
type: Learning
title: "Git remote: github.com/hoipippeloi/repoleepo.monster"
description: "The workspace is published at **https://github.com/hoipippeloi/repoleepo.monster** — first push on 2026-10-05 created the `main` branch with upstream tracking s"
tags: [github, git, railway, deployment, devops]
timestamp: "2026-10-05T17:35:14.136Z"
---

# Git remote: github.com/hoipippeloi/repoleepo.monster

The workspace is published at **https://github.com/hoipippeloi/repoleepo.monster** — first push on 2026-10-05 created the `main` branch with upstream tracking set up.

What's in the repo: `src/`, `sql/`, `Dockerfile`, `railway.json`, `README.md`, and the `docs/wiki` knowledge base. Excluded via gitignore: `node_modules/`, `.pi/`, and env files.

Why it matters: the intended deployment path is Railway "+ New → GitHub Repo" from this remote (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`, wiring `DATABASE_URL = ${{ Postgres.DATABASE_URL }}`), so GitHub `main` is the deploy source. When changing deploy-relevant files (`Dockerfile`, `railway.json`, `sql/schema.sql`), push to `main` for the changes to reach Railway.
