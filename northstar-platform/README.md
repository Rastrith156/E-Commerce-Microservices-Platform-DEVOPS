# E-Commerce Microservices Platform

React/Vite storefront and three Spring Boot services, with an incremental,
fail-closed Jenkins and GitOps delivery scaffold. This repository does **not**
contain a provisioned GCP project, Kubernetes cluster, registry, SonarQube
server, Argo CD installation, Kyverno installation, or monitoring backend.
Nothing here claims a production deployment has run.

PayPal remains a sandbox simulation by default. Compose does not forward
PayPal credentials, the CI status test asserts `simulated-sandbox`, and the
GitOps workload contains no payment secrets. This project does not process
live payments.

## Components

| Component | Local endpoint | Runtime |
| --- | --- | --- |
| Frontend | `http://localhost:8085` | Nginx unprivileged |
| Catalog | `http://localhost:8081` | Spring Boot, Java 21 |
| Cart | `http://localhost:8082` | Spring Boot, Java 21 |
| Order | `http://localhost:8083` | Spring Boot, Java 21 |

The backend services expose health probes and Prometheus-format HTTP metrics
for a monitoring system that must be installed and configured separately.
Details and limitations are in [`docs/architecture.md`](docs/architecture.md).

## Local validation (PowerShell)

```powershell
# Generate a local-only database password for this PowerShell session.
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$env:ORDER_DB_PASSWORD = [Convert]::ToBase64String($bytes)

Set-Location .\frontend
npm ci
npm run lint
npm run build
Set-Location ..
docker compose config --quiet
docker compose up --build
```

The frontend is served on port 8085. PostgreSQL is available only on the
Compose network; it has no published host port. Stop Compose with `Ctrl+C` or
run `docker compose down` to stop and remove this project's containers and
network. The named `ecommerce_orders_data` volume is retained. Do not use
`docker compose down --volumes` if you need to keep orders. Docker must be
running. The Jenkins pipeline additionally builds Linux containers, runs Maven
tests, scans files and final images, and exercises the application endpoints.

## Durable order storage

The order service stores orders in PostgreSQL 16. Compose mounts the database
data directory on the named volume `ecommerce_orders_data`; the database has no
published port. Flyway applies SQL migrations from
`services/order-service/src/main/resources/db/migration` during service
startup, and Hibernate validates the migrated schema. Order items keep product
name and price snapshots so catalog changes do not rewrite existing orders.
The existing PayPal sandbox API is unchanged; the simulator is used when
PayPal credentials are absent or the sandbox API is unavailable.

Required environment variable:

| Variable | Purpose | Default |
| --- | --- | --- |
| `ORDER_DB_PASSWORD` | PostgreSQL and order-service password | Required; no default |
| `ORDER_DB_USER` | PostgreSQL application user | `ecommerce_app` |
| `ORDER_DB_NAME` | PostgreSQL database name | `ecommerce_orders` |

Keep the password in a local `.env` file (already ignored by Git) or set it in
the process environment. The snippet above creates a random password for the
current PowerShell session. Compose passes it to PostgreSQL and the order
service without putting it in source control. Jenkins generates a temporary
random password for Compose validation and its isolated smoke-test database.

To apply migrations and start the stack:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Flyway runs automatically when the order service starts. After adding a new
migration, recreate only that service with `docker compose up --build -d
order-service`; Flyway records applied migration checksums in the database.

Create an order and inspect the durable record:

```powershell
$payload = @{
  customerReference = 'demo-customer-42'
  items = @(@{ productId = 'chair-form'; quantity = 2 })
  delivery = @{
    recipient = 'Demo Customer'
    addressLine1 = '10 Example Road'
    city = 'Mumbai'
    region = 'MH'
    postalCode = '400001'
    countryCode = 'IN'
  }
} | ConvertTo-Json -Depth 6

$created = Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:8083/api/payments/paypal/orders' `
  -ContentType 'application/json' -Body $payload
$created
Invoke-RestMethod -Uri "http://localhost:8083/api/orders/$($created.recordId)"
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8083/api/payments/paypal/orders/$($created.orderId)/capture" `
  -ContentType 'application/json' -Body '{}'
```

`orderId` remains the payment reference used by the existing capture endpoint.
`recordId` is the durable database ID used by `GET /api/orders/{recordId}`.
The optional `customerReference` is a caller-supplied reference, not an
authenticated customer identity. This demo does not yet authenticate callers
or authorize order reads; do not expose these endpoints publicly with real
customer data until identity and access controls are added.

Restart the order service or PostgreSQL without deleting its volume to check
that stored orders remain:

```powershell
docker compose restart order-service
Invoke-RestMethod -Uri "http://localhost:8083/api/orders/$($created.recordId)"
docker compose restart order-db
Invoke-RestMethod -Uri "http://localhost:8083/api/orders/$($created.recordId)"
```

The automated lifecycle check uses a unique Compose project, restarts both
containers, verifies retrieval after service recreation, removes only its own
containers/network, and intentionally retains its test database volume:

```powershell
.\scripts\test-order-persistence.ps1
```

### Backup and restore

Create a custom-format backup through the database container. The backup is
written under the Git-ignored `backups` directory and contains customer data;
store it securely and keep it out of commits:

```powershell
New-Item -ItemType Directory -Path .\backups -Force | Out-Null
$db = (docker compose ps --quiet order-db).Trim()
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupName = "orders-$stamp.dump"
docker exec $db pg_dump -Fc -U $env:ORDER_DB_USER -d $env:ORDER_DB_NAME -f "/tmp/$backupName"
docker cp "$($db):/tmp/$backupName" ".\backups\$backupName"
docker exec $db rm -f "/tmp/$backupName"
```

Restore to a **new database name** first, then verify it before planning any
cutover. These commands do not drop or overwrite the current database:

```powershell
$db = (docker compose ps --quiet order-db).Trim()
$backup = (Resolve-Path .\backups\orders-YYYYMMDD-HHMMSS.dump).Path
$backupName = Split-Path -Leaf $backup
docker exec $db createdb -U $env:ORDER_DB_USER orders_restore_test
docker cp $backup "$($db):/tmp/$backupName"
docker exec $db pg_restore -U $env:ORDER_DB_USER -d orders_restore_test --no-owner "/tmp/$backupName"
docker exec $db rm -f "/tmp/$backupName"
docker exec $db psql -U $env:ORDER_DB_USER -d orders_restore_test -c 'SELECT count(*) FROM orders;'
```

Keep the backup and restored database until the restore is verified. A tested
cloud backup schedule and production restore drill are still required before
public deployment.

## Delivery design

The GCP Mumbai preparation plan for `rastrith.in` is in
[`docs/gcp-mumbai-deployment.md`](docs/gcp-mumbai-deployment.md). It is a
plan only; it does not provision cloud infrastructure or change DNS.

- [`Jenkinsfile`](Jenkinsfile) is the application CI pipeline. It runs on a
  Linux Docker-capable Jenkins agent, gates on lint/build, backend tests,
  SonarQube, Gitleaks, Trivy filesystem/dependency/image scans, and Compose
  smoke checks. Only `main` is configured to publish; protect it in GitHub
  before connecting a publishing registry.
- [`gitops/`](gitops) is a **repo-ready directory**, not yet a separate Git
  remote. Copy its contents into a separately created GitOps repository before
  configuring Jenkins or Argo CD. Image references are bootstrap placeholders
  until CI opens and a reviewer merges a verified dev promotion PR.
- Argo CD uses automated sync and self-healing, with pruning disabled. Staging
  and production have Git-managed indefinite rollout pauses; remove a pause
  only through a separately reviewed GitOps PR.
- Kyverno policies start in `Audit`. Validate them with the included CLI tests
  and in a non-production cluster before changing them to `Enforce`.
- Exact canary traffic percentages require an installed traffic router.
  Without it, Argo Rollouts only approximates weights with pod counts. Rollout
  analysis intentionally fails closed until a real Prometheus endpoint and
  scraped application metrics are configured.

See [`docs/platform-setup.md`](docs/platform-setup.md) for Jenkins credentials,
GitHub branch protection, separate-repository setup, promotion controls, and
unconfigured external dependencies. Follow
[`docs/rollback.md`](docs/rollback.md) for digest-based, reviewable rollback.
The current machine's validation results and blockers are recorded in
[`docs/verification-report.md`](docs/verification-report.md).
