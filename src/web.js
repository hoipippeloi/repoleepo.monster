// Optional always-on mode (MODE=web): tiny HTTP surface so you can trigger a
// run manually. POST /run with `Authorization: Bearer $RUN_TOKEN`.
// GET / and GET /healthz are unauthenticated health checks.

import http from 'node:http';
import { config } from './config.js';
import { runOnce } from './runner.js';

const log = (...a) => console.log(new Date().toISOString(), '[web]', ...a);

let running = false;

export function startWeb() {
  const server = http.createServer(async (req, res) => {
    const json = (code, body) => {
      res.writeHead(code, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const path = (req.url || '/').split('?')[0];

    if (req.method === 'GET' && (path === '/' || path === '/healthz')) {
      return json(200, { ok: true, running, mode: 'web' });
    }

    if (req.method === 'POST' && path === '/run') {
      if (config.runToken && req.headers.authorization !== `Bearer ${config.runToken}`) {
        return json(401, { error: 'unauthorized' });
      }
      if (running) return json(409, { error: 'run already in progress' });
      running = true;
      try {
        const stats = await runOnce();
        return json(200, { ok: true, stats });
      } catch (err) {
        return json(500, { ok: false, error: String((err && err.message) || err) });
      } finally {
        running = false;
      }
    }

    json(404, { error: 'not found' });
  });

  server.listen(config.port, () => log(`web mode listening on :${config.port}`));
  return server;
}
