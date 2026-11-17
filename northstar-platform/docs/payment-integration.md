# PayPal status and safety

The supported local and CI mode is a **sandbox simulation**. The Order Service
status endpoint reports `simulated-sandbox` when credentials are absent, and
the CI test asserts that behavior. Compose intentionally does not forward
PayPal client credentials, and the Kubernetes workload does not reference a
payment Secret.

The current source contains optional PayPal **sandbox** API code paths when
credentials are explicitly supplied. Those paths are not live payment
processing and are not enabled by this CI/GitOps scaffold. Do not add payment
credentials to CI, Compose, manifests, logs, or Git. A production payment
integration would require a separate security, compliance, reliability, and
business approval effort; this platform does not configure one.
