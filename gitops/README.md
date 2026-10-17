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
