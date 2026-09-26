/**
 * MODULE 33 — Amazon ElastiCache — In-Memory Caching
 */
const MODULE_33_DATA = {
  id: 'elasticache-fundamentals', moduleId: 'module-33',
  title: 'Amazon ElastiCache — In-Memory Caching',
  description: 'Master in-memory data stores. Covers Redis and Memcached, cluster mode, replication groups, caching strategies, session stores, and cache invalidation.',
  difficulty: 'intermediate', duration: '70 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master ElastiCache core concepts and architecture', 'Implement ElastiCache using Boto3 and AWS CLI', 'Troubleshoot common ElastiCache issues', 'Pass certification questions about ElastiCache'],
  sections: [
    { id: 'why', type: 'why', title: 'Why ElastiCache?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">⚡</span><div class="alert-content"><div class="alert-title">Sub-Millisecond Latency — Cache Your Database Queries</div><div class="alert-text">ElastiCache provides managed Redis or Memcached. Cache database queries, session data, and computed results. Reduce DB load by 90%+ and get microsecond response times.</div></div></div>
      <table><thead><tr><th>Feature</th><th>Redis</th><th>Memcached</th></tr></thead><tbody><tr><td><strong>Data Structures</strong></td><td>Strings, Lists, Sets, Hashes, Sorted Sets</td><td>Key-value only</td></tr><tr><td><strong>Persistence</strong></td><td>Yes (AOF, RDB)</td><td>No (volatile)</td></tr><tr><td><strong>Replication</strong></td><td>Up to 5 read replicas</td><td>None</td></tr><tr><td><strong>Clustering</strong></td><td>Cluster mode (up to 500 shards)</td><td>Auto-discovery</td></tr><tr><td><strong>Use Case</strong></td><td>Sessions, leaderboards, queues, pub/sub</td><td>Simple caching</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">ElastiCache Runs Inside Your VPC — Not Publicly Accessible</div><div class="alert-text">ElastiCache nodes have private IPs only. They cannot be accessed from the internet. Your application must be in the same VPC (or peered VPC) to connect.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'ElastiCache Architecture', content: { title: 'Cache: App → ElastiCache → Database', width: 750, height: 280,
      nodes: [
          { id: 'app', label: 'Application', icon: '🖥️', x: 10, y: 110, type: 'compute', description: 'Lambda, ECS, or EC2 application.' },
          { id: 'cache', label: 'ElastiCache Redis', icon: '⚡', x: 250, y: 50, type: 'storage', description: 'In-memory cache. Sub-millisecond reads. Cache frequently accessed data.' },
          { id: 'db', label: 'RDS / DynamoDB', icon: '🗄️', x: 250, y: 200, type: 'storage', description: 'Primary database. Cache miss triggers DB read.' },
          { id: 'primary', label: 'Primary Node', icon: '📝', x: 480, y: 50, type: 'compute', description: 'Handles reads and writes.' },
          { id: 'replica', label: 'Read Replica', icon: '📖', x: 480, y: 200, type: 'compute', description: 'Async replication. Handles read-heavy traffic.' }
      ],
      edges: [
          { from: 'app', to: 'cache', label: 'Cache Hit (fast)', animated: true },
          { from: 'app', to: 'db', label: 'Cache Miss' },
          { from: 'cache', to: 'primary', label: 'Read/Write' },
          { from: 'primary', to: 'replica', label: 'Replicate', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Caching Strategies</h4><table><thead><tr><th>Strategy</th><th>How</th><th>Use Case</th></tr></thead><tbody><tr><td><strong>Cache-Aside (Lazy)</strong></td><td>App checks cache → miss → read DB → populate cache</td><td>Most common. Simple to implement.</td></tr><tr><td><strong>Write-Through</strong></td><td>App writes to cache AND DB simultaneously</td><td>Strong consistency needed.</td></tr><tr><td><strong>Write-Behind</strong></td><td>App writes to cache → async write to DB</td><td>Write-heavy workloads.</td></tr></tbody></table><h4>2. Redis Cluster Mode</h4><ul><li><strong>Disabled:</strong> 1 primary + up to 5 replicas. All data on one node. Max ~100GB.</li><li><strong>Enabled:</strong> Data partitioned across shards (up to 500). Each shard has 1 primary + replicas. Scales to TB.</li></ul><h4>3. TTL (Time-To-Live)</h4><p>Set expiration on cache keys. Critical to prevent stale data. Typical: 60s for real-time, 300s for near-real-time, 3600s for static data.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'ElastiCache Boto3 Operations', content: { title: 'ElastiCache Management', languages: [
      { id: 'python-elasticache', label: 'Core Operations',
        code: `import boto3
import redis
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Connect to ElastiCache Redis
r = redis.Redis(host='my-cluster.cache.amazonaws.com', port=6379, decode_responses=True)

def cache_aside_get(key, db_query_fn, ttl=300):
    """Cache-aside pattern: check cache first, then DB."""
    # Try cache
    cached = r.get(key)
    if cached:
        logger.info("Cache HIT: %s", key)
        return json.loads(cached)
    
    # Cache miss — query database
    logger.info("Cache MISS: %s", key)
    result = db_query_fn()
    
    # Populate cache with TTL
    r.setex(key, ttl, json.dumps(result))
    return result


def invalidate_cache(key):
    """Delete a cached key (on data update)."""
    r.delete(key)
    logger.info("Cache invalidated: %s", key)`,
        explanations: [
              { line: '10', text: 'Connect to ElastiCache Redis endpoint. This must be in the same VPC as your application.' },
              { line: '15-25', text: 'Cache-aside pattern: check cache first (fast), on miss query DB (slow), then populate cache with TTL.' }
        ] }
    ], defaultLang: 'python-elasticache', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'ElastiCache CLI Commands', content: [
        { command: 'aws elasticache describe-cache-clusters --show-cache-node-info', category: 'aws-cli', expectedOutput: '{\n  "CacheClusters": [{"CacheClusterId": "my-redis", "Engine": "redis", "CacheNodeType": "cache.r6g.large", "NumCacheNodes": 1, "CacheNodes": [{"Endpoint": {"Address": "my-redis.cache.amazonaws.com", "Port": 6379}}]}]\n}', explanation: 'Shows cluster info including endpoint address and port.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'ElastiCache CLI Lab', mode: 'simulated',
      initialText: 'ElastiCache CLI Lab. Try:\n  aws elasticache describe-cache-clusters --show-cache-node-info\n  aws elasticache describe-replication-groups',
      commands: {
          'aws elasticache describe-cache-clusters --show-cache-node-info': { text: '{\n  "CacheClusters": [{"CacheClusterId": "my-redis", "Engine": "redis", "EngineVersion": "7.0", "CacheNodeType": "cache.r6g.large", "CacheClusterStatus": "available"}]\n}', type: 'output' },
          'aws elasticache describe-replication-groups': { text: '{\n  "ReplicationGroups": [{"ReplicationGroupId": "my-redis-rg", "Status": "available", "ClusterEnabled": false, "NodeGroups": [{"PrimaryEndpoint": {"Address": "my-redis-rg.cache.amazonaws.com", "Port": 6379}}]}]\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: 'Cannot connect to Redis', error: 'Connection timed out', cause: 'Security group doesn\'t allow port 6379, or app is in different VPC.', fix: 'Add inbound rule for port 6379 from app security group. Ensure same VPC or VPC peering.' },
          { title: 'Cache eviction too frequent', error: 'Keys being evicted despite TTL not expired', cause: 'Memory full. Redis evicts using LRU policy.', fix: 'Increase node size or add shards. Monitor with ElastiCache metrics: CurrItems, BytesUsedForCache.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'ElastiCache Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Cache-aside pattern: what happens on cache miss?', options: [
              { id: 'a', text: 'Return empty' },
              { id: 'b', text: 'Query DB, populate cache, return result' },
              { id: 'c', text: 'Wait for cache refresh' },
              { id: 'd', text: 'Retry cache' }
            ], correctId: 'b', explanation: 'On miss: query DB → store in cache with TTL → return. Next request hits cache.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Cache Hit Rate Monitor', content: { title: 'Cache Hit Rate Monitor', description: 'Monitor ElastiCache metrics and report cache hit rate.', difficulty: 'intermediate',
      requirements: [
          'Get CacheHits and CacheMisses CloudWatch metrics',
          'Calculate hit rate',
          'Alert if below 80%'
      ],
      starterCode: `import boto3\ncw = boto3.client('cloudwatch')\n\ndef lambda_handler(event, context):\n    # TODO: Get ElastiCache metrics\n    # TODO: Calculate hit rate\n    pass`,
      language: 'python', hints: [
          'cw.get_metric_statistics(Namespace="AWS/ElastiCache", MetricName="CacheHits")',
          'hit_rate = hits / (hits + misses) * 100'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon ElastiCache Hands-On Lab', content: {"title":"Amazon ElastiCache Hands-On Lab","description":"Configure and test Amazon ElastiCache following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open ElastiCache Console","instruction":"AWS Console → Search \"ElastiCache\" → Open service dashboard.","expectedResult":"ElastiCache dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon ElastiCache and what problem does it solve?","shortAnswer":"Amazon ElastiCache is a managed AWS service that provides managed in-memory caching with Redis or Memcached for microsecond latency. It eliminates the need to manage Redis/Memcached servers, handle cluster scaling, implement replication.","commonMistake":"Not implementing cache invalidation strategy — stale cache data causes application bugs.","followUp":"When would you NOT use Amazon ElastiCache?"},{"difficulty":"beginner","question":"What are the key components of Amazon ElastiCache?","shortAnswer":"Cache Clusters, Replication Groups, Shards, Nodes, Parameter Groups, Subnet Groups, Global Datastore.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon ElastiCache integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon ElastiCache priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon ElastiCache costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon ElastiCache?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon ElastiCache for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon ElastiCache?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon ElastiCache achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon ElastiCache?"},{"difficulty":"intermediate","question":"Explain the Amazon ElastiCache scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon ElastiCache handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon ElastiCache?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon ElastiCache in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon ElastiCache architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon ElastiCache costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon ElastiCache?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon ElastiCache using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon ElastiCache support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon ElastiCache is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon ElastiCache from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon ElastiCache costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon ElastiCache.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon ElastiCache across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon ElastiCache API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon ElastiCache has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon ElastiCache from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon ElastiCache encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon ElastiCache are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete ElastiCache resources:</strong> Navigate to ElastiCache console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the ElastiCache console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },


    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 32: AWS PrivateLink', url: 'module-32.html' }, next: { title: 'Chapter 34: Amazon OpenSearch', url: 'module-34.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_33_DATA; } else { window.MODULE_33_DATA = MODULE_33_DATA; }
