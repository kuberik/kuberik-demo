import { exec, execSilent, applyYaml, serverSideApplyYaml, poll } from './exec.js';

const NS = 'kuberik-demo-staging';

export async function applyManifests(yaml: string): Promise<void> {
  await applyYaml(yaml);
}

export async function createRegistrySecret(username: string, token: string, ns: string = NS): Promise<void> {
  await exec(
    `kubectl create secret docker-registry github-registry-credentials ` +
    `--docker-server=ghcr.io --docker-username=${username} --docker-password=${token} ` +
    `-n ${ns} --dry-run=client -o yaml | kubectl apply -f -`,
  );
}

export async function createGithubTokenSecret(token: string, ns: string): Promise<void> {
  await exec(
    `kubectl create secret generic github-token ` +
    `--from-literal=token=${token} ` +
    `-n ${ns} --dry-run=client -o yaml | kubectl apply -f -`,
  );
}

export async function waitForKustomization(ns: string = NS): Promise<void> {
  await exec(`kubectl wait kustomization/kuberik-demo-app -n ${ns} --for=condition=Ready --timeout=20m`);
}

export async function getImagePolicyLatest(name: string, ns: string = NS): Promise<string | null> {
  try {
    const out = await exec(`kubectl get imagepolicy ${name} -n ${ns} -o jsonpath='{.status.latestRef.tag}'`);
    if (!out || out === "''") return null;
    return out || null;
  } catch {
    return null;
  }
}

export async function waitForImagePolicyTag(name: string, ns: string = NS, differentFrom?: string): Promise<string> {
  return poll(
    async () => {
      const tag = await getImagePolicyLatest(name, ns);
      if (!tag) return null;
      if (differentFrom && tag === differentFrom) return null;
      return tag;
    },
    { interval: 10000, timeout: 600000 },
  );
}


export async function getHealthCheckStatus(name: string): Promise<string | null> {
  try {
    const out = await exec(`kubectl get healthcheck ${name} -n ${NS} -o jsonpath='{.status.status}'`);
    return out.replace(/'/g, '') || null;
  } catch {
    return null;
  }
}

export async function getRolloutBakeStatus(ns: string = NS): Promise<string | null> {
  try {
    const out = await exec(
      `kubectl get rollout.kuberik.com kuberik-demo-app -n ${ns} -o jsonpath='{.status.history[0].bakeStatus}'`,
    );
    return out.replace(/'/g, '') || null;
  } catch {
    return null;
  }
}

export async function waitForHealthCheckUnhealthy(): Promise<void> {
  await poll(
    async () => {
      const s = await getHealthCheckStatus('kuberik-demo-high-error-rate');
      return s === 'Unhealthy' ? true : null;
    },
    { interval: 5000, timeout: 600000 },
  );
}

export async function waitForHealthCheckHealthy(): Promise<void> {
  await poll(
    async () => {
      const s = await getHealthCheckStatus('kuberik-demo-high-error-rate');
      return s === 'Healthy' ? true : null;
    },
    { interval: 5000, timeout: 600000 },
  );
}

export async function waitForBakeFailed(): Promise<void> {
  await poll(
    async () => {
      const s = await getRolloutBakeStatus();
      return s === 'Failed' ? true : null;
    },
    { interval: 5000, timeout: 600000 },
  );
}

export async function waitForBakeSucceeded(ns: string = NS): Promise<void> {
  await poll(
    async () => {
      const s = await getRolloutBakeStatus(ns);
      return s === 'Succeeded' ? true : null;
    },
    { interval: 5000, timeout: 600000 },
  );
}

export async function waitForHealthCheckUnhealthyNs(name: string, ns: string): Promise<void> {
  await poll(
    async () => {
      try {
        const out = await exec(`kubectl get healthcheck ${name} -n ${ns} -o jsonpath='{.status.status}'`);
        const s = out.replace(/'/g, '') || null;
        return s === 'Unhealthy' ? true : null;
      } catch {
        return null;
      }
    },
    { interval: 5000, timeout: 120000 },
  );
}

export async function deleteHealthCheck(name: string, ns: string): Promise<void> {
  await exec(`kubectl delete healthcheck ${name} -n ${ns} --ignore-not-found`);
}

export async function deletePrometheusRule(name: string, ns: string): Promise<void> {
  await exec(`kubectl delete prometheusrule ${name} -n ${ns} --ignore-not-found`);
}

export async function setWantedVersion(tag: string): Promise<void> {
  await serverSideApplyYaml(`
apiVersion: kuberik.com/v1alpha1
kind: Rollout
metadata:
  name: kuberik-demo-app
  namespace: ${NS}
  annotations:
    rollout.kuberik.com/deploy-message: "Demo rollback to stable version"
spec:
  wantedVersion: "${tag}"
`, 'rollout-dashboard');
}

// hostPort 8080 in kind-config.yaml maps to containerPort 30951 (HTTPS NodePort).
// The shared rollout-dashboard-gateway accepts *.192.168.1.102.nip.io from all namespaces.
export const DEMO_STAGING_TRAFFIC_URL = 'https://demo-staging.192.168.1.102.nip.io:8080';
export const DEMO_PROD_TRAFFIC_URL    = 'https://demo-prod.192.168.1.102.nip.io:8080';

async function waitForHTTPRouteReady(ns: string): Promise<void> {
  await poll(
    async () => {
      try {
        const status = await exec(
          `kubectl get httproute kuberik-demo-app -n ${ns}` +
          ` -o jsonpath='{.status.parents[0].conditions[?(@.type=="Accepted")].status}'`,
        );
        return status.replace(/'/g, '') === 'True' ? true : null;
      } catch {
        return null;
      }
    },
    { interval: 3000, timeout: 60000 },
  );
  await new Promise(r => setTimeout(r, 2000));
}

export async function waitForDemoTrafficReady(): Promise<void> {
  await Promise.all([
    waitForHTTPRouteReady(NS),
    waitForHTTPRouteReady('kuberik-demo-prod'),
  ]);
}
