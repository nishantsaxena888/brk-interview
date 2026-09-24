# BRK Interview Preparation & Engineering Guidelines

This repository contains interview preparation materials, job descriptions, technical specifications, and architectural references for the **Python Engineer (Data Platform Engineering)** position.

## 🎯 Role Context & Architecture Stack
- **Domain**: Multi-Tenant Automotive SaaS Platform (5,000+ Dealer Groups, 40+ Partner Integrations across DMS, CRM, Digital Retail, F&I).
- **Core Technology Stack**:
  - **Languages**: Modern Python (AWS Lambda Powertools, Pydantic v2, JSON Schema).
  - **AWS Serverless (NAWS)**: Lambda, EventBridge, Step Functions, SQS, API Gateway, DynamoDB (Single-Table Design), S3 Data Lake (Medallion Architecture: Landing -> Bronze -> Silver -> Gold), Secrets Manager, SSM, KMS, ECS Fargate, Aurora MySQL.
  - **AI & Multi-Agent**: AWS Bedrock, AgentCore Runtime, Strands Agent Scaffolding, Bedrock Guardrails (PII protection, tenant isolation), Bedrock Evaluations.
  - **Infrastructure as Code**: AWS CDK (Python/TypeScript).
  - **Observability**: OpenTelemetry tracing into AWS CloudWatch with record-level data lineage.

---

## 📜 Repository Rules & Guidelines

1. **Code & Script Quality**:
   - Write clean, modern Python using type hints (`typing`) and explicit error handling.
   - All external payload validations must use strict JSON Schema or Pydantic models at system boundaries.
   - Never hardcode credentials; always reference AWS Secrets Manager or Parameter Store.

2. **Interview Strategy & STAR Mapping**:
   - Every technical answer should connect real-world experience (such as the high-scale `cent_poc` reconciliation engine) with the `jd.txt` and `about.txt` architecture requirements.
   - Emphasize **resilience under scale**, **multi-tenant row-level data isolation**, and **idempotent event processing**.

3. **Documentation Integrity**:
   - Keep markdown documentation formatted with clear headers, tables, and Mermaid diagrams where applicable.
   - Maintain clickable file links (`file:///...`) when linking codebase artifacts.

4. **AI Agent Collaboration & Portability**:
   - All AI agents (Antigravity IDE, subagents, Claude Code, or CLI runners) operating within this repository MUST automatically read, inherit, and enforce the rules in `AGENTS.md` and skills in `.agents/skills/`.
   - Keep `.agents/` synchronized with remote `main` so all team members and agents operate with identical architectural standards and interview prep STAR runbooks.

