# 01. STAR Stories Spoken Runbook
**Role**: Python Engineer (Data Platform Engineering)  
**Target Delivery**: 90 to 120 seconds per story. Grounded in real production experience.

---

## 🌟 Story 1: Centene Migration Reconciliation Engine (`cent_poc`)
> **Primary Use**: When asked about high-scale Python, memory optimization, data integrity, or migration validation.

* **Situation**:
  Centene was sunsetting its legacy Novasys Django portal and migrating policy, subscriber, and broker records to Salesforce. We had to reconcile 100,000+ policy records across relational databases. Initial queries and naive in-memory comparisons were causing high server lag and out-of-memory (OOM) crashes on our RHEL application nodes.
* **Task**:
  I needed to build an automated, zero-downtime, memory-safe data reconciliation engine in Python that could validate massive record sets without destabilizing live production systems.
* **Action**:
  1. **Two-Phase Memory Chunking**: Built `compare_manager.py` using Pandas generator streaming with a strict chunk size (`POLICY_CHUNK_SIZE = 10,000`).
  2. **Batch DB Queries**: Instead of per-record lookups, each chunk executed a single batch query against indexed DB columns, then immediately purged local memory objects after processing.
  3. **Data Normalization Engine**: Built dynamic transformers in `configuration.py` to normalize decimal `.0` float artifacts, strip leading zeros on policy IDs, and standardize date timestamps.
  4. **Audit Export & Visualization**: Exported structured JSON audit files to AWS S3, triggered downstream Lambda validation with SQS dead-letter queues, and created a standalone, zero-dependency HTML5/JS dashboard for business analysts to search policy ranges (`start_policy` to `end_policy`).
* **Result**:
  Eliminated all OOM crashes (100% memory safety), achieved high-throughput validation across 100,000+ policies, and provided leadership with clear data discrepancies prior to production cutover.

---

## 🌟 Story 2: Centene Kafka Event Re-Sequencing & Commission Data Integrity
> **Primary Use**: When asked about event-driven architectures, Kafka, idempotency, or fixing data corruption in streaming pipelines.

* **Situation**:
  In our Django portal, Kafka consumer pipelines were ingesting policy lifecycle events (new enrollments, status updates, cancellations). Due to network latency and partition rebalancing, events frequently arrived out of chronological order. This caused premature termination of enrollment spans and calculated incorrect broker commission payouts.
* **Task**:
  Eliminate the misordered event processing and ensure broker commission calculations were 100% accurate based on true chronological event history.
* **Action**:
  1. Built Python asyncio Kafka consumers using strict Pydantic v2 models at the boundary to validate incoming payloads.
  2. Implemented an event re-sequencing and buffering layer that held events within a short sliding time window and re-ordered them by event generation timestamp and sequence ID.
  3. Implemented idempotent enrollment span recalculation logic against historical database spans, ensuring that reprocessing an event produced identical state without corrupting broker payouts.
* **Result**:
  Completely resolved the misordered event anomaly, ensuring accurate downstream commission and enrollment records, and eliminating manual policy correction tickets.

---

## 🌟 Story 3: Centene Parallel Simulation Guard
> **Primary Use**: When asked about technical debt, de-risking high-stakes releases, or testing in complex systems.

* **Situation**:
  The legacy Novasys portal had over a decade of technical debt, with core business logic buried inside database triggers, stored procedures, and interdependent Django signals. Any code deployment risked silently breaking commission calculations for live brokers across 20M+ insured members.
* **Task**:
  Provide an automated verification mechanism to prove code changes were safe *before* deploying to production.
* **Action**:
  1. Architected a parallel dry-run simulation engine capable of replaying live policy calculation pipelines against 100,000+ historical policies in a staging environment.
  2. Captured outputs from both the legacy production baseline and the newly proposed code branch, comparing delta calculations field by field.
  3. Created an automated report highlighting any unintended calculation variances before release sign-off.
* **Result**:
  Intercepted hundreds of potential incorrect policy and commission corrections prior to deployment, transforming releases from high-stress fire drills into predictable, verified deployments.

---

## 🌟 Story 4: CapitalOne Serverless Transaction Orchestration
> **Primary Use**: When asked about AWS Step Functions, Lambda, DynamoDB, CDK, or idempotency.

* **Situation**:
  CapitalOne needed a transaction orchestration platform to coordinate multiple financial microservices across the complete lifecycle of a client transaction, ensuring strict auditability and zero lost transactions.
* **Task**:
  Build a resilient serverless transaction pipeline with automated error recovery, idempotency, and automated infrastructure provisioning.
* **Action**:
  1. Designed AWS Step Functions state machines orchestrating Python Lambda handlers with built-in retry schedules, exponential backoff, and fallback states.
  2. Implemented DynamoDB single-table locking using conditional writes (`attribute_not_exists`) to guarantee idempotent execution across parallel incoming requests.
  3. Defined all infrastructure as code using AWS CDK (TypeScript/Python) and built automated integration tests using LocalStack and pytest to simulate AWS cloud services locally.
* **Result**:
  Delivered an automated, auditable transaction workflow with zero lost transactions, standardized Python service patterns, and reduced local testing cycle times.

---

## 🌟 Story 5: KKR Bedrock & Vector Search Anomaly Engine
* **Situation**:
  At KKR, portfolio valuation reporting relied on ingesting complex unstructured financial filings, spreadsheets, and partner statements. Manual comparison was slow and subtle numerical discrepancies were difficult to catch across disparate reporting formats.
* **Task**:
  Automate structured data extraction from financial documents and build an intelligent anomaly detection engine.
* **Action**:
  1. Built Python ingestion pipelines using AWS Bedrock (Claude models) to extract key financial entities from unstructured PDFs and spreadsheets into validated Pydantic JSON schemas.
  2. Generated dense vector embeddings of financial records and indexed them into Elasticsearch.
  3. Built a semantic retrieval (RAG) and anomaly detection service that compared newly reported metrics against historical baselines, flagging outlier valuations for analysts.
* **Result**:
  Replaced manual spreadsheet validation with automated AI extraction, catching portfolio valuation discrepancies before publication to LP investors.

---

## 🌟 Story 6: The Partner Integration Ownership Story (Handling Bad Specs)
> **Primary Use**: When asked about partner communication, pushing back on external engineering teams, or handling broken APIs.

* **Situation**:
  We were integrating a third-party broker lookup and licensing service (Softheon REST API). The partner's API documentation stated their endpoint accepted JSON payloads and returned standardized HTTP error codes. However, during sandbox integration, the endpoint silently dropped required fields, intermittently returned `200 OK` with error strings in the body, and enforced unannounced rate limits.
* **Task**:
  Unblock the integration, protect our pipeline from corrupted data, and establish a clear technical agreement with the partner team.
* **Action**:
  1. Enabled raw HTTP payload tracing and structured logging to capture concrete examples of spec divergence, payload drops, and rate limit responses.
  2. Initiated a direct technical working session with the partner's engineering lead; walked them through the captured traces and proposed a specific contract adjustment.
  3. Implemented defensive boundary validation in Python using Pydantic, routed malformed payloads to a quarantine S3 bucket, and configured client-side rate throttling with jittered backoff.
* **Result**:
  Successfully certified the integration two weeks ahead of schedule and authored a partner integration playbook that became the standard for subsequent vendor on-boardings.
