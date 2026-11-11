# Security Documentation

## Security Architecture

The E-Commerce Microservices Platform implements a defence-in-depth security architecture:

### Secret Security
- **Gitleaks**: Scans for exposed secrets in every pipeline run
- **GitHub secret scanning**: Integrated via GitHub Actions
- **Jenkins credentials**: All secrets stored in Jenkins credential store
- **Cloud Secret Manager**: GCP Secret Manager for production secrets
- **No hardcoded credentials**: All configuration via environment variables

### Static Analysis
- **SonarQube**: Code quality and security hotspots
- **Quality Gate enforcement**: PRs blocked if quality gate fails
- **Maintainability checks**: Code smells, duplication, complexity

### Dependency Security
- **Trivy**: Filesystem and container image vulnerability scanning
- **Dependency vulnerability analysis**: Automated in CI/CD
- **Vulnerability remediation**: HIGH and CRITICAL findings must be fixed

### Container Security
- **Non-root containers**: All services run as non-root user
- **Minimal base images**: eclipse-temurin JRE, nginx:alpine, postgres:alpine
- **Image pinning**: Specific image tags used in production
- **Read-only filesystems**: Where compatible
- **Dropped Linux capabilities**: Security context restrictions
- **Resource restrictions**: CPU and memory limits on all containers
- **Container health checks**: Liveness, readiness, startup probes

### Supply Chain Security
- **SBOM**: CycloneDX/SPDX SBOM generated for every image
- **Cosign image signing**: All images signed before publishing
- **Signature verification**: Signatures verified before deployment
- **Immutable image digests**: Production uses digest-based references
- **SLSA-aligned build practices**: Reproducible builds where practical

### Kubernetes Security
- **Kyverno policies**: Non-root, resource limits, image registry restrictions
- **Pod Security Standards**: Restricted profile enforced
- **Least-privilege RBAC**: Service accounts with minimal permissions
- **Network policies**: Inter-service communication restricted
- **Restricted secrets access**: Secrets mounted only to required pods

## Security Findings

All security findings are documented and handled:
- **CRITICAL/HIGH**: Must be fixed before production deployment
- **MEDIUM**: Should be fixed in next release cycle
- **LOW**: Documented and tracked

No blanket ignores or false security claims are used.

## PayPal Integration

PayPal is configured for **sandbox mode only**. Production integration requires:
1. PayPal production credentials
2. Updated API base URL
3. Additional security review

## Compliance

- OWASP Top 10 considerations addressed
- Input validation on all API endpoints
- Structured error handling (no stack traces leaked)
- Correlation IDs for distributed tracing and audit
- Secure headers (X-Frame-Options, X-Content-Type-Options, CSP)
