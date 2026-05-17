// All app-repo template files. USERNAME is substituted at runtime.

export function appMainGood(): string {
  return `import os, time, random
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Lock

VERSION = os.environ.get("VERSION", "unknown")

class Metrics:
    def __init__(self):
        self.lock = Lock()
        self.requests = 0
        self.errors = 0
        self.dur_sum = 0.0
        self.start = time.time()

    def record(self, err: bool, dur: float):
        with self.lock:
            self.requests += 1
            self.dur_sum += dur
            if err:
                self.errors += 1

    def snapshot(self):
        with self.lock:
            return self.requests, self.errors, self.dur_sum

metrics = Metrics()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def do_GET(self):
        start = time.time()
        is_err = False

        if self.path == "/metrics":
            reqs, errs, dur = metrics.snapshot()
            body = (
                f'# HELP http_requests_total Total HTTP requests\\n'
                f'# TYPE http_requests_total counter\\n'
                f'http_requests_total{{version="{VERSION}",app="kuberik-demo-app"}} {reqs}\\n'
                f'# HELP http_errors_total Total HTTP errors\\n'
                f'# TYPE http_errors_total counter\\n'
                f'http_errors_total{{version="{VERSION}",app="kuberik-demo-app"}} {errs}\\n'
                f'# HELP http_request_duration_seconds_sum Sum of durations\\n'
                f'# TYPE http_request_duration_seconds_sum counter\\n'
                f'http_request_duration_seconds_sum{{version="{VERSION}",app="kuberik-demo-app"}} {dur:.6f}\\n'
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(body.encode())
            return

        if self.path == "/healthz":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return

        # Normal endpoint
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(f"[{VERSION}] Hello!\\n".encode())

        metrics.record(is_err, time.time() - start)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("", port), Handler)
    print(f"kuberik-demo-app v{VERSION} on :{port}")
    server.serve_forever()
`;
}

export function appMainGoodV2(): string {
  return `import os, time, random
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Lock

VERSION = os.environ.get("VERSION", "unknown")

class Metrics:
    def __init__(self):
        self.lock = Lock()
        self.requests = 0
        self.errors = 0
        self.dur_sum = 0.0
        self.start = time.time()

    def record(self, err: bool, dur: float):
        with self.lock:
            self.requests += 1
            self.dur_sum += dur
            if err:
                self.errors += 1

    def snapshot(self):
        with self.lock:
            return self.requests, self.errors, self.dur_sum

metrics = Metrics()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def do_GET(self):
        start = time.time()
        is_err = False

        if self.path == "/metrics":
            reqs, errs, dur = metrics.snapshot()
            body = (
                f'# HELP http_requests_total Total HTTP requests\\n'
                f'# TYPE http_requests_total counter\\n'
                f'http_requests_total{{version="{VERSION}",app="kuberik-demo-app"}} {reqs}\\n'
                f'# HELP http_errors_total Total HTTP errors\\n'
                f'# TYPE http_errors_total counter\\n'
                f'http_errors_total{{version="{VERSION}",app="kuberik-demo-app"}} {errs}\\n'
                f'# HELP http_request_duration_seconds_sum Sum of durations\\n'
                f'# TYPE http_request_duration_seconds_sum counter\\n'
                f'http_request_duration_seconds_sum{{version="{VERSION}",app="kuberik-demo-app"}} {dur:.6f}\\n'
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(body.encode())
            return

        if self.path == "/healthz":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return

        # Normal endpoint
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(f"[{VERSION}] Hello! (feature: dark mode)\\n".encode())

        metrics.record(is_err, time.time() - start)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("", port), Handler)
    print(f"kuberik-demo-app v{VERSION} on :{port}")
    server.serve_forever()
`;
}

export function appMainBad(): string {
  return `import os, time, random
from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Lock

VERSION = os.environ.get("VERSION", "unknown")

class Metrics:
    def __init__(self):
        self.lock = Lock()
        self.requests = 0
        self.errors = 0
        self.dur_sum = 0.0

    def record(self, err: bool, dur: float):
        with self.lock:
            self.requests += 1
            self.dur_sum += dur
            if err:
                self.errors += 1

    def snapshot(self):
        with self.lock:
            return self.requests, self.errors, self.dur_sum

metrics = Metrics()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def do_GET(self):
        start = time.time()
        is_err = False

        if self.path == "/metrics":
            reqs, errs, dur = metrics.snapshot()
            body = (
                f'# HELP http_requests_total Total HTTP requests\\n'
                f'# TYPE http_requests_total counter\\n'
                f'http_requests_total{{version="{VERSION}",app="kuberik-demo-app"}} {reqs}\\n'
                f'# HELP http_errors_total Total HTTP errors\\n'
                f'# TYPE http_errors_total counter\\n'
                f'http_errors_total{{version="{VERSION}",app="kuberik-demo-app"}} {errs}\\n'
                f'# HELP http_request_duration_seconds_sum Sum of durations\\n'
                f'# TYPE http_request_duration_seconds_sum counter\\n'
                f'http_request_duration_seconds_sum{{version="{VERSION}",app="kuberik-demo-app"}} {dur:.6f}\\n'
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4")
            self.end_headers()
            self.wfile.write(body.encode())
            return

        if self.path == "/healthz":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok")
            return

        # BUG: incorrect input validation causes most requests to fail
        if random.random() < 0.8:
            is_err = True
            self.send_response(500)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"[{VERSION}] Internal Server Error\\n".encode())
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(f"[{VERSION}] Hello! (feature: dark mode)\\n".encode())

        metrics.record(is_err, time.time() - start)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    server = HTTPServer(("", port), Handler)
    print(f"kuberik-demo-app v{VERSION} on :{port}")
    server.serve_forever()
`;
}

export function dockerfile(): string {
  return `FROM python:3.12-slim
WORKDIR /app
COPY app/main.py .
EXPOSE 8080
CMD ["python", "main.py"]
`;
}

export function workflowBuildImage(): string {
  return `name: Build and Push Image

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'Dockerfile'

permissions:
  packages: write
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.REGISTRY_TOKEN }}

      - name: Set image tag
        id: tag
        run: |
          OWNER="\${GITHUB_REPOSITORY_OWNER,,}"
          echo "tag=main-$(date +%s)-\${GITHUB_SHA::7}" >> "$GITHUB_OUTPUT"
          echo "owner=\${OWNER}" >> "$GITHUB_OUTPUT"

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ steps.tag.outputs.owner }}/kuberik-demo-app/app:\${{ steps.tag.outputs.tag }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`;
}

export function workflowBuildManifests(): string {
  return `name: Build and Push Manifests

on:
  push:
    branches: [main]
    paths:
      - 'manifests/**'

permissions:
  packages: write
  contents: read

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: fluxcd/flux2/action@main
        with:
          version: latest

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.REGISTRY_TOKEN }}

      - name: Push OCI artifact
        run: |
          OWNER="\${GITHUB_REPOSITORY_OWNER,,}"
          TAG="main-$(date +%s)-\${GITHUB_SHA::7}"
          flux push artifact \\
            "oci://ghcr.io/\${OWNER}/kuberik-demo-app/manifests:\${TAG}" \\
            --path="./manifests" \\
            --source="\${{ github.server_url }}/\${{ github.repository }}" \\
            --revision="\${{ github.ref_name }}@sha1:\${{ github.sha }}"
`;
}

export function manifestsKustomization(username: string): string {
  return `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: kuberik-demo-staging
resources:
  - deployment.yaml
  - service.yaml
  - servicemonitor.yaml
  - kruise-rollout.yaml
  - httproute.yaml
`;
}

export function manifestsKustomizationStaging(): string {
  return `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: kuberik-demo-staging
resources:
  - deployment.yaml
  - service.yaml
  - kruise-rollout.yaml
`;
}

export function manifestsKustomizationProd(): string {
  return `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: kuberik-demo-prod
resources:
  - deployment.yaml
  - service.yaml
  - kruise-rollout.yaml
  - httproute.yaml
`;
}

export function manifestsDeployment(username: string): string {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: kuberik-demo-app
  labels:
    app: kuberik-demo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: kuberik-demo-app
  template:
    metadata:
      labels:
        app: kuberik-demo-app
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
        prometheus.io/path: "/metrics"
    spec:
      imagePullSecrets:
        - name: github-registry-credentials
      containers:
        - name: app
          image: ghcr.io/${username.toLowerCase()}/kuberik-demo-app/app:\${APP_VERSION}
          env:
            - name: VERSION
              value: \${APP_VERSION}
          ports:
            - name: http
              containerPort: 8080
          readinessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 3
            failureThreshold: 3
          resources:
            requests:
              cpu: 10m
              memory: 32Mi
            limits:
              memory: 64Mi
`;
}

export function manifestsService(): string {
  return `apiVersion: v1
kind: Service
metadata:
  name: kuberik-demo-app
  labels:
    app: kuberik-demo-app
spec:
  selector:
    app: kuberik-demo-app
  ports:
    - name: http
      port: 80
      targetPort: 8080
`;
}

export function manifestsServiceMonitor(): string {
  return `apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: kuberik-demo-app
  labels:
    prometheus: kube-prometheus-stack
spec:
  selector:
    matchLabels:
      app: kuberik-demo-app
  endpoints:
    - port: http
      path: /metrics
      interval: 5s
`;
}

export function manifestsKruiseRollout(): string {
  return `apiVersion: rollouts.kruise.io/v1beta1
kind: Rollout
metadata:
  name: kuberik-demo-app
  annotations:
    rollout.kuberik.io/step-1-ready-timeout: "10m"
    rollout.kuberik.io/step-1-bake-time: "60s"
    rollout.kuberik.io/step-2-ready-timeout: "10m"
    rollout.kuberik.io/step-2-bake-time: "5s"
spec:
  workloadRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kuberik-demo-app
  strategy:
    canary:
      steps:
        - replicas: 1
          traffic: "50%"
        - replicas: "100%"
      trafficRoutings:
        - service: kuberik-demo-app
          gateway:
            httpRouteName: kuberik-demo-app
          gracePeriodSeconds: 3
`;
}

export function manifestsKruiseRolloutSimple(): string {
  return `apiVersion: rollouts.kruise.io/v1beta1
kind: Rollout
metadata:
  name: kuberik-demo-app
  annotations:
    rollout.kuberik.io/step-1-ready-timeout: "10m"
    rollout.kuberik.io/step-1-bake-time: "5s"
    rollout.kuberik.io/step-2-ready-timeout: "10m"
    rollout.kuberik.io/step-2-bake-time: "5s"
spec:
  workloadRef:
    apiVersion: apps/v1
    kind: Deployment
    name: kuberik-demo-app
  strategy:
    canary:
      steps:
        - replicas: 1
        - replicas: 2
`;
}

// No separate Gateway needed — shared rollout-dashboard-gateway accepts *.192.168.1.102.nip.io
// from all namespaces. Demo HTTPRoute attaches directly to it.
export function manifestsGateway(): string {
  return '';
}

export function manifestsHTTPRoute(): string {
  return `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: kuberik-demo-app
spec:
  parentRefs:
    - name: rollout-dashboard-gateway
      namespace: kuberik-system
  hostnames:
    - demo-staging.192.168.1.102.nip.io
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: kuberik-demo-app
          port: 80
`;
}

export function manifestsHTTPRouteProd(): string {
  return `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: kuberik-demo-app
spec:
  parentRefs:
    - name: rollout-dashboard-gateway
      namespace: kuberik-system
  hostnames:
    - demo-prod.192.168.1.102.nip.io
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: kuberik-demo-app
          port: 80
`;
}

export function clusterManifests(username: string, initialTag: string, repoFullName: string): string {
  const ghcr = `ghcr.io/${username.toLowerCase()}/kuberik-demo-app`;
  return `---
apiVersion: v1
kind: Namespace
metadata:
  name: kuberik-demo-staging
---
# Image repository — scans GHCR for new app image tags
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  image: ${ghcr}/app
  interval: 10s
  secretRef:
    name: github-registry-credentials
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  imageRepositoryRef:
    name: kuberik-demo-app
  filterTags:
    pattern: "^main-(?P<timestamp>[0-9]+)-[a-zA-Z0-9]+$"
    extract: "$timestamp"
  policy:
    alphabetical:
      order: asc
---
# OCI source for manifests — static tag, manifests never change in this demo
apiVersion: source.toolkit.fluxcd.io/v1
kind: OCIRepository
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  interval: 30s
  url: oci://${ghcr}/manifests
  ref:
    tag: stable
  secretRef:
    name: github-registry-credentials
---
# Kustomization — APP_VERSION substituted by kuberik rollout controller
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
  annotations:
    rollout.kuberik.com/substitute.APP_VERSION.from: kuberik-demo-app
spec:
  interval: 15s
  prune: true
  sourceRef:
    kind: OCIRepository
    name: kuberik-demo-app
  postBuild:
    substitute:
      APP_VERSION: "${initialTag}"
---
# Kuberik Rollout — only the image changes; manifests are static
apiVersion: kuberik.com/v1alpha1
kind: Rollout
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
  annotations:
    dashboard.rollout.kuberik.com/description: "Demo app — staging"
spec:
  releasesImagePolicy:
    name: kuberik-demo-app
  versionHistoryLimit: 5
  bakeTime: 5s
  healthCheckSelector:
    selector:
      matchLabels:
        app: kuberik-demo-app
---
# Health check: Flux Kustomization reconciliation
apiVersion: kuberik.com/v1alpha1
kind: HealthCheck
metadata:
  name: kuberik-demo-kustomization
  namespace: kuberik-demo-staging
  labels:
    app: kuberik-demo-app
  annotations:
    healthcheck.kuberik.com/kustomization: kuberik-demo-app
    kuberik.com/display-name: "Flux Deployment"
spec:
  class: kustomization
---
# Health check: Prometheus HighErrorRate alert
apiVersion: kuberik.com/v1alpha1
kind: HealthCheck
metadata:
  name: kuberik-demo-high-error-rate
  namespace: kuberik-demo-staging
  labels:
    app: kuberik-demo-app
  annotations:
    healthcheck.kuberik.com/prometheus-url: "http://kube-prometheus-stack-prometheus.monitoring.svc.cluster.local:9090"
    healthcheck.kuberik.com/prometheus-alert-labels: "alertname=HighErrorRate,app=kuberik-demo-app"
    healthcheck.kuberik.com/requeue-interval: "15s"
    kuberik.com/display-name: "High Error Rate"
spec:
  class: prometheus-alert
---
# Prometheus alert rules
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: kuberik-demo-alerts
  namespace: kuberik-demo-staging
  labels:
    prometheus: kube-prometheus-stack
    role: alert-rules
spec:
  groups:
    - name: kuberik-demo
      interval: 5s
      rules:
        - alert: HighErrorRate
          expr: |
            rate(http_errors_total{app="kuberik-demo-app"}[20s])
            /
            rate(http_requests_total{app="kuberik-demo-app"}[20s])
            > 0.1
          for: 10s
          labels:
            severity: critical
            app: kuberik-demo-app
          annotations:
            summary: "High error rate detected in kuberik-demo-app"
            description: "Error rate is above 10% for 30s"
---
apiVersion: environments.kuberik.com/v1alpha1
kind: Environment
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  rolloutRef:
    name: kuberik-demo-app
  backend:
    type: github
    project: "${repoFullName}"
    secret: "github-token"
  name: kuberik-demo-app
  environment: staging
`;
}

export function clusterManifestsStaging(username: string, initialTag: string, repoFullName: string): string {
  const ghcr = `ghcr.io/${username.toLowerCase()}/kuberik-demo-app`;
  return `---
apiVersion: v1
kind: Namespace
metadata:
  name: kuberik-demo-staging
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  image: ${ghcr}/app
  interval: 10s
  secretRef:
    name: github-registry-credentials
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  imageRepositoryRef:
    name: kuberik-demo-app
  filterTags:
    pattern: "^main-(?P<timestamp>[0-9]+)-[a-zA-Z0-9]+$"
    extract: "$timestamp"
  policy:
    alphabetical:
      order: asc
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: OCIRepository
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  interval: 30s
  url: oci://${ghcr}/manifests/staging
  ref:
    tag: stable
  secretRef:
    name: github-registry-credentials
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
  annotations:
    rollout.kuberik.com/substitute.APP_VERSION.from: kuberik-demo-app
spec:
  interval: 15s
  prune: true
  sourceRef:
    kind: OCIRepository
    name: kuberik-demo-app
  postBuild:
    substitute:
      APP_VERSION: "${initialTag}"
---
apiVersion: kuberik.com/v1alpha1
kind: Rollout
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
  annotations:
    dashboard.rollout.kuberik.com/description: "Demo app — staging"
spec:
  releasesImagePolicy:
    name: kuberik-demo-app
  versionHistoryLimit: 5
  bakeTime: 15s
  healthCheckSelector:
    selector:
      matchLabels:
        app: kuberik-demo-app
---
apiVersion: kuberik.com/v1alpha1
kind: HealthCheck
metadata:
  name: kuberik-demo-kustomization
  namespace: kuberik-demo-staging
  labels:
    app: kuberik-demo-app
  annotations:
    healthcheck.kuberik.com/kustomization: kuberik-demo-app
    kuberik.com/display-name: "Flux Deployment"
spec:
  class: kustomization
---
apiVersion: environments.kuberik.com/v1alpha1
kind: Environment
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-staging
spec:
  rolloutRef:
    name: kuberik-demo-app
  backend:
    type: github
    project: "${repoFullName}"
    secret: "github-token"
  name: kuberik-demo-app
  environment: staging
  relationship:
    environment: dev
    type: After
`;
}

export function clusterManifestsProd(username: string, initialTag: string, repoFullName: string): string {
  const ghcr = `ghcr.io/${username.toLowerCase()}/kuberik-demo-app`;
  return `---
apiVersion: v1
kind: Namespace
metadata:
  name: kuberik-demo-prod
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImageRepository
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-prod
spec:
  image: ${ghcr}/app
  interval: 10s
  secretRef:
    name: github-registry-credentials
---
apiVersion: image.toolkit.fluxcd.io/v1beta2
kind: ImagePolicy
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-prod
spec:
  imageRepositoryRef:
    name: kuberik-demo-app
  filterTags:
    pattern: "^main-(?P<timestamp>[0-9]+)-[a-zA-Z0-9]+$"
    extract: "$timestamp"
  policy:
    alphabetical:
      order: asc
---
apiVersion: source.toolkit.fluxcd.io/v1
kind: OCIRepository
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-prod
spec:
  interval: 30s
  url: oci://${ghcr}/manifests/prod
  ref:
    tag: stable
  secretRef:
    name: github-registry-credentials
---
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-prod
  annotations:
    rollout.kuberik.com/substitute.APP_VERSION.from: kuberik-demo-app
spec:
  interval: 15s
  prune: true
  sourceRef:
    kind: OCIRepository
    name: kuberik-demo-app
  postBuild:
    substitute:
      APP_VERSION: "${initialTag}"
---
apiVersion: kuberik.com/v1alpha1
kind: Rollout
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-prod
  annotations:
    dashboard.rollout.kuberik.com/description: "Demo app — prod"
spec:
  releasesImagePolicy:
    name: kuberik-demo-app
  versionHistoryLimit: 5
  bakeTime: 15s
  healthCheckSelector:
    selector:
      matchLabels:
        app: kuberik-demo-app
---
apiVersion: kuberik.com/v1alpha1
kind: HealthCheck
metadata:
  name: kuberik-demo-kustomization
  namespace: kuberik-demo-prod
  labels:
    app: kuberik-demo-app
  annotations:
    healthcheck.kuberik.com/kustomization: kuberik-demo-app
    kuberik.com/display-name: "Flux Deployment"
spec:
  class: kustomization
---
apiVersion: environments.kuberik.com/v1alpha1
kind: Environment
metadata:
  name: kuberik-demo-app
  namespace: kuberik-demo-prod
spec:
  rolloutRef:
    name: kuberik-demo-app
  backend:
    type: github
    project: "${repoFullName}"
    secret: "github-token"
  name: kuberik-demo-app
  environment: prod
  relationship:
    environment: staging
    type: After
`;
}
