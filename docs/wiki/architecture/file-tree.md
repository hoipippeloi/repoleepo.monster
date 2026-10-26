---
type: Artifact
title: File tree
description: Complete project file listing with per-file descriptions.
timestamp: "2026-10-12T07:48:11.188Z"
---

# File tree — descriptions updated 2026-10-26T10:48:00.871Z (commit 438ca3f: identity/blast-radius fix)
# Respects .wiki_ignore exclusions (node_modules, dist, build, .next, .cache, __pycache__, .DS_Store, wiki internals).
# [description] — shorthand summary of each file's function

.
├── .dockerignore — Docker build context exclusions
├── .env.example — Template for all [[github-repo-tracker]] env vars: DATABASE_URL (use the Railway reference ${{ Postgres.DATABASE_URL }}), GITHUB_TOKEN (classic PAT, no scopes; 60→5000 req/h), the three source vars (GITHUB_SOURCE_SELF, GITHUB_OWNERS, GITHUB_SEARCH_QUERIES), GITHUB_SLICED_SEARCH (requires created:>=DATE or A..B bound; supports star bands like stars:50..5000), filters (INCLUDE_FORKS=0, INCLUDE_ARCHIVED=1, FETCH_DETAILS=0, DRY_RUN), and web-mode vars (MODE=cron, RUN_TOKEN)
├── .gitignore — Git exclusion patterns
├── .mcp.json — MCP server configuration for agent tooling in this workspace
├── .pi/ — Pi coding agent's project-local state directory
│   └── todos/ — File-based todo storage for the pi agent (one markdown file per task, TODO-<hex>)
├── .wiki_ignore — Exclusion patterns for wiki staleness detection (wiki itself, build/cache dirs)
├── Dockerfile — Tracker container image: node:22-slim, single runtime dep pg
├── package.json — Node ≥20 project manifest (single runtime dependency: pg)
├── package-lock.json — Locked dependency tree
├── railway.json — Railway service config: cron schedule `0 3 * * 0` (Sundays 03:00 UTC), ON_FAILURE restart policy (max 3)
├── README.md — Tracker usage/setup documentation
├── docs/ — Project documentation root
│   └── wiki/ — OKF v0.1 knowledge wiki bundle documenting this project (index.md, overview.md, glossary.md, architecture/, log.md, last_updated.md, changelog/, pages/, wiki-viewer.html, wiki.js)
├── sql/ — [[github-repo-tracker]] database DDL/queries (applied to the project's Railway Postgres)
│   ├── schema.sql — Tables: repos (identity keyed by GitHub repo id alone; full_name intentionally NOT unique since 438ca3f — plain repos_full_name_idx only, delete+recreate lands a second row) and repo_snapshots (one metric row per repo per run; unique (repo_id, run_id)); runs (incl. repos_skipped); idempotent migrations (DROP CONSTRAINT repos_full_name_key, ADD COLUMN repos_skipped)
│   └── queries.sql — Supporting read queries
└── src/ — Tracker source (6 modules; see [[github-repo-tracker]])
    ├── index.js — Entry point: dispatches cron vs web mode
    ├── config.js — Env var parsing/validation (sources, filters, DB, token)
    ├── db.js — Postgres access: repo upserts (conflict on id), blast-radius-proof batch writes in flushBuffer (batch fail → rollback → per-row SAVEPOINT retry → skip + log into runs.repos_skipped), snapshot writes, run bookkeeping
    ├── github.js — GitHub API client: /user/repos, /users/{owner}/repos, search; auth + rate-limit handling
    ├── runner.js — Sweep orchestration incl. GITHUB_SLICED_SEARCH date-window slicing (every slice ≤ ~950 results, beating the 1,000-result search cap) and pacing (30 req/min with token); reports per-run stats incl. repos_skipped
    └── web.js — Optional MODE=web HTTP server: /healthz + POST /run (Bearer RUN_TOKEN)
