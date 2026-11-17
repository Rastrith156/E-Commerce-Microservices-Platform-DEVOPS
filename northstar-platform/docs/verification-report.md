# Tool and technology verification

Status checked on 2026-11-04. The repository contains a working local application and delivery templates; it is not a live cloud deployment.

| Tool / technology | Status | Evidence or remaining requirement |
| --- | --- | --- |
| Git / GitHub | VERIFIED | Local `main` checkout and `origin` are present. No commit or push was made. |
| Jenkins | IMPLEMENTED BUT NOT VERIFIED | Jenkinsfile defines CI, scan, smoke, publish, and archive stages. Trivy shell blocks pass `sh -n`; full pipeline and declarative lint remain unverified. The local agent is exited and points to an unreachable old controller address. |
| Linux Docker agent | BLOCKED BY PREREQUISITE | `jenkins-linux-docker` exits with `No route to host` for `http://172.17.0.4:8080/tcpSlaveAgentListener/`. Its prior controller is stopped. Reconnect the agent to the intended controller before running CI. |
| Docker / Docker Compose | VERIFIED | Compose config validates. All four application images rebuilt. An isolated Compose stack started with healthy PostgreSQL and returned HTTP 200 from frontend, catalog, catalog metrics, cart, order health, and PayPal status. Its database volume is preserved. |
| React / Vite / Node.js / npm | VERIFIED | Existing frontend lint, production build, and 11 Vitest tests passed in the previous verification run. |
| Java 21 / Spring Boot / Maven | VERIFIED | Existing Maven verification passed for all three services. Current Docker rebuilds reused the Maven build layers and completed successfully. |
| SonarQube | IMPLEMENTED BUT NOT VERIFIED | Local server health endpoint reports `UP`; no project analysis or quality-gate result was produced. |
| SonarScanner CLI | IMPLEMENTED BUT NOT VERIFIED | Jenkins references the configured `sonar-scanner` tool, but no CI agent was available to run it. |
| Gitleaks | VERIFIED | Prior v8.24.2 history and working-tree scans reported no leaks. |
| Trivy filesystem scan | IMPLEMENTED BUT NOT VERIFIED | The first scan stopped on Maven Central HTTP 429. The Trivy config now has Google Maven Central and repo1 fallbacks; Jenkins mounts its read-only Maven cache into Trivy. A complete post-fix filesystem scan has not finished. |
| Trivy image scans | IMPLEMENTED BUT NOT VERIFIED | The pre-fix frontend image had 49 HIGH/CRITICAL findings. After adding Alpine security upgrades and rebuilding, the frontend scan reported zero HIGH/CRITICAL findings. Catalog, cart, and order scans are still blocked on the 948 MiB Java index download. No findings are suppressed. |
| SBOM tooling | IMPLEMENTED BUT NOT VERIFIED | A CycloneDX SBOM for the rebuilt frontend validates and contains 71 components. The other three SBOMs and Jenkins artifact archiving have not been verified in a pipeline run. |
| Container registry | BLOCKED BY PREREQUISITE | No registry URL or writer credentials are configured here. Publishing remains disabled. |
| Kubernetes | VERIFIED | `kubectl kustomize` rendered the app base, Argo CD apps, Kyverno policies, and dev/staging/prod overlays. |
| Argo CD | IMPLEMENTED BUT NOT VERIFIED | Application manifests exist, but the separate GitOps remote, real digests, and cluster are external prerequisites. |
| Kyverno | VERIFIED | Kyverno CLI v1.14.0 policy test: 9 passed, 0 failed. Policy remains in Audit mode. |
| Argo Rollouts | IMPLEMENTED BUT NOT VERIFIED | Canary templates fail closed while the Prometheus address is a placeholder; no live metrics backend or cluster is connected. |
| Prometheus | IMPLEMENTED BUT NOT VERIFIED | Catalog exposes `/actuator/prometheus` and returned HTTP 200 locally. A Prometheus server/scrape target is not configured for this project. |
| Grafana | NOT IMPLEMENTED | No project Grafana service, provisioning, or dashboards are configured. |
| PostgreSQL | VERIFIED | Flyway migration and durable orders are implemented. Previous repository/persistence and container-restart lifecycle tests passed; they were not repeated. Compose keeps the database on a named volume and exposes no host port. |
| GCP / public deployment | BLOCKED BY PREREQUISITE | Deployment plan exists. A GCP project, GKE, private Cloud SQL, registry, secret sync, backups, HTTPS ingress, and reviewed DNS changes are not provisioned. No deployment or DNS changes were made. |

## Changes verified in this review

- `docker compose -f compose.yaml build --pull` rebuilt catalog, cart, order, and frontend successfully after applying current Alpine package upgrades in their runtime stages.
- The isolated Compose smoke run returned HTTP 200 from all six checks. Its test containers/network were stopped without `down -v`; `ecommerce-review-20261104_ecommerce_orders_data` remains intact.
- The frontend image before remediation had 1 CRITICAL and 48 HIGH findings. `apk upgrade --no-cache` updated vulnerable Alpine packages; the rebuilt frontend scan then reported zero HIGH/CRITICAL results. SARIF is in `reports/local-audit-20261104-frontend-postfix/trivy-frontend.sarif`.
- Trivy generated and parsed the frontend CycloneDX report at `reports/local-audit-20261104-frontend-postfix/frontend.cdx.json` (71 components).
- `git diff --check` and Compose/Kustomize validation passed. PostgreSQL lifecycle tests were not rerun.

## Remaining blockers

- Jenkins full-pipeline execution needs the Docker-capable agent reconnected to the intended Jenkins controller. The current agent uses a stale controller URL; do not run the main-branch publishing pipeline until publishing is explicitly authorized.
- The cold Trivy Java database is about 948 MiB. The ECR mirror is faster than GHCR/GCR in this environment, but the download still takes tens of minutes. The three Java-image scans, complete workspace scan, and their SBOMs must finish after the cached Java index is available.
- SonarQube analysis, registry push/signing, cluster reconciliation, Argo Rollouts analysis, and GCP deployment need the external credentials and infrastructure listed above.
