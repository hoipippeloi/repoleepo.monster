---
type: Glossary
title: Glossary
description: Key terms for this project.
timestamp: "2026-10-05T17:10:53.541Z"
---

# Glossary

| Term | Definition |
|------|------------|
| OKF (Open Knowledge Format) | File-based wiki convention (v0.1): markdown documents with YAML frontmatter (`type`, `title`, `description`, `timestamp`) organized into an indexable bundle. This project's wiki is an OKF bundle. |
| Wiki bundle | The complete `docs/wiki/` tree — entry point `index.md`, system docs, and the `pages/` knowledge graph. |
| pi | The coding agent harness working in this workspace. Stores project-local state under `.pi/` and provides the wiki tools that read and write this bundle. |
| `.pi/todos/` | File-based todo storage for pi — one markdown file per task, identified as `TODO-<hex>`. Currently empty. |
| `.wiki_ignore` | Gitignore-style pattern file listing paths excluded from wiki staleness detection (the wiki itself plus common build/cache directories). |
| Staleness detection | Mechanism comparing workspace changes against `docs/wiki/last_updated.md` (honoring `.wiki_ignore`) to flag when the wiki is out of date. |
| Concept | Wiki page type for abstract ideas, definitions, and categories. Collected in `pages/concepts/`. |
| Entity | Wiki page type for concrete named things — systems, tools, records. Collected in `pages/entities/`. |
| Artifact | Wiki page type for documents, diagrams, and deliverables. Collected in `pages/artifacts/`. |
| Wikilink | `[[slug]]` cross-reference syntax in wiki pages, auto-converted to markdown links between pages. |
| `/wiki:init` | The pi command that scaffolded this bundle on 2026-10-05. |
