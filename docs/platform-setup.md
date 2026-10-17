# Platform setup and security gates

## Scope and current state

This is a repository-side implementation only. It creates no GCP resources,
clusters, registries, paid services, GitHub settings, credentials, or remote
repositories. Validate the scaffolding with the commands below, then deploy
only after the listed external dependencies have been supplied and tested.

## Jenkins prerequisites

Use a Linux Jenkins agent labelled `linux-docker` with:

- Docker Engine, Docker Compose v2, and Buildx; a working local daemon.
- `git`, `curl`, `kubectl`, `cosign`, GitHub CLI (`gh`), Bash, `grep`, and
  `sed`. Maven and Node run in versioned containers.
- Jenkins Pipeline, GitHub Branch Source/status integration, Credentials
  Binding, SonarQube Scanner, and JUnit plugins.
- A SonarQube server configured in Jenkins as `sonarqube`, a scanner tool
  named `sonar-scanner`, and a SonarQube webhook to
  `<JENKINS_URL>/sonarqube-webhook/`. The Sonar quality gate must fail closed.

Configure these non-secret job parameters/environment values:

| Name | Example / purpose |
| --- | --- |
| `IMAGE_REGISTRY` | `us-central1-docker.pkg.dev/PROJECT_ID/ecommerce` |
| `GITOPS_REPOSITORY` | HTTPS URL of the separate GitOps repository |
| `GITOPS_BASE_BRANCH` | `main` |
| `COSIGN_CERTIFICATE_IDENTITY` | Exact trusted Jenkins OIDC identity |
| `COSIGN_OIDC_ISSUER` | Exact OIDC issuer used by the Jenkins signer |
| `STAGING_BASE_URL` | HTTPS staging storefront URL for the separate integration job |
| `PRODUCTION_BASE_URL` | HTTPS production storefront URL required for prod manifest changes |

Create Jenkins credentials; never put their values in the repository or
pipeline parameters:

| Jenkins credential ID | Type | Use |
| --- | --- | --- |
| `artifact-registry-writer` | Username/password | Docker registry login; use a short-lived Artifact Registry token and least-privilege writer identity |
| `artifact-registry-reader` | Username/password | GitOps PR signature verification; read-only access to the promoted Artifact Registry repository |
| `cosign-oidc-token` | Secret text | Short-lived `SIGSTORE_ID_TOKEN` issued to the trusted Jenkins signing job |
| `gitops-github-token` | Secret text | Fine-grained GitHub token/App token limited to GitOps repository contents and pull requests |

Prefer workload identity federation and short-lived tokens over service-account
keys or long-lived personal tokens. Do not bind credentials into builds, add
them to Docker build arguments, or print them. Configure credentials only in
Jenkins' supported credential store or an approved secret manager.

The Jenkinsfile runs tests and produces reports for pull requests, but image
publication/signing and GitOps PR creation run only on `main`. Configure the
job as a GitHub multibranch pipeline, disable shallow clone/history truncation,
and set the GitHub webhook. The GitOps repository needs its own multibranch
job pointed at `gitops/Jenkinsfile` after the directory contents have been
copied to the new repository root.

## Pull requests and protected branches

Set GitHub rulesets in both repositories; repository files cannot enable
server-side branch protection. Protect `main` and `develop` in the application
repository and `main` in the GitOps repository:

1. Require pull requests and at least one independent approval (two for
   production GitOps changes); dismiss stale approvals and require approval
   after the latest push.
2. Require the exact Jenkins status/check context emitted by each multibranch
   job. Seed a test PR and copy the actual check name; do not guess it.
   Require the GitOps render and Kyverno test job too.
3. Require branches to be up to date, block force-pushes and deletion, and
   disallow administrator/bypass exceptions except a separately audited
   emergency procedure.
4. Require `CODEOWNERS` approval for `gitops/environments/prod/` (and the
   equivalent path in the separate GitOps repository). Add actual platform
   owners before enabling the rule.

Only merge the application PR after Jenkins' complete pipeline is green.
Jenkins cannot configure GitHub protection through this checkout, and no such
remote settings have been changed.

## CI gate order and evidence

The application [`Jenkinsfile`](../Jenkinsfile) runs:

1. Checkout and branch/PR target validation.
2. Gitleaks full Git history and working-tree scans.
3. `npm ci` and Maven dependency resolution with checksum enforcement.
4. Frontend lint/build; all three Spring Boot test suites and JUnit XML.
5. SonarQube analysis and blocking quality gate.
6. Trivy filesystem/dependency scan.
7. Multi-stage image builds, final-image Trivy scans, CycloneDX SBOMs, and
   Compose endpoint smoke tests, including the catalog Prometheus scrape
   endpoint and its HTTP request metrics.
8. On protected `main` only: push commit-SHA tags, capture registry digests,
   Cosign-sign and verify each pushed digest, and open a dev GitOps PR.
   Compose smoke checks run the already-built, scanned images without
   rebuilding them.

HIGH and CRITICAL Trivy findings fail. `.trivyignore` contains no suppressions;
there is no blanket `ignore-unfixed` exception. Any future exception must be
reviewed, narrowly scoped, documented with owner/rationale/expiry, and removed
when fixed. Signing is not a vulnerability waiver. Jenkins archives JUnit
reports, SARIF findings, SBOMs, verified-image records, frontend build output,
and other files under `reports/`.

The application Dockerfiles have separate builders and non-root runtime
images. Production should additionally pin all tool and base images by digest,
keep registry commit-SHA tags immutable, and enable registry vulnerability and
retention controls. Deployment overlays use `image@sha256:...`, not tags.

## GitOps repository and promotion

1. Create a **separate** private GitHub repository for GitOps. Copy the
   contents of [`../gitops`](../gitops) to its root; do not configure Argo CD
   against this application repository.
2. Replace `ORG/ecommerce-gitops`, `PROJECT_ID`, the Artifact Registry
   location/repository, and the example signer identity/issuer in the Argo CD
   Application and Kyverno policies. The dev/staging/prod all-zero digests are
   intentionally invalid bootstrap placeholders.
3. Configure the registry to reject tag overwrites and grant the Jenkins
   publisher only the required repository write scope. Configure GKE node
   identity/image pull access separately; no image-pull Secret is included.
4. Install Argo CD, Argo Rollouts, and Kyverno with their supported CRDs and
   versioned installation sources. Review and apply only
   `apps/argocd/app-ecommerce-dev.yaml` after a real verified dev digest has
   been merged. Do not apply staging/prod Applications while their placeholder
   digests remain.
5. Dev auto-syncs only after its promotion PR is merged. GitOps Jenkins checks
   render all overlays, requires the same digest when changing staging/prod
   image references, and verifies signatures on the exact changed-environment
   digests. Staging promotion is a separate PR changing only image digests.
   Changes to the staging overlay/base require `STAGING_BASE_URL` integration
   smoke checks. After Argo reconciles, staging pauses at 50%; merge a second
   reviewed PR removing the staging pause. That PR reruns the staging smoke
   checks against the canary before it can pass its required Jenkins status.
6. Promote exactly those already verified dev/staging digests to prod by PR.
   Production analysis also pauses at 50%. Explicit reviewer approval and a
   separate reviewed GitOps PR removing the prod pause are required to reach
   100%. Production manifest changes require HTTPS `PRODUCTION_BASE_URL` smoke
   checks, signature checks, the Argo analysis evidence, and protected review.
   Do not use `kubectl argo rollouts promote` as the normal promotion mechanism;
   it would bypass the Git record.

Run `cosign verify` against the exact image digest before each staging/prod
promotion and preserve its output with the PR/CI evidence. The Kyverno signature
policy independently verifies that the admitted digest has the configured
trusted identity. Update its placeholder identity to match Jenkins' actual
OIDC certificate subject and issuer before installing the policy.

Automated Argo CD sync/self-heal is enabled in each Application. `prune` is
explicitly `false`; deletions must be reviewed and removed through Git, then
handled as a separate safe operation.

## Admission and progressive delivery

Kyverno policies start with `validationFailureAction: Audit`. Run
`kyverno test policies/tests` and review policy reports in a non-production
cluster. The tests cover an approved digest/restricted Pod and a violating
workload; they do not prove signature verification against the eventual
registry/identity. First observe audit results in dev/staging, then change to
`Enforce` only after verifying all deployed images, namespace selectors, and
exceptions. Never disable verification to make a rollout pass.

The service code exposes the HTTP request counters and histogram required by
the analysis template. **No Prometheus server or scrape config exists here.**
Provision a real Prometheus-compatible backend, scrape the three service
`/actuator/prometheus` endpoints, preserve the `application` tag, establish
traffic/SLO thresholds, and replace `PROMETHEUS_ENDPOINT_REQUIRED`. No sample
metric is treated as evidence until observed. Missing metrics cause failed or
inconclusive analysis and stop the rollout.

There is no ingress, service mesh, or traffic router in this repository.
Without a supported Argo Rollouts traffic-routing integration, canary weights
are pod-count approximations and do not guarantee exact 5/20/50/100 percent
request splitting. Install and validate a traffic router before representing
the stages as exact percentages. The frontend stays on rolling updates until
it has usable telemetry. Staging/prod indefinite pauses ensure successful
analysis alone cannot promote all traffic.

Kubernetes namespaces set Pod Security Admission `restricted`. Workloads run
non-root, disallow privilege escalation, drop all Linux capabilities, use
read-only root filesystems, configure resource requests/limits, and use
`RuntimeDefault` seccomp. Validate these with Kyverno and the actual cluster
version before changing Kyverno to enforce mode.

## Local and repository-side validation

From the application repository in PowerShell:

```powershell
Set-Location .\frontend
npm ci
npm run lint
npm run build
Set-Location ..
docker compose config --quiet
```

When Docker is available, also run `docker compose up --build` and exercise
ports 8085, 8081, 8082, and 8083. In the separate GitOps repository, use:

```powershell
kubectl kustomize .\environments\dev
kubectl kustomize .\environments\staging
kubectl kustomize .\environments\prod
```

The included GitOps Jenkinsfile runs those render checks and
`kyverno test policies/tests`. Promotion PRs also compare environment digests
and verify signatures with the read-only registry credential. These are not
substitutes for a live admission test, actual vulnerability assessment,
rollout analysis, or cluster health verification.

## External blockers before production

- A real private GitOps remote and its protected-branch rules.
- Jenkins deployment, plugins, Docker-capable agent, configured SonarQube,
  registry, GitHub and short-lived signing credentials.
- GCP project, IAM/workload identity, immutable Artifact Registry repository,
  and a secured GKE cluster.
- Argo CD, Argo Rollouts and Kyverno installed and tested.
- Prometheus collection, an approved traffic router/ingress, actual SLOs,
  staging URL and application integration checks.
- GitHub rulesets, named required Jenkins checks, owners/reviewers, and
  independently approved production changes.

No credential or cloud resource should be requested or supplied in chat.
