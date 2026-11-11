# Terraform Infrastructure for GCP

Terraform configuration for deploying the E-Commerce Microservices Platform on Google Cloud Platform (Mumbai region).

## Resources

| Resource | Description |
|----------|-------------|
| GKE Cluster | Kubernetes cluster with Workload Identity |
| Node Pool | 3x e2-medium nodes |
| Cloud SQL | PostgreSQL 15 instance |
| Artifact Registry | Docker image repository |
| VPC Network | Custom VPC with subnet |
| Secret Manager | PayPal credentials storage |

## Setup

```bash
# Copy example variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Edit terraform.tfvars with your project details

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan

# Apply deployment (requires approval)
terraform apply
```

## Important Notes

- Do not provision cloud resources without explicit approval.
- PayPal credentials must be sandbox only.
- Remote state is configured for GCS but commented out - uncomment for production.
- Cloud SQL uses private IP connectivity within the VPC.
- Deletion protection is disabled on Cloud SQL for development flexibility.

## Cost Optimization

- Uses e2-medium instances (cost-effective for student projects)
- Cloud SQL db-custom-2-4096 (2 vCPU, 4 GB RAM)
- PD SSD storage with auto-increase
- Automated backups with point-in-time recovery
