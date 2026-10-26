---
type: Learning
title: Changing the sliced-search band freezes out-of-band repos — snapshots stop, history retained
description: "**Discovered 2026-10-05** while moving the [[github-repo-tracker]] query from `stars:>=50` to the `stars:50..5000` band."
tags: [github-repo-tracker, github-search, railway, coverage, gotcha]
timestamp: "2026-10-05T18:19:40.693Z"
---

# Changing the sliced-search band freezes out-of-band repos — snapshots stop, history retained

**Discovered 2026-10-05** while moving the [[github-repo-tracker]] query from `stars:>=50` to the `stars:50..5000` band.

Three non-obvious behaviors when changing the `GITHUB_SLICED_SEARCH` query band:

1. **Out-of-band repos freeze, they are not deleted.** Repos already stored whose star count moves above the band's top end (5,000★) stop being yielded by search, so they stop receiving new snapshot rows. Their historical snapshots remain intact in the DB — the series just goes stale/dangling. Nothing cleans them up.
2. **The band rides along in every slice.** The date-window slicer only rewrites the `created:` clause; any additional query terms (`stars:50..5000`) are carried into every slice unchanged. So narrowing coverage is purely an env-var edit, no code.
3. **A Railway variable edit redeploys but doesn't run.** Changing a variable redeploys the cron service, but a redeploy does **not** trigger a run on a cron service. The new band takes effect at the next scheduled run — use the temporary `*/5 * * * *` schedule trick ([[railway-cron-skips-overlapping-runs-trigger-the-first-sweep-]]) to fire a sweep immediately.

Also note the `stars:min..max` range syntax is what makes "exclude only mega-repos" cheap: 50..5000 excludes just ~3.2k repos vs the uncapped `>=50` corpus.
