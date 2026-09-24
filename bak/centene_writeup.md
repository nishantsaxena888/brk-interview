# Centene Corporation — Work Summary
**Role**: AI Polyglot Engineer | **Nov 2025 – Present** | New Jersey

---

**Business Context**
Worked on Novasys Portal, an internal SaaS platform for insurance brokers managing policies, member enrollments, and commission payouts across a 20M+ member healthcare platform. Key challenges included accurate real-time policy event processing

**Tech Stack**
Python, Django, FastAPI, Pydantic, Apache Kafka, PostgreSQL, PgBouncer, DuckDB, AWS (S3, Lambda, SQS, SNS, CloudWatch), React SPA, Rancher, Kubernetes, RHEL 9, REST/GraphQL APIs

**Key Contributions**
- Maintained and refactored legacy Django portal and Kafka consumer pipelines; integrated Softheon and OneSource APIs to enrich broker metadata for accurate commission payouts.
- Engineered Kafka event re-sequencing to eliminate out-of-order enrollment events and prevent $20M+ in false broker commission payouts.
- Built a Python reconciliation engine validating 100,000+ migrated Salesforce records, with S3 audit exports, Lambda processing, SQS DLQs, and SNS notifications; results surfaced via React SPA + Django dashboard.
- Built a parallel simulation system to dry-run code changes against 100K+ live policies before each deployment.
- Built a DuckDB-powered tool to validate Oracle → SQL Server SSIS package migrations.
- Implemented PII masking and CloudWatch observability across logging pipelines.
- Deployed containerized services on Rancher Kubernetes; designed a custom RHEL daemon to auto-restart PgBouncer post OS patching.

