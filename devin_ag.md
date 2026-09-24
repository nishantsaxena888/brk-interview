<div align="center">

# NISHANT SAXENA

**nishu.saxena@gmail.com** | **(848)-345-0433** | **[linkedin.com/in/nishantasaxena](https://www.linkedin.com/in/nishantasaxena/)**

</div>

---

## PROFESSIONAL SUMMARY

- 17+ years of experience in software development and delivery across web, client/server, and cloud-native distributed systems; collaborative engineer with Agile/Scrum delivery across US, Singapore, and India.
- Built end-to-end inbound and outbound data pipelines using Kafka, NiFi, and Celery to integrate enterprise ERP systems and partner APIs, landing raw payloads into S3 data lakes and normalizing them into canonical JSON Schema models at system boundaries.
- Engineered resilient serverless microservices using AWS Lambda (Lambda Powertools), Step Functions, and EventBridge: idempotency keys, DynamoDB deduplication locks, webhook signature verification, and exponential backoff retry policies.
- Built multi-tenant SaaS platforms enforcing role-based and tenant-scoped data access (RBAC, OAuth2/JWT, Entra ID, Keycloak, Okta, AWS IAM/Cognito, Google Identity); comfortable owning technical relationships with external integration teams.
- Built production AI systems on AWS Bedrock for document and financial data extraction into structured JSON models, and RAG services over Elasticsearch dense vectors for semantic search and anomaly detection.
- Architected AI data pipelines using LLMs, LangChain, and LlamaIndex for autonomous document classification, entity extraction, and validation.
- AI-driven SDLC power-user (Claude, Copilot): integrating AI assistants across the full software lifecycle—architecture planning, rapid microservice development, tech debt refactoring, automated testing, and root-cause debugging.
- Skilled in extending cloud-native services across AWS, Azure, and GCP: building POCs, scaling existing microservices, and deploying serverless workflows (Functions, Logic Apps) and containerized apps (EKS, Container Apps) via CI/CD pipelines.
- Hands-on with OCR and Document AI workflows using AWS Textract, Tesseract, docTR, Mindee, and Azure Vision for structured data extraction, integrated with ML-driven validation workflows, rule engines, and classification logic.
- Skilled in authentication and security (JWT, OAuth2, Keycloak, Azure Entra ID, RBAC, AWS IAM, KMS, Secrets Manager/SSM), async execution (Celery, RQ), and real-time features (WebSockets).
- Experienced with databases (PostgreSQL, MySQL, Amazon Aurora, MongoDB, Redis, DynamoDB, Neo4j, Elasticsearch, Solr, SQL Server, Azure SQL) including schema design, indexing, and query optimization.

---

## SKILL SPECIFICATIONS

- **Languages & Frameworks**: Python, C# / .NET Core, JavaScript (ES6+), TypeScript, ReactJS, Django, Flask, FastAPI, GraphQL, Celery, Selenium, Kafka
- **Cloud & DevOps**: AWS (Bedrock, Step Functions, EventBridge, Lambda, DynamoDB, S3, API Gateway, SNS, SQS, ECS, EKS, MSK, CDK), Azure (Entra ID, Data Factory, Container Apps, Functions, Logic Apps), GCP (Vertex AI), Docker, Docker Compose, Terraform, GitHub Actions, LocalStack, CI/CD Pipelines
- **Database Technologies**: PostgreSQL, MySQL, Amazon Aurora (MySQL), MongoDB, Redis, DynamoDB, Neo4j, Elasticsearch, Solr, SQL Server, Azure SQL 
- **Testing, Monitoring & Automation**: PyTest, Jest, React Testing Library, Locust, CloudWatch, New Relic, ELK, Splunk, TDD, CI/CD Test Automation, Playwright
- **Authentication & Access Control**: JWT, OAuth2, Keycloak, Azure Entra ID (SSO), RBAC, IAM (AWS), KMS
- **AI / ML & LLM Technologies**: Claude Code, GitHub Copilot, AWS Bedrock, Embeddings, Semantic Search, Vector Search (Elasticsearch Dense Vectors), RAG, Agentic Workflows (LangChain, LlamaIndex), Document AI Workflows, Text Classification & Validation Pipelines
- **Integration & Protocols**: RESTful APIs, SOAP/XML (WSDL), Webhooks, SFTP / File-based Ingestion, JSON Schema, Event-Driven Architecture

---

## PROFESSIONAL EXPERIENCE

### Centene, New Jersey — *AI Polyglot Engineer* — Nov 2025 – Present

- Maintained and refactored legacy Django SaaS portal and Kafka consumer pipelines processing upstream policy events through stored procedures, database triggers, and background jobs; integrated third-party REST and GraphQL APIs to asynchronously enrich broker metadata and marketing plan attributes for accurate commission payouts.
- Resolved out-of-order Kafka event streams by engineering event re-sequencing and enrollment span recalculation logic, eliminating false broker commission payouts, corrupt member timelines, and monetary financial leakage.
- Built a Python reconciliation engine to validate 100,000+ migrated Salesforce records with zero memory errors, exporting audit results to AWS S3 with Lambda-triggered downstream processing, SQS dead-letter queues for failed retries, and SNS batch completion notifications — surfaced via a React SPA and Django dashboard.
- Designed a custom RHEL SQLite system monitoring daemon to auto-restart PgBouncer connection poolers post OS security patching on legacy enterprise servers.
- Implemented PII masking across CloudWatch structured logging pipelines, establishing per-service log groups and operational alarms to enforce data privacy compliance and integration health observability.
- Built a parallel simulation system to dry-run and validate code changes against 100,000+ live policies on a legacy financial platform serving 20M+ insurance members, protecting $20M+ in at-risk broker commissions and preventing thousands of incorrect policy corrections per deployment.
- Leveraged AI-assisted development tooling (Windsurf IDE) to accelerate delivery across legacy system refactoring, pipeline development, and high-risk code change cycles.
- Built a DuckDB-powered reconciliation tool within the Django platform to validate Oracle-to-SQL Server SSIS package migrations, enabling high-speed in-memory data comparison and integrity verification across large-scale database downscale migrations.
- Deployed and managed containerized Django and Kafka consumer services on a Rancher-managed Kubernetes platform, with AWS S3 for reconciliation audit staging and data exports.

### KKR, New York, NY — *Principal AI Engineer* — May 2025 – Nov 2025

- Architected a scalable Python (FastAPI) and React/Redux platform to onboard new LP investors and publish live portfolio valuation data to the investor reporting portal.
- Designed RESTful APIs to automatically ingest and validate unstructured data from SharePoint, external financial systems, and legacy Excel files.
- Replaced messy Excel valuation models with a secure web platform, utilizing Pandas for backend calculations and the Univer framework for transparent UI reporting.
- Set up PostgreSQL and Elasticsearch to handle massive data storage, leveraging semantic search (dense embeddings) to instantly catch anomalies across different financial sheets.
- Built LLM-assisted utilities to seamlessly scan validation workflows and generate highly accurate exception summaries for business analysts.
- Enforced financial calculation accuracy through TDD with pytest, using raw historic portfolio data as regression baseline to catch valuation discrepancies before production.
- Developed new full-stack business features while enforcing strict pipeline observability through audit trails, robust logging, and automated alerts.
- Seamlessly integrated the entire platform into existing CI/CD pipelines to securely deploy and scale the containerized orchestration on AWS EKS (Kubernetes).
- Leveraged AWS Bedrock to extract and validate financial data from Excel and PDF files, and built a RAG pipeline over Elasticsearch dense vectors to detect portfolio valuation anomalies.

### Charter Communications, Denver, CO — *Senior Software Engineer | Data | AWS | Python* — Jan 2025 – May 2025

- Developed a dynamic reporting platform with React.js frontend and Django REST Framework backend, supporting multiple departmental workflows.
- Designed and optimized REST APIs for real-time reporting, analytics integration, and cross-system data interactions.
- Directed large-scale data ingestion and transformation pipelines using Apache NiFi into PostgreSQL and MongoDB, ensuring highly reliable data flows.
- Built search and analytics infrastructure leveraging Elasticsearch, enabling fast, flexible queries and dashboards across massive datasets.
- Implemented platform observability and monitoring standards, including operational alerts and sync tracking via AWS SNS and Lambda.
- Created reusable React components based on schema-driven APIs, ensuring scalable and maintainable UI integration across departments.

### CapitalOne, Manhattan, NYC — *Principal Engineer (Python / AWS)* — Apr 2024 – Sep 2024

- Architected and implemented a transaction orchestration platform using AWS Step Functions, coordinating multiple microservices to represent the full lifecycle of client transactions and ensuring seamless service interactions.
- Converted legacy Java utilities to Python with Test-Driven Development (TDD), standardizing utility services and improving maintainability.
- Designed and developed AWS Lambda functions for generic API calls with robust retry logic, structured exception handling, and fallback mechanisms to improve system reliability.
- Managed transaction metadata in DynamoDB, enabling orchestration tracking, auditing, and end-to-end visibility across the pipeline.
- Built end-to-end testing frameworks with pytest and leveraged LocalStack to simulate and validate Step Functions, Lambda, and DynamoDB interactions locally.
- Maintained automated AWS deployment pipelines using Node.js (TypeScript) SDK and CDK, enabling scalable, reproducible infrastructure provisioning.
- Enhanced operational observability by creating internal debugging utilities to trace transaction steps and improve visibility during integration and UAT testing.

### Mind Master Solutions Pte Ltd, Singapore / Hyderabad, India — *Principal Software Engineer* — Jun 2022 – May 2024

- Built a cloud-agnostic Document Extraction system (`simplyflow.ai`) using Python, Django, and PostgreSQL, seamlessly distributing intensive OCR workloads across AWS (Textract), Azure (Vision), and GCP (Vertex AI).
- Architected agentic workflows (LangChain/LlamaIndex) for autonomous document classification and validation using GenAI models.
- Integrated Generative AI with OCR tools (AWS Textract, Tesseract) for enhanced document processing and accuracy improvement.
- Orchestrated modular Python and Node.js microservices on AWS EKS with Kubernetes autoscaling to handle high-volume OCR document extraction spikes securely.
- Built unified monitoring and retry mechanisms across WebMethods → Kafka → AWS Lambda pipeline using Python and Step Functions.
