export type PhaseId =
  | 'setup'
  | 'healthy'
  | 'propagating'
  | 'breaking'
  | 'alert-fired'
  | 'rolling-back'
  | 'recovered'
  | 'error';

export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface SetupStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}

export type TrafficResult = 'ok' | 'error' | 'timeout';

export interface TrafficStats {
  totalRequests: number;
  totalErrors: number;
  recentResults: TrafficResult[];
  reqPerSec: number;
  currentVersion: string;
  targetVersion: string | null;
  alertFiring: boolean;
  stagingLastResponse: string | null;
  prodLastResponse: string | null;
}

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

export interface DemoState {
  phase: PhaseId;
  setupSteps: SetupStep[];
  logs: LogEntry[];
  traffic: TrafficStats;
  statusMessage: string;
  waitingForSpace: boolean;
  errorMessage: string | null;
}

export const SETUP_STEPS: SetupStep[] = [
  { id: 'build',    label: 'Build images locally',         status: 'pending' },
  { id: 'k8s',      label: 'Push & apply manifests',       status: 'pending' },
  { id: 'rollout',  label: 'Wait for initial rollout',     status: 'pending' },
  { id: 'traffic',  label: 'Start traffic generator',      status: 'pending' },
];

export const DEMO_PHASES: Array<{ id: PhaseId; label: string }> = [
  { id: 'healthy',      label: 'v1 healthy'                        },
  { id: 'propagating',  label: 'Deploy v2 — propagate staging→prod'},
  { id: 'breaking',     label: 'Deploy broken version'             },
  { id: 'alert-fired',  label: 'Prometheus alert fires'            },
  { id: 'rolling-back', label: 'Kuberik blocks rollout'            },
  { id: 'recovered',    label: 'Rollback to stable'                },
];

export const INITIAL_STATE: DemoState = {
  phase: 'setup',
  setupSteps: SETUP_STEPS,
  logs: [],
  traffic: {
    totalRequests: 0,
    totalErrors: 0,
    recentResults: [],
    reqPerSec: 0,
    currentVersion: '',
    targetVersion: null,
    alertFiring: false,
    stagingLastResponse: null,
    prodLastResponse: null,
  },
  statusMessage: 'Initializing...',
  waitingForSpace: false,
  errorMessage: null,
};
