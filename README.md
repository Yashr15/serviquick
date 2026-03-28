# ServiQuick

A full-stack, location-aware service marketplace that connects people who need household services (plumbing, electrical work, gardening, carpentry) with trusted local providers. Built with **Node.js/Express** (backend), **React/Vite** (frontend), **MongoDB**, and deployable on **AWS ECS Fargate** via Terraform.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Tech stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Local development](#local-development)
   - [Option A – Docker Compose (recommended)](#option-a--docker-compose-recommended)
   - [Option B – Manual setup](#option-b--manual-setup)
5. [Environment variables](#environment-variables)
6. [API reference](#api-reference)
7. [AWS deployment guide](#aws-deployment-guide)
   - [Step 1 – MongoDB Atlas](#step-1--mongodb-atlas)
   - [Step 2 – AWS IAM user](#step-2--aws-iam-user)
   - [Step 3 – Terraform init & apply](#step-3--terraform-init--apply)
   - [Step 4 – Build & push Docker images](#step-4--build--push-docker-images)
   - [Step 5 – (Optional) HTTPS with ACM](#step-5--optional-https-with-acm)
   - [Step 6 – Verify the deployment](#step-6--verify-the-deployment)
   - [Step 7 – CI/CD with GitHub Actions](#step-7--cicd-with-github-actions)
8. [Features](#features)

---

## Architecture overview

```
Internet
    │
    ▼
┌──────────────────────────────────┐
│  Application Load Balancer (ALB) │  ← HTTP/80 and HTTPS/443
└────────────┬─────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐     ┌──────────────┐
│ Frontend│     │   Backend    │   (path: /api/*, /health)
│  Nginx  │     │  Node.js 20  │
│  :80    │     │   :4000      │
└─────────┘     └──────┬───────┘
(ECS Fargate)          │ (ECS Fargate)
                       ▼
               ┌──────────────┐
               │  MongoDB     │
               │  Atlas /     │
               │  DocumentDB  │
               └──────────────┘

AWS resources
├── VPC with public + private subnets (2 AZs)
├── NAT Gateway
├── ECR repositories (backend, frontend)
├── ECS Cluster (Fargate, Container Insights enabled)
├── ECS Services with Auto Scaling (CPU target 60%)
├── ALB with listener rules (/api/* → backend, * → frontend)
├── ACM certificate for HTTPS (optional)
├── CloudWatch Log Groups (30-day retention)
├── CloudWatch Alarms (CPU high, 5xx errors)
├── SSM Parameter Store (secrets)
└── IAM roles (task execution, task)
```

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Backend API | Node.js 20 + Express 5 + Mongoose 8 |
| Database | MongoDB Atlas (or AWS DocumentDB) |
| Authentication | JWT (jsonwebtoken) |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan (combined in prod, dev in local) |
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Maps | Leaflet + OpenStreetMap |
| Containerisation | Docker + Docker Compose |
| Infrastructure | Terraform ≥ 1.6 + AWS provider ~5.x |
| Container platform | AWS ECS Fargate |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20 | https://nodejs.org |
| Docker & Docker Compose | ≥ 24 | https://docs.docker.com/get-docker/ |
| AWS CLI | v2 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Terraform | ≥ 1.6 | https://developer.hashicorp.com/terraform/install |

---

## Local development

### Option A – Docker Compose (recommended)

This starts MongoDB, the backend API, and the React frontend all in one command.

```bash
# 1. Clone the repository
git clone https://github.com/Yashr15/serviquick.git
cd serviquick

# 2. Copy the environment template and review the values
cp .env.example .env
# The defaults work out-of-the-box for Docker Compose.
# Change JWT_SECRET to a random string before running.

# 3. Start all services
docker compose up --build

# 4. Open the app
#   Frontend (React/Nginx):  http://localhost
#   Backend API:             http://localhost:4000
#   Health check:            http://localhost:4000/health
```

To stop:

```bash
docker compose down          # stop containers (data preserved)
docker compose down -v       # stop and delete the MongoDB volume
```

---

### Option B – Manual setup

Run the backend and frontend separately without Docker.

#### 1. Start a local MongoDB instance

```bash
# Using Docker (easiest):
docker run -d --name mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=changeme \
  mongo:7.0

# Or install MongoDB Community Edition:
# https://www.mongodb.com/docs/manual/installation/
```

#### 2. Start the backend

```bash
# From the project root
npm install

# Create the .env file
cp .env.example .env
# Edit .env – at minimum set MONGODB_URI and JWT_SECRET

# Run in development mode (nodemon hot-reload)
npm run dev
# → API available at http://localhost:4000
```

#### 3. Start the frontend

```bash
# In a separate terminal
cd client
npm install

# Point the frontend at the local backend
VITE_API_URL=http://localhost:4000 npm run dev
# → App available at http://localhost:5173
```

#### 4. Verify everything works

```bash
# Health check
curl http://localhost:4000/health
# → {"ok":true,"uptime":...,"timestamp":"..."}

# Protected route (should return 401 without a token)
curl http://localhost:4000/api/auth/me
# → {"error":"No token"}
```

---

## Environment variables

### Backend (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `4000` | Server port |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | Long random string for signing JWTs. Generate with `openssl rand -hex 32` |
| `NODE_ENV` | No | `development` | Set to `production` in production |
| `CORS_ORIGIN` | No | `http://localhost:5173,http://localhost:5174` | Comma-separated list of allowed origins |
| `MONGO_ROOT_USER` | No | `admin` | MongoDB root username (docker-compose only) |
| `MONGO_ROOT_PASSWORD` | No | `changeme` | MongoDB root password (docker-compose only) |

### Frontend (build-time)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:4000` in dev, or your ALB DNS/domain in prod). When running via Docker Compose, the Nginx proxy handles `/api/*` forwarding so this is set to `/api`. |

---

## API reference

All protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/signup` | — | Create account |
| `POST` | `/api/auth/login` | — | Log in, receive JWT |
| `GET` | `/api/auth/me` | ✅ any | Get own profile |
| `PATCH` | `/api/auth/me` | ✅ any | Update profile (name, phone, bio, location, categories) |
| `POST` | `/api/auth/change-password` | ✅ any | Change password |

### Jobs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/jobs` | requester | Post a job |
| `GET` | `/api/jobs` | any | List jobs (filter: category, status, search, lng, lat, radius, page, limit) |
| `GET` | `/api/jobs/:id` | any | Get single job |
| `PATCH` | `/api/jobs/:id` | requester | Edit open job |
| `DELETE` | `/api/jobs/:id` | requester | Delete open job |
| `POST` | `/api/jobs/:id/cancel` | requester | Cancel open/assigned job |
| `POST` | `/api/jobs/:id/claim` | provider | Submit a bid |
| `POST` | `/api/jobs/:id/accept` | requester | Accept a proposal |
| `POST` | `/api/jobs/:id/complete` | requester | Mark job complete + record payment |
| `GET` | `/api/jobs/:id/proposals` | any | List proposals for a job |
| `GET` | `/api/jobs/me/requester` | requester | My posted jobs (paginated) |
| `GET` | `/api/jobs/me/provider` | provider | My submitted proposals (paginated) |

### Providers / Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/providers` | — | List providers (filter: category, lng, lat, radius) |
| `GET` | `/api/providers/:id` | — | Public profile + rating summary |
| `GET` | `/api/providers/me` | provider | Own provider profile |
| `POST` | `/api/providers/me` | provider | Update provider profile |

### Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/reviews` | requester | Submit review for completed job |
| `GET` | `/api/reviews/provider/:id` | — | Provider rating summary |
| `GET` | `/api/reviews/provider/:id/list` | — | All reviews for a provider |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/notifications` | ✅ any | List notifications (paginated) |
| `GET` | `/api/notifications/unread-count` | ✅ any | Unread notification count |
| `PATCH` | `/api/notifications/:id/read` | ✅ any | Mark single notification as read |
| `PATCH` | `/api/notifications/read-all` | ✅ any | Mark all notifications as read |

---

## AWS deployment guide

### Step 1 – MongoDB Atlas

ServiQuick stores all data in MongoDB. We recommend **MongoDB Atlas** (free tier available).

1. Create a free account at https://cloud.mongodb.com
2. Create a new **M0 (free)** cluster in `ap-south-1` (Mumbai) or your preferred region
3. Create a database user with **read/write** access
4. Under **Network Access**, add `0.0.0.0/0` (or your NAT Gateway EIP for production)
5. Copy the connection string – it looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/serviquick?retryWrites=true&w=majority
   ```
6. Keep this URI – you'll need it in Step 3

---

### Step 2 – AWS IAM user

Create a dedicated IAM user for Terraform (do **not** use root credentials).

```bash
# Using AWS Console or CLI
aws iam create-user --user-name serviquick-deploy

# Attach the required managed policies
aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchFullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMFullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess

aws iam attach-user-policy \
  --user-name serviquick-deploy \
  --policy-arn arn:aws:iam::aws:policy/ApplicationAutoScalingForAmazonECSService

# Create access key and configure AWS CLI
aws iam create-access-key --user-name serviquick-deploy
# → copy AccessKeyId and SecretAccessKey

aws configure --profile serviquick
# Enter your AccessKeyId, SecretAccessKey, region (e.g. ap-south-1), output format (json)
```

---

### Step 3 – Terraform init & apply

```bash
cd terraform

# Initialise providers
terraform init

# Preview what will be created
terraform plan \
  -var="mongodb_uri=mongodb+srv://..." \
  -var="jwt_secret=$(openssl rand -hex 32)" \
  -var="cors_origin=http://YOUR_ALB_DNS"

# Apply (creates ~40 resources, takes ~5 minutes)
terraform apply \
  -var="mongodb_uri=mongodb+srv://..." \
  -var="jwt_secret=$(openssl rand -hex 32)" \
  -var="cors_origin=http://YOUR_ALB_DNS"
```

> **Tip:** Store sensitive vars in a `terraform.tfvars` file (already in `.gitignore`) or in AWS Secrets Manager. Never commit them.

After apply, note the outputs:

```
alb_dns_name      = "serviquick-prod-alb-123456789.ap-south-1.elb.amazonaws.com"
backend_ecr_url   = "123456789.dkr.ecr.ap-south-1.amazonaws.com/serviquick-prod-backend"
frontend_ecr_url  = "123456789.dkr.ecr.ap-south-1.amazonaws.com/serviquick-prod-frontend"
ecs_cluster_name  = "serviquick-prod-cluster"
```

---

### Step 4 – Build & push Docker images

Use the ECR URLs from the Terraform outputs.

```bash
# Set your values
export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export BACKEND_ECR=123456789.dkr.ecr.ap-south-1.amazonaws.com/serviquick-prod-backend
export FRONTEND_ECR=123456789.dkr.ecr.ap-south-1.amazonaws.com/serviquick-prod-frontend
export ALB_DNS=serviquick-prod-alb-123456789.ap-south-1.elb.amazonaws.com

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build & push backend
docker build -t serviquick-backend:latest .
docker tag serviquick-backend:latest $BACKEND_ECR:latest
docker push $BACKEND_ECR:latest

# Build & push frontend (pass the ALB URL as the API base)
docker build \
  --build-arg VITE_API_URL=http://$ALB_DNS \
  -t serviquick-frontend:latest \
  ./client
docker tag serviquick-frontend:latest $FRONTEND_ECR:latest
docker push $FRONTEND_ECR:latest
```

After pushing, force ECS to pick up the new images:

```bash
aws ecs update-service \
  --cluster serviquick-prod-cluster \
  --service serviquick-prod-backend \
  --force-new-deployment \
  --region $AWS_REGION

aws ecs update-service \
  --cluster serviquick-prod-cluster \
  --service serviquick-prod-frontend \
  --force-new-deployment \
  --region $AWS_REGION
```

---

### Step 5 – (Optional) HTTPS with ACM

For production, always use HTTPS.

1. **Request a certificate** in ACM:
   ```bash
   aws acm request-certificate \
     --domain-name app.yourdomain.com \
     --validation-method DNS \
     --region ap-south-1
   ```
2. Add the CNAME validation records to your DNS provider (Route 53, Cloudflare, etc.)
3. Wait for the certificate status to become `ISSUED`
4. Copy the ARN (e.g. `arn:aws:acm:ap-south-1:123456789:certificate/abc-123`)
5. Re-apply Terraform with the certificate:
   ```bash
   terraform apply \
     -var="mongodb_uri=..." \
     -var="jwt_secret=..." \
     -var="cors_origin=https://app.yourdomain.com" \
     -var="acm_certificate_arn=arn:aws:acm:ap-south-1:123456789:certificate/abc-123"
   ```
6. Point your domain's CNAME at the ALB DNS name

---

### Step 6 – Verify the deployment

```bash
# Health check
curl http://$ALB_DNS/health
# → {"ok":true,"uptime":42,"timestamp":"2025-..."}

# API root
curl http://$ALB_DNS/api/auth/me
# → {"error":"No token"}  (expected – not logged in)

# Open the frontend
open http://$ALB_DNS
```

Check logs in CloudWatch:

```bash
# Backend logs (live tail)
aws logs tail /ecs/serviquick-prod/backend --follow --region $AWS_REGION

# Frontend logs
aws logs tail /ecs/serviquick-prod/frontend --follow --region $AWS_REGION
```

---

### Step 7 – CI/CD with GitHub Actions

A workflow file is included at `.github/workflows/deploy.yml`. It automatically builds and deploys both Docker images to AWS ECS on every push to `main`.

Add the following **GitHub repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | IAM access key ID from Step 2 |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key from Step 2 |
| `BACKEND_ECR` | ECR URL for backend (from Terraform output) |
| `FRONTEND_ECR` | ECR URL for frontend (from Terraform output) |
| `VITE_API_URL` | `http(s)://YOUR_ALB_OR_DOMAIN` |

Once secrets are configured, every push to `main` will:
1. Build and push backend & frontend Docker images (tagged with the commit SHA and `latest`)
2. Trigger ECS rolling deployments for both services
3. Wait for deployments to stabilise before the job completes

---

## Features

### Backend
- **JWT authentication** with signup, login, profile update, password change
- **Location-aware job search** using MongoDB `$near` geo queries
- **Full-text search** on job title and description
- **Paginated** API responses for all list endpoints
- **Budget ranges** on jobs; providers see budget when bidding
- **Duplicate bid prevention** per provider per job
- **Job lifecycle**: open → assigned → completed / cancelled
- **Mock payment recording** on job completion
- **Ratings & reviews** with per-provider aggregated score
- **Notifications** for proposals, acceptance/rejection, and job completion
- **Rate limiting** (100 req/15 min on API endpoints; 20 req/15 min on auth endpoints)
- **Helmet** security headers, **compression**, **Morgan** request logging
- **Graceful shutdown** + MongoDB reconnect with retry logic

### Frontend
- **Landing page** with feature highlights, stats, and how-it-works section
- **Dashboard** with visual stats and mini bar charts for both roles
- **Post Job** with map picker and optional budget range
- **Browse Jobs** with keyword search, category/radius/location filters, live GPS tracking, bid modal
- **My Jobs** with status filter, cancel, edit, and mark-complete actions
- **Find Providers** – discover providers by category, location, and distance
- **Provider Profile** with star ratings and review list
- **Profile Settings** – edit name, phone, bio, service categories, location, and change password
- **Mobile-responsive** navigation with hamburger menu
- **Automatic 401 redirect** to login on token expiry

### Infrastructure (AWS)
- **ECS Fargate** – serverless containers, no EC2 to manage
- **ALB** with path-based routing (`/api/*` → backend, `*` → frontend)
- **HTTPS** via ACM (optional, controlled by `acm_certificate_arn` variable)
- **Auto Scaling** – CPU target tracking at 60% for both services
- **CloudWatch** log groups (30-day retention) and alarms (CPU high, 5xx errors)
- **SSM Parameter Store** for all secrets (never in container env vars)
- **ECR** image scanning on push
- **Multi-AZ** deployment across two availability zones
