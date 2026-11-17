# Audited GitOps rollback

This repository is the authoritative deployment record. Do not use an
unrecorded manual cluster edit as the normal rollback.

1. Inspect Git history and Argo CD/Rollouts events. Identify the prior
   known-good digest for every affected service; record the failed release
   commit, incident ID, CI evidence, and analysis result.
2. Query Artifact Registry for each exact digest. Stop if any image is missing;
   never substitute a mutable tag or rebuild an equivalent image.
3. Run `cosign verify` against each digest with the configured certificate
   identity and OIDC issuer. Review its vulnerability evidence and admission
   policy result separately; signature validity alone is not a safety result.
4. Create a Git revert or focused PR restoring the previous digests. Preserve
   environment promotion pauses, reviewers, and branch protection. Do not
   rewrite history.
5. After protected merge, confirm Argo CD reconciles the Git revision and
   Argo Rollouts keeps the previous healthy ReplicaSet available until the
   rollback is ready.
6. Run the relevant environment health and integration checks. Preserve the
   PR/revert, registry query, Cosign output, Kyverno outcome, CI/SBOM/scan
   reports, rollout analysis, and health evidence with the incident.

If emergency manual intervention is needed, record the operator, reason,
commands, and timestamps, then reconcile the intended state through a reviewed
Git PR. That is an emergency exception, not the authoritative rollback path.
