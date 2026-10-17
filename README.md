# E-Commerce Microservices Platform

React/Vite storefront and three Spring Boot services, with an incremental,
fail-closed Jenkins and GitOps delivery scaffold. This repository does **not**
contain a provisioned GCP project, Kubernetes cluster, registry, SonarQube
server, Argo CD installation, Kyverno installation, or monitoring backend.
Nothing here claims a production deployment has run.

PayPal remains a sandbox simulation by default. Compose does not forward
PayPal credentials, the CI status test asserts `simulated-sandbox`, and the
GitOps workload contains no payment secrets. This project does not process
live payments.

## Components

| Component | Local endpoint | Runtime |
| --- | --- | --- |
| Frontend | `http://localhost:8085` | Nginx unprivileged |
| Catalog | `http://localhost:8081` | Spring Boot, Java 21 |
| Cart | `http://localhost:8082` | Spring Boot, Java 21 |
| Order | `http://localhost:8083` | Spring Boot, Java 21 |

The backend services expose health probes and Prometheus-format HTTP metrics
for a monitoring system that must be installed and configured separately.
Details and limitations are in [`docs/architecture.md`](docs/architecture.md).

## Local validation (PowerShell)

```powershell
Set-Location .\frontend
npm ci
npm run lint
npm run build
Set-Location ..
docker compose config --quiet
docker compose up --build
```

The frontend is served on port 8085. Stop Compose with `Ctrl+C`; run
`docker compose down` to remove the local containers. Docker must be running.
The Jenkins pipeline additionally builds Linux containers, runs Maven tests,
scans files and final images, and exercises all four HTTP endpoints.

## Delivery design

- [`Jenkinsfile`](Jenkinsfile) is the application CI pipeline. It runs on a
  Linux Docker-capable Jenkins agent, gates on lint/build, backend tests,
  SonarQube, Gitleaks, Trivy filesystem/dependency/image scans, and Compose
  smoke checks. Only `main` is configured to publish; protect it in GitHub
  before connecting a publishing registry.
- [`gitops/`](gitops) is a **repo-ready directory**, not yet a separate Git
  remote. Copy its contents into a separately created GitOps repository before
  configuring Jenkins or Argo CD. Image references are bootstrap placeholders
  until CI opens and a reviewer merges a verified dev promotion PR.
- Argo CD uses automated sync and self-healing, with pruning disabled. Staging
  and production have Git-managed indefinite rollout pauses; remove a pause
  only through a separately reviewed GitOps PR.
- Kyverno policies start in `Audit`. Validate them with the included CLI tests
  and in a non-production cluster before changing them to `Enforce`.
- Exact canary traffic percentages require an installed traffic router.
  Without it, Argo Rollouts only approximates weights with pod counts. Rollout
  analysis intentionally fails closed until a real Prometheus endpoint and
  scraped application metrics are configured.

See [`docs/platform-setup.md`](docs/platform-setup.md) for Jenkins credentials,
GitHub branch protection, separate-repository setup, promotion controls, and
unconfigured external dependencies. Follow
[`docs/rollback.md`](docs/rollback.md) for digest-based, reviewable rollback.
The current machine's validation results and blockers are recorded in
[`docs/verification-report.md`](docs/verification-report.md).
