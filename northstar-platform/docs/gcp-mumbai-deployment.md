# GCP Mumbai deployment plan for `rastrith.in`

This is a preparation plan only. It creates no cloud resources and changes no
DNS. Region: `asia-south1` (Mumbai). Use a project budget alert before creating
billable resources and review the live [Google Cloud pricing calculator](https://cloud.google.com/products/calculator)
with the expected traffic, database storage, backups, egress, and log volume.

## Proposed architecture

- **Runtime:** GKE Autopilot in `asia-south1`, with workloads pinned to the
  supported region, autoscaling, resource requests/limits, and the existing
  Argo CD / Rollouts / Kyverno controls. For staging, use one replica and
  disable HA database options; production can scale after measured load tests.
- **Database:** Cloud SQL for PostgreSQL in `asia-south1`, private IP only,
  VPC-native connectivity, automated backups and point-in-time recovery. Use
  a Cloud SQL Auth Proxy sidecar with Workload Identity Federation for GKE;
  keep the app's PostgreSQL username/password in Secret Manager and sync it
  into the `ecommerce-order-db` namespace Secret using an approved external
  secret controller. Set the JDBC URL to the in-pod proxy. Do not give the
  database a public IP.
- **Images:** private Artifact Registry in the same region. CI already
  addresses digests; enable cleanup policies only after retention requirements
  are defined, and retain the last known-good production digests.
- **HTTPS:** external GKE Gateway / regional Application Load Balancer with a
  Google-managed certificate for `rastrith.in` (and `www.rastrith.in` only if
  required). Route only the frontend publicly. Keep catalog, cart, order, and
  PostgreSQL as ClusterIP/private services. Add DNS A/AAAA records only after
  the Gateway has a reserved address and certificate provisioning is ready.
- **Backups and recovery:** enable Cloud SQL automated backups and PITR,
  choose retention and a separate-region export policy based on the recovery
  objectives, and perform scheduled restore drills into a separate instance.
  Record the resulting operation IDs and application-level order checks.
- **Rollback:** revert a reviewed GitOps digest promotion; keep prior image
  digests available and verify their signatures. For database changes, use
  forward-compatible expand/contract migrations; a workload rollback alone
  cannot reverse a destructive schema migration.

Google recommends the Cloud SQL Auth Proxy for GKE connections; it can use a
private-IP instance and provides IAM authorization and TLS. [Connection guidance](https://docs.cloud.google.com/sql/docs/postgres/connect-kubernetes-engine)
and [private-IP configuration](https://docs.cloud.google.com/sql/docs/postgres/private-ip)
describe the VPC prerequisites. Cloud SQL backup restore uses the managed
backup workflow; rehearse it before production. [Backup restore guide](https://docs.cloud.google.com/sql/docs/postgres/backup-recovery/restoring)

## Cost controls

- Start with one environment and low replica counts; keep staging scaled down
  outside test windows. Do not use spot capacity for database or critical
  production replicas.
- Set CPU/memory requests from measured load, define autoscaling bounds, and
  use a regional load balancer only if single-region service is acceptable.
- Keep Cloud SQL storage and backup retention proportional to measured data
  and recovery objectives. Avoid cross-region replicas until the availability
  requirement justifies their ongoing cost.
- Set budget alerts, log retention limits, and egress monitoring. Do not treat
  a budget alert as a spend cap. Check the current [GKE pricing](https://cloud.google.com/kubernetes-engine/pricing),
  [Cloud SQL pricing](https://cloud.google.com/sql/pricing), and [load balancer pricing](https://cloud.google.com/load-balancing/pricing)
  before provisioning; rates and billable network usage vary by region and
  configuration.

## Manual prerequisites and launch sequence

1. Confirm GCP project ownership, billing, `asia-south1` quotas, budget alert,
   workload identity, VPC address ranges, and domain control for `rastrith.in`.
2. Configure Artifact Registry, GKE, Argo CD, Argo Rollouts, Kyverno in Audit
   mode, Prometheus scraping, and a supported Gateway/traffic-routing setup.
3. Provision private Cloud SQL PostgreSQL, VPC connectivity, backups/PITR,
   proxy IAM, Secret Manager, and the external-secret synchronization
   mechanism. Create `ecommerce-order-db` in each target namespace with keys
   `jdbc-url`, `username`, and `password`. The current Rollout does not yet
   include the Cloud SQL proxy sidecar; add and test it before syncing to GKE.
4. Replace `ORG`, `PROJECT_ID`, registry, GitOps, signing identity, and
   Prometheus placeholders with reviewed real values. Replace bootstrap image
   digests only with CI-produced, signed digests. Never commit credentials.
5. Deploy dev and validate migration, order create/read, health, signature
   policy reports, and a canary against real scraped metrics. Require a manual
   reviewed promotion for staging and production.
6. Configure the HTTPS Gateway and managed certificate, wait for certificate
   readiness, then update the authoritative DNS records to its reserved
   address. Run external HTTPS checks before opening production traffic.
7. Verify a database backup restore and application rollback drill. Keep
   Kyverno in Audit until policy reports are clean; retain rollout analysis
   pauses until live Prometheus metrics and request routing are confirmed.

This repo currently has no GCP resources, Cloud SQL proxy sidecar, External
Secrets controller configuration, public Gateway/HTTPS route, real metrics
endpoint, DNS changes, or usable production image digests. Those are explicit
pre-deployment requirements rather than inferred successes.
