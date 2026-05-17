import React from 'react';
import { Box, Text } from 'ink';
import type { SetupStep, PhaseId } from '../state.js';
import { DEMO_PHASES } from '../state.js';

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function useSpinner(): string {
  const [frame, setFrame] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % SPINNER.length), 80);
    return () => clearInterval(t);
  }, []);
  return SPINNER[frame];
}

function SetupStepRow({ step }: { step: SetupStep }) {
  const spin = useSpinner();
  const icon =
    step.status === 'done'    ? <Text color="green">✓</Text>  :
    step.status === 'failed'  ? <Text color="red">✗</Text>    :
    step.status === 'running' ? <Text color="yellow">{spin}</Text> :
                                <Text color="gray">○</Text>;
  return (
    <Box>
      <Box width={3}>{icon}</Box>
      <Text color={step.status === 'failed' ? 'red' : step.status === 'done' ? 'white' : 'gray'}>
        {step.label}
      </Text>
      {step.detail && step.status === 'running' && (
        <Text color="gray"> — {step.detail.slice(0, 35)}</Text>
      )}
      {step.detail && step.status === 'done' && (
        <Text color="gray"> {step.detail.slice(0, 20)}</Text>
      )}
    </Box>
  );
}

const PHASE_DETAILS: Partial<Record<PhaseId, string>> = {
  healthy:        'v1 live on staging and prod',
  propagating:    'v2 rolling out — staging→prod propagation',
  breaking:       'Broken version rolling out (50% canary)',
  'alert-fired':  'Prometheus HighErrorRate alert active',
  'rolling-back': 'Kuberik blocked rollout — reverting',
  recovered:      'Previous version restored',
};

interface Props {
  setupSteps: SetupStep[];
  phase: PhaseId;
  statusMessage: string;
  waitingForSpace: boolean;
}

export function StepList({ setupSteps, phase, statusMessage, waitingForSpace }: Props) {
  const spin = useSpinner();

  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      {/* Setup steps */}
      <Text bold color="cyan">SETUP</Text>
      <Box height={1} />
      {setupSteps.map(step => (
        <SetupStepRow key={step.id} step={step} />
      ))}

      <Box height={1} />
      <Text bold color="cyan">DEMO PHASES</Text>
      <Box height={1} />

      {DEMO_PHASES.map(({ id, label }) => {
        const phaseOrder: PhaseId[] = ['healthy', 'propagating', 'breaking', 'alert-fired', 'rolling-back', 'recovered'];
        const currentIdx = phaseOrder.indexOf(phase);
        const thisIdx = phaseOrder.indexOf(id);
        const isCurrent = phase === id;
        const isDone = thisIdx < currentIdx;

        const icon =
          isDone    ? <Text color="green">✓</Text>  :
          isCurrent ? <Text color="yellow">{spin}</Text> :
                      <Text color="gray">○</Text>;

        const detail = isCurrent ? PHASE_DETAILS[id] : undefined;

        return (
          <Box key={id} flexDirection="column">
            <Box>
              <Box width={3}>{icon}</Box>
              <Text color={isDone ? 'white' : isCurrent ? 'yellow' : 'gray'} bold={isCurrent}>
                {label}
              </Text>
            </Box>
            {detail && (
              <Box marginLeft={3}>
                <Text color="gray" dimColor>{detail}</Text>
              </Box>
            )}
          </Box>
        );
      })}

      <Box flexGrow={1} />

      {/* Status message */}
      <Box borderStyle="single" borderColor="gray" paddingX={1} flexDirection="column">
        {statusMessage.split('\n').map((line, i) => (
          <Text key={i} color={waitingForSpace && line.includes('SPACE') ? 'cyan' : 'white'}>
            {line}
          </Text>
        ))}
        {waitingForSpace && (
          <Box marginTop={1}>
            <Text bold color="cyan">[SPACE]</Text>
            <Text color="gray"> to continue</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
