// Central env-based configuration. Every knob is an env var so Railway needs
// zero code changes between environments.

const csv = (v) =>
  (v || '').split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);

const lines = (v) =>
  (v || '').split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);

const bool = (v, d = false) =>
  v == null || v === ''
    ? d
    : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());

export const config = {
  databaseUrl: process.env.DATABASE_URL || '',
  githubToken: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
  owners: csv(process.env.GITHUB_OWNERS),
  searchQueries: lines(process.env.GITHUB_SEARCH_QUERIES),
  slicedSearchQueries: lines(process.env.GITHUB_SLICED_SEARCH),
  selfSource: bool(process.env.GITHUB_SOURCE_SELF, false),
  includeForks: bool(process.env.INCLUDE_FORKS, false),
  // Archived repos keep getting snapshots so their time series stays continuous.
  includeArchived: bool(process.env.INCLUDE_ARCHIVED, true),
  // Opt-in: adds true watchers (subscribers) via one extra API call per repo.
  // Off by default — at 100k+ repos it would blow the weekly API budget.
  fetchDetails: bool(process.env.FETCH_DETAILS, false),
  dryRun: bool(process.env.DRY_RUN, false),
  mode: (process.env.MODE || 'cron').toLowerCase(), // cron | web
  port: Number(process.env.PORT || 8080),
  runToken: process.env.RUN_TOKEN || '',
  batch: Math.max(50, Number(process.env.BATCH_SIZE || 500)),
  userAgent: 'repoleepo-github-tracker/1.0 (+https://repoleepo.monster)',
};

export function requireConfig() {
  if (config.dryRun) return; // dry runs never touch the database
  if (!config.owners.length && !config.searchQueries.length && !config.slicedSearchQueries.length && !config.selfSource) {
    console.error(
      '[config] No sources configured. Set GITHUB_SOURCE_SELF=1 (all public repos of the token\'s account), ' +
        'GITHUB_OWNERS (comma-separated orgs/users), GITHUB_SEARCH_QUERIES (one query per line), ' +
        'and/or GITHUB_SLICED_SEARCH (broad queries with created:>=DATE, one per line).'
    );
    process.exit(1);
  }
  if (config.selfSource && !config.githubToken) {
    console.error(
      '[config] GITHUB_SOURCE_SELF=1 needs GITHUB_TOKEN — /user/repos is an authenticated endpoint.'
    );
    process.exit(1);
  }
  // In web mode the DB is only touched when a run is triggered, so don't block
  // startup (healthchecks must stay green) — runOnce() fails per-request.
  if (config.mode !== 'web' && !config.databaseUrl) {
    console.error(
      '[config] Missing DATABASE_URL. On Railway set it to ${{ Postgres.DATABASE_URL }} ' +
        '(use your database service\'s actual name — the variables editor autocompletes).'
    );
    process.exit(1);
  }
}
