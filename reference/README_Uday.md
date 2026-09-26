# 🚀 AWS Production Masterclass

**Build, deploy, secure, scale, and operate a real AWS production environment — 37 chapters, one continuous project.**

---

## 📋 Chapter Overview

| Ch | Title | Production Story |
|----|-------|-----------------|
| 01 | Amazon VPC — Build Your Network Foundation | Before launching anything, we need a network |
| 02 | Amazon EC2 — Launch Your First Server | Deploy a web app on a virtual server |
| 03 | Amazon S3 — Store Files & Static Assets | Where do we store images, CSS, uploads? |
| 04 | AWS IAM — Secure Access & Permissions | Who can access what? Least privilege |
| 05 | Elastic Load Balancing — Distribute Traffic | One server isn't enough. Distribute traffic |
| 06 | Amazon Route 53 — DNS & Domain Names | Users need a domain name, not an IP |
| 07 | Amazon CloudFront — CDN & Edge Delivery | Serve content globally with low latency |
| 08 | Amazon CloudWatch — Monitor Everything | The app is live. Is it healthy? |
| 09 | AWS CloudTrail — Audit API Activity | Who changed what? Audit trail |
| 10 | Amazon RDS — Relational Databases | The app needs a database |
| 11 | AWS KMS — Encryption & Key Management | Encrypt data at rest and in transit |
| 12 | AWS Secrets Manager — Manage Credentials | Don't hardcode passwords. Rotate secrets |
| 13 | AWS STS — Temporary Credentials & Roles | Cross-account access, temporary tokens |
| 14 | AWS Systems Manager — Operations Hub | Manage servers without SSH |
| 15 | AWS Lambda — Serverless Compute | Run code without servers |
| 16 | Amazon API Gateway — Build REST APIs | Expose Lambda functions as APIs |
| 17 | Amazon DynamoDB — NoSQL Database | Serverless database for serverless apps |
| 18 | Amazon Cognito — User Authentication | Users need to sign up and log in |
| 19 | Amazon SQS — Message Queues | Decouple services. Handle async work |
| 20 | Amazon SNS — Notifications & Fan-Out | Send notifications. Fan out events |
| 21 | Amazon EventBridge — Event-Driven Architecture | React to events across AWS services |
| 22 | AWS Step Functions — Workflow Orchestration | Coordinate multi-step serverless workflows |
| 23 | Amazon ECR — Container Registry | Store Docker images securely |
| 24 | Amazon ECS — Container Orchestration | Run containerized apps at scale |
| 25 | AWS Fargate — Serverless Containers | Containers without managing servers |
| 26 | AWS CodeBuild — CI Build Automation | Automate builds. Test on every commit |
| 27 | AWS CodePipeline — CD Pipeline | Automate deployments end-to-end |
| 28 | AWS CloudFormation — Infrastructure as Code | Define infrastructure in templates |
| 29 | AWS Config — Resource Compliance | Is every resource configured correctly? |
| 30 | AWS Backup — Data Protection & DR | Backup everything. Recover from disaster |
| 31 | AWS WAF & Shield — Web App Security | Protect against attacks and DDoS |
| 32 | AWS PrivateLink — Private Connectivity | Access services without the internet |
| 33 | Amazon ElastiCache — In-Memory Caching | Speed up the app. Cache hot data |
| 34 | Amazon OpenSearch — Search & Log Analytics | Search logs. Analyze at scale |
| 35 | AWS Organizations — Multi-Account Governance | Scale from 1 account to many |
| 36 | AWS IAM Identity Center — SSO & Workforce | One login for all AWS accounts |
| 37 | Amazon Bedrock & GenAI — AI-Powered Apps | Add generative AI to your production app |

---

## 🏗️ Architecture Evolution

```
Ch 1-2:   User → Internet → EC2              (basic app on VPC)
Ch 3-4:   User → Internet → EC2 → S3         (+ storage & IAM security)
Ch 5:     User → ALB → EC2 + EC2             (+ load balancing)
Ch 6:     User → Route 53 → ALB → EC2        (+ DNS)
Ch 7:     User → Route 53 → CloudFront → ALB (+ CDN)
Ch 8-9:   + CloudWatch monitoring + CloudTrail auditing
Ch 10:    + RDS database backend
Ch 11-14: + Encryption + Secrets + Ops tooling
Ch 15-22: + Serverless (Lambda, API GW, DynamoDB, events)
Ch 23-27: + Containers (ECR, ECS, Fargate, CI/CD)
Ch 28:    + Infrastructure as Code (CloudFormation)
Ch 29-34: + Compliance, backup, security, caching, search
Ch 35-37: + Enterprise governance + GenAI capstone
```

---

## 🚀 How to Run

### Option 1 — npx (Recommended)

```bash
cd Uday_AWS
npx -y http-server ./aws-lambda-masterclass -p 5500 -c-1 -o
```

Open http://localhost:5500

### Option 2 — Python

```bash
cd Uday_AWS_Services_notes/aws-lambda-masterclass
python -m http.server 5500
```

Open http://localhost:5500

### Option 3 — VS Code Live Server

1. Install the **Live Server** extension
2. Right-click `aws-lambda-masterclass/index.html`
3. Select **Open with Live Server**

### Option 4 — Direct (limited)

Double-click `aws-lambda-masterclass/index.html` in your file explorer.
> ⚠️ Some features may not work due to CORS restrictions.

---

## 📂 Project Structure

```
Uday_AWS_Services_notes/
├── aws-lambda-masterclass/          ← Interactive web app
│   ├── index.html                   ← Course home page
│   ├── css/                         ← Design system & layout
│   ├── js/
│   │   ├── app.js                   ← App controller
│   │   ├── data/
│   │   │   ├── courses.js           ← Chapter registry (37 chapters)
│   │   │   ├── module-01-iam.js     ← Chapter data files
│   │   │   └── ...
│   │   └── engine/                  ← Interactive engines
│   └── modules/
│       ├── module-01.html           ← Chapter pages
│       └── ...
├── Phase_01_Core_AWS/               ← Source markdown (chapters 1-7 original)
├── Phase_02_.../                    ← Source markdown (chapters 8-14 original)
├── ...
└── README_Uday.md                   ← This file
```

---

## ✨ Features

- **37 interactive chapters** covering all core AWS services
- **Data-driven architecture** — all content in JS data files
- **Interactive terminals** — simulated AWS CLI commands
- **Architecture diagrams** — clickable nodes with explanations
- **Code editor** — Boto3 operations with line-by-line explanations
- **Quizzes** — knowledge checks with detailed explanations
- **Challenges** — hands-on coding challenges
- **Troubleshooting labs** — real-world error scenarios
- **Responsive** — works on desktop, tablet, and mobile

---

## 🛑 Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

---

## 🔗 Links

- **Course Home:** http://localhost:5500
- **Chapter 01 (VPC):** http://localhost:5500/modules/module-04.html
- **Chapter 15 (Lambda):** http://localhost:5500/modules/module-08.html
- **Chapter 37 (Bedrock):** http://localhost:5500/modules/module-37.html
