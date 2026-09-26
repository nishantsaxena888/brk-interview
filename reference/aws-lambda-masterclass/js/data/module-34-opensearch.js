/**
 * MODULE 34 — Amazon OpenSearch Service — Search & Analytics
 */
const MODULE_34_DATA = {
  id: 'opensearch-fundamentals', moduleId: 'module-34',
  title: 'Amazon OpenSearch Service — Search & Analytics',
  description: 'Master search and log analytics. Covers domains, indices, Kibana/Dashboards, log aggregation, fine-grained access control, and integration with CloudWatch.',
  difficulty: 'intermediate', duration: '70 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master OpenSearch Service core concepts and architecture', 'Implement OpenSearch Service using Boto3 and AWS CLI', 'Troubleshoot common OpenSearch Service issues', 'Pass certification questions about OpenSearch Service'],
  sections: [
    { id: 'why', type: 'why', title: 'Why OpenSearch Service?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🔍</span><div class="alert-content"><div class="alert-title">Search and Analyze Logs at Scale</div><div class="alert-text">OpenSearch provides managed search and analytics. Index logs from CloudWatch, VPC Flow Logs, CloudTrail. Search with full-text queries. Visualize with dashboards.</div></div></div>
      <table><thead><tr><th>Feature</th><th>OpenSearch</th><th>CloudWatch Logs Insights</th><th>Athena</th></tr></thead><tbody><tr><td><strong>Query Type</strong></td><td>Full-text search + aggregations</td><td>Log Insights QL</td><td>SQL</td></tr><tr><td><strong>Visualization</strong></td><td>Built-in Dashboards (Kibana)</td><td>Basic</td><td>None (use QuickSight)</td></tr><tr><td><strong>Real-time</strong></td><td>Yes (streaming)</td><td>Near real-time</td><td>Batch</td></tr><tr><td><strong>Cost</strong></td><td>Instance hours + storage</td><td>Per query</td><td>Per query + S3</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">OpenSearch Domains Are Expensive — Right-Size Your Cluster</div><div class="alert-text">Running OpenSearch is like running EC2 instances. Start small (t3.small.search for dev) and use UltraWarm for historical data to reduce costs by 80%.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'OpenSearch Service Architecture', content: { title: 'Logs → OpenSearch → Dashboards', width: 750, height: 280,
      nodes: [
          { id: 'logs', label: 'Log Sources', icon: '📋', x: 10, y: 110, type: 'storage', description: 'CloudWatch Logs, S3, Kinesis Firehose, Beats agents.' },
          { id: 'os', label: 'OpenSearch Domain', icon: '🔍', x: 250, y: 110, type: 'compute', description: 'Managed cluster. Hot nodes for active data, UltraWarm for historical.' },
          { id: 'dash', label: 'Dashboards', icon: '📊', x: 500, y: 50, type: 'client', description: 'Kibana-compatible visualizations.' },
          { id: 'alerts', label: 'Alerting', icon: '🚨', x: 500, y: 200, type: 'trigger', description: 'Anomaly detection and alerting on log patterns.' }
      ],
      edges: [
          { from: 'logs', to: 'os', label: 'Index', animated: true },
          { from: 'os', to: 'dash', label: 'Visualize' },
          { from: 'os', to: 'alerts', label: 'Alert' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Domain Architecture</h4><ul><li><strong>Hot nodes:</strong> SSD-backed, for active indexing and search</li><li><strong>UltraWarm nodes:</strong> S3-backed, 80% cheaper for historical data</li><li><strong>Cold storage:</strong> Cheapest, for rarely accessed data</li></ul><h4>2. Fine-Grained Access Control</h4><p>Control access at the index, document, and field level. Integrate with IAM or internal user database.</p><h4>3. Index Lifecycle</h4><p>Hot → UltraWarm → Cold → Delete. Automate with Index State Management (ISM) policies.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'OpenSearch Service Boto3 Operations', content: { title: 'OpenSearch Service Management', languages: [
      { id: 'python-opensearch', label: 'Core Operations',
        code: `import boto3
import logging
from opensearchpy import OpenSearch

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Connect to OpenSearch domain
os_client = OpenSearch(
    hosts=[{'host': 'search-my-domain.us-east-1.es.amazonaws.com', 'port': 443}],
    http_auth=('admin', 'Admin123!'),
    use_ssl=True
)

def search_logs(index, query_text, size=10):
    """Full-text search across log indices."""
    body = {
        'query': {
            'multi_match': {
                'query': query_text,
                'fields': ['message', 'log', '@message']
            }
        },
        'size': size,
        'sort': [{'@timestamp': {'order': 'desc'}}]
    }
    response = os_client.search(index=index, body=body)
    hits = response['hits']['hits']
    logger.info("Found %d results for: %s", len(hits), query_text)
    return hits`,
        explanations: [
              { line: '9-12', text: 'Connect to the managed OpenSearch domain. Use IAM auth in production instead of basic auth.' },
              { line: '17-25', text: 'multi_match searches across multiple fields. Sort by timestamp descending for latest results first.' }
        ] }
    ], defaultLang: 'python-opensearch', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'OpenSearch Service CLI Commands', content: [
        { command: 'aws opensearch describe-domains --domain-names my-logs', category: 'aws-cli', expectedOutput: '{\n  "DomainStatusList": [{"DomainName": "my-logs", "EngineVersion": "OpenSearch_2.11", "ClusterConfig": {"InstanceType": "r6g.large.search", "InstanceCount": 3}, "Endpoints": {"vpc": "vpc-search-my-logs.us-east-1.es.amazonaws.com"}}]\n}', explanation: 'Shows domain config, instance types, and endpoint.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'OpenSearch Service CLI Lab', mode: 'simulated',
      initialText: 'OpenSearch CLI Lab. Try:\n  aws opensearch list-domain-names\n  aws opensearch describe-domains --domain-names my-logs',
      commands: {
          'aws opensearch list-domain-names': { text: '{\n  "DomainNames": [{"DomainName": "my-logs", "EngineType": "OpenSearch"}, {"DomainName": "app-search", "EngineType": "OpenSearch"}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Cluster status RED', error: 'Cluster health: RED', cause: 'One or more primary shards are unassigned. Usually: disk full or node failure.', fix: 'Check disk usage. Add nodes or increase storage. Delete old indices.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'OpenSearch Service Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Best use case for UltraWarm nodes?', options: [
              { id: 'a', text: 'Active indexing' },
              { id: 'b', text: 'Historical data that is rarely queried' },
              { id: 'c', text: 'Real-time search' },
              { id: 'd', text: 'Dashboard queries' }
            ], correctId: 'b', explanation: 'UltraWarm is S3-backed, 80% cheaper than hot nodes. Perfect for log data older than 7-30 days.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Log Search Dashboard', content: { title: 'Log Search Dashboard', description: 'Query OpenSearch for error logs and return summary.', difficulty: 'intermediate',
      requirements: [
          'Search for ERROR level logs',
          'Aggregate by service name',
          'Return top 10 error sources'
      ],
      starterCode: `from opensearchpy import OpenSearch\n\ndef lambda_handler(event, context):\n    # TODO: Connect to OpenSearch\n    # TODO: Search for errors\n    pass`,
      language: 'python', hints: [
          'os_client.search(index="logs-*", body={"query": {"match": {"level": "ERROR"}}})'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon OpenSearch Hands-On Lab', content: {"title":"Amazon OpenSearch Hands-On Lab","description":"Configure and test Amazon OpenSearch following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open OpenSearch Console","instruction":"AWS Console → Search \"OpenSearch\" → Open service dashboard.","expectedResult":"OpenSearch dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon OpenSearch and what problem does it solve?","shortAnswer":"Amazon OpenSearch is a managed AWS service that provides managed Elasticsearch/OpenSearch for log analytics, full-text search, and real-time dashboards. It eliminates the need to manage Elasticsearch clusters, handle scaling, implement data pipelines.","commonMistake":"Not right-sizing instance types — OpenSearch is memory and storage intensive.","followUp":"When would you NOT use Amazon OpenSearch?"},{"difficulty":"beginner","question":"What are the key components of Amazon OpenSearch?","shortAnswer":"Domains, Indexes, Shards, Replicas, UltraWarm, Cold Storage, Dashboards, Ingestion Pipelines.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon OpenSearch integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon OpenSearch priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon OpenSearch costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon OpenSearch?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon OpenSearch for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon OpenSearch?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon OpenSearch achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon OpenSearch?"},{"difficulty":"intermediate","question":"Explain the Amazon OpenSearch scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon OpenSearch handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon OpenSearch?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon OpenSearch in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon OpenSearch architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon OpenSearch costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon OpenSearch?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon OpenSearch using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon OpenSearch support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon OpenSearch is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon OpenSearch from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon OpenSearch costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon OpenSearch.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon OpenSearch across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon OpenSearch API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon OpenSearch has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon OpenSearch from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon OpenSearch encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon OpenSearch are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete OpenSearch resources:</strong> Navigate to OpenSearch console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the OpenSearch console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },


    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 33: Amazon ElastiCache', url: 'module-33.html' }, next: { title: 'Chapter 35: AWS Organizations', url: 'module-31.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_34_DATA; } else { window.MODULE_34_DATA = MODULE_34_DATA; }
