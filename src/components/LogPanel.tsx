import React from 'react';
import { Box, Text } from 'ink';
import type { LogEntry } from '../state.js';

const LEVEL_COLOR = {
  info:    'gray',
  success: 'green',
  warn:    'yellow',
  error:   'red',
} as const;

const LEVEL_ICON = {
  info:    '·',
  success: '✓',
  warn:    '⚠',
  error:   '✗',
} as const;

interface Props {
  logs: LogEntry[];
  maxLines?: number;
}

export function LogPanel({ logs, maxLines = 6 }: Props) {
  const visible = logs.slice(-maxLines);
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
      <Text bold color="cyan">EVENTS</Text>
      {visible.map((entry, i) => (
        <Box key={i}>
          <Text color="gray">{entry.timestamp}  </Text>
          <Text color={LEVEL_COLOR[entry.level]}>{LEVEL_ICON[entry.level]}  </Text>
          <Text color={entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : 'white'}>
            {entry.message}
          </Text>
        </Box>
      ))}
      {visible.length === 0 && <Text color="gray">No events yet...</Text>}
    </Box>
  );
}
