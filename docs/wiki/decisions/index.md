# Decisions

- [Tracker scope: numeric repo stats only](./tracker-scope-numeric-repo-stats-only.md) - **Context.** The GitHub Repo Tracker initially stored repo metadata alongside metric snapshots: description, language, license, topics, fork/archived flags, Git
- [Tracker goal: harvest ALL public GitHub repos, not just the token account's](./tracker-goal-harvest-all-public-github-repos-not-just-the-to.md) - Context
- [Tracker coverage threshold: all public repos with >50 stars](./tracker-coverage-threshold-all-public-repos-with-50-stars.md) - Context
- [Tracker drops collaborators; FETCH_DETAILS back to opt-in watchers-only](./tracker-drops-collaborators-fetch-details-back-to-opt-in-wat.md) - **Context.** [tracker-scope-numeric-repo-stats-only](../decisions/tracker-scope-numeric-repo-stats-only.md) (earlier the same day) kept a `collaborators` snapsh
- [GITHUB_SLICED_SEARCH: date-window sliced search beats the 1,000-result cap](./github-sliced-search-date-window-sliced-search-beats-the-1-0.md) - **Context.** [tracker-coverage-threshold-all-public-repos-with-50-stars](../decisions/tracker-coverage-threshold-all-public-repos-with-50-stars.md) picked the >
- [Tracker coverage band: 50–5,000 stars (stars:50..5000)](./tracker-coverage-band-50-5-000-stars-stars-50-5000.md) - **Context.** [[github-repo-tracker]] had a coverage threshold of "all public repos with >50 stars" (implemented as `GITHUB_SLICED_SEARCH=created:>=2022-01-01 st
