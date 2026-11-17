# Audited GitOps rollback

The GitOps repository is the deployment record. Do not use an unrecorded
manual cluster edit as the normal rollback.

## Procedure

1. **Identify the prior release.** Inspect GitOps history and the Argo CD /
   Rollouts event history. Select the previous known-good digest for every
   affected service. Record the triggering commit, rollout analysis result,
   incident ID, time, and relevant CI report links.
2. **Confirm the artifact still exists.** Query the configured registry for
   each exact `image@sha256:...`. Stop if a digest is missing; do not substitute
   a tag or rebuild an equivalent image.
3. **Re-verify trust and policy.** Run `cosign verify` using the configured
   trusted certificate identity and OIDC issuer for each digest. Confirm the
   applicable vulnerability evidence and Kyverno policy status. A valid
   signature alone is not evidence that the image is safe.
4. **Submit a reviewed Git change.** Revert the GitOps commit that introduced
   the bad digest, or create a focused PR restoring the previous exact digest.
   Keep environment-specific config and rollout gates intact. Do not force-push
   or rewrite history.
5. **Reconcile through Argo CD.** Merge only under the environment's branch
   protection and required checks. Confirm Argo CD reconciles the Git revision;
   investigate sync errors instead of patching live resources.
6. **Verify recovery.** Check Argo CD sync/health, the Argo Rollouts status and
   events, readiness/liveness, and the staging/production integration checks.
   Confirm the old ReplicaSet remains healthy until the rollback completes.
7. **Preserve evidence.** Attach the Git revert/PR, registry lookup, Cosign
   output, Kyverno/admission outcome, CI/SBOM/scan reports, rollout analysis,
   health checks, and incident reference to the incident record.

If an immediate manual intervention is necessary to contain an incident,
record the operator, reason, commands, and timestamps; then reconcile Git to
the actual intended state through a reviewed PR as soon as possible. Manual
intervention is an emergency exception, not the authoritative rollback path.

Example operator commands (replace every placeholder; run only after approved
registry access is configured):

```sh
gcloud artifacts docker images describe \
  us-central1-docker.pkg.dev/PROJECT_ID/ecommerce/catalog-service@sha256:DIGEST
cosign verify \
  --certificate-identity "$COSIGN_CERTIFICATE_IDENTITY" \
  --certificate-oidc-issuer "$COSIGN_OIDC_ISSUER" \
  us-central1-docker.pkg.dev/PROJECT_ID/ecommerce/catalog-service@sha256:DIGEST
git revert <gitops-release-commit>
```
