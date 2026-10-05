---
type: Learning
title: "Sliced-search sweep numbers: 142k-repo corpus fits weekly cron only with FETCH_DETAILS=0"
description: "**Discovered 2026-10-05** during live feasibility measurement of the proposed large-corpus sweep (`created:>=2022-01-01 stars:>=100`) for the [[github-repo-trac"
tags: [github, search-api, rate-limits, scaling, github-repo-tracker, slicing]
timestamp: "2026-10-05T17:59:05.163Z"
---

# Sliced-search sweep numbers: 142k-repo corpus fits weekly cron only with FETCH_DETAILS=0

**Discovered 2026-10-05** during live feasibility measurement of the proposed large-corpus sweep (`created:>=2022-01-01 stars:>=100`) for the [[github-repo-tracker]] — this quantifies the open size/FETCH_DETAILS questions left in [[tracker-coverage-threshold-all-public-repos-with-50-stars]].

## Measured corpus sizes (live, 2026-10-05)

- `created:>=2022-01-01 stars:>=100` → **142,457 repos**
- `created:>=2022-01-01 stars:>=50` → 260,820 repos
- One month slice (Jan 2022, ≥100★) → 2,735 repos; mid-2025 runs ~2,200/month → **monthly slices are too coarse** (each exceeds the 1,000-result cap), **weekly slices fit**
- Star-range splitting (the technique recorded in the coverage decision) and **date-window slicing** are the two complementary axes; recursive halving until every slice's `total_count` ≤ ~950.

## Cost model for a full weekly sweep

- ~1,420 result pages + ~300–500 probe requests ≈ **~1,900 search calls** → at the search API's 30 req/min ≈ **65–75 min per sweep** — fits the existing Sunday cron, but search-request pacing must be added.
- Storage: 142k repos × 52 weekly snapshots ≈ 7.4M rows/year — trivial for the project Postgres.

## The real constraint: FETCH_DETAILS at scale

- Watchers + contributor counts cost 2 calls/repo → ~284k calls/week for 142k repos ≈ **57 h on one 5,000 req/h token — infeasible weekly.**
- Realistic options: `FETCH_DETAILS=0` for big sweeps (stats-only sweep costs ~3 calls/min — effectively free), keep details for a smaller/higher-threshold set, or spread the detail pass over ~8 tokens (~7 h).

## Gotchas observed in the user's example script

- A **rolling** window (`created:>=today-730d`) makes the target move every run — repos age out of the set. Slices and sweeps must use **fixed date bounds** (e.g. `created:>=2022-01-01`) for stable time-series and deterministic slicing.
- The script saved only page 1 of search results: its query matched 642 repos but it silently wrote 100. Any sliced-search implementation must page and/or slice — never trust a single search page.
