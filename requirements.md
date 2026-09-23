# Technical & Functional Requirements Specification

**Target Position**: Python Engineer (Data Platform Engineering)  
**Domain**: Multi-Tenant Automotive SaaS Platform  
**Target Repository**: `brk-interview`

---

## 🎯 1. Role Overview & System Objectives

The platform serves as the central data ingestion, normalization, and intelligence layer between **5,000+ automotive dealer groups** and **40+ third-party partner systems** (DMS platforms like CDK, Reynolds & Reynolds, Tekion, DealerTrack, Procede; CRMs; Digital Retail tools; F&I providers; and Lenders).

### Core Goals:
- Own partner integrations end-to-end: spec review, sandbox testing, Python ingestion build, schema normalization, and production maintenance.
- Ingest raw partner feeds (REST, SOAP/XML, Webhooks, SFTP) into an **S3 Medallion Data Lake** (`Landing` → `Bronze` → `Silver` → `Gold`).
- Enforce strict **multi-tenant row-level data isolation** across all data pipelines and AI agent retrieval layers.
- Guarantee system resilience under partner rate-limit shifts, silent schema changes, and upstream outages.

---

## ⚙️ 2. Core Infrastructure & Stack Requirements

### Architecture Stack (AWS Serverless / NAWS):
- **Primary Language**: Modern Python (AWS Lambda Powertools, Pydantic v2, JSON Schema validation).
- **Compute & Orchestration**: AWS Lambda, AWS Step Functions, EventBridge, SQS, API Gateway, ECS Fargate.
- **Data Lakes & Databases**:
  - **S3 Data Lake**: Medallion Layering (Landing → Bronze → Silver → Gold).
  - **DynamoDB**: Single-table design for low-latency state tracking and idempotency deduplication locks.
  - **Relational / Warehouse**: Amazon Aurora MySQL / PostgreSQL.
- **Security & Infrastructure**:
  - AWS Secrets Manager, SSM Parameter Store, AWS KMS encryption.
  - **100% Infrastructure as Code**: AWS CDK (Python / TypeScript).
  - Webhook security: HMAC SHA256 signature verification, mTLS, replay protection.

---

## 🤖 3. AI Platform & Multi-Agent Architecture Requirements

Based on the **A2Z AI Foundations Phase 1 Scope** ([about.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/about.txt)):

1. **Multi-Agent Orchestration**:
   - Synchronous Orchestrator routing requests between specialized agents (**DMS Agent** & **CRM Agent**).
   - Intent discovery, composition, and refusal/fallback mechanisms.
2. **AuthN / AuthZ & Multi-Tenancy**:
   - OAuth2 via Auth0.
   - `Tenant ID` MUST be propagated on **every single request** to enforce row-level tenant data isolation.
3. **Guardrails & Governance**:
   - **AWS Bedrock Guardrails**: Allowed topics, PII masking, and prompt scope enforcement.
   - Red-team prompt test suite (10 automated prompts testing cross-tenant leakage and PII exfiltration).
4. **Observability & Data Lineage**:
   - OpenTelemetry (OTel) context propagation into AWS CloudWatch.
   - Record-level lineage tracking on every response (`tenant`, `persona`, `model`, `latency`, `cost`, `retrieval record IDs`).
   - CloudWatch dashboard + 3 alarms (*Error Rate*, *P95 Latency*, *Daily Spend*).
5. **AgentCore Memory**:
   - Short-term session memory + Long-term memory namespaced strictly by `tenant` and `user`.

---

## 🛠️ 4. Integration & Engineering Requirements

- **Protocol Support**: REST, SOAP/XML (WSDL handling), Webhooks, SFTP file feeds.
- **Boundary Validation**: Strict JSON Schema or Pydantic model validation at system boundaries before data enters Bronze/Silver layers.
- **Idempotency & Deduplication**: DynamoDB conditional `PutItem` locks with TTL for at-least-once delivery guarantees.
- **AI Tooling SDLC**: Daily usage of Claude 3.5 / Antigravity IDE to parse partner WSDLs, scaffold typed Python clients, generate TDD unit tests, and diagnose production logs.

---

## 📑 5. Verification & Deliverables Checklist

- [x] Job Description documented in [jd/jd.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/jd.txt).
- [x] AI Architecture Scope documented in [jd/about.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/about.txt).
- [x] Workspace rules configured in [AGENTS.md](file:///Users/nishantsaxena/workspace/brk-interview/AGENTS.md).
- [x] Interview preparation skill created in [.agents/skills/interview-prep/SKILL.md](file:///Users/nishantsaxena/workspace/brk-interview/.agents/skills/interview-prep/SKILL.md).
- [x] AWS Medallion pipeline skill created in [.agents/skills/aws-medallion-integration/SKILL.md](file:///Users/nishantsaxena/workspace/brk-interview/.agents/skills/aws-medallion-integration/SKILL.md).
- [x] Client Submission Note created in [client_submission_note.md](file:///Users/nishantsaxena/workspace/brk-interview/client_submission_note.md).
