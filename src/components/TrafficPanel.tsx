import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { TrafficStats, PhaseId } from '../state.js';

function bar(ratio: number, width = 20): string {
  const filled = Math.min(width, Math.round(ratio * width));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function sparkline(values: number[], width = 30): string {
  const BLOCKS = ' ▁▂▃▄▅▆▇█';
  if (values.length === 0) return ' '.repeat(width);
  const max = Math.max(...values, 0.001);
  const slice = values.slice(-width);
  const padded = ' '.repeat(Math.max(0, width - slice.length)) + slice.map(v => {
    const idx = Math.min(8, Math.round((v / max) * 8));
    return BLOCKS[idx];
  }).join('');
  return padded;
}

interface Props {
  traffic: TrafficStats;
  phase: PhaseId;
}

export function TrafficPanel({ traffic, phase }: Props) {
  const errorRate = traffic.totalRequests > 0
    ? traffic.totalErrors / traffic.totalRequests
    : 0;

  const errorPct = (errorRate * 100).toFixed(1);

  const statusColor =
    phase === 'recovered'    ? 'green'  :
    phase === 'rolling-back' ? 'yellow' :
    phase === 'alert-fired'  ? 'red'    :
    errorRate > 0.1          ? 'red'    :
    errorRate > 0            ? 'yellow' :
                               'green';

  const statusLabel =
    phase === 'recovered'     ? '● RECOVERED'    :
    phase === 'rolling-back'  ? '↩ ROLLING BACK' :
    phase === 'alert-fired'   ? '⚠ CRITICAL'     :
    errorRate > 0.1           ? '⚠ DEGRADED'     :
                                '● HEALTHY';

  const recentSlice = traffic.recentResults.slice(-60);
  const buckets = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < recentSlice.length; i += 3) {
      const chunk = recentSlice.slice(i, i + 3);
      const errCount = chunk.filter(r => r !== 'ok').length;
      out.push(errCount / chunk.length);
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traffic.recentResults.length]);

  const last30 = traffic.recentResults.slice(-30);

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1} borderStyle="single" borderColor="gray">
      <Text bold color="cyan">LIVE TRAFFIC</Text>
      <Box height={1} />

      {/* Status */}
      <Box>
        <Text bold color={statusColor as Parameters<typeof Text>[0]['color']}>
          {statusLabel}
        </Text>
        {traffic.alertFiring && (
          <Text color="red" bold>  ⚠ Prometheus alert FIRING</Text>
        )}
      </Box>

      <Box height={1} />

      {/* Staging / prod response bodies */}
      <Box flexDirection="column">
        <Box>
          <Text color="gray">staging: </Text>
          <Text color={errorRate > 0.05 ? 'red' : 'white'}>
            {traffic.stagingLastResponse ?? '—'}
          </Text>
        </Box>
        <Box>
          <Text color="gray">prod:    </Text>
          <Text color="green">
            {traffic.prodLastResponse ?? '—'}
          </Text>
        </Box>
      </Box>

      <Box height={1} />

      {/* Error rate bar */}
      <Box flexDirection="column">
        <Box>
          <Text color="gray">Error rate  </Text>
          <Text bold color={errorRate > 0.1 ? 'red' : errorRate > 0 ? 'yellow' : 'green'}>
            {errorPct}%
          </Text>
        </Box>
        <Box>
          <Text color={errorRate > 0.1 ? 'red' : errorRate > 0 ? 'yellow' : 'green'}>
            {bar(errorRate, 24)}
          </Text>
        </Box>
      </Box>

      <Box height={1} />

      {/* Stats */}
      <Box flexDirection="column">
        <Box>
          <Text color="gray">Requests/s  </Text>
          <Text>{traffic.reqPerSec.toFixed(1)}</Text>
        </Box>
        <Box>
          <Text color="gray">Total       </Text>
          <Text>{traffic.totalRequests.toLocaleString()}</Text>
        </Box>
        <Box>
          <Text color="gray">Errors      </Text>
          <Text color={traffic.totalErrors > 0 ? 'red' : 'white'}>
            {traffic.totalErrors.toLocaleString()}
          </Text>
        </Box>
      </Box>

      <Box height={1} />

      {/* Error rate sparkline */}
      <Text color="gray">Error rate history (1m):</Text>
      <Text color={errorRate > 0.1 ? 'red' : errorRate > 0 ? 'yellow' : 'green'}>
        {sparkline(buckets, 28)}
      </Text>

      <Box height={1} />

      {/* Recent requests */}
      <Text color="gray">Recent requests:</Text>
      <Box flexWrap="wrap">
        {last30.map((r, i) => (
          <Text key={i} color={r === 'ok' ? 'green' : 'red'}>
            {r === 'ok' ? '✓' : '✗'}
          </Text>
        ))}
        {last30.length === 0 && <Text color="gray">waiting for traffic...</Text>}
      </Box>

      <Box flexGrow={1} />

      {/* Version info */}
      <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        <Box>
          <Text color="gray">Deployed:  </Text>
          <Text color="green">{traffic.currentVersion || '—'}</Text>
        </Box>
        {traffic.targetVersion && (
          <Box>
            <Text color="gray">Rolling:   </Text>
            <Text color="yellow">→ {traffic.targetVersion}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
