# GitOps repository

This directory is the root of a **separate Git repository**. Copy its contents
to a new, private GitHub repository before configuring Argo CD or Jenkins. Do
not treat this nested directory as a substitute for a separate remote.

All application deployments are addressed by registry digest. The all-zero
digests in the overlays are deliberately unusable bootstrap placeholders; merge
only the dev promotion PR generated after CI has pushed and verified real,
signed image digests. Promote those same digests to staging and production in
reviewed PRs; never rebuild for promotion.

See [`PROMOTION.md`](PROMOTION.md) for promotion controls and
[`ROLLBACK.md`](ROLLBACK.md) for the audited rollback process. The application
repository's `docs/platform-setup.md` documents branch protection, credentials,
monitoring prerequisites, and repository validation.

Apply only the Argo CD Application for an environment after its image digests
are valid. Automated sync is enabled, self-heal is enabled, and pruning is
disabled in every environment.

The order Rollout reads `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` from the
namespace-local Secret `ecommerce-order-db`. Provision it through Secret
Manager/External Secrets or an approved cluster secret workflow before syncing
workloads. Its JDBC URL must reach a private PostgreSQL endpoint; no database
endpoint or credential belongs in Git. This repository does not provision a
production database or a secret-sync controller.

See [`../docs/gcp-mumbai-deployment.md`](../docs/gcp-mumbai-deployment.md) for
the cost-conscious deployment outline and remaining cloud prerequisites.
