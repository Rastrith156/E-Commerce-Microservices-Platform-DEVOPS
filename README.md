# E-Commerce Microservices Platform

A simplified e-commerce application organized as independent frontend, catalog, cart, and order components. Phase 1 establishes a clean repository and a review-driven Git workflow; application implementation and delivery infrastructure belong to later phases.

## Objective

Build an evolvable microservices platform while practicing professional DevOps delivery in incremental phases. This repository currently contains only the **Phase 1: Version Control** foundation.

## Architecture

- **Frontend** — React/HTML client that will call backend REST APIs.
- **Catalog Service** — product listing and product detail API.
- **Cart Service** — user shopping-cart management.
- **Order Service** — checkout and order creation.

Service boundaries, responsibilities, and expected interactions are described in [`docs/architecture.md`](docs/architecture.md).

## Technology stack

### Phase 1 (implemented)

- Git and GitHub-compatible repository conventions
- GitFlow-style branches
- Conventional Commits
- Pull request and issue templates

### Planned for later phases (not implemented yet)

React/HTML, backend REST technologies, GitHub Actions or Jenkins, Docker, Kubernetes, Helm, Terraform, Ansible, Prometheus, Grafana, Trivy, and SAST tooling. Their mention here is roadmap context, not a claim of implementation.

## Repository structure

```text
ecommerce-microservices/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
├── docs/
│   ├── architecture.md
│   └── git-workflow.md
├── frontend/
│   ├── src/
│   ├── package.json
│   └── README.md
├── services/
│   ├── catalog-service/{src,tests,README.md}
│   ├── cart-service/{src,tests,README.md}
│   └── order-service/{src,tests,README.md}
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

Empty source and test directories contain `.gitkeep` files so Git records the intended structure.

## Branching strategy

- `main` — production-ready code only.
- `develop` — integration branch for completed work.
- `feature/*` — individual features, branched from `develop`.
- `release/*` — release preparation, branched from `develop`.
- `hotfix/*` — urgent production fixes, branched from `main`.

See [`docs/git-workflow.md`](docs/git-workflow.md) for the complete workflow and branch-protection setup.

## Developer quick start

```bash
git clone <repository-url>
cd ecommerce-microservices

git checkout develop
git pull origin develop

git checkout -b feature/catalog-api
```

Implement and test a focused change, then commit it with a Conventional Commit message:

```bash
git add .
git commit -m "feat: add catalog service"
git push -u origin feature/catalog-api
```

Create a Pull Request from **`feature/catalog-api` → `develop`**. Complete the PR template, obtain at least one approving review, address feedback, and ensure applicable tests pass. Merge using the repository's allowed merge method, then delete the feature branch.

## Pull requests and merges

1. Keep each PR focused on one change.
2. Link the relevant issue when one exists.
3. Describe testing and affected services.
4. Never include secrets, passwords, tokens, or API keys.
5. Require at least one approval before merge.
6. Do not push directly to protected `main`; prefer PRs for `develop` too.
7. Add required status checks when CI/CD is introduced in a later phase.

For all contribution rules, read [`CONTRIBUTING.md`](CONTRIBUTING.md).
