# Requirement & Agent Review Specification (`requirements.md`)

This file is a standalone specification intended for AI agents (Claude, ChatGPT, Antigravity, or peer reviewers) to evaluate candidate alignment, suggest resume refinements, critique client cover notes, and generate interview questions for the **Python Engineer (Data Platform Engineering)** position.

---

## 🎯 1. Target Role & Job Requirements (From Client JD & Architecture Spec)

### Role Profile
* **Title**: Python Engineer (Data Platform Engineering) — Multi-Tenant Automotive SaaS
* **Scale**: 5,000+ Dealer Groups, 40+ Partner Systems (DMS platforms like CDK, Reynolds & Reynolds, Tekion, DealerTrack, Procede; CRMs; Digital Retail; F&I; Lenders).
* **Core Function**: Own end-to-end partner ingestion pipelines (REST, SOAP/XML, Webhooks, SFTP file feeds) landing into an **S3 Medallion Data Lake** (`Landing` → `Bronze` → `Silver` → `Gold`).

### Key Technical Requirements
1. **Python & AWS Serverless**: Modern Python (AWS Lambda Powertools, Pydantic v2, JSON Schema), Lambda, EventBridge, Step Functions, DynamoDB (Single-Table Design & deduplication locks), SQS, API Gateway, AWS CDK.
2. **Integration Protocols & Resilience**: Webhook HMAC SHA256 verification, mTLS, replay protection, exponential backoff, rate limiting, and contract testing.
3. **Multi-Tenancy**: OAuth2 via Auth0, strict row-level tenant data isolation enforced on every call (`tenant_id` propagation).
4. **AWS Bedrock & Multi-Agent Architecture** (From `about.txt` Phase 1 Scope):
   - **Strands Agent Scaffolding** & **AgentCore Runtime**.
   - Synchronous Multi-Agent Orchestrator routing between **DMS Agent** & **CRM Agent**.
   - **AWS Bedrock (Claude 3.5)** & **Bedrock Guardrails** (PII masking, allowed topics, tenant isolation).
   - **AgentCore Memory** (session & long-term tenant-namespaced memory).
   - **OpenTelemetry (OTel)** tracing into CloudWatch with record-level data lineage (`tenant_id`, `latency`, `cost`, `retrieval record IDs`).

---

## 🔬 2. Candidate's Actual Hands-On Experience & Last Project Details

### A. Last Project: Centene (Nov 2025 – Present) — *Reconciliation Engine (`cent_poc`)*
* **Context**: Decommissioning legacy Novasys architecture to transition into Salesforce.
* **Core Build (`cent_poc`)**:
  - Engineered a two-phase flat-file chunking execution engine (`compare_manager.py`) in Python to validate **100,000+ migrated policy, subscriber, and agent records** against PostgreSQL.
  - Implemented a memory-safe chunking pipeline (`POLICY_CHUNK_SIZE = 10,000`) using Pandas streaming, achieving **zero Out-Of-Memory (OOM) errors** under strict server constraints.
  - Created dynamic schema normalization rules in `configuration.py` (stripping `.0` trailing decimals, uppercasing IDs, handling missing field fallbacks).
  - Restricted DB access to **1 single batch hit per chunk**, avoiding query spikes on production databases.
  - Developed a real-time visual comparison dashboard using the Univer JS framework and a local SQLite monitoring daemon on RHEL.
  - Refactored legacy Celery asynchronous consumers across broker and payment feeds.

### B. CapitalOne (Apr 2024 – Sep 2024) — *Serverless Transaction Orchestrator*
  - Built transaction lifecycle orchestration using **AWS Step Functions**, **Lambda Powertools**, **EventBridge**, and **DynamoDB deduplication locks**.
  - Implemented TDD test suites with LocalStack and wrote 100% of infrastructure as code using **AWS CDK**.

### C. KKR & Mind Master Solutions (2022 – 2025) — *AWS Bedrock & Document AI*
  - Built AWS Bedrock (Claude 3.5) prompt extraction workflows converting unstructured financial sheets into structured JSON models.
  - Developed financial RAG pipelines using Elasticsearch dense vector search and FastAPI.
  - Built document processing pipelines using AWS Textract, S3 Medallion Lake, and Kubernetes EKS.

---

## 📄 3. Draft Client Submission Materials (For Agent Review & Suggestion)

### Client Email Draft
> **Subject**: Application & Technical Experience Overview — Senior Python Data Platform & AWS AI Engineer
> 
> Hi [Hiring Manager / Recruiter Name],
> 
> I am writing to express my strong interest in the **Python Engineer (Data Platform Engineering)** position. With over 17 years of experience building high-throughput Python data pipelines, AWS serverless microservices, and multi-agent AI systems, I am excited about the opportunity to own your partner integration platform.
> 
> In my most recent role at **Centene**, I engineered a high-scale **Python/Django Data Reconciliation Engine (`cent_poc`)** validating **100,000+ policy records** using a memory-safe flat-file chunking engine (`POLICY_CHUNK_SIZE = 10,000`), Pandas streaming, and single-query DB batch hits under strict RAM limits.
> 
> Beyond data platform engineering, I have extensive experience building multi-agent AI systems using **AWS Bedrock (Claude 3.5)**, **Strands Agent Scaffolding**, **AgentCore Runtime**, **Bedrock Guardrails**, **AgentCore Memory**, and **OpenTelemetry CloudWatch lineage**.
> 
> I welcome the opportunity to discuss how my background in Python ingestion, AWS serverless resilience, and AWS Bedrock multi-agent architectures can drive immediate value for your team.

---

## 🤖 4. Instructions for the Reviewing AI Agent

If you are an AI agent reading this file, please provide feedback on:
1. **Resume & Experience Alignment**: Are there any gaps between the candidate's `cent_poc` / CapitalOne experience and the Automotive SaaS requirements?
2. **Client Email Optimization**: How can the email draft be made even punchier for technical hiring managers?
3. **Technical Interview Questions**: What specific system design or coding questions should be asked to test the candidate on **AWS Bedrock**, **Strands scaffolding**, **Lambda Powertools**, **S3 medallion lakes**, and **webhook idempotency**?
