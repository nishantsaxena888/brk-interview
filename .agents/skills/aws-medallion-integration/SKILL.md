---
name: aws-medallion-integration
description: >-
  Reference patterns and step-by-step workflows for designing resilient AWS Python Lambda
  ingestion pipelines with S3 Medallion Layering (Landing -> Bronze -> Silver -> Gold).
---

# AWS Medallion Integration Pipeline Skill

This skill documents the standard architecture and implementation runbook for ingestion pipelines connecting third-party DMS/CRM partner feeds to AWS native infrastructure.

---

## 🏛️ Medallion Layering Reference

```
[Partner Webhook / REST / SOAP / SFTP]
                  │
                  ▼
         ┌────────────────┐
         │ API Gateway /  │
         │ Lambda Ingest  │
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │ Landing Bucket │  (Raw, immutable external payload - JSON/XML/CSV)
         └───────┬────────┘
                 │ (Validation & Schema Cleansing)
                 ▼
         ┌────────────────┐
         │ Bronze Bucket  │  (Parquet format, appended timestamps, standardized keys)
         └───────┬────────┘
                 │ (Normalizing to Canonical Model)
                 ▼
         ┌────────────────┐
         │ Silver Bucket  │  (Cleaned, deduplicated, tenant-partitioned canonical data)
         └───────┬────────┘
                 │ (Business Aggregations & ML Feature Store)
                 ▼
         ┌────────────────┐
         │  Gold Bucket   │  (Optimized query model for DMS Agent & CRM Agent RAG)
         └────────────────┘
```

---

## 🔒 Security & Resilience Checklist
- [ ] **Secrets Management**: Credentials in AWS Secrets Manager / Parameter Store with KMS encryption.
- [ ] **Webhook Verification**: HMAC signature verification (SHA256) on incoming webhooks before writing to S3.
- [ ] **Dead Letter Queue (DLQ)**: SQS DLQ attached to Lambda / EventBridge for failed event retries.
- [ ] **OpenTelemetry Instrumentation**: `aws-lambda-powertools` with tracer, logger, and metrics configured per partner.
