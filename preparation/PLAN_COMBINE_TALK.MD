# Combined Interview Talk Plan (`PLAN_COMBINE_TALK.MD`)

**Role**: Python Engineer — Data Platform Engineering, Multi-Tenant Automotive SaaS
**Candidate**: Nishant Saxena (17+ yrs — Python, AWS Serverless, Partner Integrations, AI Platforms)
**Sources merged**: [PLAN_AG.md](file:///Users/nishantsaxena/workspace/brk-interview/preparation/PLAN_AG.md) · [PLAN_DEVIN.md](file:///Users/nishantsaxena/workspace/brk-interview/preparation/PLAN_DEVIN.md) · [talk_devin_ag.md](file:///Users/nishantsaxena/workspace/brk-interview/bak/talk_devin_ag.md) · [cover_letter_devin.txt](file:///Users/nishantsaxena/workspace/brk-interview/resume/cover_letter_devin.txt)

---

## 🎤 The 2-Minute Opening Pitch

> *"I have 17+ years across web, client/server, and cloud-native distributed systems, with recent focus on data platform engineering on AWS. My core strength is exactly what this role centers on — owning third-party integrations end to end. At Centene, I built Python asyncio Kafka consumers and integrated external partner APIs — Softheon via REST and OneSource via GraphQL — with strict Pydantic validation at the boundary. At CapitalOne, I built serverless transaction orchestration on Step Functions, Lambda, and DynamoDB with idempotency and dedup locks. I normalize inconsistent external schemas into canonical models, I build pipelines that survive silent partner drift and out-of-order events, and I use Claude daily to turn partner specs into typed clients and contract tests fast."*

---

## 🔒 Locked-In Talking Points (Consistency Rules)

These are the agreed phrasings — do NOT deviate between resume, cover letter, and verbal:

| Topic | Locked Phrasing | Do NOT Say |
| :--- | :--- | :--- |
| Commission fix impact | "Delivering corrected policy, commission, and enrollment data downstream" | Any dollar figure ($20M removed) |
| Kafka issue framing | "A long-standing issue where misordered events were corrupting policy numbers, enrollment spans, and broker commission data" | "Critical/severe incident" |
| Centene role | "Delivered enhancements and refactoring on the Django-based Novasys Portal" | "Maintained the legacy system" |
| SSIS migration direction | **Oracle → SQL Server** (SSIS packages) | "SQL Server to Oracle" |
| CI/CD | GitHub Actions, CDK pipelines, Terraform | CircleCI (JD uses it; don't claim) |
| Auth | OAuth2/JWT, Keycloak, Azure Entra ID, IAM | Claim Auth0 hands-on (speak OIDC patterns instead) |
| S3 architecture | "S3 data lakes" — medallion only if asked | Don't volunteer Landing→Gold unprompted unless ready to whiteboard |

---

## 🗣️ Talk Flow — Six Themes (in delivery order)

### 1. Partner Integrations — *lead with this*
**Talk track**: "The integration surface is the product — I treat partner boundaries as zero-trust."
- Anchor: Softheon Broker Lookup (REST, `httpx.AsyncClient`, Pydantic `TypeAdapter` validation) + OneSource GraphQL (`hios_id` plan lookup).
- **SOAP/WSDL Handling**: Many legacy DMS platforms (CDK, Reynolds & Reynolds) run SOAP/XML. Parse WSDLs via Python (`zeep` / `xmltodict`), validate boundaries immediately into canonical Pydantic models so downstream never sees raw XML.
- Partner-call story ready: capturing raw payloads, proving spec mismatches with traces, negotiating contract fixes, certifying ahead of schedule.

### 2. Resilient Event-Driven Ingestion — *the money story*
**Talk track**: "At-least-once delivery means duplicates and out-of-order events are normal, not exceptional."
- Anchor: Kafka re-sequencing layer fixing out-of-order policy events → corrected downstream data.
- **Compute Choice (Lambda vs. ECS Fargate)**:
  - Sub-second webhooks & REST events → **Lambda** (serverless, event-driven scaling).
  - Heavy overnight batch feeds / long-running SFTP exports (>15 min) → **ECS Fargate tasks** triggered via Step Functions.
- **Noisy Neighbor Protection (5,000+ Dealers)**: SQS FIFO with `MessageGroupId = tenant_id` to guarantee per-dealer ordered processing while preventing one dealer's traffic burst from starving others.
- Whiteboard flow: API Gateway → Lambda (Powertools `@idempotent`) → DynamoDB `attribute_not_exists` conditional put + TTL → SQS → consumer. DLQ + CloudWatch alarm on poison messages.

### 3. Medallion S3 Data Lake
**Talk track**: "Land raw first — immutable replay is your insurance against partner drift."
- Landing (raw + headers) → Bronze (validated + ingestion metadata) → Silver (canonical model) → Gold (aggregates for agents/reporting).
- DynamoDB single-table: `PK=TENANT#<dealer_id>`, `SK=PARTNER#<name>#CONFIG` / `DEAL#<id>`.

### 4. Multi-Tenant Isolation & Security
**Talk track**: "5,000 dealer groups means tenant isolation is a retrieval-layer guarantee, not a config flag."
- S3 `tenant_id=` prefixes + IAM ABAC (`${aws:PrincipalTag/TenantId}`); `WHERE tenant_id = :tenant_id` at query layer.
- HMAC-SHA256 webhook signature checks; secrets in Secrets Manager/SSM, never in code; PII masked before CloudWatch (`structlog` processors at Centene).

### 5. Schema Normalization & Contract Testing
**Talk track**: "Never let an invalid external payload crash downstream."
- Anchor: `configuration.py` transformers — `.0` float stripping, policy ID formatting, missing-field fallbacks.
- **Pydantic v2 Patterns**: Use Discriminated Unions to route polymorphic partner payloads (e.g. CDK vs Tekion deal formats) into canonical models.
- Quarantine bucket pattern; daily contract tests vs. partner sandboxes; distinguish breaking vs. non-breaking changes.

### 6. AI-Augmented Engineering + A2Z Agent Architecture
**Talk track**: "I use Claude to turn vendor specs into typed clients and diff spec versions for breaking changes — it's how I onboard partners faster."
- Production Bedrock (Claude 3.5) extraction + Elasticsearch RAG at KKR.
- Speak their Phase 1 vocabulary: **Strands scaffolding, AgentCore Runtime/Gateway/Memory, orchestrator + intent routing (DMS Agent ↔ CRM Agent), Bedrock Guardrails (PII, cross-tenant), OpenTelemetry → CloudWatch lineage, Bedrock Evaluations harness, LLM Gateway for cost-attributed model egress.**

---

## ⭐ STAR Stories — Speakable Order (90 sec each)

1. **Centene `cent_poc` reconciliation engine** — memory-safe two-phase chunking (`POLICY_CHUNK_SIZE=10,000`), single DB batch hit per chunk, zero OOM across 100K+ records, air-gapped HTML5 dashboard.
2. **Centene Kafka re-sequencing** — out-of-order events corrupting policy numbers/enrollment spans/commission data → re-sequencing + idempotent span recalculation → corrected data downstream.
3. **Centene parallel simulation guard** — dry-run code changes against 100K+ live policies before deployment; caught hundreds of bad calculations per release.
4. **CapitalOne Step Functions orchestration** — Lambda handlers, DynamoDB state locking + dedup, LocalStack/pytest offline testing, CDK pipelines.
5. **KKR Bedrock + RAG anomaly detection** — unstructured filings → canonical JSON; dense-vector semantic search catching valuation anomalies pre-publication.
6. **Partner ownership story** — spec vs. live-traffic mismatch → payload trace evidence → partner engineering call → contract fix + defensive validation + onboarding runbook.

---

## ⚡ Rapid-Fire Q&A (memorized structure, not scripts)

- **Rate limits**: client-side token bucket → honor `Retry-After` / jittered backoff → SQS buffer with controlled consumer concurrency.
- **Canonical model mapping**: raw → S3 Landing → boundary validation → per-partner TDD adapters → canonical `Deal`/`Inventory` → quarantine on failure.
- **Idempotency**: derive key (webhook ID or SHA-256 of business attrs) → AWS Lambda Powertools `@idempotent` with DynamoDB persistence layer → `ConditionalCheckFailedException` = ack 200, skip.
- **Compute Sizing**: Lambda for fast webhooks/REST (sub-15 min); ECS Fargate for heavy SFTP/batch feeds exceeding Lambda limits.
- **Tenant isolation & Noisy Neighbors**: S3 prefix + ABAC + parameterized queries + SQS FIFO `MessageGroupId=tenant_id` + namespaced agent memory + tenant-scoped logs with PII scrubbing.
- **2 AM silent partner schema change breaking 500 dealers**: CloudWatch alarm on validation failures → quarantine captures failing payloads → diff against contract tests → page partner on-call → replay from Landing once fixed.

---

## 🧭 Closing — Questions to Ask Them

1. "Of your 40+ partner integrations, what share of production issues come from silent schema drift vs. auth/rate-limit failures?"
2. "How do you handle partners whose sandbox passes certification but production behaves differently?"
3. "In the Phase 1 DMS/CRM agent orchestration, what's been hardest — intent discovery or state handoff between agents?"
4. "When dealer onboarding backlogs build, is the bottleneck partner responsiveness, normalization edge cases, or certification?"
5. "What does success look like in the first 90 days — a partner certification, a pipeline refactor, or standing up the contract-testing standard?"

---

## ✅ Pre-Interview Checklist
- [ ] Resume PDF, cover letter, and verbal claims all match the locked phrasings above
- [ ] Can draw Scenario A ingestion pipeline + `cent_poc` engine from memory
- [ ] Six STAR stories rehearsed aloud at ≤90 seconds each
- [ ] Read `jd/about.txt` once more morning-of for A2Z vocabulary
