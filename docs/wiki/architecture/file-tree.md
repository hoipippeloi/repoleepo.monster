---
type: Artifact
title: File tree
description: Complete project file listing with per-file descriptions.
timestamp: "2026-10-05T17:10:53.541Z"
---

# File tree — generated 2026-10-05T17:10:53.541Z
# Respects .wiki_ignore exclusions.
# [description] — shorthand summary of each file's function

.
├── .pi/ — Pi coding agent's project-local state directory
│   └── todos/ — File-based todo storage for the pi agent (one markdown file per task, TODO-<hex>); currently empty
├── docs/ — Project documentation root
│   └── wiki/ — OKF v0.1 knowledge wiki bundle documenting this project
│       ├── index.md — Wiki entry point; links to overview, file tree, glossary, and pages
│       ├── overview.md — System overview: what the project contains and how it is organized
│       ├── glossary.md — Key project terms and definitions
│       ├── architecture/ — Architecture documentation
│       │   └── file-tree.md — Artifact: complete annotated project file listing (this file)
│       ├── last_updated.md — Sync timestamp consumed by wiki staleness detection
│       ├── log.md — Running changelog of wiki updates
│       └── pages/ — Knowledge graph: concepts, entities, and artifacts
│           ├── index.md — Pages index linking the three collections
│           ├── TEMPLATES.md — Reference templates for Concept, Entity, and Artifact pages
│           ├── concepts/ — Abstract ideas, definitions, categories (empty, awaiting first pages)
│           ├── entities/ — Concrete named things: systems, tools, records (empty, awaiting first pages)
│           └── artifacts/ — Documents, diagrams, code files, deliverables (empty, awaiting first pages)
└── .wiki_ignore — Exclusion patterns for wiki staleness detection (wiki itself, build/cache dirs)
