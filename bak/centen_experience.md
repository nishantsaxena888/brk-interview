# Centene (Novasys to Salesforce Migration & Reconciliation Platform)

## 📌 Executive Summary & Architecture Overview
- **Domain**: High-scale healthcare & insurance subscriber/policy data migration validation.
- **Problem Statement**: Transitioning away from the sunsetting Novasys Portal to Salesforce without data loss, schema mismatch, or production memory crashes across 100,000+ subscriber, agent, and enrollment span records.
- **Solution**: Designed and built a memory-safe, two-phase Python/Django **Reconciliation Engine** (`compare_manager.py`), a RHEL-based server-level `system_monitor` daemon, and a zero-dependency standalone **Univer Analytics UI** for real-time business discrepancy triage.

---

## 🛠️ Detailed Component & System Architecture

### 1. Two-Phase Execution Engine (`compare_manager.py`)
- **Phase 1 (`make_chunk`)**: 
  - Reads large source files (Salesforce webhooks / CSV exports and Novasys PostgreSQL data).
  - Applies normalization rules: policy ID formatting, upper-casing, stripping floating-point `.0` artifacts, and handling missing-field fallbacks.
  - Segments sources independently using Pandas streaming with `POLICY_CHUNK_SIZE = 10,000`.
  - Outputs flat CSV files into `data/chunks/` (`sf_Subscriber_1.csv`, `sf_Agent_1.csv`, etc.).
- **Phase 2 (`compare_and_aggregate`)**:
  - Scans chunk files, calculates lexicographical policy bounds (`start_policy` to `end_policy`).
  - Single DB batch hit per chunk to validate matching database records (`db_...csv`).
  - Generates chunk-level JSON reports (`agg_...json`) and bubbles global metrics into `master_aggregate.json`.
  - Explicit RAM hygiene: immediately flushes chunk data to disk, preventing memory bloat and guaranteeing zero OOM errors.

### 2. Standalone Analytics & Comparison Dashboard (Univer UI)
- **Zero-Dependency Architecture**: Embedded HTML5 pages (`dashboard.html`, `policy_analytics.html`) with inline CSS and native JavaScript—completely decoupled from parent portal template inheritance (`base.html`) or heavy frameworks (Tailwind, Tabulator).
- **On-Demand Triangulation**: The browser UI loads only `master_aggregate.json` (~KB payload). When a user searches a policy ID or selects a chunk, native JS uses lexicographical bounds to fetch only the specific JSON slice on demand.

### 3. RHEL `system_monitor` Daemon
- RHEL-based system monitoring daemon utilizing local SQLite architecture.
- Safely operates on strict server mounts to capture legacy environment alerts, CPU/memory stats, and Celery consumer queue health during legacy architecture sunset.

---

## ⭐️ STAR Interview Runbook (Mapped to BRK Requirements)

### STAR Story 1: Memory Safety under High-Volume Data Reconciliation
- **Situation**: Migrating 100,000+ policy records caused out-of-memory (OOM) crashes when attempting to compare full datasets in Django.
- **Task**: Architect an ingestion & validation pipeline that runs safely on production servers with strict RAM constraints.
- **Action**: Built `compare_manager.py` implementing a two-phase chunking strategy (`POLICY_CHUNK_SIZE = 10,000`) using Pandas streaming and single-query DB batch hits, immediately releasing RAM after writing JSON chunk outputs to disk.
- **Result**: Achieved 100% verification accuracy across 100k+ records with 0 OOM errors and reduced comparison execution time by 65%.

### STAR Story 2: Inconsistent External Schema Normalization (Canonical Model)
- **Situation**: Incoming Salesforce API payloads, webhooks, and flat files contained inconsistent formatting (`POL12345.0` vs `POL12345`, missing agent IDs, varied date string formats).
- **Task**: Standardize raw external payloads into a canonical JSON model before reconciliation.
- **Action**: Engineered dynamic normalization transformers in `configuration.py` to strip decimal `.0` float artifacts, standardize string representations, and apply fallback rules at system boundaries.
- **Result**: Eliminated false-positive validation failures caused by schema formatting discrepancies.

---

## 🎯 Technical Q&A Cheat Sheet for BRK Interview

**Q1: How did you handle scale without consuming excessive server memory?**
> *Answer*: "I implemented a two-phase pipeline with Pandas streaming. In Phase 1, source payloads were split into independent flat chunks of 10,000 policies. In Phase 2, the engine fetched matching records from PostgreSQL via a single batch query per chunk, generated comparative JSON artifacts, and explicitly cleared RAM before moving to the next chunk."

**Q2: Why did you build the frontend as a standalone HTML page instead of using Django templates?**
> *Answer*: "To guarantee zero-lag loading and prevent breaking changes from parent portal updates. By embedding native CSS/JS into a single standalone HTML page, the UI loads instantly without template inheritance overhead (`base.html`), and fetches only light JSON index maps for on-demand policy triangulation."

---

## 📝 Resume Bullets (Drafting & Review)

- Directed the cloud migration strategy, orchestrating the decommissioning of legacy Novasys architecture to transition into Salesforce.
- Architected a high-scale Python/Django Reconciliation Engine to securely validate high-volume (100,000+) migrated records across Salesforce and Novasys — reconciling Salesforce API/webhook events and scheduled flat-file exports via a memory-safe chunking pipeline (`POLICY_CHUNK_SIZE = 10,000`) and single-query DB batch hits, with zero OOM errors.
- Engineered a lightweight, custom observability tool — operating safely within strict production memory constraints via server mounts — to monitor and support the sunsetting legacy architecture.
- Broke down highly complex legacy triggers and utilized Pandas aggregations to instantly isolate and broadcast the exact reasons for data validation failures during migration.
- Built dynamic schema-normalization and field-mapping rules (formatting policy IDs, stripping `.0` decimals, handling missing-field fallbacks) to reconcile inconsistent external record formats into a canonical model.
- Engineered a visual data comparison dashboard utilizing the open-source Univer framework, simplifying complex workflows and exposing real-time migration discrepancies to the business.
- Designed a dedicated RHEL-based `system_monitor` leveraging local SQLite architecture to securely capture legacy environment alerts.
- Stabilized production environments by refactoring legacy asynchronous consumers (Celery) across payment and broker systems.
- Enhanced engineering velocity by deeply integrating multi-model AI workflows (Claude, Gemini) and advanced agentic frameworks into the SDLC.
- Drastically reduced End-to-End (E2E) feature delivery time by utilizing these AI agents to rapidly scaffold and deploy Python microservices.

---

## 📝 Centene Experience Track (Nishant)

### Work #1: Legacy RHEL Server Auto-Recovery & Django Alert Monitoring App
- **Environment**: Older legacy RHEL enterprise servers hosting Nginx, PgBouncer connection pooler, and PostgreSQL without modern systemd auto-restart support.
- **Problem**: Whenever OS security patches were applied to the legacy RHEL servers, PgBouncer and background services went down and failed to automatically restart, breaking database connection pooling for downstream Django apps.
- **Solution**: Built a custom, lightweight "mini New Relic" monitoring app integrated directly into the legacy Django codebase (backed by local SQLite) to actively track PgBouncer service health, capture system alerts, and automatically trigger service restart routines when down post-patching.
- **Impact**: Restored database connection pooling automatically post-patching, eliminating manual server intervention and DB connection outages.

### Work #2: Upstream Kafka Consumer Policy Reconciliation, Back-Tracking & Legacy Code Refactoring
- **Context**: Inbound policy event streams arriving from upstream systems into Python Kafka consumers contained frequent formatting errors, missing attributes, and floating-point artifacts (e.g., `POL123.0`).
- **Action**: 
  - Designed back-tracking and audit mechanisms to trace data anomalies back to specific upstream Kafka producers/sources.
  - Implemented dynamic schema-normalization and field-mapping rules (formatting policy IDs, stripping `.0` float artifacts, applying fallback defaults) inside Kafka consumer ingestion handlers.
  - Refactored and enhanced legacy Django models and background workers to handle unannounced upstream payload changes without failing production event consumers.
- **Impact**: Resolved chronic production support issues, prevented downstream pipeline crashes, and established a resilient canonical mapping layer for real-time Kafka event streams.

### Work #3: Production Infrastructure Topology & End-to-End Pipeline Workflow
- **Infrastructure Topology**: 
  - Enterprise RHEL environment (Rocky Linux 9) implementing 3-user RBAC security (`user`, `admin` with `wheel`/supervisorctl privileges, `pgbouncer` owner).
  - Port mapping architecture: Nginx/Apache proxy (5555), PgBouncer connection pooler (5444), PostgreSQL 15 (5432), and Gunicorn/Django app server (8000).
  - Timezone locked to EST (`America/New_York`) to ensure absolute audit log and discrepancy timestamp parity across services.
- **End-to-End Pipeline Flow**:
  1. **Ingestion & Normalization**: Upstream Kafka consumers and Salesforce webhook/batch feeds land into server mounts. `make_chunk` applies policy normalization (stripping `.0` float artifacts, formatting IDs) and segments data into flat CSV chunks (`POLICY_CHUNK_SIZE=10,000`).
  2. **Batch Reconciliation**: `compare_and_aggregate` runs a single DB batch query per chunk through PgBouncer into PostgreSQL 15, generating raw database dumps (`db_...csv`) and JSON comparative metrics (`agg_...json`).
  3. **Master Index & Air-Gapped UI**: Bubbles global metrics into `master_aggregate.json`. Decoupled HTML5 standalone dashboard (zero external JS/CSS dependencies) loads the light master index and fetches chunk data on-demand via native JS policy triangulation.
### Work #4: Softheon, OneSource GraphQL & Out-of-Order Kafka Stream Reconciliation
- **API & Integration Architecture**:
  - **Softheon Broker Lookup (`softheonbrokerlookup.py`)**: Async HTTP client (`httpx.AsyncClient`) querying Softheon by `issuer_subscriber_id`, validating Agent/Broker payloads via Pydantic models (`TypeAdapter(list[Agent]).validate_python`).
  - **OneSource GraphQL Client (`onesource.py`)**: Async client executing GraphQL queries (`/graphql`) to retrieve marketing plan names (`CasePlanMarketingName`) using `hios_id` & `effective_date_year`.
  - **Async Consumer Application (`novasys-nextgen-consumer`)**: Ran concurrent `KafkaConsumer` & `NovasysConsumer` (DB poller) loops using `asyncio.gather()` with `structlog` PII masking (`logging_processors.py`).
- **Out-of-Order Kafka Event Stream & Broker Commission Fix**:
  - **Problem**: Upstream Kafka events arrived out-of-order, causing broken enrollment spans, missing address updates, and false broker commission calculations/payouts in the legacy Django model.
  - **Solution**: Engineered event re-sequencing, span recalculation rules, and back-tracking mechanisms inside Kafka ingestion handlers to maintain policy timeline integrity.
  - **Impact**: Eliminated significant monetary leakage caused by false broker commission payouts and corrupt billing spans, resolving chronic downstream policy errors and securing 100% financial audit accuracy.

---

## 📝 Centene Experience Summary (Nishant - Key Pillars)

1. **Novasys Portal (Django)**: Maintenance, enhancement, and core refactoring.
2. **Upstream Ingestion**: Flask app (Pydantic validation) → Kafka event topics → Python `asyncio` Kafka consumers → Stored Procedures & DB background triggers.
3. **External Partner APIs**: Softheon Broker Lookup API (Pydantic validation) + OneSource GraphQL API (`hios_id` plan lookup).
4. **Out-of-Order Event Resilience**: Fixed out-of-order Kafka message delivery, span gaps, and false broker commission payouts (eliminating monetary leakage).
5. **Reconciliation Engine & UI**: Chunked processing (`POLICY_CHUNK_SIZE=10k`, `compare_manager.py`), lexicographical indexing, zero-dependency Univer HTML5 dashboard.
6. **RHEL Environment & Monitoring**: Legacy RHEL topology (Nginx 5555, PgBouncer 5444, Postgres 5432, Gunicorn 8000) + custom SQLite `system_monitor` daemon for post-patching PgBouncer auto-restart + `structlog` PII masking.

---

## 📝 Resume Bullets Nishant

- **Extensible Django Portal & Async Ingestion**: Enhanced an extensible Django SaaS platform (`Novasys Portal`) and built Python `asyncio` Kafka consumers processing Pydantic-validated event streams from upstream Flask microservices into database stored procedures and background triggers.
- **Third-Party Partner APIs**: Integrated **Softheon Broker Lookup API** (Pydantic schema validation) and **OneSource GraphQL API** via `httpx.AsyncClient` to asynchronously resolve agent/broker metadata and marketing plan attributes (`hios_id`).
- **Stream Resilience & Monetary Protection**: Resolved out-of-order Kafka event streams by engineering event re-sequencing and enrollment span recalculation logic, eliminating false broker commission payouts, corrupt member timelines, and monetary financial leakage.
- **High-Scale Reconciliation Engine & Air-Gapped UI**: Architected a memory-safe two-phase Python reconciliation engine (`compare_manager.py`, `POLICY_CHUNK_SIZE = 10,000`) with lexicographical policy indexing (`start_policy` → `end_policy`) to validate 100,000+ migrated Salesforce records with zero OOM errors and an air-gapped standalone HTML5/JS dashboard.
- **Legacy RHEL Observability & Security**: Designed a custom RHEL SQLite `system_monitor` daemon to auto-restart PgBouncer connection poolers post OS security patching on legacy enterprise servers, while implementing `structlog` PII masking across logging pipelines.
