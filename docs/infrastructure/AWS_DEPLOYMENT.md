# AWS Deployment Architecture & Strategy

This document outlines the blueprint for deploying the Monorepo Ecosystem (Angular, Node.js, Prisma, PostgreSQL, n8n) to Amazon Web Services (AWS) in a scalable, secure, and automated fashion.

## 1. Core Architecture Principles

Unlike our local `docker-compose.yml` which bundles everything onto a single machine, the production AWS architecture decouples the database from the application layer to guarantee data persistence and high availability.

### 1.1 Compute: AWS ECS (Elastic Container Service) with Fargate
We will NOT use standard EC2 instances (which require manual OS patching and scaling). Instead, we will use **AWS Fargate** (Serverless Compute for Containers).
- **Frontend Task**: Runs the Nginx-based Angular container.
- **Backend Task**: Runs the Node.js/Express API.
- **n8n Task**: Runs the automation workflows.

### 1.2 Storage: AWS RDS (Relational Database Service)
Running PostgreSQL inside a Docker container in production is an anti-pattern (high risk of data loss on container restart).
- We will provision a managed **AWS RDS PostgreSQL** instance.
- It will automatically handle daily backups, patch management, and vertical scaling.
- The `DATABASE_URL` environment variable in ECS will point to this RDS instance.

### 1.3 Networking & Security
- **VPC (Virtual Private Cloud)**: All resources live inside a private AWS network.
- **ALB (Application Load Balancer)**: Acts as the entry point to the internet. It maps:
  - `portofoliu.ro/*` -> Frontend ECS Task
  - `api.portofoliu.ro/*` -> Backend ECS Task
  - `n8n.portofoliu.ro/*` -> n8n ECS Task
- **Security Groups**: 
  - RDS is strictly locked down. It only accepts connections from the Backend and n8n security groups.
  - The Backend only accepts traffic from the ALB.

## 2. CI/CD Deployment Flow (GitHub Actions -> AWS)

Our existing `.github/workflows/main.yml` handles Continuous Integration (building and testing). For **Continuous Deployment (CD)**, we will add the following steps:

1. **Build & Tag**: GitHub Actions builds the `Dockerfile` for frontend and backend.
2. **Push to ECR**: The images are pushed to **AWS ECR (Elastic Container Registry)**, creating a permanent artifact.
3. **Update ECS**: GitHub Actions calls the `aws-actions/amazon-ecs-deploy-task-definition` action to gracefully swap the old containers with the new ones (Blue/Green Deployment) with zero downtime.

## 3. Migration Strategy (Phase 4 Execution)

1. Provision AWS ECR Repositories.
2. Provision RDS PostgreSQL instance.
3. Push initial schema using `npx prisma migrate deploy`.
4. Provision ECS Cluster and Task Definitions.
5. Setup ALB and Route53 (DNS).
6. Update GitHub Secrets with AWS Credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
