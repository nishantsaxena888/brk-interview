# Interview Preparation Notes (BRK Data Platform Engineering)

## Key Architectural Concepts & Tech Highlights for Interview Prep

### 1. S3 Medallion Architecture
- **Landing**: Raw incoming payloads from 40+ partner integrations (REST, SOAP, Webhooks, SFTP feeds).
- **Bronze**: Raw schema preservation with metadata & timestamping.
- **Silver**: Standardized, cleaned, and validated canonical JSON models (JSON Schema enforcement).
- **Gold**: Aggregated business metrics, analytics, and serving-layer data models for downstream applications.

### 2. DynamoDB Single-Table Design & Resilience
- Multi-tenant data isolation using composite partition keys (`TENANT#<id>#DEALER#<id>`).
- Deduplication locks & at-least-once delivery handling.
- Idempotency key pattern via AWS Lambda Powertools.

### 3. Webhook Security & Partner Integration Protocol
- **Authentication/Security**: HMAC signature verification, OAuth2/JWT machine-to-machine token rotation, mTLS.
- **Resilience**: Exponential backoff retries, rate-limiting handlers, graceful degradation during third-party partner outages.

### 4. AWS EventBridge Event Bus Pattern
- Central event routing for 40+ DMS, CRM, Digital Retail, and F&I platforms.
- Event rules filtering payloads like `DealerInventoryUpdated`, `ClaimReconciled` into SQS queues, Step Functions, and Lambda workers.

### 5. Observability & System Lineage
- **OpenTelemetry**: Distributed tracing across serverless microservices.
- **CloudWatch & Alarms**: Partner-specific structured logging, operational metrics, and correlation IDs for quick 2 AM triage.
