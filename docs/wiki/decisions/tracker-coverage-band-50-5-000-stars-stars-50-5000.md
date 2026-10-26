---
type: Decision
title: "Tracker coverage band: 50–5,000 stars (stars:50..5000)"
description: "**Context.** [[github-repo-tracker]] had a coverage threshold of "all public repos with >50 stars" (implemented as `GITHUB_SLICED_SEARCH=created:>=2022-01-01 st"
tags: [github-repo-tracker, coverage, star-band, railway, config]
status: accepted
supersedes: tracker-coverage-threshold-all-public-repos-with-50-stars
timestamp: "2026-10-05T18:19:04.401Z"
---

# Tracker coverage band: 50–5,000 stars (stars:50..5000)

**Context.** [[github-repo-tracker]] had a coverage threshold of "all public repos with >50 stars" (implemented as `GITHUB_SLICED_SEARCH=created:>=2022-01-01 stars:>=50`). The user asked to cap the top end so mega-repos are excluded.

**Choice.** Switch the query to a star **band**: `GITHUB_SLICED_SEARCH=created:>=2022-01-01 stars:50..5000`. Pure env-var change on the Railway service — no code change; GitHub search supports `stars:min..max` ranges and the date-window slicer only rewrites the `created:` clause, so the band rides along in every slice.

**Measured cost (live, 2026-10-05).** The 50–5,000★ band since 2022-01-01 is **257,610 repos** — vs 260,820 for plain `>=50`, i.e. only **3,211 mega-repos above 5,000★** are excluded. Weekly sweep: ~2,600 result pages + slice probes ≈ **1.5–2h per Sunday run** at 30 req/min; still fits the weekly cron comfortably (see [[sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro]] for the earlier measurement).

**Alternatives considered.**
- Keep `>=50` uncapped — rejected: user explicitly wants the top end bounded.
- Hard cap in code — unnecessary; search-range syntax covers it with zero code.

**Consequences.**
- Already-stored repos that rise above 5,000★ stop being yielded: their snapshot rows freeze (history retained, no deletion) — see [[sliced-search-band-freezes-out-of-band-repos]].
- Editing the variable in Railway redeploys the service but does **not** trigger a run on a cron service; the band takes effect at the next scheduled run (or fire one early with the temporary `*/5 * * * *` trick).
- `.env.example` updated (commit `2a9db9a`) to show the band syntax.
