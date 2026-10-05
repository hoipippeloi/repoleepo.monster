---
type: System Overview
title: Overview
description: What this project contains and its structure.
timestamp: "2026-10-05T17:10:53.541Z"
---

# Overview

**repoleepo.monster** is a documentation-first project workspace. Its entire current content is a freshly scaffolded project knowledge wiki built on the [Open Knowledge Format](https://github.com/earendil-works/okf) (OKF v0.1) under `docs/wiki/`, together with the supporting state needed to keep that wiki healthy. There is no application source code yet: the repository is the knowledge base that will grow alongside — and ahead of — whatever code the project accumulates.

The workspace is organized around three top-level entries. `.pi/` is the pi coding agent's project-local state directory — currently just an empty `todos/` folder, where file-based task records (one markdown file per todo, identified as `TODO-<hex>`) will live as work items are created. `.wiki_ignore` is a gitignore-style pattern file that excludes paths from wiki staleness detection; it ignores the wiki itself (so wiki edits never mark the wiki stale) and common build/dependency/cache directories (`node_modules/`, `dist/`, `build/`, `.next/`, `.cache/`, `__pycache__/`, `.DS_Store`). `docs/` holds the wiki bundle itself.

Inside `docs/wiki/`, `index.md` is the entry point and links to the three top-level system documents: `overview.md` (this file), `glossary.md` (key terms), and `architecture/file-tree.md` (a complete annotated file listing). `pages/` holds the knowledge graph — three collections (`concepts/`, `entities/`, `artifacts/`) for abstract ideas, concrete named things, and deliverables respectively — seeded from the reference templates in `pages/TEMPLATES.md`. `log.md` records wiki changes, and `last_updated.md` carries the sync timestamp consumed by staleness detection.

The bundle was scaffolded by `/wiki:init` on 2026-10-05 and populated with its first real content in the same session. Conventions going forward: new knowledge is recorded via the `wiki_note_*` tools (or hand-written pages following `TEMPLATES.md`), pages cross-link with `[[wikilinks]]`, and `last_updated.md` is bumped whenever the wiki is brought back in sync with the rest of the workspace.
