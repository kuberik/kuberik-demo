import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { exec, execSilent } from './exec.js';

export interface CommitInfo {
  sha: string;
  shortSha: string;
  timestamp: number;
  tag: string;
}

export async function createGithubRepo(repoFullName: string, token: string): Promise<void> {
  const exists = await exec(`gh repo view ${repoFullName} --json name -q .name`).then(() => true).catch(() => false);
  if (!exists) {
    await exec(`gh repo create ${repoFullName} --private`);
  }
}

export async function initRepo(dir: string, repoFullName: string, token: string): Promise<void> {
  await execSilent(`git -C ${dir} init -b main`);
  // Embed token in remote URL so git push doesn't need interactive auth
  await execSilent(`git -C ${dir} remote add origin https://x-access-token:${token}@github.com/${repoFullName}.git`);
}

export async function commitAndPush(
  dir: string,
  files: Record<string, string>,
  message: string,
): Promise<CommitInfo> {
  for (const [relPath, content] of Object.entries(files)) {
    const abs = join(dir, relPath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  await execSilent(`git -C ${dir} add .`);
  await execSilent(
    `git -C ${dir} -c user.email=demo@kuberik.local -c "user.name=Kuberik Demo" commit -m ${JSON.stringify(message)}`,
  );
  await execSilent(`git -C ${dir} push origin main --force`);

  const sha = await exec(`git -C ${dir} rev-parse HEAD`);
  const shortSha = sha.slice(0, 7);
  const timestamp = parseInt(await exec(`git -C ${dir} log --format=%ct -1`), 10);
  return { sha, shortSha, timestamp, tag: `main-${timestamp}-${shortSha}` };
}
