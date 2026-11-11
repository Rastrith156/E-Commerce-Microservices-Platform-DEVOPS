terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.20.0"
    }
  }

  # Remote state configuration - uncomment and configure for production
  # backend "gcs" {
  #   bucket = "ecommerce-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# ---------------------------------------------------------------------------
# Artifact Registry for container images
# ---------------------------------------------------------------------------
resource "google_artifact_registry_repository" "images" {
  provider = google-beta
  location = var.region
  repository_id = "ecommerce-images"
  format = "DOCKER"
  description = "E-Commerce platform container images"
}

# ---------------------------------------------------------------------------
# GKE Cluster
# ---------------------------------------------------------------------------
resource "google_container_cluster" "primary" {
  name     = "ecommerce-cluster"
  location = var.zone
  remove_default_node_pool = true
  initial_cluster_version = "1.29"

  networking_config {
    # Enable intra-node visibility for logging/monitoring
  }

  # Workload Identity for secure GCP service access
  workload_identity_config {
    identity_namespace = "${var.project_id}.svc.id.goog"
  }

  # Private cluster - no public endpoints
  private_cluster_config {
    enable_private_nodes = true
    enable_private_endpoint = false
    master_ipv4_cidr_block = "10.0.0.0/28"
  }

  database_config {
    # Cloud SQL integration
  }
}

resource "google_container_node_pool" "primary" {
  name       = "ecommerce-node-pool"
  location   = var.zone
  cluster    = google_container_cluster.primary.name
  node_count = 3

  node_config {
    machine_type = "e2-medium"
    disk_size_gb = 50
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
    workload_metadata_config {
      node_metadata = "GKE_METADATA_SERVER"
    }
  }
}

# ---------------------------------------------------------------------------
# Cloud SQL for PostgreSQL
# ---------------------------------------------------------------------------
resource "google_sql_database_instance" "postgres" {
  name             = "ecommerce-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-custom-2-4096"
    storage_type = "PD_SSD"
    storage_auto_increase = true
    storage_auto_increase_limit = 100

    backup_configuration {
      enabled = true
      binary_log_enabled = true
      start_time = "02:00"
    }

    ip_configuration {
      private_network = google_compute_network.vpc.self_link
      require_ssl = true
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = false
}

resource "google_sql_database" "ecommerce" {
  name     = "ecommerce"
  instance = google_sql_database_instance.postgres.name
}

# ---------------------------------------------------------------------------
# VPC Network
# ---------------------------------------------------------------------------
resource "google_compute_network" "vpc" {
  name                    = "ecommerce-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "ecommerce-subnet"
  ip_cidr_range = "10.0.0.0/16"
  region        = var.region
  network       = google_compute_network.vpc.self_link
}

# ---------------------------------------------------------------------------
# Secret Manager
# ---------------------------------------------------------------------------
resource "google_secret_manager_secret" "paypal_client_id" {
  secret_id = "paypal-client-id"
  replication {
    auto = true
  }
}

resource "google_secret_manager_secret_version" "paypal_client_id" {
  secret = google_secret_manager_secret.paypal_client_id.id
  secret_data = var.paypal_client_id
}

resource "google_secret_manager_secret" "paypal_client_secret" {
  secret_id = "paypal-client-secret"
  replication {
    auto = true
  }
}

resource "google_secret_manager_secret_version" "paypal_client_secret" {
  secret = google_secret_manager_secret.paypal_client_secret.id
  secret_data = var.paypal_client_secret
}

# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
output "cluster_name" {
  value = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

output "artifact_registry_repository" {
  value = google_artifact_registry_repository.images.id
}

output "cloud_sql_instance" {
  value = google_sql_database_instance.postgres.name
}

output "cloud_sql_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}
