import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(nodeExec);

export async function exec(cmd: string, opts?: { cwd?: string; env?: NodeJS.ProcessEnv }): Promise<string> {
  const { stdout } = await execAsync(cmd, {
    cwd: opts?.cwd,
    env: { ...process.env, ...opts?.env },
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

export async function execSilent(cmd: string, opts?: { cwd?: string }): Promise<void> {
  await execAsync(cmd, { cwd: opts?.cwd, maxBuffer: 10 * 1024 * 1024 });
}

export async function applyYaml(yaml: string): Promise<void> {
  const tmp = join(tmpdir(), `kuberik-demo-${Date.now()}.yaml`);
  writeFileSync(tmp, yaml);
  try {
    await execAsync(`kubectl apply -f ${tmp}`);
  } finally {
    unlinkSync(tmp);
  }
}

export async function serverSideApplyYaml(yaml: string, fieldManager: string): Promise<void> {
  const tmp = join(tmpdir(), `kuberik-demo-${Date.now()}.yaml`);
  writeFileSync(tmp, yaml);
  try {
    await execAsync(`kubectl apply --server-side --field-manager=${fieldManager} -f ${tmp}`);
  } finally {
    unlinkSync(tmp);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function poll<T>(
  fn: () => Promise<T | null>,
  { interval = 5000, timeout = 600000 }: { interval?: number; timeout?: number } = {},
): Promise<T> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await fn();
    if (result !== null) return result;
    await sleep(interval);
  }
  throw new Error('Poll timed out');
}
