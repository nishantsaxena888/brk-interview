<div align="center">

# NISHANT SAXENA

*Contact Name: Douglas Blekicki | Contact Email: DBlekicki@wscs.ai*

</div>

---

## PROFESSIONAL SUMMARY

- 17+ years of experience in software development and delivery across web, client/server, and cloud-native distributed systems.
- Polyglot engineer across Python (Django, FastAPI, Flask) and C# / .NET, currently building full-stack features on a decoupled .NET Clean Architecture backend with a React.js (Next.js / React 19) frontend.
- Strong foundation in system analysis, architecture, design, development, testing, and implementation, with a track record of simplifying complex systems through clean architecture, code optimization, and automation.
- Hands-on across frontend and backend — responsive UIs, REST/GraphQL APIs, and microservices.
- Built production AI systems on AWS Bedrock (Claude 3.5) for document and financial data extraction into structured JSON, and RAG services over Elasticsearch dense vectors for semantic search, similarity retrieval, and anomaly detection.
- Architected cloud-native AI pipelines (AWS / Azure / GCP) using LLMs and agentic paradigms (LangChain, LlamaIndex) for autonomous document classification, validation, and extraction.
- Claude and GitHub Copilot power-user: parses vendor specs and WSDLs into typed Python clients, scaffolds services and handlers, generates TDD and contract test suites, and reasons over production logs to isolate failures.
- Owned end-to-end multi-tenant integrations with 40+ external partner systems — ERP SOAP/WSDL endpoints, WebMethods XML services, DMS/CRM platforms, webhooks, and file-based feeds — landing raw data into S3 medallion layers (Landing -> Bronze -> Silver -> Gold) and normalizing inconsistent external schemas into canonical, Pydantic/JSON Schema validated models.
- Engineered resilience under upstream SLAs using Python (AWS Lambda Powertools): idempotency keys, DynamoDB-backed deduplication, rate limiting, exponential backoff, structured exception handling, OpenTelemetry tracing to CloudWatch, and fallback paths.
- Well-versed in DevOps and multi-cloud: AWS (Lambda, Step Functions, DynamoDB, S3, ECS, EKS, API Gateway, MSK, CDK), Azure (Entra ID SSO, Data Factory with CDC, Container Apps, Functions, Logic Apps, Azure SQL), GCP (Vertex AI, GKE), Docker, Terraform, GitHub Actions, CI/CD.
- Hands-on with OCR and Document AI workflows using AWS Textract, Tesseract, docTR, Mindee, and Azure Vision for structured data extraction, integrated with ML-driven validation workflows, rule engines, and classification logic.
- Skilled in authentication and security (JWT, OAuth2, Keycloak, Azure Entra ID, RBAC, AWS IAM, KMS), async execution (Celery, RQ), and real-time features (WebSockets).
- Experienced with databases (PostgreSQL, MySQL, Amazon Aurora, MongoDB, Redis, DynamoDB, SQL Server, Azure SQL) including schema design, indexing, and query optimization.
- Strong background in Elasticsearch and Kafka for search, messaging, and event-driven systems.
- Collaborative engineer with Agile/Scrum delivery experience across US, Singapore, and India.

---

## SKILL SPECIFICATIONS

- **Languages & Frameworks**: Python, C# / .NET Core, JavaScript (ES6+), TypeScript, ReactJS (React 19, Next.js), Django, Flask, FastAPI, Flask-RESTful, GraphQL, Celery, Selenium
- **Cloud & DevOps**: AWS (Bedrock, Step Functions, Lambda, DynamoDB, S3, API Gateway, SNS, SQS, ECS, EKS, MSK, CDK), Azure (Entra ID, Data Factory, Container Apps, Functions, Logic Apps), GCP (Vertex AI), Docker, Docker Compose, Terraform, GitHub Actions, LocalStack, CI/CD Pipelines
- **Database Technologies**: PostgreSQL, MySQL, Amazon Aurora (MySQL), MongoDB, Redis, DynamoDB, SQL Server, Azure SQL
- **Testing, Monitoring & Automation**: PyTest, Jest, React Testing Library, Locust, CloudWatch, New Relic, ELK, Splunk, TDD, CI/CD Test Automation
- **Authentication & Access Control**: JWT, OAuth2, Keycloak, Azure Entra ID (SSO), RBAC, IAM (AWS), KMS
- **AI / ML & LLM Technologies**: Claude Code, GitHub Copilot, AWS Bedrock (Claude 3.5), Embeddings, Semantic Search, Vector Search (Elasticsearch Dense Vectors), RAG, Agentic Workflows (LangChain, LlamaIndex), Document AI Workflows, Text Classification & Validation Pipelines
- **Integration & Protocols**: RESTful APIs, SOAP/XML (WSDL), Webhooks, SFTP / File-based Ingestion, JSON Schema, Event-Driven Architecture

---

## PROFESSIONAL EXPERIENCE

**Centene**, NJ — *AI Polyglot Engineer* — Nov 2025 – Till Date

- Directed the cloud migration strategy, orchestrating the decommissioning of legacy Novasys architecture to transition into Salesforce.
- Architected a high-scale Python/Django Reconciliation Engine (`cent_poc`) to securely validate high-volume (100,000+) migrated records across Salesforce and Novasys without internal model bloat, using a memory-safe flat-file chunking pipeline and single-query DB batch hits.
- Engineered a lightweight, custom observability tool—operating safely within strict production memory constraints via server mounts—to monitor and support the sunsetting legacy architecture.
- Broke down highly complex legacy triggers and utilized Pandas aggregations to instantly isolate and broadcast the exact reasons for data validation failures during migration.
- Engineered a visual data comparison dashboard utilizing the open-source Univer framework, simplifying complex workflows and exposing real-time migration discrepancies to the business.
- Designed a dedicated RHEL-based system_monitor leveraging local SQLite architecture to securely capture legacy environment alerts.
- Stabilized production environments by refactoring legacy asynchronous consumers (Celery) across payment and broker systems.
- Enhanced engineering velocity by deeply integrating multi-model AI workflows (Claude, Gemini) and advanced agentic frameworks (Antigravity) into the SDLC.
- Drastically reduced End-to-End (E2E) feature delivery time by utilizing these AI agents to rapidly scaffold and deploy Python microservices.

**KKR**, New York, NY — *Principal AI Engineer* — May 2025 – Nov 2025

- Architected a scalable Python (FastAPI) and React/Redux platform to actively onboard new investors and securely publish live valuation data to the Share Market.
- Designed RESTful APIs to automatically ingest and validate unstructured data from SharePoint, external financial systems, and legacy Excel files.
- Replaced messy Excel valuation models with a secure web platform, utilizing Pandas for backend calculations and the Univer framework for transparent UI reporting.
- Set up PostgreSQL and Elasticsearch to handle massive data storage, leveraging semantic search (dense embeddings) to instantly catch anomalies across different financial sheets.
- Built LLM-assisted utilities to seamlessly scan validation workflows and generate highly accurate exception summaries for business analysts.
- Guaranteed 100% calculation accuracy by using Copilot to write TDD test cases, specifically utilizing raw historic portfolio data as the baseline test coverage.
- Developed new full-stack business features while enforcing strict pipeline observability through audit trails, robust logging, and automated alerts.
- Seamlessly integrated the entire platform into existing CI/CD pipelines to securely deploy and scale the containerized orchestration on AWS EKS (Kubernetes).
- Built an AWS Bedrock (Claude 3.5) POC to extract and validate financial data from Excel and PDF files.
- Developed a financial RAG POC using AWS Bedrock and Elasticsearch to detect valuation anomalies.
- Created serverless Python APIs with AWS Bedrock to automate financial exception reporting.
- Designed AWS Bedrock prompt workflows to convert unstructured financial sheets into JSON models.

**Charter Communications**, Denver, CO — *Senior Software Engineer | Data | AWS | Python* — Jan 2025 – May 2025

- Developed a dynamic reporting platform with React.js frontend and Django REST Framework backend, supporting multiple departmental workflows.
- Designed and optimized REST APIs for real-time reporting, analytics integration, and cross-system data interactions.
- Directed large-scale data ingestion and transformation pipelines using Apache NiFi into PostgreSQL and MongoDB, ensuring highly reliable data flows.
- Built search and analytics infrastructure leveraging Elasticsearch, enabling fast, flexible queries and dashboards across massive datasets.
- Implemented platform observability and monitoring standards, including operational alerts and sync tracking via AWS SNS and Lambda.
- Created reusable React components based on schema-driven APIs, ensuring scalable and maintainable UI integration across departments.

**CapitalOne**, Manhattan, NYC — *Principal Engineer (Python/AWS)* — Apr 2024 – Sep 2024

*Developed a transaction pipeline using AWS Step Functions as a coordinator service, representing the complete lifecycle of a transaction. The system ensured that all services interact seamlessly, coordinating each step in the transaction journey.*

*Technologies: Python, TypeScript, AWS Step Functions, Lambda, DynamoDB, LocalStack, TDD, Client's inbuilt infrastructure tool (wrapped around CDK and written in TypeScript).*

- Architected and implemented a transaction orchestration platform using AWS Step Functions, coordinating multiple microservices to represent the full lifecycle of client transactions and ensuring seamless service interactions.
- Converted legacy Java utilities to Python with Test-Driven Development (TDD), standardizing utility services and improving maintainability.
- Designed and developed AWS Lambda functions for generic API calls with robust retry logic, structured exception handling, and fallback mechanisms to improve system reliability.
- Managed transaction metadata in DynamoDB, enabling orchestration tracking, auditing, and end-to-end visibility across the pipeline.
- Built end-to-end testing frameworks with pytest and leveraged LocalStack to simulate and validate Step Functions, Lambda, and DynamoDB interactions locally.
- Maintained automated AWS deployment pipelines using Node.js (TypeScript) SDK and CDK, enabling scalable, reproducible infrastructure provisioning.
- Enhanced operational observability by creating internal debugging utilities to trace transaction steps and improve visibility during integration and UAT testing.
- Developed Angular-based enterprise dashboards with RxJS and RESTful backend integration for real-time monitoring, analytics, and reporting.
- Collaborated with client stakeholders to gather requirements, define architecture, and deliver robust, production-ready solutions.

**Mind Master Solutions Pte Ltd**, Singapore / Hyderabad, India — *Principal Software Engineer (Python/React/Cloud/AI)* — Jun 2022 – May 2024

*Project #1 – Document Extraction (simplyflow.ai): Built a Document Extraction system using Python, Django, PostgreSQL, and OCRs like AWS Textract, Microsoft Azure, Fitz, and Tesseract OCR, automating the extraction of relevant information from a large number of documents (invoices, receipts, contracts) into a structured database format.*

*Technologies: MSSQL, PostgreSQL, Django, FastAPI, Python, Azure Functions, Elasticsearch, Azure.*

- Architected agentic workflows (LangChain/LlamaIndex) for autonomous document classification and validation using GenAI models.
- Built Google AppScript automations bridging G-Suite tools seamlessly with the core Python AI engine for fast data ingestion.
- Accelerated Python API development, testing, and debugging cycles by heavily utilizing AI coding assistants like Gemini and GitHub Copilot.
- Extended Django REST Framework (DRF) for low-code/no-code CRUD APIs based on database schemas, facilitating agile microservices development using FastAPI.
- Developed and validated AI/ML pipelines for text recognition, entity extraction, and contextual analysis using GenAI models.
- Integrated Generative AI with OCR tools (AWS Textract, Tesseract) for enhanced document processing and accuracy improvement.
- Developed scalable WebSocket servers using Node.js to broadcast live document processing updates to the ReactJS frontend, reducing database polling overhead.
- Engineered cloud-deployed AI workflows, ensuring high model accuracy through robust validation techniques.
- Created custom AI wrappers and connectors to streamline data extraction from documents.
- Created versatile Python-based connector classes for CRUD consistency across modules.
- Created a rule-based classification system for document type detection.
- Built a cloud-agnostic Document Extraction system (simplyflow.ai) using Python, Django, and PostgreSQL, seamlessly distributing intensive OCR workloads across AWS (Textract), Azure (Vision), and GCP (Vertex AI).
- Designed heuristic rule engines for intelligent data extraction.
- Automated pipeline execution with Python threading and schedulers.
- Orchestrated data processing workflows with AWS Step Functions for classification, processing, and ERP integration.
- Developed Python-based email modules using IMAP and SMTP for automated email handling.
- SaaS-ready implementation for customizable client interaction and scalability.
- Developed dynamic ReactJS interfaces configured via low-code API outputs.
- Integrated robust search, filtering, and data visualization.
- Streamlined authentication and access control integration with backend IAM.
- Dockerized backend and frontend for scalability and consistent deployment.
- Orchestrated modular Python and Node.js microservices on AWS EKS and fully scaled to GCP, leveraging Kubernetes autoscaling to handle unpredictable high-volume OCR document extraction spikes securely.
- Built unified monitoring and retry mechanisms across WebMethods → Kafka → AWS Lambda pipeline using Python and Step Functions.
- Built validation frameworks for ML/AI pipelines using Python, Terraform, and Robot Framework, embedding resilience checks and observability into cloud-native workflows.
- Partnered with infra/MLOps teams to enforce validation-as-code and quality engineering across platform components.
- Enabled horizontal scaling and caching with Redis.
- Built end-to-end workflows using API Gateway, AWS Lambda, Step Functions, and Amazon MSK (Managed Streaming for Apache Kafka) for SSO and secure, scalable microservices orchestration.
- Leveraged Kafka topics for event-driven architecture for real-time processing and ensuring seamless integration across services. Automated infrastructure provisioning with Terraform, building all components from scratch.
- Monitored and analyzed application and database performance using Amazon CloudWatch, New Relic, and ELK (Elasticsearch, Logstash, Kibana) for real-time insights and debugging.
- Designed and developed intuitive front-end components using React and Next.js for user-friendly interfaces in automation platforms.

**Highiq.ai**, Hyderabad, India — *Staff Software Engineer (Python/Angular/Cloud Automation/C#/RPA)* — Mar 2021 – Apr 2022

*Project #1 – Bumi (Contract Reader): Contract analysis automation solution processing thousands of contracts rapidly to deliver precise insights for informed decision-making. Project #2 – Oscar (Accounts Payable): Cloud-based solution for intelligent automation of accounts payable, handling invoice monitoring, pre-processing, automatic extraction, multi-step validation workflows, and ERP integration.*

*Technologies: SQL Server, PostgreSQL, React, Django, ELK, Angular, Python, AWS, Textract.*

- Developed backend APIs using Django REST Framework to automate contract analysis and invoice workflows.
- Maintained legacy .NET modules for core business rule validation and PO compliance, ensuring backward compatibility with existing ERP workflows.
- Integrated Python services with .NET-based validation layers to preserve business-critical logic while modernizing data pipelines.
- Supported hybrid environments where .NET legacy logic handled complex regulatory validations before document ingestion.
- Leveraged AWS SageMaker to train and deploy lightweight ML models for document classification and validation within OCR-based extraction pipelines.
- Designed and optimized databases with SQL Server and PostgreSQL for efficient data storage and retrieval.
- Implemented Python scripts and utilities for file processing, automation, and data transformation.
- Integrated secure authentication and authorization mechanisms using SSO, JWT, and Azure Identity.
- Created schedulers using Python APScheduler for interval-based job execution and file processing pipelines.
- Replaced UI Path with open-source RPA tools to reduce costs and improve automation efficiency.
- Built a file processing pipeline with Python APScheduler to handle large-scale document automation tasks.
- Designed real-time data pipelines integrating AWS Textract with Snowflake for scalable invoice analytics.
- Designed a validation framework to minimize code redundancy and streamline validation workflows.
- Created wrapper functionalities for CRUD operations on PostgreSQL using Python SQLAlchemy for database interactions.
- Processed CSV files using Python pandas for data manipulation and cleaning.
- Extracted data from documents using AWS Textract API with Boto3 for automation of invoice pre-processing.
- Implemented a SaaS solution on AWS Marketplace for cloud-based, scalable deployment of the application.
- Utilized the ELK stack to monitor and analyze application logs for system insights and error detection.
- Supported ERP system integrations through APIs and utilities, enabling seamless multi-step validation workflows.
- Implemented robust database security with IAM policies, encryption (KMS), and compliance configurations.
- Developed heuristic rule engines and AI/ML models for intelligent invoice processing and error validation workflows.
- Directed critical cross-platform security configurations and authentication workflows leveraging Azure Identity and SSO for secure cross-cloud service access.
- Developed monitoring dashboards using Databricks and ELK to visualize extraction accuracy and processing KPIs.
- Engineered intelligent automation platforms integrating modern Python microservices with legacy C#/.NET business rule validation layers to process highly regulated contracts.
- Automated data annotation using Label Studio, enabling efficient model training and accuracy improvements.
- Abstracted legacy UI Path RPA processes into highly efficient, cloud-agnostic Python data pipelines utilizing APScheduler.
- Integrated AWS Textract and Python-based ML pipelines for data extraction and entity recognition.

**Infomagnus**, Hyderabad, India — *Software Development Engineer IV (SDE-4)* — Apr 2019 – Mar 2021

*Project #1 – Retail Suite of Tools (Advantage Solutions): A suite of tools unifying two legacy systems (Advantage Solutions and Daymon) after their merger. Technologies: Flask, PostgreSQL, Elasticsearch, Angular, AWS. Project #2 – Risk Mitigation (Walmart): Enhanced a legacy Django-based product (SAS) to handle 3x current load using load testing and log analysis. Technologies: Python 3.6, Django, PyCharm, PostgreSQL, Flask-RESTful, SQLAlchemy, pandas, py-test, Locust, New Relic.*

- Developed a suite of tools using Flask to integrate legacy systems from Advantage Solutions and Daymon, ensuring seamless collaboration between systems and workforce.
- Used PostgreSQL and Elasticsearch to implement efficient data storage, retrieval, and advanced search capabilities.
- Built and maintained APIs to support Angular-based front-end applications, enabling user-friendly interfaces for the tools.
- Deployed the tools on AWS, leveraging its cloud infrastructure for scalability and reliability.
- Enhanced a Django-based legacy system (SAS) to handle three times the current load, ensuring scalability and performance improvements.
- Performed load testing with Locust and analyzed logs using New Relic to identify performance bottlenecks.
- Designed a generic framework using the Locust module to dynamically add test cases and load options for performance testing.
- Developed native Node.js APIs to seamlessly integrate the core AI engine with the client's existing in-house Node server architecture.
- Integrated REST API testing with Flask-RESTful and py-test modules to ensure the reliability of backend services.
- Developed an application-level PostgreSQL connector using SQLAlchemy for optimized database interactions.
- Created Python decorators at multiple layers to collect logs for detailed analysis and debugging.
- Conducted sprint planning, combining metrics from testing and log analysis to prioritize code enhancements.
- Utilized New Relic to monitor and analyze application performance, implementing code and query optimizations to improve system efficiency.

**Exponential Machines**, Hyderabad, India — *Technical Product Lead* — Jan 2017 – Mar 2019

*Project #1 – DOC/Pulse (RPA/AI monitoring and control platform): Decision Intelligence dashboard delivering real-time operational insights for autonomous processes. Technologies: Flask, Elasticsearch, Python, MongoDB, Neo4J, Splunk, Angular, Keycloak, AWS SQS, SNS, RabbitMQ, UI Path. Project #2 – Enso (ML/AI platform): Decision Intelligence Platform for building, orchestrating, and managing decision agents at scale. Technologies: Flask, Elasticsearch, Python, MongoDB, Splunk, Angular, Keycloak, Apache NiFi, Django, Tornado, Kafka, RabbitMQ.*

- Developed microservices and APIs using Flask for dashboards, analytics, and event-trigger systems.
- Created reusable wrappers for Elasticsearch and Splunk to streamline integration and improve code efficiency.
- Migrated data from Splunk to Elasticsearch, optimizing system performance and search capabilities.
- Built a connector for UI Path to extract metadata about RPA bots, enabling better monitoring and insights.
- Developed APIs for Angular-based dashboards to display real-time decision insights and analytics graphs.
- Designed APIs for event-trigger systems to handle various operational events and analytics scenarios.
- Utilized Django to create admin interfaces for platform management and configuration in client-specific solutions.
- Managed high-concurrency asynchronous tasks using Tornado to ensure real-time decision-making capabilities.
- Designed and maintained databases with MongoDB, ensuring efficient storage and retrieval for operational data.
- Architected system-level designs for platform scalability and efficiency, aligning with client requirements.
- Used Kafka and RabbitMQ for real-time messaging, event streaming, and asynchronous communication between components.
- Integrated Neo4j to model the graph of decision agents, their dependencies, and interactions with other agents, policies, and events.
- Automated data orchestration and integration using Apache NiFi to streamline data flows between different services.
- Managed authentication and role-based access using Keycloak for secure platform access.
- Collaborated with business stakeholders for sprint planning, feature prioritization, and client demos.
- Conducted code reviews, ensuring adherence to coding standards and best practices.
- Delivered technical documentation to facilitate knowledge transfer and system maintenance.
- Provided demos and walkthroughs to clients, highlighting key functionalities and system features.
- Set up and maintained robust development environments to support seamless team operations and deployments.

**Pramati Technologies** (Client: Castlight Health), Hyderabad, India — *Principal Engineer* — Dec 2013 – Jan 2017

*Project #1 – Analytics and Legacy System Enhancement: Converted a legacy Java/Excel-macro reporting system to a Django portal with complex business logic, migrating the database from MySQL to Greenplum. Technologies: Python, Django, Highchart, MySQL. Project #2 – In-house Test Automation Framework: Testing framework with server configuration, dashboard test execution, historic reporting, and JIRA integration. Technologies: Python, Django, Celery, Selenium. Project #3 – ODEX: A tool to streamline daily operations for the Customer Support Team. Technologies: Python, Django, DRF, PostgreSQL.*

- Migrated a legacy system from Java processes and Excel macros to a Django-based web portal, implementing complex business rules and logic.
- Designed and implemented a Highcharts framework to enable dynamic report generation through configuration.
- Migrated databases from MySQL to Greenplum, enhancing the Django portal to accommodate the changes.
- Created and maintained APIs using Django and Django REST Framework (DRF) for automated workflows and seamless data handling.
- Updated Python and Django versions in legacy projects for improved compatibility, performance, and security.
- Designed and developed an in-house test automation framework using Django, Selenium, and Celery to streamline testing operations.
- Integrated the test automation framework with Jira for automated bug reporting and management.
- Built a UI-based dashboard using Django to configure and execute test cases, monitor historical reports, and analyze trends.
- Automated repetitive tasks for customer support by identifying patterns in bug tracker requests and database queries using Python and Django.
- Developed operational efficiency tools by creating APIs with Django REST Framework and managing PostgreSQL databases.
- Reduced regression suite runtime by enabling API-based test case configurations within the test automation framework.
- Wrote test cases for all developed systems to ensure reliability, performance, and maintainability.
- Worked on both backend and frontend development, leveraging Python, Django, and PostgreSQL to deliver end-to-end solutions.
- Provided solutions to streamline operations and reduce manual work by understanding team pain points and designing effective tools.

**HTmedia** (Product: Shine.com), Gurugram, India — *Product Lead* — Aug 2011 – Dec 2013

*Led a team of developers at Shine.com (millions of users), managing development and real-time data indexing using Python, Django, Solr, and MongoDB to ensure efficient application performance under high load. Technologies: Flask, Elasticsearch, Python, MongoDB, Splunk, Angular, Keycloak, AWS SQS, SNS, RabbitMQ, UI Path.*

- Led a development team to manage Shine.com, using Python and Django to handle millions of users, ensuring high performance and scalability.
- Designed and managed MongoDB for efficient storage and retrieval of data, handling thousands of concurrent requests.
- Implemented a near real-time data indexing pipeline with Solr to enhance search functionality and reduce latency.
- Used Python and Flask to build backend APIs for various platform functionalities.
- Reduced technical debt by refactoring legacy Python and Django code, improving maintainability and performance.
- Developed a custom log management tool using Python to streamline bug identification and troubleshooting.
- Delivered a high-performance content management system (CMS) using Django, enabling efficient management of platform content.
- Utilized Elasticsearch for analytics and search enhancements on the platform.
- Deployed services on AWS for scalable and reliable infrastructure support.
- Integrated Elasticsearch for real-time monitoring and log analysis to ensure platform stability.
- Managed user authentication and authorization using Keycloak for secure access control.
- Handled message queues with RabbitMQ for asynchronous communication across system components.

**Innovektor Consultancy Pvt. Ltd.**, Mumbai, India — *Lead Technology* — Dec 2009 – Jul 2011

*Project #1 – Groffr: Online platform for group buying in real estate. Project #2 – Verkko/ConnectAlum: Alumni networking platform with chat and networking features. Technologies: PHP Symfony, Python, jQuery, MySQL.*

- Developed web platforms using PHP Symfony framework for Groffr (real estate group buying) and Verkko (alumni networking).
- Managed MySQL databases for user authentication, data storage, and API integrations, ensuring efficient backend operations.
- Designed and optimized user interfaces using jQuery for an intuitive and seamless user experience.
- Utilized Python for scripting and backend automation tasks to support platform functionalities.
- Implemented secure data handling practices to ensure user data protection across the platforms.
- Collaborated with teams to write detailed documentation, conduct testing, and implement continuous improvement initiatives.

**Silverline IT Private Ltd.**, Noida, India — *Senior Software Engineer* — Jul 2008 – Dec 2009

*Turbogear Project and several PHP client projects with a French partner. Technologies: Typo3, PHP5, Apache, Linux, MySQL5, Smarty, Mootools, OpenERP, Python, Linux.*

- Supported PHP projects using Typo3, Smarty, and other MVC frameworks to deliver customized client solutions.
- Managed MySQL5 databases for efficient data storage, retrieval, and backend support.
- Implemented automation projects using Turbogears and Python, streamlining workflows and improving efficiency.
- Provided server management on Linux, including configuring Apache servers and managing deployments.
- Developed interactive front-end components using Mootools for an enhanced user experience.
- Integrated and supported OpenERP for client-specific requirements, optimizing operational processes.
- Collaborated with teams for testing, debugging, and deploying PHP and Python-based applications.

**Ozas Technologies** (Client: Currenex) — *Software Developer* — Mar 2007 – Jun 2008

*Currenex is a financial technology company providing foreign exchange (FX) trading services to banks, hedge funds, brokers, fund managers, and corporations. Technologies: Java, Swing, Struts2, Oracle 9i, Jasper Reports.*

- Developed backend functionalities using Java to support tasks within the financial trading platform.
- Created user interfaces using Swing for interactive and responsive desktop applications.
- Designed and implemented workflows and business logic using the Struts2 framework for web application development.
- Built front-end components and layouts using HTML and CSS to meet specific client design requirements.
- Generated detailed financial reports using Jasper Reports for analytics and insights.
- Managed and optimized database operations with Oracle 9i for secure and efficient data storage and retrieval.

---

## EDUCATION

- **B.Tech, Information Technology** — UPTU, Hindustan College of Science and Technology (Sharda University), 2006–2007
