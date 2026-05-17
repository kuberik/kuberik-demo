import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, useInput, useApp } from 'ink';
import { Header } from './components/Header.js';
import { StepList } from './components/StepList.js';
import { TrafficPanel } from './components/TrafficPanel.js';
import { LogPanel } from './components/LogPanel.js';
import { INITIAL_STATE } from './state.js';
import type { PhaseId, SetupStep, LogEntry, TrafficResult } from './state.js';
import { runDemo } from './demo/runner.js';
import type { RunnerCallbacks } from './demo/runner.js';

const REQ_INTERVAL_MS = 250; // 4 req/s
const RPS_WINDOW_MS = 5000;

export function App({ autoMode = false }: { autoMode?: boolean }) {
  const { exit } = useApp();
  const [phase, setPhase] = useState<PhaseId>(INITIAL_STATE.phase);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>(INITIAL_STATE.setupSteps);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [traffic, setTraffic] = useState(INITIAL_STATE.traffic);
  const [statusMessage, setStatusMessage] = useState('Starting up...');
  const [waitingForSpace, setWaitingForSpace] = useState(false);
  const [stagingUrl, setStagingUrl] = useState<string | null>(null);
  const [prodUrl, setProdUrl] = useState<string | null>(null);

  // Space-key resolver
  const spaceResolverRef = useRef<(() => void) | null>(null);

  useInput((input, key) => {
    if (input === ' ' && spaceResolverRef.current) {
      const resolve = spaceResolverRef.current;
      spaceResolverRef.current = null;
      resolve();
    }
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  const waitForSpace = useCallback((): Promise<void> => {
    if (autoMode) return Promise.resolve();
    return new Promise<void>(resolve => {
      spaceResolverRef.current = resolve;
    });
  }, [autoMode]);

  // Staging traffic generator
  const recentTimestamps = useRef<number[]>([]);
  useEffect(() => {
    if (!stagingUrl) return;
    const interval = setInterval(async () => {
      const now = Date.now();
      let result: TrafficResult = 'ok';
      let body = '';
      try {
        const resp = await fetch(stagingUrl, { signal: AbortSignal.timeout(1500) });
        body = (await resp.text()).trim().slice(0, 60);
        result = resp.ok ? 'ok' : 'error';
      } catch {
        result = 'timeout';
      }
      recentTimestamps.current = [...recentTimestamps.current.filter(t => now - t < RPS_WINDOW_MS), now];
      const rps = recentTimestamps.current.length / (RPS_WINDOW_MS / 1000);
      setTraffic(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        totalErrors: prev.totalErrors + (result !== 'ok' ? 1 : 0),
        recentResults: [...prev.recentResults.slice(-119), result],
        reqPerSec: rps,
        stagingLastResponse: body || prev.stagingLastResponse,
      }));
    }, REQ_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [stagingUrl]);

  // Prod traffic generator (response body only)
  useEffect(() => {
    if (!prodUrl) return;
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(prodUrl, { signal: AbortSignal.timeout(1500) });
        const body = (await resp.text()).trim().slice(0, 60);
        setTraffic(prev => ({ ...prev, prodLastResponse: body || prev.prodLastResponse }));
      } catch {
        // ignore prod errors in UI — they show in staging stats
      }
    }, REQ_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [prodUrl]);

  // Build runner callbacks
  const callbacks = useRef<RunnerCallbacks>({
    log(msg, level = 'info') {
      const entry: LogEntry = {
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        level,
        message: msg,
      };
      setLogs(prev => [...prev.slice(-99), entry]);
    },
    stepRunning(id, detail) {
      setSetupSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'running', detail } : s));
    },
    stepDone(id, detail) {
      setSetupSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'done', detail } : s));
    },
    stepFailed(id, detail) {
      setSetupSteps(prev => prev.map(s => s.id === id ? { ...s, status: 'failed', detail } : s));
    },
    setPhase,
    setStatus: setStatusMessage,
    setWaiting: setWaitingForSpace,
    setVersions(current, target) {
      setTraffic(prev => ({ ...prev, currentVersion: current, targetVersion: target ?? null }));
    },
    setAlertFiring(v) {
      setTraffic(prev => ({ ...prev, alertFiring: v }));
    },
    setStagingTrafficUrl(url) { setStagingUrl(url); },
    setProdTrafficUrl(url) { setProdUrl(url); },
    waitForSpace,
    exit() { exit(); },
  }).current;

  // Start the demo runner once on mount
  useEffect(() => {
    runDemo(callbacks);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = process.stdout.rows || 40;
  const logHeight = 8;
  const mainHeight = rows - 3 - logHeight; // 3 for header

  return (
    <Box flexDirection="column" height={rows}>
      <Header phase={phase} />

      <Box flexDirection="row" flexGrow={1} height={mainHeight}>
        <Box width="50%" flexDirection="column">
          <StepList
            setupSteps={setupSteps}
            phase={phase}
            statusMessage={statusMessage}
            waitingForSpace={waitingForSpace}
          />
        </Box>
        <Box width="50%" flexDirection="column">
          <TrafficPanel traffic={traffic} phase={phase} />
        </Box>
      </Box>

      <LogPanel logs={logs} maxLines={logHeight - 2} />
    </Box>
  );
}
