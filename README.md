# E-Commerce Microservices Platform

A complete, secure, automated, observable, scalable and production-deployable enterprise-grade DevSecOps platform.

## Architecture

```
User
  |
  v
Frontend (React + Vite + Nginx)
  |------> Catalog Service (Spring Boot)
  |------> Cart Service (Spring Boot)
  `------> Order Service (Spring Boot)
           |
           v
    PostgreSQL (shared database)
```

## Technology stack

### Frontend
- React 18, TypeScript, Vite
- React Router DOM
- Vitest + React Testing Library
- Nginx (production reverse proxy)

### Backend microservices
- Java 21, Spring Boot 3.3.4
- Spring Data JPA, Spring Validation
- PostgreSQL 15, Flyway migrations
- Spring Actuator (health checks)

### DevSecOps
- Jenkins (CI/CD pipeline)
- GitHub Actions (PR validation, CI, release)
- SonarQube (static analysis, quality gate)
- Gitleaks (secret scanning)
- Trivy (filesystem + image scanning)
- SBOM generation (SPDX)
- Cosign (image signing and verification)
- Docker (multi-stage, non-root images)
- Docker Compose (local development)

### Kubernetes & GitOps
- Kubernetes manifests with Kustomize overlays (dev/staging/production)
- Argo CD (GitOps continuous delivery)
- Argo Rollouts (canary deployments)
- Kyverno (security policies)
- Network policies, HPA, resource limits

### Observability
- Prometheus (metrics collection)
- Grafana (dashboards)
- Structured logging with correlation IDs

### Cloud (GCP Mumbai)
- Terraform (IaC)
- GKE, Artifact Registry, Cloud SQL, Secret Manager, VPC

## Repository structure

```text
ecommerce-microservices/
├── Jenkinsfile                      # Declarative CI/CD pipeline
├── docker-compose.yml               # Local development environment
├── frontend/                        # React + Vite + TypeScript frontend
│   ├── src/
│   ├── nginx.conf                   # Production Nginx config
│   └── package.json
├── services/
│   ├── catalog-service/             # Product catalog microservice
│   ├── cart-service/                # Shopping cart microservice
│   └── order-service/               # Order checkout microservice
├── k8s/                             # Kubernetes manifests
│   ├── base/                        # Base manifests
│   └── overlays/                    # Environment overlays (dev/staging/prod)
├── monitoring/                      # Prometheus + Grafana configs
├── terraform/                       # GCP infrastructure (IaC)
├── .github/workflows/               # GitHub Actions CI/CD
│   ├── pr.yml                       # Pull request validation
│   ├── ci.yml                       # Branch CI
│   └── release.yml                  # Release workflow
└── docs/                            # Documentation
```

## Quick start (local development)

### Prerequisites
- Docker 29+ and Docker Compose
- Node.js 20+ (for frontend development)
- Java 21 + Maven 3.9+ (for backend development)
- kubectl (for Kubernetes)

### Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/Rastrith156/E-Commerce-Microservices-Platform-DEVOPS.git
cd E-Commerce-Microservices-Platform-DEVOPS

# Start Jenkins, SonarQube, and PostgreSQL
docker compose up -d

# Access:
# - Jenkins: http://localhost:18080
# - SonarQube: http://localhost:19000
```

### Build and run backend services

```bash
# Catalog service
cd services/catalog-service
mvn clean package
java -jar target/catalog-service-1.0.0.jar

# Cart service
cd services/cart-service
mvn clean package
java -jar target/cart-service-1.0.0.jar

# Order service
cd services/order-service
mvn clean package
java -jar target/order-service-1.0.0.jar
```

### Build and run frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Run frontend tests

```bash
cd frontend
npm test
```

## CI/CD

### Jenkins
The `Jenkinsfile` defines a declarative pipeline with all required stages:
1. Checkout
2. Dependency installation
3. Secret scanning (Gitleaks)
4. Frontend lint, tests, production build
5. Backend Maven tests
6. Static code analysis (SonarQube)
7. SonarQube Quality Gate
8. Software composition analysis (Trivy)
9. Trivy filesystem + image scanning
10. Docker image builds
11. SBOM generation
12. Container smoke testing
13. Image signing (Cosign)
14. Signature verification
15. Registry publishing
16. GitOps promotion
17. Deployment validation
18. Rollback verification

### GitHub Actions
- `.github/workflows/pr.yml` - Pull request validation
- `.github/workflows/ci.yml` - Branch CI (develop, main)
- `.github/workflows/release.yml` - Release workflow (tags)

## Kubernetes

```bash
# Apply base manifests
kubectl apply -k k8s/overlays/dev

# Or use Argo CD for GitOps
kubectl apply -f k8s/argocd-application.yaml
```

## Cloud deployment (GCP Mumbai)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply  # Requires explicit approval
```

## Security

- All container images are multi-stage, non-root, minimal base images
- Gitleaks scans for exposed secrets in every pipeline run
- Trivy scans filesystem and container images for vulnerabilities
- SonarQube enforces quality gate on every PR
- Cosign signs and verifies container images
- Kyverno policies enforce non-root, resource limits, and image registry restrictions
- Network policies restrict inter-service communication
- PayPal is configured for sandbox mode only
- No hardcoded credentials; all secrets via environment variables or Secret Manager

## Testing

- Frontend: Vitest + React Testing Library (unit + component tests)
- Backend: JUnit 5 + Mockito (unit tests)
- All services include context load tests and service layer tests

## Documentation

- `docs/architecture.md` - Architecture overview
- `docs/git-workflow.md` - Git workflow and branch protection
- `frontend/README.md` - Frontend documentation
- `services/*/README.md` - Individual service documentation
- `monitoring/README.md` - Monitoring setup
- `terraform/README.md` - Terraform infrastructure

## License

Private - Student portfolio project.
