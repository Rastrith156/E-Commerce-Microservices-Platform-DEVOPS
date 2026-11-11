variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "GCP zone"
  type        = string
  default     = "asia-south1-a"
}

variable "paypal_client_id" {
  description = "PayPal sandbox client ID"
  type        = string
  sensitive   = true
}

variable "paypal_client_secret" {
  description = "PayPal sandbox client secret"
  type        = string
  sensitive   = true
}
