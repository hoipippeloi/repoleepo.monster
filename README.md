# GitHub Repo Tracker

A tiny, cheap harvester that runs weekly on [Railway](https://railway.com), pulls repos from
the GitHub API, **upserts** them into your existing Postgres, and writes one **stats
snapshot per repo per run** — so every number (collaborators, stars, forks, watchers,
open issues) becomes a time series. Repo metadata and dev/commit activity are
intentionally not stored: numeric repo stats only.

Zero-config ops: the app creates its own schema on first run, is idempotent (re-running the
same day never duplicates data), and exits cleanly when done — exactly what Railway's Cron
services require. One runtime dependency (`pg`).

## How it gets data

Two source types, combinable via env vars:

| Source | Env var | Reach |
| --- | --- | --- |
| Your account | `GITHUB_SOURCE_SELF=1` + `GITHUB_TOKEN` | All **public** repos of the token's account via `/user/repos` — owned + collaborator + accessible org repos, paginated, no cap |
| Org/user repos | `GITHUB_OWNERS=vercel,facebook` | Every public repo of each login, paginated — **no result cap** |
| Search queries | `GITHUB_SEARCH_QUERIES=stars:>50000 language:rust` | Anything searchable — but GitHub caps search at **1,000 results per query** |

**Honest scope note:** "all repos on GitHub" isn't reachable through the API (hundreds of
millions of repos; search caps at 1,000 hits/query). If you want broad coverage, use many
tight queries (per language, per star band) — the tracker merges everything, and duplicates
across sources are deduplicated by GitHub repo id.

## Deploy next to your database on Railway

1. **Push this folder to a GitHub repo** and open your Railway project (the one containing
   the Postgres service).
2. **+ New → GitHub Repo** → select it. Railway builds the `Dockerfile` (config in
   `railway.json`).
3. **Add variables** on the new service:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{ Postgres.DATABASE_URL }}` — a *reference* to your DB service (type `${{` and use the autocomplete; replace `Postgres` with your DB service's real name). This uses the internal `*.railway.internal` hostname, so traffic never leaves the private network: no public exposure, no egress cost. |
   | `GITHUB_TOKEN` | A GitHub classic PAT. Use a **scopeless** PAT for public data; if you set `GITHUB_SOURCE_SELF=1`, any PAT authorized as you works — `/user/repos?visibility=public` only returns public repos. |
   | `GITHUB_SOURCE_SELF=1` and/or `GITHUB_OWNERS` and/or `GITHUB_SEARCH_QUERIES` | Sources — see table above. For "all my repos" tracking, just `GITHUB_SOURCE_SELF=1` + the token. |
4. **Settings → Cron Schedule**: `0 3 * * 0` — every **Sunday 03:00 UTC** (cron is UTC; 0 = Sunday). Adjust the hour to your taste.
5. **First run:** cron services wait for their schedule — to see it work immediately,
   either set the schedule temporarily to `* * * * *` (runs within 5 minutes; revert after)
   or run locally first (below). Watch the service's **Deployments → Logs**.

> If a previous execution is still `Active`, Railway skips the next scheduled run. This app
> closes its DB pool and exits when done, so that shouldn't happen — a full run of even
> 100k repos takes minutes.

### Deploying updates

Push to GitHub → Railway autodeploys. The schema uses `CREATE TABLE IF NOT EXISTS`, so
updates never touch existing data.

## Configuration reference

| Variable | Default | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | — (required) | Postgres connection string. Use `${{ Postgres.DATABASE_URL }}` on Railway. |
| `GITHUB_TOKEN` | empty | GitHub PAT. **Required for `GITHUB_SOURCE_SELF`**, recommended otherwise. |
| `GITHUB_SOURCE_SELF` | `0` | `1` = track all public repos of the token's own account (`/user/repos?visibility=public`). |
| `GITHUB_OWNERS` | empty | Comma/space-separated org + user logins. |
| `GITHUB_SEARCH_QUERIES` | empty | One GitHub search query per line (`;` also separates). |
| `INCLUDE_FORKS` | `0` | Also track forks. |
| `INCLUDE_ARCHIVED` | `1` | Keep snapshotting archived repos (keeps their history continuous). |
| `FETCH_DETAILS` | `1` | Per repo: 2 extra API calls → `watchers` (subscribers) + `collaborators` (contributor count). Turn off for very large sets (>50k repos). |
| `DRY_RUN` | `0` | List what *would* be upserted; no DB needed. Perfect for testing config. |
| `BATCH_SIZE` | `500` | Rows per DB transaction. |
| `MODE` | `cron` | `cron` = run once and exit. `web` = always-on server with manual trigger. |
| `RUN_TOKEN` | empty | Required `Authorization: Bearer` token for `POST /run` in web mode. |
| `PORT` | `8080` | Web mode listen port (Railway injects this). |

## Running it yourself

```bash
npm install

# 1. Test your source config against the live GitHub API (no DB involved):
DRY_RUN=1 GITHUB_OWNERS=vercel npm start

# 2. Run a real harvest locally against your Railway DB:
#    (grab DATABASE_PUBLIC_URL from the Postgres service's variables)
DATABASE_URL="postgres://...@...proxy.rlwy.net:.../railway" \
GITHUB_TOKEN=ghp_xxx \
GITHUB_SEARCH_QUERIES="stars:>10000 language:rust" \
npm start

# 3. Optional: always-on mode with a manual trigger endpoint
MODE=web RUN_TOKEN=some-secret npm start
curl -X POST -H "Authorization: Bearer some-secret" http://localhost:8080/run
```

## Data model

- **`repos`** — slim identity registry, one row per GitHub repo (keyed by GitHub's stable
  repo id): name, owner, URL. No metadata, no dev activity — just identity + timestamps.
- **`repo_snapshots`** — **the time series**: numeric stats only — `stars`, `forks`,
  `open_issues`, `watchers`, `collaborators`, `size_kb` per repo per run (`run_id` = UTC
  date). Unique on `(repo_id, run_id)`.
- **`runs`** — audit log per run: status, counts, errors.

> **Where "collaborators" comes from:** GitHub only exposes the true collaborator list to
> accounts with push access to a repo. For public tracking, the app counts public
> **contributors** instead — one request per repo (page-count trick on the contributors
> endpoint). For your own repos the two largely overlap.

Ready-made analysis queries (weekly deltas, top gainers, run history) live in
[`sql/queries.sql`](sql/queries.sql). Railway's dashboard can run them directly
(Postgres service → **Data** tab).

## Cost profile

- The cron service only exists for the minutes it runs each week — **pennies per month** on
  Railway's usage-based billing. The Postgres database is the one you already pay for.
- GitHub API is free; 5,000 req/h with a token covers ~1,600 repos/hour with
  `FETCH_DETAILS` on (3 calls per repo), or ~500k repos/hour with it off (1 call per
  100 repos).
- Storage: 100k repos ≈ 5.2M snapshot rows/year ≈ a few hundred MB. Fine on any plan;
  if you track millions of repos, consider pruning old snapshots.

## Project layout

```
├── src/
│   ├── index.js    # mode dispatcher (cron = run once & exit, web = HTTP)
│   ├── runner.js   # one harvest run: collect → upsert → snapshot → log
│   ├── github.js   # REST collector: pagination, rate limits, 2 source types
│   ├── db.js       # pg pool, schema, upserts, snapshots, run log
│   ├── web.js      # optional /healthz + POST /run server
│   └── config.js   # env parsing + validation
├── sql/
│   ├── schema.sql  # reference copy (app auto-applies it)
│   └── queries.sql # analysis recipes
├── Dockerfile
├── railway.json    # Dockerfile builder, start command, restart policy
└── .env.example
```
