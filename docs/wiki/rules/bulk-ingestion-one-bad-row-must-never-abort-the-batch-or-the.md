---
type: Rule
title: "Bulk ingestion: one bad row must never abort the batch or the sweep"
description: **Guideline.** Any bulk upsert/insert pipeline that sweeps an external source must be written so a single malformed or conflicting row cannot destroy throughput
tags: [data-ingestion, postgres, reliability, pattern]
timestamp: "2026-10-26T10:47:36.121Z"
---

# Bulk ingestion: one bad row must never abort the batch or the sweep

**Guideline.** Any bulk upsert/insert pipeline that sweeps an external source must be written so a single malformed or conflicting row cannot destroy throughput:

1. Write in batches (speed).
2. On batch failure: roll back the batch, then replay **row-by-row inside a SAVEPOINT** (`SAVEPOINT row_sp` … `ROLLBACK TO SAVEPOINT row_sp` on error).
3. Skip + log the bad rows and count them in a per-run counter (the tracker uses `runs.repos_skipped`), so skips are visible instead of silent.
4. Keep sweeping.

**When it applies.** Data ingestion from external APIs where one record's constraint violation, shape change, or encoding must not cost the whole run. Reference implementation: `flushBuffer` in `src/db.js` of the [[github-repo-tracker]] (commit `438ca3f`).

**Rationale.** Because batches commit atomically (the same principle as [[edit-batches-are-atomic-a-failed-edit-means-nothing-in-that-]]), one poisoned row killed its entire 500-row batch and aborted six consecutive weekly sweeps (Oct 18–25, 2026) at the identical ~78.5k mark before the fix. Blast-radius isolation turns a run-killing poison row into a logged skip.
