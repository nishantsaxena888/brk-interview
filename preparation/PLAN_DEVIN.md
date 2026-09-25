# Interview Preparation Plan — Python Engineer (Data Platform Engineering)

> **Target Role**: Python Engineer — Multi-Tenant Automotive SaaS (5,000+ dealer groups, 40+ partner integrations, native AWS serverless)
> **Contact**: Douglas Blekicki (DBlekicki@wscs.ai)
> **Candidate Materials**: [Leela.md](file:///Users/nishantsaxena/workspace/brk-interview/Leela.md) · [resume/cover_letter_devin.txt](file:///Users/nishantsaxena/workspace/brk-interview/resume/cover_letter_devin.txt) · [centen_experience.md](file:///Users/nishantsaxena/workspace/brk-interview/centen_experience.md)

---

## 🎯 Prep Objectives

1. Map every JD requirement to a concrete, defensible story from Centene / CapitalOne / KKR.
2. Be able to whiteboard the `cent_poc` reconciliation engine and Kafka re-sequencing work end-to-end.
3. Demonstrate fluency in the NAWS serverless stack + AI agent architecture (AgentCore, Strands, Bedrock) from `about.txt` Phase 1 scope.
4. Show partner-facing maturity — the JD explicitly wants "the person on the partner call."

---

## 📚 Source Material Index

| File | Use |
| :--- | :--- |
| [jd/jd.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/jd.txt) | Role requirements — master checklist |
| [jd/about.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/about.txt) | A2Z Phase 1 scope — AgentCore, Strands, Guardrails, Memory, Evaluations |
| [centen_experience.md](file:///Users/nishantsaxena/workspace/brk-interview/centen_experience.md) | STAR runbook + Centene technical deep-dive |
| [client_submission_note.md](file:///Users/nishantsaxena/workspace/brk-interview/client_submission_note.md) | JD-to-experience mapping table |
| [.agents/skills/interview-prep/SKILL.md](file:///Users/nishantsaxena/workspace/brk-interview/.agents/skills/interview-prep/SKILL.md) | STAR framework + system design cheat sheet |
| [.agents/skills/aws-medallion-integration/SKILL.md](file:///Users/nishantsaxena/workspace/brk-interview/.agents/skills/aws-medallion-integration/SKILL.md) | Medallion pipeline reference patterns |

---

## 🗓️ Prep Phases

### Phase 1 — Story Bank & Consistency (do first)
- [ ] Rehearse 4 core STAR stories until they can be told in **90 seconds each**:
  1. `cent_poc` reconciliation engine (memory safety, 100K+ records, zero OOM)
  2. Kafka out-of-order event re-sequencing (policy numbers, enrollment spans, commission data)
  3. CapitalOne Step Functions orchestration (DynamoDB dedup, idempotency, CDK)
  4. RHEL `system_monitor` / PgBouncer auto-recovery (legacy resilience under constraints)
- [ ] **Consistency check before any submission**: SSIS direction (Oracle → SQL Server vs. SQL Server → Oracle), $20M figure usage policy, Cognito claim — pick one version across resume, cover letter, and talking points.
- [ ] Prepare a "partner call" anecdote — Softheon/OneSource integration, spec ambiguity, pushing back on a bad payload contract. The JD weights this heavily.

### Phase 2 — JD Requirement Drills
Practice concise answers for each Must-Have:

| JD Requirement | Your Story Hook |
| :--- | :--- |
| 10+ yrs modern Python | 17+ yrs; Pydantic v2, asyncio consumers, Lambda Powertools |
| Third-party API integration owned end-to-end | Softheon Broker Lookup + OneSource GraphQL at Centene; 40+ partner feeds (resume) |
| SOAP/XML, webhooks, file feeds | ERP SOAP/WSDL, WebMethods XML, webhook intake at Mind Master/Highiq |
| AWS hands-on | CapitalOne: Lambda, Step Functions, DynamoDB, CDK, LocalStack |
| Schema → canonical model normalization | `configuration.py` transformers: `.0` stripping, ID formatting, fallbacks |
| Debug distributed systems from logs | Kafka back-tracking; CloudWatch structured logging; New Relic/ELK |
| Idempotency & dedup (preferred) | DynamoDB conditional-write dedup lock pattern (be ready to whiteboard) |
| Webhook security / OAuth2 (preferred) | HMAC verification, JWT/OAuth2, Keycloak/Entra ID |
| Contract testing (preferred) | Pydantic `TypeAdapter` validation at boundary; TDD with pytest |
| CDK / CI/CD (preferred) | CapitalOne CDK pipelines; Terraform at Mind Master |

### Phase 3 — System Design Scenarios (whiteboard-ready)
- [ ] **Idempotent webhook receiver**: API Gateway → Lambda → DynamoDB `attribute_not_exists` conditional put + TTL → SQS → processor. (Skill cheat sheet)
- [ ] **Medallion ingestion pipeline**: Landing → Bronze → Silver → Gold on S3; partner file feed promotion; per-tenant prefixes `tenant_id=XYZ`.
- [ ] **Multi-tenant isolation**: ABAC with `${aws:PrincipalTag/TenantId}`, row-level isolation at retrieval.
- [ ] **Resilience under partner SLA**: backoff, rate-limit handling, replay of missed events, DLQ + SNS alerting (tie to reconciliation engine).
- [ ] **A2Z agent orchestration** (from about.txt): orchestrator → intent discovery → DMS Agent / CRM Agent routing → composition → refusal path. Know: Strands scaffolding, AgentCore Runtime/Gateway/Memory, Bedrock Guardrails (PII, cross-tenant), OpenTelemetry → CloudWatch lineage, Bedrock Evaluations harness.

### Phase 4 — Mock Q&A & Polish
- [ ] Run through `centen_experience.md` Q&A cheat sheet out loud.
- [ ] Prepare 3–5 questions **for them** (partner onboarding velocity, certification process, how integrations are prioritized across dealer groups, Phase 2 async orchestration plans).
- [ ] AI-usage talking points: Claude/Copilot for spec→typed client scaffolding, contract tests, log triage — the JD explicitly screens for daily Claude use.

---

## ⚠️ Known Gaps & Mitigations

| Gap | Mitigation |
| :--- | :--- |
| No automotive/DMS domain experience | Frame as integration-domain-agnostic; emphasize learning partner specs fast (Softheon/OneSource ramp). |
| Auth0 (JD uses it; resume lists Keycloak/Entra) | Speak to OAuth2/JWT flows generally; Auth0 is same OIDC patterns. |
| CircleCI (JD) vs GitHub Actions (resume) | CI/CD concepts transfer; don't claim CircleCI. |
| `about.txt` is a delivery scope doc, not interview questions | Use it to speak their vocabulary (AgentCore, Strands, LLM Gateway) — shows you read their architecture. |

---

## ✅ Definition of Done
- [ ] Every JD Must-Have has a rehearsed story with numbers
- [ ] Can draw the reconciliation engine + Kafka pipeline from memory
- [ ] Can draw the medallion + multi-tenant architecture on request
- [ ] Cover letter, resume, and verbal claims are mutually consistent
