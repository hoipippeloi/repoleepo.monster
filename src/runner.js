// One harvest run: collect repos from GitHub, upsert them, write metric
// snapshots, log the run. run_id = UTC date, so re-running on the same day
// is idempotent (snapshots upsert instead of duplicate).

import { config } from './config.js';
import { collectRepos, fetchStats } from './github.js';
import * as db from './db.js';

const log = (...a) => console.log(new Date().toISOString(), '[runner]', ...a);

export async function runOnce() {
  const runId = new Date().toISOString().slice(0, 10);
  const stats = { seen: 0, created: 0, updated: 0, snapshots: 0 };

  if (config.dryRun) {
    const sample = [];
    for await (const r of collectRepos()) {
      stats.seen++;
      if (sample.length < 5) sample.push(`${r.full_name} (★${r.stargazers_count})`);
    }
    log(`DRY RUN: would upsert ${stats.seen} repos + snapshots. Sample: ${sample.join(' | ') || 'none'}`);
    return stats;
  }

  if (!config.databaseUrl) throw new Error('DATABASE_URL is not set — cannot write to Postgres.');

  await db.ensureSchema();
  await db.startRun(runId);

  const buffer = [];
  const flush = async () => {
    const res = await db.flushBuffer(buffer, runId);
    stats.created += res.created;
    stats.updated += res.updated;
    stats.snapshots += buffer.length;
    buffer.length = 0;
  };

  try {
    for await (const raw of collectRepos()) {
      const extra = config.fetchDetails
        ? await fetchStats(raw.full_name).catch((e) => {
            log(`stats fetch failed for ${raw.full_name}: ${e.message}`);
            return null;
          })
        : null;
      buffer.push({ repoRow: db.toRepoRow(raw), metrics: db.toMetrics(raw, extra) });
      stats.seen++;
      if (buffer.length >= config.batch) {
        await flush();
        log(`progress: seen=${stats.seen} created=${stats.created} updated=${stats.updated} snapshots=${stats.snapshots}`);
      }
    }
    await flush();
    await db.finishRun(runId, 'success', stats);
    log(`run ${runId} complete: ${JSON.stringify(stats)}`);
  } catch (err) {
    // Persist whatever is still buffered, then rethrow so the process exits non-zero.
    if (buffer.length) {
      await db.flushBuffer(buffer, runId).catch(() => {});
    }
    await db
      .finishRun(runId, 'failed', stats, String((err && err.stack) || err))
      .catch((e) => log('failed to record run failure:', e.message));
    throw err;
  }

  return stats;
}
