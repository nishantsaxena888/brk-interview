<div align="center">

# NISHANT SAXENA

**nishu.saxena@gmail.com** | **(848)-345-0433** | **[linkedin.com/in/nishantasaxena](https://www.linkedin.com/in/nishantasaxena/)**

</div>

---

## PROFESSIONAL SUMMARY

- 17+ years of experience in software development and delivery across web, client/server, and cloud-native distributed systems; collaborative engineer with Agile/Scrum delivery across US, Singapore, and India.
- Built end-to-end inbound and outbound data pipelines using Kafka, NiFi, and Celery to integrate enterprise ERP systems and partner APIs, landing raw payloads into S3 data lakes and normalizing them into canonical JSON Schema models at system boundaries.
- Engineered resilience under upstream SLAs using Python on AWS Lambda (Lambda Powertools): idempotency keys, DynamoDB-backed deduplication, webhook signature verification, rate limiting, exponential backoff, structured exception handling, and fallback paths.
- Built multi-tenant SaaS platforms enforcing role-based and tenant-scoped data access (RBAC, OAuth2/JWT, Entra ID, Keycloak); comfortable owning the technical relationship with external integration teams.
- Built production AI systems on AWS Bedrock (Claude) for document and financial data extraction into structured JSON, and RAG services over Elasticsearch dense vectors for semantic search, similarity retrieval, and anomaly detection.
- Architected cloud-native AI pipelines (AWS / Azure / GCP) using LLMs and agentic paradigms (LangChain, LlamaIndex) for autonomous document classification, validation, and extraction.
- Claude Code and GitHub Copilot power-user: parses vendor specs and WSDLs into typed Python clients, scaffolds services and handlers, generates TDD and contract test suites, and reasons over production logs to isolate failures.
- Well-versed in DevOps and multi-cloud: AWS (Lambda, Step Functions, EventBridge, DynamoDB, S3, ECS, EKS, API Gateway, MSK, CDK), Azure (Entra ID SSO, Data Factory with CDC, Container Apps, Functions, Logic Apps, Azure SQL), GCP (Vertex AI, GKE), Docker, Terraform, GitHub Actions, CI/CD.
- Hands-on with OCR and Document AI workflows using AWS Textract, Tesseract, docTR, Mindee, and Azure Vision for structured data extraction, integrated with ML-driven validation workflows, rule engines, and classification logic.
- Skilled in authentication and security (JWT, OAuth2, Keycloak, Azure Entra ID, RBAC, AWS IAM, KMS, Secrets Manager/SSM), async execution (Celery, RQ), and real-time features (WebSockets).
- Experienced with databases (PostgreSQL, MySQL, Amazon Aurora, MongoDB, Redis, DynamoDB, SQL Server, Azure SQL) including schema design, indexing, and query optimization.
- Strong background in Elasticsearch and Kafka for search, messaging, and event-driven systems.

---

## SKILL SPECIFICATIONS

- **Languages & Frameworks**: Python, C# / .NET Core, JavaScript (ES6+), TypeScript, ReactJS (React 19, Next.js), Django, Flask, FastAPI, Flask-RESTful, GraphQL, Celery, Selenium
- **Cloud & DevOps**: AWS (Bedrock, Step Functions, Lambda, DynamoDB, S3, API Gateway, SNS, SQS, ECS, EKS, MSK, CDK), Azure (Entra ID, Data Factory, Container Apps, Functions, Logic Apps), GCP (Vertex AI), Docker, Docker Compose, Terraform, GitHub Actions, LocalStack, CI/CD Pipelines
- **Database Technologies**: PostgreSQL, MySQL, Amazon Aurora (MySQL), MongoDB, Redis, DynamoDB, SQL Server, Azure SQL
- **Testing, Monitoring & Automation**: PyTest, Jest, React Testing Library, Locust, CloudWatch, New Relic, ELK, Splunk, TDD, CI/CD Test Automation
- **Authentication & Access Control**: JWT, OAuth2, Keycloak, Azure Entra ID (SSO), RBAC, IAM (AWS), KMS
- **AI / ML & LLM Technologies**: Claude Code, GitHub Copilot, AWS Bedrock (Claude), Embeddings, Semantic Search, Vector Search (Elasticsearch Dense Vectors), RAG, Agentic Workflows (LangChain, LlamaIndex), Document AI Workflows, Text Classification & Validation Pipelines
- **Integration & Protocols**: RESTful APIs, SOAP/XML (WSDL), Webhooks, SFTP / File-based Ingestion, JSON Schema, Event-Driven Architecture

---

## PROFESSIONAL EXPERIENCE

### Centene, New Jersey — *AI Polyglot Engineer* — Nov 2025 – Present

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

### KKR, New York, NY — *Principal AI Engineer* — May 2025 – Nov 2025

- Architected a scalable Python (FastAPI) and React/Redux platform to actively onboard new investors and securely publish live valuation data to the Share Market.
- Designed RESTful APIs to automatically ingest and validate unstructured data from SharePoint, external financial systems, and legacy Excel files.
- Replaced messy Excel valuation models with a secure web platform, utilizing Pandas for backend calculations and the Univer framework for transparent UI reporting.
- Set up PostgreSQL and Elasticsearch to handle massive data storage, leveraging semantic search (dense embeddings) to instantly catch anomalies across different financial sheets.
- Built LLM-assisted utilities to seamlessly scan validation workflows and generate highly accurate exception summaries for business analysts.
- Guaranteed 100% calculation accuracy by using Copilot to write TDD test cases, specifically utilizing raw historic portfolio data as the baseline test coverage.
- Developed new full-stack business features while enforcing strict pipeline observability through audit trails, robust logging, and automated alerts.
- Seamlessly integrated the entire platform into existing CI/CD pipelines to securely deploy and scale the containerized orchestration on AWS EKS (Kubernetes).
- Built an AWS Bedrock POC to extract and validate financial data from Excel and PDF files.
- Developed a financial RAG POC using AWS Bedrock and Elasticsearch to detect valuation anomalies.

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
