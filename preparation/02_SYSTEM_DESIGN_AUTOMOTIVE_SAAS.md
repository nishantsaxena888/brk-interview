# 02. System Design: Multi-Tenant Automotive Partner Data Platform
**Domain**: Multi-Tenant Automotive SaaS (5,000+ Dealer Groups, 40+ Partner Integrations)  
**Stack**: Native AWS (API Gateway, Lambda, ECS Fargate, EventBridge, Step Functions, DynamoDB, S3 Medallion, Aurora MySQL, Bedrock)

---

## 🏛️ End-to-End Architecture Diagram

```mermaid
flowchart TD
    subgraph Partners ["External Partner Surfaces (40+ Platforms)"]
        P1["Modern DMS / CRM (Webhooks / REST)"]
        P2["Legacy DMS (SOAP / WSDL / XML)"]
        P3["Batch Feeds (SFTP / CSV / Fixed-Width)"]
    end

    subgraph Boundary ["Ingress & Ingestion Boundary"]
        APIGW["API Gateway (HTTP / Webhooks)<br/>• HMAC Signature Check<br/>• mTLS / OAuth2 Token Verify"]
        SFTP["AWS Transfer Family (SFTP)"]
        L_Ingest["Lambda Ingest Handler<br/>• Powertools @idempotent<br/>• DynamoDB Dedup Lock"]
    end

    subgraph MedallionS3 ["S3 Data Lake (Medallion Layers)"]
        S3_Landing["Landing Layer (Raw Immutable)<br/>s3://bucket/landing/tenant_id=XYZ/partner=cdk/"]
        S3_Bronze["Bronze Layer (Validated JSON Schema)<br/>s3://bucket/bronze/tenant_id=XYZ/"]
        S3_Silver["Silver Layer (Canonical Deal Model)<br/>s3://bucket/silver/tenant_id=XYZ/"]
        S3_Gold["Gold Layer (Aggregated Analytics / Views)<br/>s3://bucket/gold/tenant_id=XYZ/"]
        S3_Quarantine["Quarantine Bucket<br/>(Failed Schema / Poison Payloads)"]
    end

    subgraph Processing ["Orchestration & Compute Engines"]
        EB["Amazon EventBridge (Event Bus)"]
        SFN["AWS Step Functions (Normalization Workflow)"]
        L_Normal["Lambda Normalizer<br/>(Fast sub-15 min tasks)"]
        Fargate["ECS Fargate Task<br/>(Long-running batch SFTP > 15 min)"]
        SQS_FIFO["SQS FIFO Queues<br/>MessageGroupId = tenant_id"]
    end

    subgraph StorageServ ["Serving & Retrieval Layer"]
        DDB["DynamoDB Single-Table<br/>(Tenant Configs, Deduplication, Locks)"]
        Aurora["Aurora MySQL (Multi-Tenant)<br/>WHERE tenant_id = :id"]
        Agents["AI Multi-Agent Runtime<br/>(DMS Agent & CRM Agent via Bedrock)"]
    end

    %% Connections
    P1 --> APIGW
    P2 --> APIGW
    P3 --> SFTP
    APIGW --> L_Ingest
    SFTP --> S3_Landing
    L_Ingest --> DDB
    L_Ingest --> S3_Landing
    S3_Landing --> EB
    EB --> SQS_FIFO
    SQS_FIFO --> SFN
    SFN --> L_Normal
    SFN --> Fargate
    L_Normal --> S3_Quarantine
    L_Normal --> S3_Bronze
    L_Normal --> S3_Silver
    Fargate --> S3_Silver
    S3_Silver --> S3_Gold
    S3_Silver --> Aurora
    Aurora --> Agents
    S3_Gold --> Agents
```

---

## ⚖️ Key Architectural Decisions & Trade-Offs

### 1. Compute Sizing: AWS Lambda vs. ECS Fargate
| Workload Type | Choice | Technical Rationale |
| :--- | :--- | :--- |
| **Partner Webhook Intake** | **AWS Lambda** | Event-driven, sub-second execution, zero idle cost, scales instantly with incoming webhook spikes. |
| **REST API Polling** | **AWS Lambda** | Small, periodic pagination tasks triggered via EventBridge cron rules (every 5–15 mins). |
| **Overnight DMS File Ingestion** | **ECS Fargate** | Large partner flat files (100MB+ pipe-delimited DMS dumps) taking 20–45 minutes to parse, process, and reconcile exceed Lambda's 15-minute hard limit. |

### 2. S3 Medallion Layering (Why 4 Layers?)
1. **Landing (Raw)**: Exact replica of the HTTP body or SFTP file with partner headers. **Immutable and read-only**. If normalization logic has bugs or a partner's format silently changes, we can replay data from Landing without re-requesting from the vendor.
2. **Bronze**: Raw records parsed into JSON, validated against structural schema, with ingestion metadata (`tenant_id`, `received_at`, `payload_hash`).
3. **Silver**: Clean, normalized canonical model (e.g., standard `Deal`, `Vehicle`, `Customer`). Deduplicated, normalized fields (VIN formatted, timestamps to UTC, phone numbers to E.164).
4. **Gold**: High-performance read models, daily dealership metrics, and data ready for Bedrock agent retrieval.

### 3. DynamoDB Single-Table Design
* **Partition Key (`PK`)**: `TENANT#<dealer_id>`
* **Sort Key (`SK`)**: 
  - `CONFIG#PARTNER#<partner_id>` (Store partner credentials, polling cursor, rate-limit settings)
  - `IDEMPOTENCY#<event_hash>` (Deduplication lock with 24-hr TTL)
  - `DEAL#<deal_id>` (Fast transactional lookup for dealer workflows)
* **GSI 1**: `GSI1PK = STATUS#<status>`, `GSI1SK = TIMESTAMP#<iso8601>` (for processing queues and dead-letter triage).

### 4. Noisy Neighbor Protection (5,000+ Dealers)
* **The Problem**: A 50-store dealer conglomerate dumps 200,000 inventory updates at 9:00 AM, exhausting Lambda concurrency and choking API quotas for single-store dealerships.
* **The Solution**:
  - Ingestion buffer uses **SQS FIFO Queues** where `MessageGroupId = tenant_id`.
  - Set reserved concurrency on worker Lambdas and token-bucket rate limiters per `tenant_id`.
  - Guarantees fair scheduling across dealer tenants.

### 5. Multi-Tenant Data Isolation Strategy
1. **Storage Isolation**: S3 paths strictly prefix-partitioned (`s3://bucket/layer/tenant_id=<id>/`).
2. **IAM ABAC Enforcement**: IAM roles attach policy conditions matching `${aws:PrincipalTag/TenantId}`.
3. **Query-Level Enforcement**: Relational queries on Aurora MySQL always append parameterized `WHERE tenant_id = :tenant_id`.
4. **Agent Memory Isolation**: Bedrock AgentCore memory spaces are keyed by `tenant_id` and `user_id`. No cross-tenant context bleeding.
