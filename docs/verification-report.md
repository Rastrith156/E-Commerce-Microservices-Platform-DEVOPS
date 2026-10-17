# Verification report

This workspace was audited against the available local environment. The implementation is a secure delivery scaffold, not a live production deployment. No GCP project, Kubernetes cluster, registry, SonarQube instance, Argo CD installation, Kyverno cluster, GitOps remote, or GitHub branch rulesets were created or configured here.

## Passing checks

The following checks ran successfully in the current local environment:

- `docker compose -f compose.yaml config --quiet` — passed.
- `docker compose -f compose.yaml build` — passed for all four application images.
- Gitleaks v8.24.2 Git-history scan — passed (9 commits scanned; no leaks found).
- Gitleaks v8.24.2 working-tree scan — passed (no leaks found).
- `npm run lint` in the frontend — passed.
- `npm test` in the frontend — passed (11 tests).
- `npm run build` in the frontend — passed.
- `npm ci` and `npm audit` in the frontend — passed after upgrading Vitest to 5.0.5 (0 vulnerabilities).
- `mvn -B -ntp -C verify` in the pinned Maven build image for catalog, cart, and order — passed (2 tests per service).
- Full Compose runtime smoke checks — frontend, same-origin catalog API, catalog health/metrics, cart, and order status returned HTTP 200; Nginx served the favicon/social image and public pages, while unknown routes, assets, and API paths returned HTTP 404.
- The built Nginx image returned the custom 404 document with HTTP 404. `/sitemap.xml` correctly returns 404 while `VITE_SITE_URL` is unset; no production domain is fabricated.
- Isolated Docker Compose runtime smoke checks for the frontend, same-origin API, catalog, cart, order status, and catalog Prometheus endpoint — passed.
- The catalog runtime image returned HTTP 200 from `/actuator/prometheus`, with `http_server_requests_seconds` present.
- `kubectl kustomize` for the GitOps app base, Argo CD app definitions, Kyverno policies, and all three environment overlays — passed.
- Each environment overlay rendered the expected four digest-pinned application references with no non-digest image references.
- `git diff --check` — passed.
- `bash -n` on the root staging script and both GitOps smoke scripts — passed.
- The shell blocks in both Jenkinsfiles were syntax-checked successfully using Git Bash.
- Maven XML parsing for all three Spring Boot service `pom.xml` files — passed.

## Failing or blocked checks

The following checks did not pass and remain blocked by missing external dependencies or implementation gaps:

- Real SonarQube analysis and quality gate — not run; no SonarQube server or Jenkins scanner tool was configured.
- Trivy filesystem/dependency scan — blocked locally. The pinned Trivy v0.61.1 image was pulled, but after about 10 minutes its 128.03 MiB vulnerability database had reached only about 2.35% at roughly 200 KiB/s. The scan was stopped before scanning; it has no scanner exit code or completed report, and no pass is claimed.
- Trivy final-image scans — not run to completion; they remain required in Jenkins after the blocking vulnerability database is available.
- Real Cosign signing and verification — not run; the Cosign binary was not installed in the environment.
- Real Kyverno CLI tests against cluster policies — not run; the Kyverno CLI was not installed in the environment.
- Real Jenkins pipeline execution — not run; no Jenkins controller / agent was available here.
- Real GitOps repository PR creation — not run; no separate GitOps remote or required GitHub token/credentials existed.
- Real Argo CD and Argo Rollouts deployment reconciliation — not run; no cluster existed.
- Real production/dev/staging smoke checks against cluster services — not run; no Kubernetes cluster or live ingress/traffic was available.
- Real registry digest push/sign/publish flow — not run; no Artifact Registry, registry credentials, or repository existed.
- Production canonical metadata and `/sitemap.xml` are intentionally omitted because `VITE_SITE_URL` is unset; configure the real root HTTPS domain before publishing the site.
- Trivy remains unverified because its vulnerability database could not be downloaded in this environment; this is separate from the passing npm audit.

## Specific application validation status

The local application stack was exercised with freshly built Docker images, but not against a cluster, registry, or production ingress. All three backend Maven verification runs passed (2 tests per service). The Compose smoke run returned HTTP 200 for the storefront, same-origin catalog API, catalog health/Prometheus, cart, and order payment-status endpoint. Nginx served public assets and pages; unknown routes, assets, and API paths returned HTTP 404. The social metadata fallback now references the actual `social-card.svg` asset. Sitemap generation requires the real root HTTPS `VITE_SITE_URL`; it is deliberately omitted until configured.

The original Maven smoke-test 404 was caused by the Prometheus metrics exporter being disabled unless explicitly enabled; the test had been using a test-only override that did not guarantee the runtime exporter was enabled. The catalog now sets `management.prometheus.metrics.export.enabled=true` in its application configuration, and the smoke test uses that same configuration. The service includes `spring-boot-starter-actuator` and the Spring Boot-managed `micrometer-registry-prometheus` dependency, exposes only `health,prometheus`, and serves Prometheus metrics from the rebuilt runtime image. Jenkins' composed-application smoke gate checks the catalog Prometheus endpoint as well. The production social-image metadata now defaults to the existing `social-card.svg` asset rather than a nonexistent PNG.

## Untested components

The following items remain untested and must be validated only in a real environment:

- Jenkins multibranch pipeline execution
- GitHub branch protection and status-check enforcement
- SonarQube quality gate blocking behavior
- Trivy severity enforcement and `.trivyignore` policy
- Docker image builds in a Linux-capable pipeline runner
- Final image Trivy scanning and SBOM generation
- Cosign keyless signing and verification with the configured identity/issuer
- Artifact Registry immutable tag and digest policy
- GitOps PR automation against the separate GitOps repository
- Argo CD sync and self-healing behavior
- Argo Rollouts canary analysis, abort, and controlled promotion
- Kyverno admission enforcement after policy validation
- Production approval gates and rollback flow

## External dependencies required before production deployment

The following external components are required to complete the target GitOps platform and should be configured by operators before claiming deployment success:

- GCP project and service identities
- Artifact Registry or equivalent image registry
- GKE cluster or equivalent Kubernetes runtime
- Jenkins controller with Docker/Buildx and required plugins
- GitHub repository with protected branches and status checks
- SonarQube instance and scanner configuration
- Prometheus (or equivalent metrics backend) with the required `application` label
- Argo CD, Argo Rollouts, and Kyverno installations with CRDs
- Real trusted Cosign identity/issuer settings
- Separate GitOps repository and GitHub token permissions
- Domain/TLS and ingress or traffic-routing support for staged and production rollout checks

## Bottom line

The repository now contains a secure-by-default delivery scaffold, validated source configuration, and production-oriented GitOps/Kubernetes templates. However, this environment did not include the real CI, registry, cluster, and monitoring services required to prove end-to-end deployment, signing, policy enforcement, or progressive delivery. The platform is therefore implemented as a production-ready template and configuration baseline, not as a deployed production system.
