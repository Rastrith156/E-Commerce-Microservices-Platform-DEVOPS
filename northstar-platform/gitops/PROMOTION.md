# Environment promotion

CI creates a dev image-update PR only after scanning, signing, and verifying
the pushed image digests. Merge that PR to let the dev Argo CD Application
reconcile. Never use image tags or rebuild for another environment.

Promote the exact four `image@sha256` values from dev to staging in a GitOps PR.
Argo Rollouts pauses the Java services at 50%. Wait for analysis and run the
protected staging integration job using the committed digest set. GitOps
Jenkins runs the HTTPS smoke check on staging/base changes; preserve its report.
A second reviewed PR removes the staging `promotion-gates.yaml` patch to allow
the rollout to reach 100%, and re-runs the integration check before passing.

Promote the same verified digests from staging to prod in a separate PR with
explicit production reviewer approval. Production also stops at 50%. Check
staging integration evidence, current vulnerability/signature verification,
and production analysis. GitOps Jenkins requires staging and production HTTPS
smoke checks on production/base changes. A separately approved GitOps PR must
remove the prod pause patch before the rollout can reach 100%. Successful
analysis alone never releases production traffic.

Before each promotion, compare all four digest values and verify each exact
digest with the configured Cosign identity/issuer. Keep sync, analysis, and
review evidence attached to the PR. If a controller or check is unavailable,
hold the PR; do not bypass the gate.
