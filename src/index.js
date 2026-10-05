// Entrypoint / mode dispatcher.
//  - MODE unset or "cron" (default): run one harvest and exit cleanly.
//    This is what a Railway Cron service expects — the process must terminate
//    and leave no open resources (we close the pg pool).
//  - MODE=web: serve /healthz + POST /run for manual triggering.

import { config, requireConfig } from './config.js';
import { runOnce } from './runner.js';
import { close as closeDb } from './db.js';
import { startWeb } from './web.js';

const log = (...a) => console.log(new Date().toISOString(), '[index]', ...a);

process.on('unhandledRejection', (err) => {
  log('unhandled rejection:', err);
  process.exitCode = 1;
});
process.on('uncaughtException', (err) => {
  log('uncaught exception:', err);
  process.exitCode = 1;
});

requireConfig();

if (config.mode === 'web') {
  startWeb();
} else {
  runOnce()
    .then((stats) => log('done:', JSON.stringify(stats)))
    .catch((err) => {
      log('run failed:', (err && err.stack) || err);
      process.exitCode = 1;
    })
    .finally(() => closeDb());
}
