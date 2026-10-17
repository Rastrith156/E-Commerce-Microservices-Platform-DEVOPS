# Architecture and deployment boundaries

## Application

The React/Vite frontend uses same-origin API paths. The local Nginx container
proxies those paths to three Spring Boot services: catalog (8081), cart (8082),
and order (8083). Each Java service exposes Actuator liveness/readiness probes
and Prometheus-format HTTP request metrics. Actuator metrics are not, by
themselves, a monitoring backend.

The order service defaults to simulated PayPal sandbox behavior when payment
credentials are absent. No production payment credentials or live-payment
claims are part of this delivery.

Current catalog data and cart/order state are in-memory/demo data. Persistence,
identity, authorization, and durable order processing are not implemented;
the Kubernetes scaffold is not a claim that these application services are
production-ready.

## CI and supply chain

Jenkins runs on a Linux agent with Docker, uses `npm ci` and Maven checksum
verification, and gates publication on lint/build, backend tests, SonarQube,
Gitleaks, Trivy filesystem/dependency/image scans, and Compose smoke checks.
Only after those gates does the trusted `main` job publish commit-tagged
images, record their registry digests, sign the digests with configured
keyless Cosign identity, and verify the published signatures.

Image vulnerability policy is independent of signature policy: a valid
signature proves the configured identity signed that digest; it does not
prove the image is vulnerability-free. HIGH and CRITICAL findings fail CI.
There are no approved Trivy suppressions in this checkout.

## GitOps and progressive delivery

The contents of [`../gitops`](../gitops) are intended for a separate repository.
Argo CD follows that repository as the deployment source of truth, with
self-healing enabled and pruning disabled in dev, staging, and prod. CI opens a
PR to update dev only; staging and prod use separate reviewed PRs and reuse
the same digests.

The Java services use Argo Rollouts 5% / 20% / 50% / 100% canary steps and
Prometheus analysis for HTTP availability, 5xx ratio, and p95 latency. The
queries are backed by Actuator/Micrometer instrumentation in this repo, but
they require an independently provisioned Prometheus service and scrape
configuration that attaches the `application` label. The address placeholder
is intentionally invalid: rollout analysis will not silently pass without
monitoring.

No traffic router or ingress is installed here. Without one, weights are
replica-count approximations and small replica sets cannot implement exact
percentages. Frontend uses a protected rolling update because frontend
telemetry is not currently available. Configure a supported router and
frontend metrics before claiming exact traffic splitting or frontend canaries.

Production and staging add an indefinite pause before the 100% rollout step.
Removing that pause is a Git change requiring the environment's protected-branch
review process. A successful analysis alone cannot promote production.

## Explicitly unprovisioned

GCP project/IAM, Artifact Registry, GKE, Argo CD, Argo Rollouts, Kyverno,
Prometheus, ingress/traffic routing, domain/TLS, private GitOps repository,
Jenkins plugins and credentials, and GitHub branch rulesets all require
operator setup. No cloud resources or cluster changes have been made.
