import { getUsername, getToken } from '../lib/gh.js';
import { dockerLoginGhcr, buildAndPushImage, loadImageIntoKind, pushManifestsOci } from '../lib/docker.js';
import { createGithubRepo, initRepo, commitAndPush } from '../lib/git.js';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  applyManifests, createRegistrySecret, createGithubTokenSecret, waitForKustomization,
  waitForImagePolicyTag,
  waitForHealthCheckUnhealthy, waitForHealthCheckHealthy, waitForBakeFailed, waitForBakeSucceeded,
  setWantedVersion,
  waitForDemoTrafficReady, DEMO_STAGING_TRAFFIC_URL, DEMO_PROD_TRAFFIC_URL,
} from '../lib/k8s.js';

// Shared gateway uses self-signed wildcard cert — skip TLS verification.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import {
  appMainGood, appMainGoodV2, appMainBad, dockerfile,
  manifestsKustomization, manifestsKustomizationProd,
  manifestsDeployment, manifestsService,
  manifestsServiceMonitor, manifestsKruiseRollout, manifestsKruiseRolloutSimple,
  manifestsHTTPRoute, manifestsHTTPRouteProd,
  clusterManifests, clusterManifestsProd,
} from './templates.js';
import type { PhaseId } from '../state.js';

export interface RunnerCallbacks {
  log(msg: string, level?: 'info' | 'success' | 'warn' | 'error'): void;
  stepRunning(id: string, detail?: string): void;
  stepDone(id: string, detail?: string): void;
  stepFailed(id: string, detail?: string): void;
  setPhase(phase: PhaseId): void;
  setStatus(msg: string): void;
  setWaiting(v: boolean): void;
  setVersions(current: string, target?: string | null): void;
  setAlertFiring(v: boolean): void;
  setStagingTrafficUrl(url: string): void;
  setProdTrafficUrl(url: string): void;
  waitForSpace(): Promise<void>;
  exit(): void;
}

export async function runDemo(cb: RunnerCallbacks): Promise<void> {
  try {
    const setupResult = await setup(cb);

    // Gate 1: user triggers v2 deploy
    cb.setPhase('healthy');
    cb.setStatus('v1 running on staging and prod.\nPress SPACE to deploy v2 →');
    cb.setWaiting(true);
    await cb.waitForSpace();
    cb.setWaiting(false);
    cb.log('User triggered v2 deployment', 'info');

    const v2Tag = await propagatingPhase(cb, setupResult);

    await breakingPhase(cb, v2Tag, setupResult.imageBase, setupResult.repoDir, setupResult.repoFullName, setupResult.token);
    await recoveredPhase(cb, v2Tag);
  } catch (err) {
    cb.log(`Fatal error: ${String(err)}`, 'error');
    cb.setPhase('error');
  }
}

type SetupResult = {
  v1Tag: string; imageBase: string; repoDir: string; repoFullName: string; token: string;
};

async function setup(cb: RunnerCallbacks): Promise<SetupResult> {
  cb.setPhase('setup');

  cb.stepRunning('build', 'Setting up GitHub repo...');
  const username = await getUsername();
  const token = await getToken();
  const imageBase = `ghcr.io/${username.toLowerCase()}/kuberik-demo-app`;
  const repoFullName = `${username}/kuberik-demo-app`;
  const sourceUrl = `https://github.com/${repoFullName}`;

  await dockerLoginGhcr(username, token);
  await createGithubRepo(repoFullName, token);
  cb.log(`GitHub repo ready: ${sourceUrl}`, 'info');

  // Commit v1 (initial release)
  const repoDir = mkdtempSync(join(tmpdir(), 'kuberik-demo-repo-'));
  await initRepo(repoDir, repoFullName, token);
  const v1Commit = await commitAndPush(repoDir, {
    'app/main.py': appMainGood(),
    'Dockerfile':  dockerfile(),
  }, 'feat: initial release');
  cb.log(`Committed v1: ${v1Commit.sha}`, 'info');

  const v1Ref = `${imageBase}/app:${v1Commit.tag}`;
  await buildAndPushImage(repoDir, v1Ref, v1Commit, sourceUrl,
    m => cb.stepRunning('build', `[v1] ${m}`));
  cb.log(`v1 image pushed: ${v1Commit.tag}`, 'success');
  cb.stepDone('build', v1Commit.tag.slice(0, 22));

  // Push staging + prod OCI manifests and load image in parallel
  cb.stepRunning('k8s', 'Pushing manifests and loading image into kind...');
  const manifestFilesStaging = {
    'kustomization.yaml':  manifestsKustomization(username),
    'deployment.yaml':     manifestsDeployment(username),
    'service.yaml':        manifestsService(),
    'servicemonitor.yaml': manifestsServiceMonitor(),
    'kruise-rollout.yaml': manifestsKruiseRollout(),
    'httproute.yaml':      manifestsHTTPRoute(),
  };
  const manifestFilesProd = {
    'kustomization.yaml':  manifestsKustomizationProd(),
    'deployment.yaml':     manifestsDeployment(username),
    'service.yaml':        manifestsService(),
    'kruise-rollout.yaml': manifestsKruiseRolloutSimple(),
    'httproute.yaml':      manifestsHTTPRouteProd(),
  };
  await Promise.all([
    loadImageIntoKind(v1Ref, m => cb.stepRunning('k8s', `[img] ${m}`)),
    pushManifestsOci(manifestFilesStaging, `oci://${imageBase}/manifests:stable`,
      m => cb.stepRunning('k8s', `[mfst] ${m}`)),
    pushManifestsOci(manifestFilesProd, `oci://${imageBase}/manifests/prod:stable`),
  ]);

  const allManifests = [
    clusterManifests(username, v1Commit.tag, repoFullName),
    clusterManifestsProd(username, v1Commit.tag, repoFullName),
  ].join('\n');
  await applyManifests(allManifests);
  await Promise.all([
    createRegistrySecret(username, token),
    createRegistrySecret(username, token, 'kuberik-demo-prod'),
    createGithubTokenSecret(token, 'kuberik-demo-staging'),
    createGithubTokenSecret(token, 'kuberik-demo-prod'),
  ]);
  cb.log('Cluster manifests applied (staging + prod)', 'success');
  cb.stepDone('k8s');

  // Wait for staging rollout + bake + prod propagation
  cb.stepRunning('rollout', 'Waiting for initial staging rollout...');
  await waitForKustomization();
  const v1Tag = await waitForImagePolicyTag('kuberik-demo-app');
  cb.log(`Staging rollout complete: ${v1Tag}`, 'success');
  cb.setVersions(v1Tag);

  cb.stepRunning('rollout', 'Baking v1 in staging before propagating to prod...');
  await waitForBakeSucceeded();
  cb.log('Staging bake succeeded — propagating to prod', 'info');

  cb.stepRunning('rollout', 'Waiting for prod propagation...');
  await waitForKustomization('kuberik-demo-prod');
  cb.log(`Prod propagated: ${v1Tag}`, 'success');
  cb.stepDone('rollout', v1Tag);

  // Wait for both HTTPRoutes to be accepted by the gateway
  cb.stepRunning('traffic', 'Waiting for gateway routes to be ready...');
  await waitForDemoTrafficReady();
  cb.setStagingTrafficUrl(DEMO_STAGING_TRAFFIC_URL);
  cb.setProdTrafficUrl(DEMO_PROD_TRAFFIC_URL);
  cb.log(`Traffic generators started: staging=${DEMO_STAGING_TRAFFIC_URL} prod=${DEMO_PROD_TRAFFIC_URL}`, 'success');
  cb.stepDone('traffic');

  return { v1Tag, imageBase, repoDir, repoFullName, token };
}

async function propagatingPhase(cb: RunnerCallbacks, { v1Tag, imageBase, repoDir, repoFullName, token }: SetupResult): Promise<string> {
  cb.setPhase('propagating');
  cb.setStatus('Pushing v2 — watching propagation from staging to prod...');

  const sourceUrl = `https://github.com/${repoFullName}`;
  const v2Commit = await commitAndPush(repoDir, {
    'app/main.py': appMainGoodV2(),
  }, 'feat: add dark mode feature');
  cb.log(`Committed v2: ${v2Commit.sha}`, 'info');

  const v2Ref = `${imageBase}/app:${v2Commit.tag}`;
  await buildAndPushImage(repoDir, v2Ref, v2Commit, sourceUrl,
    m => cb.log(`[v2] ${m}`, 'info'));
  await loadImageIntoKind(v2Ref, m => cb.log(`[v2] ${m}`, 'info'));

  const v2Tag = await waitForImagePolicyTag('kuberik-demo-app', 'kuberik-demo-staging', v1Tag);
  cb.log(`v2 detected in staging: ${v2Tag}`, 'info');
  cb.setVersions(v2Tag);

  return v2Tag;
}

async function breakingPhase(
  cb: RunnerCallbacks, goodTag: string, imageBase: string,
  repoDir: string, repoFullName: string, token: string,
): Promise<void> {
  cb.setPhase('breaking');
  cb.setStatus('Pushing broken version — kuberik will pick it up in staging...');

  const sourceUrl = `https://github.com/${repoFullName}`;
  cb.log('Committing and pushing broken version...', 'warn');
  const badCommit = await commitAndPush(repoDir, {
    'app/main.py': appMainBad(),
  }, 'fix: apply input validation patch');
  cb.log(`Committed bad version: ${badCommit.sha}`, 'info');

  const badRef = `${imageBase}/app:${badCommit.tag}`;
  await buildAndPushImage(repoDir, badRef, badCommit, sourceUrl,
    m => cb.log(`[bad] ${m}`, 'info'));
  await loadImageIntoKind(badRef, m => cb.log(`[bad] ${m}`, 'info'));
  const visibleBadTag = await waitForImagePolicyTag('kuberik-demo-app', 'kuberik-demo-staging', goodTag);
  cb.log(`Broken version detected by ImagePolicy: ${visibleBadTag}`, 'warn');
  cb.setVersions(goodTag, visibleBadTag);
  cb.setStatus('Broken version canary rolling out in staging (50% traffic). Prod protected by environment gate. | Watching for Prometheus alert...');

  await waitForHealthCheckUnhealthy();
  cb.setAlertFiring(true);
  cb.setPhase('alert-fired');
  cb.log('HighErrorRate Prometheus alert fired — kuberik HealthCheck UNHEALTHY', 'error');
  cb.setStatus('Alert firing! Kuberik detected unhealthy bake in staging. Prod gate blocking propagation...');

  await waitForBakeFailed();
  cb.setPhase('rolling-back');
  cb.log('Kuberik marked rollout FAILED — blocked at stage 1 (1 replica, 50% traffic)', 'error');
  cb.log('Prod remains on v2 — environment gate prevented propagation of broken version', 'success');
  cb.setStatus('Rollout blocked by kuberik. Press SPACE to rollback to stable version →');
  cb.setWaiting(true);
  await cb.waitForSpace();
  cb.setWaiting(false);
}

async function recoveredPhase(cb: RunnerCallbacks, goodTag: string): Promise<void> {
  cb.setStatus('Setting wantedVersion to v2 — kuberik rolling back...');
  await setWantedVersion(goodTag);
  cb.log(`wantedVersion set to ${goodTag} — kuberik initiating rollback`, 'warn');

  await waitForHealthCheckHealthy();
  cb.setPhase('recovered');
  cb.setAlertFiring(false);
  cb.setVersions(goodTag);
  cb.log('Rollback complete — staging restored to v2', 'success');
  cb.log('Prod was never affected — environment propagation gate held', 'success');
  cb.setStatus('Service fully restored. Staging and prod both on v2.\nPress SPACE to exit →');
  cb.setWaiting(true);
  await cb.waitForSpace();
  cb.exit();
}
