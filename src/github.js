// GitHub REST v3 collector — owner listing + search, with pagination and
// rate-limit handling. One repo object is yielded per discovered repo.

import { config } from './config.js';

const API = 'https://api.github.com';
const SEARCH_MAX_PAGES = 10; // GitHub hard cap: search returns max 1000 results per query

let rateRemaining = null; // last seen x-ratelimit-remaining
let rateResetEpoch = 0; // x-ratelimit-reset, epoch seconds

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString(), '[github]', ...a);

function authHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': config.userAgent,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(config.githubToken ? { Authorization: `Bearer ${config.githubToken}` } : {}),
  };
}

async function throttle() {
  if (rateRemaining === null || rateRemaining > 5 || !rateResetEpoch) return;
  const waitSec = Math.max(0, rateResetEpoch - Date.now() / 1000) + 1;
  if (waitSec < 3600) {
    log(`rate limit low (${rateRemaining} left) — sleeping ${Math.ceil(waitSec)}s until reset`);
    await sleep(waitSec * 1000);
  }
}

// Low-level fetch with throttling + retry. Returns the raw Response.
async function ghFetch(pathOrUrl) {
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : API + pathOrUrl;
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await throttle();
    res = await fetch(url, { headers: authHeaders() });
    const remaining = Number(res.headers.get('x-ratelimit-remaining'));
    const reset = Number(res.headers.get('x-ratelimit-reset'));
    if (Number.isFinite(remaining)) rateRemaining = remaining;
    if (Number.isFinite(reset)) rateResetEpoch = reset;

    if (res.status === 403 || res.status === 429) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const waitSec =
        (Number.isFinite(retryAfter) && retryAfter) ||
        (rateResetEpoch ? Math.max(1, rateResetEpoch - Date.now() / 1000) : 0) ||
        60 * attempt;
      log(`GitHub ${res.status} (remaining=${rateRemaining}) — retry in ${Math.ceil(waitSec)}s (attempt ${attempt}/3)`);
      if (attempt === 3) break;
      await sleep(Math.min(waitSec, 900) * 1000);
      continue;
    }
    break;
  }
  return res;
}

async function ghJson(pathOrUrl) {
  const res = await ghFetch(pathOrUrl);
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status} on ${pathOrUrl.startsWith('http') ? pathOrUrl : API + pathOrUrl}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// Walk a paginated collection endpoint until a short page ends it.
async function pagedList(path, { maxPages = Infinity } = {}) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const items = await ghJson(`${path}${sep}per_page=100&page=${page}`);
    if (!Array.isArray(items) || items.length === 0) break;
    out.push(...items);
    log(`  ${path.split('?')[0]} page ${page}: +${items.length} (total ${out.length})`);
    if (items.length < 100) break;
  }
  return out;
}

// Search endpoint — capped at 1000 results per query by GitHub itself.
async function pagedSearch(query) {
  const out = [];
  for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
    const q = encodeURIComponent(query);
    const res = await ghJson(`/search/repositories?q=${q}&per_page=100&page=${page}&sort=stars&order=desc`);
    if (!res || !Array.isArray(res.items)) break;
    out.push(...res.items);
    log(`  search page ${page}: +${res.items.length} (total ${out.length} of ${res.total_count})`);
    if (res.items.length < 100) break;
  }
  if (out.length >= SEARCH_MAX_PAGES * 100) {
    log(`WARNING: query "${query}" hit GitHub's 1000-result search cap. Split it into ` +
      `tighter queries (e.g. per language) if you need broader coverage.`);
  }
  return out;
}

function keepRepo(r) {
  if (!config.includeForks && r.fork) return false;
  if (!config.includeArchived && r.archived) return false;
  return true;
}

// Yields every discovered repo exactly per configured sources. Duplicate hits
// across sources are fine — the DB layer upserts idempotently.
export async function* collectRepos() {
  let yielded = 0;

  if (config.selfSource) {
    log('listing your public repos via /user/repos...');
    const repos = await pagedList('/user/repos?visibility=public');
    for (const r of repos) {
      if (keepRepo(r)) {
        yielded++;
        yield r;
      }
    }
    log(`self source: ${repos.length} public repos`);
  }

  for (const owner of config.owners) {
    log(`listing repos for "${owner}"...`);
    // /users/{login}/repos works for both users AND orgs; fall back to /orgs.
    let repos = await pagedList(`/users/${encodeURIComponent(owner)}/repos?type=all`);
    if (!repos.length) repos = await pagedList(`/orgs/${encodeURIComponent(owner)}/repos`);
    if (!repos.length) log(`WARNING: no repos found for "${owner}" — check the spelling.`);
    for (const r of repos) {
      if (keepRepo(r)) {
        yielded++;
        yield r;
      }
    }
    log(`owner "${owner}": ${repos.length} repos`);
  }

  for (const query of config.searchQueries) {
    log(`searching: ${query}`);
    const repos = await pagedSearch(query);
    for (const r of repos) {
      if (keepRepo(r)) {
        yielded++;
        yield r;
      }
    }
    log(`search "${query}": ${repos.length} repos`);
  }

  log(`collector finished: ${yielded} repos yielded`);
}

// Optional per-repo stats pass: watchers (subscribers) + collaborator count.
// Two API calls per repo — with a token (5,000 req/h) that covers ~1,600 repos/hour.
export async function fetchStats(fullName) {
  const [detail, collaborators] = await Promise.all([
    ghJson(`/repos/${fullName}`),
    fetchCollaboratorCount(fullName),
  ]);
  return {
    watchers: detail ? (detail.subscribers_count ?? null) : null,
    collaborators,
  };
}

// GitHub only exposes the true collaborator list to accounts with push access,
// so for public repos we count contributors as the proxy: request the list
// with per_page=1 and read the Link header's rel="last" page number — the
// total count in a single request.
async function fetchCollaboratorCount(fullName) {
  const res = await ghFetch(`/repos/${fullName}/contributors?per_page=1`);
  if (res.status === 204 || res.status === 404) return 0; // no contributors yet
  if (!res.ok) {
    await res.text().catch(() => {}); // drain the socket; don't fail the run over one repo
    return null;
  }
  const link = res.headers.get('link') || '';
  const last = link.split(',').find((p) => p.includes('rel="last"'));
  if (last) {
    const m = last.match(/[?&]page=(\d+)/);
    if (m) return Number(m[1]);
  }
  // No Link header → everything fit on page 1.
  const items = await res.json().catch(() => []);
  return Array.isArray(items) ? items.length : 0;
}
