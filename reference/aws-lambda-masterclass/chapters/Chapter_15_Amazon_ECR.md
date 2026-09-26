# Chapter 15 — Amazon ECR (Elastic Container Registry)

---

## Prerequisite Chapters
- Chapter 01 — AWS IAM (ECR access policies)
- Chapter 03 — Amazon EC2 (Docker basics)
- Chapter 04 — Amazon VPC (VPC endpoints for ECR)

## Used In Production Practicals
- Practical 25 — Docker + ECR
- Practical 26 — ECS + EC2 + ALB
- Practical 27 — ECS + Fargate + ALB + RDS
- Practical 33 — Container CI/CD (CodeBuild → ECR → ECS)
- Practical 15 — Flagship Production Architecture

---

## 1. Learning Objectives

By the end of this chapter, you will be able to:

1. **Explain** ECR's role in the container workflow.
2. **Create** repositories and push/pull Docker images.
3. **Configure** lifecycle policies to manage image storage costs.
4. **Enable** image scanning for vulnerability detection.
5. **Set up** cross-account and cross-region replication.
6. **Implement** immutable tags for production image management.
7. **Troubleshoot** authentication, push/pull errors, and access issues.
8. **Answer** interview questions about container registries.

---

## 2. What is Amazon ECR?

ECR is a fully managed Docker container registry that stores, manages, and deploys container images. It integrates natively with ECS, EKS, Lambda, and CodeBuild.

### ECR in the Container Workflow
```
Developer → Dockerfile → docker build → docker push → ECR
                                                        ↓
ECS/EKS/Lambda ← docker pull ← ECR
```

### Key Characteristics
- **Fully managed** — no registry servers to operate
- **IAM integrated** — fine-grained access control
- **Image scanning** — detect vulnerabilities (Inspector integration)
- **Lifecycle policies** — auto-delete old images
- **Cross-region replication** — images in DR region
- **Immutable tags** — prevent overwriting production images
- **OCI compatible** — Docker and OCI image formats

---

## 3. Core Concepts

### Repository Types
| Type | Visibility | Use Case |
|------|-----------|----------|
| **Private** | IAM-controlled access | Production applications |
| **Public** | Anyone can pull (ECR Public Gallery) | Open-source projects |

### Image Tagging Strategy
```
Production Strategy:
  - Every build: myapp:a1b2c3d (git commit SHA — unique)
  - Version tags: myapp:v2.1.0 (semantic version)
  - Latest: myapp:latest (mutable pointer)
  - Environment: myapp:prod-v2.1.0

Enable immutable tags → prevent overwriting tagged images
```

---

## 4-10. CLI Commands & Operations

### Repository Management
```bash
# Create repository
aws ecr create-repository \
    --repository-name my-app \
    --image-scanning-configuration scanOnPush=true \
    --image-tag-mutability IMMUTABLE \
    --encryption-configuration encryptionType=KMS

# List repositories
aws ecr describe-repositories --query 'repositories[*].[repositoryName,repositoryUri]' --output table
```

### Docker Push/Pull
```bash
# Authenticate Docker (12-hour token)
aws ecr get-login-password --region ap-south-1 | \
    docker login --username AWS --password-stdin \
    123456789012.dkr.ecr.ap-south-1.amazonaws.com

# Build, tag, push
docker build -t my-app .
docker tag my-app:latest 123456789012.dkr.ecr.ap-south-1.amazonaws.com/my-app:v1.0.0
docker push 123456789012.dkr.ecr.ap-south-1.amazonaws.com/my-app:v1.0.0

# Pull
docker pull 123456789012.dkr.ecr.ap-south-1.amazonaws.com/my-app:v1.0.0
```

### Lifecycle Policy
```bash
aws ecr put-lifecycle-policy --repository-name my-app \
    --lifecycle-policy-text '{
        "rules": [
            {"rulePriority": 1, "description": "Keep last 10 versioned images",
             "selection": {"tagStatus": "tagged", "tagPrefixList": ["v"], "countType": "imageCountMoreThan", "countNumber": 10},
             "action": {"type": "expire"}},
            {"rulePriority": 2, "description": "Delete untagged after 1 day",
             "selection": {"tagStatus": "untagged", "countType": "sinceImagePushed", "countUnit": "days", "countNumber": 1},
             "action": {"type": "expire"}}
        ]
    }'
```

### Image Scanning
```bash
aws ecr start-image-scan --repository-name my-app --image-id imageTag=v1.0.0
aws ecr describe-image-scan-findings --repository-name my-app --image-id imageTag=v1.0.0 \
    --query 'imageScanFindings.findingSeverityCounts'
```

---

## 19. Troubleshooting

### Problem 1: "no basic auth credentials"
```
Cause: Docker login expired (12-hour token)
Fix: aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
CI/CD: Add login step before every push
```

### Problem 2: AccessDenied on Push
```
Check: IAM role has ecr:GetAuthorizationToken, ecr:PutImage, ecr:InitiateLayerUpload
Cross-account: Set repository policy for cross-account access
```

---

## 22. Interview Questions

### Basic Questions (10)

**Q1: What is Amazon ECR?**
A: A managed Docker container registry. Stores, scans, and deploys container images. Integrates with ECS, EKS, Lambda, CodeBuild.

**Q2: How do you authenticate Docker with ECR?**
A: `aws ecr get-login-password | docker login --username AWS --password-stdin ECR_URI`. Token valid for 12 hours.

**Q3: What is image scanning?**
A: ECR scans images for known vulnerabilities (CVEs) using Amazon Inspector. Enable scan-on-push for automatic scanning.

**Q4: What are lifecycle policies?**
A: Rules to automatically delete old images. Keep last N tagged images, delete untagged after N days. Reduces storage costs.

**Q5: What are immutable tags?**
A: Prevents overwriting existing image tags. Once v1.0.0 is pushed, it can't be replaced. Ensures production images are never accidentally changed.

**Q6-Q10**: *(Cover: cross-region replication, cross-account access, repository policies, encryption, and public vs private repos.)*

### Intermediate-Advanced & Scenario Questions (30)

**Q11-Q40**: *(Cover: CI/CD integration, VPC endpoints for ECR, image tag strategy, multi-architecture images, ECR + Lambda, signing images, and vulnerability remediation workflow.)*

---

## 25. Production Checklist

- [ ] Scan on push enabled
- [ ] Immutable tags enabled
- [ ] Lifecycle policy configured
- [ ] KMS encryption enabled
- [ ] Cross-region replication (for DR)
- [ ] VPC endpoint for ECR (avoid NAT costs)
- [ ] CI/CD pushes with git SHA + semantic version
- [ ] Cross-account access policy (if multi-account)

---

## 26. Chapter Summary

1. **Scan on push** — catch vulnerabilities before deployment
2. **Immutable tags** — prevent overwriting production images
3. **Lifecycle policies** — auto-delete old images, control costs
4. **Git SHA + version tags** — traceability from image to code
5. **VPC endpoint** — pull images privately without NAT
6. **12-hour auth tokens** — re-authenticate in CI/CD pipelines
7. **Cross-region replication** — images in DR region
8. **Integrates natively** — ECS, EKS, Lambda, CodeBuild

---
---

# 🔬 Practical Lab 41 — Docker + ECR

## Lab Overview
| Item | Detail |
|------|--------|
| **Difficulty** | Intermediate |
| **Duration** | 25 minutes |
| **Cost** | ~$0.10/GB storage |
| **Prerequisites** | Docker installed, Practical 01 (IAM) |
| **Lab Environment** | Environment 9 — Containers |

### Step 1 — Create ECR Repository
1. **ECR** → **Create repository**
   - **Name**: `prod-web-app`
   - ✅ Scan on push
   - ✅ Immutable tags

📸 **Screenshot 01** — ECR Repository Created
> **Verify**: Scan on push enabled, tag immutability on

### Step 2 — Build and Push Docker Image
```bash
# Authenticate
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI

# Build
docker build -t prod-web-app .
docker tag prod-web-app:latest $ECR_URI/prod-web-app:v1.0.0

# Push
docker push $ECR_URI/prod-web-app:v1.0.0
```

📸 **Screenshot 02** — Image Pushed to ECR
> **What you should see**: Image with tag v1.0.0, scan results showing

📸 **Screenshot 03** — Vulnerability Scan Results
> **Verify**: Scan findings show severity counts (CRITICAL, HIGH, etc.)

🎯 **Interview Insight**: "How do you handle container image security?"
> **Strong answer**: "ECR scan on push with Inspector integration. Immutable tags prevent overwriting production images. Lifecycle policies delete untagged images. CI/CD pipeline fails on CRITICAL vulnerabilities. Base images from trusted sources, minimal images (Alpine/distroless)."
