---
okf_version: "0.1"
---

# Project Knowledge Wiki

<!-- wiki-nav:start -->
## Navigation map

Auto-generated detailed index of every docs/wiki/ concept — the map the LLM uses to locate information. 15 concept(s). Regenerated on init and on wiki_mark_synced. Generated 2026-10-05T18:09:09.414Z.

Each entry: [title](concept-id.md) — description. Links are clickable in /wiki; pass the concept-id (link target minus .md) to wiki_get.

### Core concepts

- [Glossary](glossary.md) — Key terms for this project.
- [Overview](overview.md) — What this project contains and its structure.

### Architecture

- [File tree](architecture/file-tree.md) — Complete project file listing with per-file descriptions.

### Pages

- [Railway Cron + Internal Networking Pattern](pages/concepts/railway-cron-internal-networking-pattern.md) — The Railway deployment pattern this project's tracker uses: services in the same project + environment can talk over private networking with zero config via int
- [GitHub Repo Tracker](pages/entities/github-repo-tracker.md) — Weekly GitHub repo stats harvester deployed as a Railway **Cron service** inside the existing project (project `03d94f9a-ab01-420f-8509-9c06dbd2f9cd`), writing
- [Page Templates](pages/TEMPLATES.md) — Reference templates for Concept, Entity, and Artifact pages. Follow these when using wiki_note_page.

### Decisions

- [Tracker coverage threshold: all public repos with >50 stars](decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md) — Context
- [Tracker goal: harvest ALL public GitHub repos, not just the token account's](decisions/tracker-goal-harvest-all-public-github-repos-not-just-the-to.md) — Context
- [Tracker scope: numeric repo stats only](decisions/tracker-scope-numeric-repo-stats-only.md) — **Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork/archived flags, Git

### Rules

- [Verify endpoint semantics match the user's stated goal before building a data source](rules/verify-endpoint-semantics-match-the-user-s-stated-goal-befor.md) — The guideline

### Learnings

- [Edit batches are atomic — a failed edit means nothing in that batch landed](learnings/edit-batches-are-atomic-a-failed-edit-means-nothing-in-that-.md) — **Gotcha observed 2026-10-05** (scope-slim session on `src/db.js` + README): a multi-edit batch in which 2 of 4 edits failed to match left the other 2 edits **u
- [Git remote: github.com/hoipippeloi/repoleepo.monster](learnings/git-remote.md) — The workspace is published at **https://github.com/hoipippeloi/repoleepo.monster** — first push on 2026-10-05 created the `main` branch with upstream tracking s
- [GitHub repo-list endpoint semantics: /user/repos vs /users/{owner}/repos vs /search](learnings/github-repo-list-endpoint-semantics-user-repos-vs-users-owne.md) — **Discovered 2026-10-05** when the user asked "are we fetching all repos from https://api.github.com/user/repos?" — these three endpoints look interchangeable b
- [GitHub search results: watchers_count equals stargazers_count (not real watchers)](learnings/github-search-results-watchers-count-equals-stargazers-count.md) — **Discovered 2026-10-05** while auditing the user's example fetch script for the [[github-repo-tracker]].
- [Sliced-search sweep numbers: 142k-repo corpus fits weekly cron only with FETCH_DETAILS=0](learnings/sliced-search-sweep-numbers-142k-repo-corpus-fits-weekly-cro.md) — **Discovered 2026-10-05** during live feasibility measurement of the proposed large-corpus sweep (`created:>=2022-01-01 stars:>=100`) for the [[github-repo-trac
<!-- wiki-nav:end -->

An [OKF](https://github.com/earendil-works/okf) bundle documenting this project.

- [Overview](./overview.md) — What this project contains and its structure
- [File tree](./architecture/file-tree.md) — Complete project file listing
- [Glossary](./glossary.md) — Key terms for this project
- [Pages](./pages/) — Concepts, entities, and artifacts of this project
