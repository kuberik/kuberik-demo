#!/usr/bin/env tsx
// Headless runner for automated testing — no Ink/TTY required.
import { runDemo } from '../src/demo/runner.js';
import type { RunnerCallbacks } from '../src/demo/runner.js';

const COLORS: Record<string, string> = {
  info:    '\x1b[36m',
  success: '\x1b[32m',
  warn:    '\x1b[33m',
  error:   '\x1b[31m',
  reset:   '\x1b[0m',
};

function ts() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

let stagingUrl: string | null = null;
let prodUrl: string | null = null;
let trafficInterval: ReturnType<typeof setInterval> | null = null;

let stagingReqs = 0;
let stagingErrors = 0;
let stagingLastBody = '';
let prodLastBody = '';
let tick = 0;

function fmt(body: string): string {
  return body.trim().replace(/\n/g, ' | ').slice(0, 60);
}

function startTraffic() {
  if (trafficInterval || !stagingUrl || !prodUrl) return;
  trafficInterval = setInterval(async () => {
    tick++;

    // Staging request
    try {
      const resp = await fetch(stagingUrl!, { signal: AbortSignal.timeout(2000) });
      const body = await resp.text();
      stagingReqs++;
      if (!resp.ok) stagingErrors++;
      stagingLastBody = fmt(resp.ok ? body : `[${resp.status}] ${body}`);
    } catch (e) {
      stagingReqs++;
      stagingErrors++;
      stagingLastBody = `[err] ${String(e).slice(0, 40)}`;
    }

    // Prod request (informational only — no error counting for alert)
    try {
      const resp = await fetch(prodUrl!, { signal: AbortSignal.timeout(2000) });
      const body = await resp.text();
      prodLastBody = fmt(resp.ok ? body : `[${resp.status}] ${body}`);
    } catch (e) {
      prodLastBody = `[err] ${String(e).slice(0, 40)}`;
    }

    if (tick % 20 === 0) {
      const errPct = stagingReqs === 0 ? '0.0' : (stagingErrors / stagingReqs * 100).toFixed(1);
      console.log(
        `[${ts()}] staging: ${stagingReqs} req, ${errPct}% err — "${stagingLastBody}"` +
        `\n         prod:    "${prodLastBody}"`,
      );
    }
  }, 250);
}

const cb: RunnerCallbacks = {
  log(msg, level = 'info') {
    const c = COLORS[level] ?? '';
    console.log(`${c}[${ts()}] [${level.toUpperCase()}] ${msg}${COLORS.reset}`);
  },
  stepRunning(id, detail) {
    console.log(`\x1b[34m[${ts()}] STEP  ${id}${detail ? ': ' + detail : ''}\x1b[0m`);
  },
  stepDone(id, detail) {
    console.log(`\x1b[32m[${ts()}] DONE  ${id}${detail ? ': ' + detail : ''}\x1b[0m`);
  },
  stepFailed(id, detail) {
    console.log(`\x1b[31m[${ts()}] FAIL  ${id}${detail ? ': ' + detail : ''}\x1b[0m`);
  },
  setPhase(phase) {
    console.log(`\x1b[35m[${ts()}] PHASE => ${phase}\x1b[0m`);
  },
  setStatus(msg) {
    console.log(`[${ts()}] STATUS: ${msg.replace(/\n/g, ' | ')}`);
  },
  setWaiting(v) {
    if (v) console.log(`[${ts()}] (auto-advancing from wait...)`);
  },
  setVersions(current, target) {
    console.log(`[${ts()}] VERSIONS current=${current} target=${target ?? 'none'}`);
  },
  setAlertFiring(v) {
    console.log(`\x1b[${v ? '31' : '32'}m[${ts()}] ALERT ${v ? 'FIRING' : 'cleared'}\x1b[0m`);
  },
  setStagingTrafficUrl(url) {
    stagingUrl = url;
    console.log(`[${ts()}] STAGING_URL=${url}`);
    startTraffic();
  },
  setProdTrafficUrl(url) {
    prodUrl = url;
    console.log(`[${ts()}] PROD_URL=${url}`);
    startTraffic();
  },
  waitForSpace() {
    console.log(`[${ts()}] (auto-advance — skipping space wait)`);
    return Promise.resolve();
  },
  exit() {
    if (trafficInterval) clearInterval(trafficInterval);
    console.log(`\x1b[32m[${ts()}] Demo complete. Exiting.\x1b[0m`);
    process.exit(0);
  },
};

console.log(`\x1b[1m[${ts()}] Starting kuberik demo (headless/auto mode)\x1b[0m`);
runDemo(cb).catch(err => {
  if (trafficInterval) clearInterval(trafficInterval);
  console.error(`\x1b[31m[${ts()}] Fatal: ${err}\x1b[0m`);
  process.exit(1);
});
