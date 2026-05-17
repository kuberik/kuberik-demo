import React from 'react';
import { Box, Text } from 'ink';
import type { PhaseId } from '../state.js';

const PHASE_LABELS: Record<PhaseId, { label: string; color: string }> = {
  setup:        { label: 'SETUP',          color: 'cyan'    },
  healthy:      { label: 'HEALTHY',        color: 'green'   },
  propagating:  { label: 'PROPAGATING',   color: 'cyan'    },
  breaking:     { label: 'DEPLOYING',      color: 'yellow'  },
  'alert-fired':{ label: 'ALERT FIRED',    color: 'red'     },
  'rolling-back':{ label: 'ROLLING BACK',  color: 'yellow'  },
  recovered:    { label: 'RECOVERED',      color: 'green'   },
  error:        { label: 'ERROR',          color: 'red'     },
};

interface Props {
  phase: PhaseId;
}

export function Header({ phase }: Props) {
  const { label, color } = PHASE_LABELS[phase];
  return (
    <Box borderStyle="single" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">KUBERIK DEMO</Text>
      <Text color="gray"> — Progressive Delivery with Prometheus Health Gates   </Text>
      <Text color="gray">Phase: </Text>
      <Text bold color={color as Parameters<typeof Text>[0]['color']}>{label}</Text>
    </Box>
  );
}
