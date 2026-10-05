---
type: Learning
title: Edit batches are atomic — a failed edit means nothing in that batch landed
description: "**Gotcha observed 2026-10-05** (scope-slim session on `src/db.js` + README): a multi-edit batch in which 2 of 4 edits failed to match left the other 2 edits **u"
tags: [testing, gotcha, editing, workflow]
timestamp: "2026-10-05T17:44:42.820Z"
---

# Edit batches are atomic — a failed edit means nothing in that batch landed

**Gotcha observed 2026-10-05** (scope-slim session on `src/db.js` + README): a multi-edit batch in which 2 of 4 edits failed to match left the other 2 edits **unapplied as well** — batches are atomic, not "apply the ones that match". The assistant initially assumed the matched edits had landed and had to re-check the file to discover they hadn't.

**Working method**: when any edit in a batch fails, treat the entire batch as failed — re-read the target file(s) and re-apply the survivors individually, rather than assuming partial success. Cheap to verify, expensive to assume.
