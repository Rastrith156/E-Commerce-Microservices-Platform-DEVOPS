# Monitoring

Prometheus and Grafana configuration for the E-Commerce Microservices Platform.

## Components

- **Prometheus**: Metrics collection and storage
- **Grafana**: Dashboards and visualization
- **Alerting rules**: Service down, high error rate, high response time

## Prometheus scrape targets

| Job | Target | Port |
|-----|--------|------|
| catalog-service | catalog-service pods | 8081 |
| cart-service | cart-service pods | 8082 |
| order-service | order-service pods | 8083 |
| kubernetes-pods | All Kubernetes pods | - |
| kubernetes-nodes | Kubernetes nodes | - |

## Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| CatalogServiceDown | up == 0 for 1m | Critical |
| CartServiceDown | up == 0 for 1m | Critical |
| OrderServiceDown | up == 0 for 1m | Critical |
| HighErrorRate | Error rate > 5% for 2m | Warning |
| HighResponseTime | p95 response time > 1s for 2m | Warning |
| PostgresDown | up == 0 for 1m | Critical |

## Setup

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Deploy Prometheus
kubectl apply -f monitoring/prometheus-deployment.yaml

# Deploy Grafana
kubectl apply -f monitoring/grafana-deployment.yaml

# Apply alerting rules
kubectl apply -f monitoring/alerts.yml
```

## Grafana dashboard

Import `monitoring/grafana-dashboard.json` into Grafana to view the E-Commerce Platform dashboard.
