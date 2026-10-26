---
type: Learning
title: "Railway: deploy SUCCESS means live/stable, not job done — and old deployments' crash lines linger"
description: "**Gotcha observed 2026-10-05** while verifying the [[github-repo-tracker]]'s first live sweep on Railway (deployment `229160de`):"
tags: [railway, deployment, logging, verification, gotcha]
timestamp: "2026-10-05T18:36:22.094Z"
---

# Railway: deploy SUCCESS means live/stable, not job done — and old deployments' crash lines linger

**Gotcha observed 2026-10-05** while verifying the [[github-repo-tracker]]'s first live sweep on Railway (deployment `229160de`):

Three separate illusions made the deployment look broken/unfinished when it was healthy:

1. **Stale crash lines from the old deployment.** After setting config variables and redeploying, the "No sources configured" crash spam still visible came from the **old, pre-config deployment** — not the new one. Always identify *which deployment* you're reading logs from before diagnosing.
2. **Deploy status SUCCESS ≠ job progress.** For a cron-style runner, `SUCCESS` arrives as soon as the deployment is live and stable — the actual sweep runs *inside* it for hours. The deploy status tells you nothing about whether the job is progressing; **the logs are the source of truth**.
3. **Log-stream lag / filter gaps.** An apparent gap in log timestamps suggested the job had stalled; pulling the **raw log tail** (the filtered view was hiding rate-limit retry lines) showed it running fine.

Verification pattern that worked: link the service for logs → confirm the expected job-specific lines (slice/progress output) are flowing → check the `runs` table / DB row counts for ground truth (`SELECT COUNT(*) FROM repo_snapshots;`).
