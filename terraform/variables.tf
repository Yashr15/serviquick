# ── AWS ──────────────────────────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

# ── Naming ────────────────────────────────────────────────────────────────────
variable "project" {
  description = "Short name prefix for all resources"
  type        = string
  default     = "serviquick"
}

variable "env" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "prod"
}

# ── Networking ────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ── HTTPS ─────────────────────────────────────────────────────────────────────
variable "acm_certificate_arn" {
  description = "ARN of an ACM certificate for HTTPS. Leave empty to run HTTP-only."
  type        = string
  default     = ""
}

# ── Container images ──────────────────────────────────────────────────────────
variable "backend_image_tag" {
  description = "Docker image tag for the backend service"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Docker image tag for the frontend service"
  type        = string
  default     = "latest"
}

# ── ECS task sizing ───────────────────────────────────────────────────────────
variable "backend_cpu" {
  description = "CPU units for the backend Fargate task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Memory (MiB) for the backend Fargate task"
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "CPU units for the frontend Fargate task"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Memory (MiB) for the frontend Fargate task"
  type        = number
  default     = 512
}

# ── ECS service scaling ───────────────────────────────────────────────────────
variable "backend_desired_count" {
  description = "Initial number of backend task replicas"
  type        = number
  default     = 1
}

variable "backend_max_count" {
  description = "Maximum number of backend task replicas (Auto Scaling)"
  type        = number
  default     = 4
}

variable "frontend_desired_count" {
  description = "Initial number of frontend task replicas"
  type        = number
  default     = 1
}

variable "frontend_max_count" {
  description = "Maximum number of frontend task replicas (Auto Scaling)"
  type        = number
  default     = 4
}

# ── Application secrets ───────────────────────────────────────────────────────
variable "mongodb_uri" {
  description = "MongoDB Atlas (or DocumentDB) connection URI"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key used to sign JWT tokens"
  type        = string
  sensitive   = true
}

variable "cors_origin" {
  description = "Comma-separated list of allowed CORS origins (e.g. https://app.serviquick.io)"
  type        = string
  default     = ""
}
