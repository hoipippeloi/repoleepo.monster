---
type: Decision
title: "GITHUB_SLICED_SEARCH: date-window sliced search beats the 1,000-result cap"
description: "**Context.** [tracker-coverage-threshold-all-public-repos-with-50-stars](../decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md) picked the >"
tags: [github-repo-tracker, search-api, slicing, data-source, railway]
status: accepted
supersedes: "[]"
timestamp: "2026-10-05T18:12:22.196Z"
---

# GITHUB_SLICED_SEARCH: date-window sliced search beats the 1,000-result cap

**Context.** [tracker-coverage-threshold-all-public-repos-with-50-stars](../decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md) picked the >50★ corpus but its implementation plan was star-range sharding (`stars:50..60` recursive halving behind a `MIN_STARS` knob), flagged pending. GitHub search hard-caps **1,000 results per query**, and the [sweep-numbers learning](../learnings/sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro.md) showed monthly date slices are too coarse (mid-2025 runs ~2,200/month) while weekly slices fit. The same user turn that dropped collaborators unblocked implementation: "add the sliced-search source too".

**Decision.** 2026-10-05 (commit `b0f111e`): discovery is implemented as **`GITHUB_SLICED_SEARCH`** — a new source type in [[github-repo-tracker]]. Give it any query carrying a date bound (e.g. `GITHUB_SLICED_SEARCH=created:>=2022-01-01 stars:>=100`); it recursively splits the date window until every slice's `total_count` ≤ ~950, then pages each slice.

- **Why date windows over the planned star ranges**: the star threshold stays a plain query suffix (no dedicated code knob — the ≥50★ variant is the same env var with a different number); fixed date bounds keep the target set stable run-over-run (a rolling window would make repos age out, corrupting the time series); and slicing composes with any threshold.
- **Validated live**: Jun-2025 ≥100★ (2,226 repos, known over-cap) split adaptively 592 + 542 + (1,092 → re-split → 570 + 522) = **exactly 2,226 recovered, zero lost**, unauthenticated rate limits handled without a failure. Token paces 30 search-req/min.
- Suggested sweep: `created:>=2022-01-01 stars:>=100` ≈ 142,457 repos ≈ ~1,900 calls ≈ 65–75 min/week; the ≥50★ variant (~260k repos, ~2h/week) is the same variable with a lower threshold — user's call.

**Alternatives considered.**

- Star-range sharding (`MIN_STARS`) — the original plan; workable, but needs a bespoke knob and star ranges are dense only in the low hundreds; date windows generalize better.
- `GITHUB_SEARCH_QUERIES` alone — rejected: silently truncates at 1,000 results/query (the exact trap found in the user's example script).
- Archive/GH-events enumeration — rejected: far heavier and noisier than search slicing.

**Consequences.** Every run is a full re-sweep (~1h/week); Railway skips a cron run if the previous one is still Active, which is a non-issue at ~1h. `FETCH_DETAILS` must stay `0` at this scale (see [tracker-drops-collaborators](../decisions/tracker-drops-collaborators-fetch-details-back-to-opt-in-wat.md)).
