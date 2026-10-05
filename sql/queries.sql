-- Handy queries for the repo tracker. Run these in the Railway dashboard's
-- Data tab (Postgres service → Data → query) or any psql client.

-- Latest numbers for every repo (numeric stats only)
SELECT DISTINCT ON (r.id)
  r.full_name, r.owner, s.captured_at,
  s.stars, s.forks, s.open_issues, s.watchers
FROM repos r
JOIN repo_snapshots s ON s.repo_id = r.id
ORDER BY r.id, s.captured_at DESC;

-- Weekly star deltas per repo (needs >= 2 snapshots)
WITH weeks AS (
  SELECT repo_id, captured_at, stars,
         LAG(stars) OVER (PARTITION BY repo_id ORDER BY captured_at) AS prev_stars
  FROM repo_snapshots
)
SELECT r.full_name, weeks.captured_at, weeks.prev_stars, weeks.stars,
       weeks.stars - weeks.prev_stars AS stars_gained
FROM weeks
JOIN repos r ON r.id = weeks.repo_id
WHERE weeks.prev_stars IS NOT NULL
ORDER BY stars_gained DESC;

-- Top gainers over the last 7 days
SELECT r.full_name,
       MAX(s.stars) FILTER (WHERE s.captured_at > now() - interval '7 days') -
       MIN(s.stars) FILTER (WHERE s.captured_at > now() - interval '7 days') AS stars_gained_7d
FROM repo_snapshots s
JOIN repos r ON r.id = s.repo_id
GROUP BY r.full_name
HAVING COUNT(*) FILTER (WHERE s.captured_at > now() - interval '7 days') >= 2
ORDER BY stars_gained_7d DESC
LIMIT 25;

-- Run history / health
SELECT run_id, status, started_at, finished_at,
       finished_at - started_at AS duration,
       repos_seen, repos_created, repos_updated, snapshots_written, error
FROM runs
ORDER BY started_at DESC
LIMIT 20;

-- Growth of the tracked universe over time
SELECT run_id, COUNT(*) AS snapshots, SUM(stars) AS total_stars
FROM repo_snapshots
GROUP BY run_id
ORDER BY run_id;
