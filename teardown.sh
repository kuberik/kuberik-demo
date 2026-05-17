#!/usr/bin/env bash
set -euo pipefail

echo "=== Kuberik Demo Teardown ==="

USERNAME=$(gh api user -q .login 2>/dev/null || echo "")

# Delete app repository
if [[ -n "$USERNAME" ]]; then
  REPO="${USERNAME}/kuberik-demo-app"
  if gh repo view "$REPO" &>/dev/null 2>&1; then
    echo "Deleting GitHub repo: $REPO"
    gh repo delete "$REPO" --yes
  else
    echo "Repo $REPO not found, skipping."
  fi
fi

# Delete cluster resources
echo "Deleting cluster resources..."
for ns in kuberik-demo kuberik-demo-staging kuberik-demo-prod; do
  kubectl delete namespace "$ns" --ignore-not-found
  kubectl delete namespace "$ns" --grace-period=0 --force 2>/dev/null || true
done

echo "Done."
