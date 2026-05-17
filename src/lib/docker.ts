import { exec } from './exec.js';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { CommitInfo } from './git.js';

const KIND_CLUSTER = 'rollout-dev';

export async function dockerLoginGhcr(username: string, token: string): Promise<void> {
  await exec(`echo ${JSON.stringify(token)} | docker login ghcr.io -u ${username} --password-stdin`);
}

/** Build and push image from a git repo directory using buildx with real OCI annotations. */
export async function buildAndPushImage(
  buildContext: string,
  imageRef: string,
  commit: CommitInfo,
  sourceUrl: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const created = new Date(commit.timestamp * 1000).toISOString();
  onProgress?.('Building and pushing...');
  await exec(
    `docker buildx build --push` +
    ` --platform linux/amd64` +
    ` --provenance true` +
    ` --annotation "index:org.opencontainers.image.version=${commit.shortSha}"` +
    ` --annotation "index:org.opencontainers.image.source=${sourceUrl}"` +
    ` --annotation "index:org.opencontainers.image.revision=${commit.sha}"` +
    ` --annotation "index:org.opencontainers.image.created=${created}"` +
    ` --annotation "index:org.opencontainers.image.title=Kuberik Demo App"` +
    ` --annotation "index:org.opencontainers.image.description=Demo application for kuberik progressive delivery"` +
    ` --annotation "index:org.opencontainers.image.licenses=MIT"` +
    ` --annotation "index:org.opencontainers.image.authors=Kuberik"` +
    ` --annotation "index:org.opencontainers.image.vendor=Kuberik"` +
    ` --annotation "index:org.opencontainers.image.url=https://kuberik.com"` +
    ` -t ${imageRef} ${buildContext}`,
  );
}

/** Load image into kind cluster so pods pull from local cache instead of GHCR. */
export async function loadImageIntoKind(
  imageRef: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  onProgress?.('Loading into kind...');
  await exec(`kind load docker-image ${imageRef} --name ${KIND_CLUSTER}`);
}

/** Write manifests to a temp dir and push as an OCI artifact via flux CLI. */
export async function pushManifestsOci(
  manifests: Record<string, string>,
  ociRef: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'kuberik-manifests-'));
  for (const [name, content] of Object.entries(manifests)) {
    writeFileSync(join(dir, name), content);
  }
  onProgress?.('Pushing OCI artifact...');
  await exec(
    `flux push artifact ${ociRef}` +
    ` --path=${dir}` +
    ` --source=https://demo.kuberik.local` +
    ` --revision=demo@sha1:0000000000000000000000000000000000000000`,
  );
}
