---
type: Decision
title: "Tracker coverage threshold: all public repos with >50 stars"
description: Context
tags: [github, repo-tracker, scope, coverage-threshold, search-api, railway]
status: accepted
supersedes: "["tracker-goal-harvest-all-public-github-repos-not-just-the-to"]"
timestamp: "2026-10-05T17:53:46.578Z"
---

# Tracker coverage threshold: all public repos with >50 stars

## Context

The prior decision [[tracker-goal-harvest-all-public-github-repos-not-just-the-to|Tracker goal: harvest ALL public GitHub repos]] left implementation **pending**, with coverage sizing explicitly flagged as the open question ("sized by how complete the user wants coverage to be vs. API rate limits"). It also established the hard constraint: GitHub has no endpoint listing all public repos, and `GET /search/repositories` hard-caps at **1,000 results per query**.

In this session the user answered that question directly: **"then get all repos with more than 50 stars."** As of this decision, no code has landed yet (`src/` unchanged) — this records the chosen criterion, not a completed implementation.

## The choice

[[github-repo-tracker]]'s weekly discovery target is: **all public GitHub repos with more than 50 stars** (for all users, not just the token account). Implementation will be search-based (`stars:>50` in `GITHUB_SEARCH_QUERIES` or an equivalent dedicated source), refining the "all public repos" goal into an achievable corpus.

## Alternatives considered

- **Literal "all public repos"** — not implementable via the REST API (prior decision's constraint); hundreds of millions of repos with no enumeration endpoint.
- **`stars:>0` sharding** — rejected for now: vastly larger corpus (tens of millions) for marginal value; 50 stars is the user's chosen quality bar.
- **Keep per-owner sources as primary** — rejected: cannot enumerate all logins up front.

## Rationale / how the 1k cap is beatable here

Unlike "everything", the >50-star corpus IS completely enumerable within the search cap: GitHub search accepts star **ranges** (`stars:50..60`), so recursive range-splitting (halve any range whose query returns ≥ 1,000 results) yields complete coverage of every repo above the threshold. Star ranges are dense only in the low hundreds, so the tree is shallow. This is the technique the implementation should use; naive `stars:>50` alone silently truncates at 1,000.

## Consequences

- Pending work: implement the sharded `stars:>50` discovery source (config knob, e.g. `MIN_STARS`), then update the [[github-repo-tracker]] entity page — its "update once the all-repos source is implemented" trigger fires then, not now.
- Expect a corpus in the hundreds of thousands — snapshot volume and weekly runtime still need a size estimate; `FETCH_DETAILS` default-ON (2 extra calls/repo) may need revisiting at this scale.
- The earlier "harvest all public repos" goal is operationalized, not replaced: >50 stars is its practical approximation.
