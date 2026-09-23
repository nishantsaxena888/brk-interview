---
name: interview-prep
description: >-
  Comprehensive guide and runbook for practicing interview questions, STAR stories,
  system design scenarios, and technical deep-dives for the Python Engineer role.
---

# Interview Preparation Skill (`interview-prep`)

This skill provides a structured framework for practicing technical interview topics, STAR story mappings, and system design challenges for the Automotive SaaS / Data Platform position.

---

## 🧭 Core Competency Modules

### Module 1: `cent_poc` to `jd.txt` / `about.txt` STAR Mapping
When asked about prior high-scale Python or integration experience, use the **`cent_poc` STAR framework**:

* **Situation**: Salesforce to Novasys migration required verifying 100,000+ subscriber, agent, and policy enrollment records against PostgreSQL without causing OOM crashes or server lag.
* **Task**: Build an automated, memory-safe reconciliation engine capable of handling massive flat-file datasets and cross-validating records against PostgreSQL.
* **Action**:
  - Built a two-phase chunking execution engine (`compare_manager.py`) in Python with Pandas streaming (`POLICY_CHUNK_SIZE = 10,000`).
  - Created dynamic schema normalization rules in `configuration.py` (formatting policy IDs, stripping `.0` decimals, normalizing missing fields).
  - Reduced DB load to a single batch hit per chunk and flushed RAM immediately after writing JSON output artifacts.
  - Built standalone, zero-dependency HTML5/JS dashboard views for instant deep-dive policy triage.
* **Result**: Reduced validation runtimes, achieved 100% memory safety (zero OOM errors), and enabled exact policy range search bounds (`start_policy` to `end_policy`).

---

## 🛠️ Module 2: System Design Questions & Cheat Sheet

### 1. How do you ensure Idempotency in an Event-Driven Webhook Receiver?
- **Pattern**: `EventBridge` + `Lambda` + `DynamoDB` single-table lock.
- **Mechanism**:
  1. Webhook hits API Gateway; Lambda extracts unique event signature/ID (e.g. `X-Webhook-ID` or payload hash).
  2. Perform a conditional `PutItem` in DynamoDB with `attribute_not_exists(id)` and a TTL (e.g., 24 hours).
  3. If item exists (`ConditionalCheckFailedException`), acknowledge with `200 OK` (duplicate ignored).
  4. If new, process event and update status to `PROCESSED`.

### 2. How do you enforce Multi-Tenant Isolation in a Medallion S3 Data Lake?
- **Pattern**: Prefix-based tenant partitioning (`s3://bucket/landing/tenant_id=XYZ/year=2026/`).
- **IAM Enforcement**: ABAC (Attribute-Based Access Control) using IAM policy variable `${aws:PrincipalTag/TenantId}`.
- **Agent Retrieval**: AgentCore Runtime appends `WHERE tenant_id = :tenant_id` at the SQL/Query layer for every DMS and CRM query.

---

## 🧪 Module 3: Practice Commands & Execution

To generate practice interview questions or mock interviews:
1. Review [jd/jd.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/jd.txt) and [jd/about.txt](file:///Users/nishantsaxena/workspace/brk-interview/jd/about.txt).
2. Practice walking through system design diagrams for DMS Agent <-> CRM Agent orchestration.
