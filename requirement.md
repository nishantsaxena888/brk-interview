# Requirements Specification (`requirement.md`)

**Target Role**: Python Engineer (Data Platform Engineering)  
**Domain**: Multi-Tenant Automotive SaaS Platform (5,000+ Dealer Groups, 40+ DMS/CRM Integrations)  
**Repository**: `brk-interview`

---

## 🎯 1. Business Objectives & Operational Scope

The platform serves as the central data ingestion, normalization, and multi-agent intelligence layer between **5,000+ automotive dealer groups** and **40+ third-party partner systems** (DMS platforms like CDK, Reynolds & Reynolds, Tekion, DealerTrack, Procede; CRMs; Digital Retail tools; F&I providers; and Lenders).

### Core Responsibilities:
- Own partner integrations end-to-end: spec review, sandbox testing, Python ingestion build, schema normalization, and production maintenance.
- Ingest raw partner feeds (REST, SOAP/XML, Webhooks, SFTP) into an **S3 Medallion Data Lake** (`Landing` → `Bronze` → `Silver` → `Gold`).
- Enforce strict **multi-tenant row-level data isolation** across all data pipelines and AI agent retrieval layers.
- Guarantee system resilience under partner rate-limit shifts, silent schema changes, and upstream outages.

---

## ⚙️ 2. Infrastructure & Technical Stack Requirements

### Architecture Stack (AWS Serverless / NAWS):
- **Core Language**: Modern Python (AWS Lambda Powertools, Pydantic v2, JSON Schema boundary validation).
- **Compute & Orchestration**: AWS Lambda, AWS Step Functions, EventBridge, SQS, API Gateway, ECS Fargate.
- **Data Lakes & Persistence**:
  - **S3 Data Lake**: Medallion Layering (`Landing` → `Bronze` → `Silver` → `Gold`).
  - **DynamoDB**: Single-table design for low-latency state tracking and idempotency deduplication locks (`attribute_not_exists`).
  - **Relational / Warehouse**: Amazon Aurora MySQL / PostgreSQL.
- **Security & Infrastructure**:
  - AWS Secrets Manager, SSM Parameter Store, AWS KMS encryption.
  - **100% Infrastructure as Code**: AWS CDK (Python / TypeScript).
  - Webhook security: HMAC SHA256 signature verification, mTLS, replay protection.

---

## 🤖 3. AI Platform & Multi-Agent Architecture Requirements

Based on the **A2Z AI Foundations Scope** ([about.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/about.txt)):

1. **Multi-Agent Orchestration**:
   - Built on **Strands Agent Scaffolding** and **AgentCore Runtime**.
   - Synchronous Orchestrator routing requests between specialized agents (**DMS Agent** & **CRM Agent**).
   - Intent discovery, composition, and refusal/fallback mechanisms.
2. **AuthN / AuthZ & Multi-Tenancy**:
   - Inbound OAuth2 via Auth0.
   - `Tenant ID` MUST be propagated on **every single request** to enforce row-level tenant data isolation at retrieval.
3. **AWS Bedrock & Guardrails**:
   - **AWS Bedrock (Claude 3.5)** prompt workflows.
   - **Bedrock Guardrails**: Allowed topics, PII masking, and prompt scope enforcement.
   - Red-team prompt test suite (10 automated prompts testing cross-tenant leakage and PII exfiltration).
4. **Observability & Data Lineage**:
   - OpenTelemetry (OTel) context propagation into AWS CloudWatch.
   - Record-level lineage tracking on every response (`tenant`, `persona`, `model`, `latency`, `cost`, `retrieval record IDs`).
   - CloudWatch dashboard + 3 alarms (*Error Rate*, *P95 Latency*, *Daily Spend*).
5. **AgentCore Memory**:
   - Short-term session memory + Long-term memory namespaced strictly by `tenant` and `user`.

---

## 🔬 4. Candidate Experience & Proven Track Record (`cent_poc`)

- **Centene (`cent_poc`)**: Built high-scale Python/Django Reconciliation Engine validating **100,000+ policy records** during legacy Novasys-to-Salesforce sunset. Used flat-file chunking (`POLICY_CHUNK_SIZE = 10,000`), Pandas streaming, 1 DB batch query per chunk, zero OOM errors, and Univer JS dashboards.
- **CapitalOne**: Serverless transaction coordinator using AWS Step Functions, Lambda Powertools, DynamoDB deduplication locks, LocalStack TDD, and AWS CDK IaC.
- **KKR**: Multi-tenant financial platform utilizing AWS Bedrock (Claude 3.5), Elasticsearch dense vector RAG, and FastAPI.

---

## 📑 5. Repository Documentation Map

- [requirements.md](file:///Users/nishantsaxena/workspace/brk-interview/requirements.md) / [requirement.md](file:///Users/nishantsaxena/workspace/brk-interview/requirement.md) — Requirements specifications.
- [AGENTS.md](file:///Users/nishantsaxena/workspace/brk-interview/AGENTS.md) — Workspace rules & AI agent guidelines.
- [.agents/skills/interview-prep/SKILL.md](file:///Users/nishantsaxena/workspace/brk-interview/.agents/skills/interview-prep/SKILL.md) — Interview runbook & STAR story mapping.
- [.agents/skills/aws-medallion-integration/SKILL.md](file:///Users/nishantsaxena/workspace/brk-interview/.agents/skills/aws-medallion-integration/SKILL.md) — AWS Medallion pipeline runbook.
- [client_email_draft.md](file:///Users/nishantsaxena/workspace/brk-interview/client_email_draft.md) — Client email submission draft.
- [client_submission_note.md](file:///Users/nishantsaxena/workspace/brk-interview/client_submission_note.md) — Technical experience submission note.
