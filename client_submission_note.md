# Candidate Submission Note & Technical Experience Mapping

**Candidate Name**: Nishant Saxena  
**Position Applied For**: Python Engineer (Data Platform Engineering) — Automotive SaaS Platform  
**Total Experience**: 17+ Years  
**Core Expertise**: Modern Python (Lambda Powertools, Pydantic, FastAPI/Django), AWS Serverless (Step Functions, EventBridge, DynamoDB, S3 Medallion Architecture, CDK), 40+ Third-Party Partner Integrations, Multi-Tenant Data Isolation, and AWS Bedrock / Multi-Agent AI Systems.

---

## 📌 Executive Summary & Key Value Proposition

Nishant Saxena is a **17+ year Principal Software & Data Platform Engineer** with extensive experience architecting **high-scale, event-driven ingestion pipelines**, **multi-tenant data platforms**, and **partner integration engines** on AWS. 

He is an expert **power-user of AI engineering tools** (Claude 3.5, Gemini, Antigravity IDE, GitHub Copilot) to parse third-party vendor specs/WSDLs, rapidly scaffold typed Python client SDKs, generate TDD contract test suites, and troubleshoot distributed production logs.

---

## 🔬 Recent Project Breakdown & Technology Alignment

### 1. Centene (Nov 2025 – Present) — *High-Scale Data Migration & Reconciliation Engine*
* **Role**: AI Polyglot / Senior Data Platform Engineer
* **Domain & Business Context**: Validating high-volume policy, subscriber, and agent records during the decommissioning of legacy Novasys architecture to Salesforce.
* **Tech Stack**: Modern Python, Django, Pandas, PostgreSQL, SQLite, Flat-File Chunking Engine, Celery, Claude 3.5 & Antigravity AI frameworks.
* **Similarities to Target Role**:
  - **High-Volume Data Processing**: Engineered a two-phase flat-file chunking engine (`compare_manager.py`) processing **100,000+ records** per run while maintaining a minimal memory footprint (zero OOM errors).
  - **Schema Normalization**: Developed custom transformation & field mapping rules to clean inconsistent external policy formats (stripping trailing `.0`, field uppercasing, handling missing data).
  - **Single-Query Batch Verification**: Restricted database hits to 1 batch query per chunk to prevent load spikes on target databases.
  - **Data Observability**: Built dynamic real-time reporting dashboards (Univer framework) and local SQLite system monitoring for data discrepancies.

---

### 2. CapitalOne (Apr 2024 – Sep 2024) — *Serverless Transaction Orchestration Engine*
* **Role**: Principal Engineer (Python / AWS Serverless)
* **Domain & Business Context**: Building a scalable, event-driven transaction pipeline coordinating the complete lifecycle of financial transactions across microservices.
* **Tech Stack**: Python (AWS Lambda Powertools, PyTest), AWS Step Functions, EventBridge, DynamoDB (Single-Table Design), LocalStack TDD, Node.js / TypeScript AWS CDK.
* **Similarities to Target Role**:
  - **AWS Serverless Orchestration**: Coordinated event-driven workflows across API Gateway, Lambda, Step Functions, and DynamoDB.
  - **Resilience & Idempotency**: Built generic Lambda handlers with structured exception handling, exponential backoff retries, and **DynamoDB-backed deduplication locks** for at-least-once event delivery.
  - **Infrastructure as Code**: Delivered 100% of infrastructure as code using **AWS CDK** with automated CI/CD deployment pipelines.
  - **Observability**: Implemented OpenTelemetry tracing and structured logging for end-to-end transaction visibility.

---

### 3. KKR (May 2025 – Nov 2025) — *Multi-Tenant Financial Data Platform & AI RAG Pipeline*
* **Role**: Principal AI Engineer
* **Domain & Business Context**: Building a high-throughput platform to ingest unstructured financial data feeds, validate sheets, and detect valuation anomalies.
* **Tech Stack**: Python (FastAPI), React/Redux, AWS Bedrock (Claude 3.5), Elasticsearch Dense Vectors (RAG), PostgreSQL, AWS EKS.
* **Similarities to Target Role**:
  - **Unstructured Partner Feed Ingestion**: Ingested feeds from external partner platforms (SharePoint, external APIs, Excel/PDF feeds).
  - **AWS Bedrock & Prompt Engineering**: Built serverless Python APIs leveraging Bedrock (Claude 3.5) to parse unstructured files into structured JSON models.
  - **RAG & Anomaly Detection**: Built vector search over Elasticsearch to detect data anomalies and generate automated exception reports.

---

## 🎯 Direct Technology & Competency Mapping Table

| Requirement in JD / Architecture Spec | Nishant's Hands-On Production Experience |
| :--- | :--- |
| **10+ Years Modern Python** | 17+ years Python experience (Lambda Powertools, Pydantic v2, FastAPI, Django, Pandas). |
| **AWS Native Stack (NAWS)** | Production Lambda, EventBridge, Step Functions, DynamoDB (Single-Table), S3, SQS, API Gateway, Secrets Manager, KMS, CDK. |
| **S3 Medallion Data Lake** | Landing → Bronze → Silver → Gold layering with Parquet transformations and partition keys. |
| **40+ Partner Integrations** | Webhooks (HMAC verification, replay protection), REST APIs, SOAP/WSDL endpoints, SFTP/file feeds. |
| **Resilience Under Scale** | Idempotency keys, DynamoDB deduplication, exponential backoff, rate limiting, JSON Schema boundary validation. |
| **Multi-Tenancy & Auth** | OAuth2, Auth0, Row-level tenant isolation, Azure Entra ID, Keycloak, IAM ABAC policies. |
| **AI Tooling & Agent Architecture** | AWS Bedrock (Claude 3.5), AgentCore Memory, Bedrock Guardrails, OpenTelemetry lineage, Claude / Antigravity power-user. |

---

## 📄 Note for Submission to Client

> **Cover Note**:
> 
> *"Nishant Saxena brings 17+ years of Senior Python and AWS Data Platform engineering experience, specializing in high-scale multi-tenant data ingestion and serverless orchestration. In his recent engagement at Centene, Nishant engineered a high-volume Python reconciliation engine (`cent_poc`) that validated 100,000+ migrated records using flat-file chunking and custom schema normalization under strict memory constraints. At CapitalOne, he architected an AWS serverless transaction coordinator using Step Functions, Lambda Powertools, DynamoDB deduplication locks, and AWS CDK. His expertise across REST/SOAP/Webhook integration protocols, S3 medallion data lakes, Pydantic contract validation, and daily use of AI tools (Claude 3.5 / Antigravity IDE) for spec parsing and client scaffolding aligns 100% with your Data Platform Engineering requirements."*
