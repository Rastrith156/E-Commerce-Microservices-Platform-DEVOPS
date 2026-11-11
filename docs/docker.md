# Docker Guide

## Dockerfile Standards

All service Dockerfiles follow these standards:

1. **Multi-stage builds**: Build stage compiles, runtime stage runs
2. **Minimal base images**: eclipse-temurin JRE alpine, nginx:alpine
3. **Non-root execution**: Dedicated app user with limited privileges
4. **Health checks**: HTTP or exec-based health checks
5. **Graceful shutdown**: terminationGracePeriodSeconds configured
6. **Resource limits**: CPU and memory limits defined

## Building Images

```bash
# Catalog service
docker build -t catalog-service:1.0.0 ./services/catalog-service

# Cart service
docker build -t cart-service:1.0.0 ./services/cart-service

# Order service
docker build -t order-service:1.0.0 ./services/order-service

# Frontend
docker build -t frontend:1.0.0 ./frontend
```

## Running with Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | Nginx reverse proxy |
| Catalog Service | 8081 | Product catalog API |
| Cart Service | 8082 | Shopping cart API |
| Order Service | 8083 | Order checkout API |
| PostgreSQL | 5432 | Shared database |
| Jenkins | 18080 | CI/CD controller |
| SonarQube | 19000 | Static analysis |

## Environment Variables

Each service supports the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | ecommerce |
| DB_USERNAME | Database username | ecommerce |
| DB_PASSWORD | Database password | ecommerce |
| SERVER_PORT | Application port | 8081/8082/8083 |

## Security

- All images run as non-root user
- No secrets baked into images
- Health checks on all containers
- Resource limits on all containers
