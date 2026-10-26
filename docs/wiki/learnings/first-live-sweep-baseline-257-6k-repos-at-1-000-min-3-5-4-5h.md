---
type: Learning
title: "First live sweep baseline: 257.6k repos at ~1,000/min → 3.5–4.5h full sweep"
description: "**Measured 2026-10-05** during the [[github-repo-tracker]]'s first production sweep (query `created:>=2022-01-01 stars:50..5000`, deployment `229160de`):"
tags: [github, railway, sweep, performance, baseline]
timestamp: "2026-10-05T18:36:22.094Z"
---

# First live sweep baseline: 257.6k repos at ~1,000/min → 3.5–4.5h full sweep

**Measured 2026-10-05** during the [[github-repo-tracker]]'s first production sweep (query `created:>=2022-01-01 stars:50..5000`, deployment `229160de`):

- **Corpus**: 257,618 repos detected live (matches the go-live runbook's estimate of ~257,610).
- **Adaptive slicing works in production**: oversized ranges auto-split while running (e.g. 1,187 → 649 + 538), so nothing hits GitHub's 1,000-result search cap.
- **Pace**: ~1,000 repos/min *including DB writes* → first sweep ETA **3.5–4.5 hours**, notably slower than the runbook's 1.5–2h estimate. Use ~4h as the planning number for a full ~257k sweep.
- **Rate limiting**: pacing at 30 search-req/min with the PAT, no 403 storms observed.
- **Write path**: schema auto-created on first run; `seen=created=snapshots` counts climbing in lockstep; each run logged in the `runs` table.

This complements the pre-deployment feasibility numbers in learnings/sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cron-only-with-fetch-details-0 — those measured a different query; these are the production band's real numbers. Useful baseline for judging whether a *later* weekly sweep is abnormally slow.
