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
  includeForks: bool(process.env.INCLUDE_FORKS, false),
  // Archived repos keep getting snapshots so their time series stays continuous.
  includeArchived: bool(process.env.INCLUDE_ARCHIVED, true),
  // On by default: collaborators + watchers are headline stats. Turn off for
  // very large sets (>50k repos) to run 3x faster on the API budget.
  fetchDetails: bool(process.env.FETCH_DETAILS, true),
  dryRun: bool(process.env.DRY_RUN, false),
  mode: (process.env.MODE || 'cron').toLowerCase(), // cron | web
  port: Number(process.env.PORT || 8080),
  runToken: process.env.RUN_TOKEN || '',
  batch: Math.max(50, Number(process.env.BATCH_SIZE || 500)),
  userAgent: 'repoleepo-github-tracker/1.0 (+https://repoleepo.monster)',
};

export function requireConfig() {
  if (config.dryRun) return; // dry runs never touch the database
  if (!config.owners.length && !config.searchQueries.length) {
    console.error(
      '[config] No sources configured. Set GITHUB_OWNERS (comma-separated orgs/users) ' +
        'and/or GITHUB_SEARCH_QUERIES (one GitHub search query per line).'
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
