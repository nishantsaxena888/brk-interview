/**
 * MODULE 29 — Amazon CloudFront — Content Delivery Network
 */
const MODULE_29_DATA = {
  id: 'cloudfront-fundamentals', moduleId: 'module-29',
  title: 'Amazon CloudFront — Content Delivery Network',
  description: 'Master CDN delivery. Covers distributions, origins, cache behaviors, invalidation, Lambda@Edge, Origin Access Control, signed URLs, and HTTPS/TLS configuration.',
  difficulty: 'intermediate', duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: ['Master CloudFront core concepts and architecture', 'Implement CloudFront using Boto3 and AWS CLI', 'Troubleshoot common CloudFront issues', 'Pass certification questions about CloudFront'],
  sections: [
    { id: 'why', type: 'why', title: 'Why CloudFront?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">🌐</span><div class="alert-content"><div class="alert-title">Deliver Content Globally — Sub-Second Latency</div><div class="alert-text">CloudFront caches your content at 400+ edge locations worldwide. Users get responses from the nearest edge instead of your origin server.</div></div></div>
      <table><thead><tr><th>Feature</th><th>CloudFront</th><th>S3 Direct</th><th>ALB Direct</th></tr></thead><tbody><tr><td><strong>Latency</strong></td><td>~10ms (edge)</td><td>50-200ms</td><td>50-200ms</td></tr><tr><td><strong>Caching</strong></td><td>Built-in</td><td>None</td><td>None</td></tr><tr><td><strong>DDoS</strong></td><td>Shield Standard free</td><td>Limited</td><td>Limited</td></tr><tr><td><strong>Cost</strong></td><td>$0.085/GB</td><td>$0.09/GB</td><td>$0.09/GB</td></tr></tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Always Use Origin Access Control (OAC) for S3</div><div class="alert-text">Never make your S3 bucket public. Use OAC to let CloudFront access S3 privately. OAC replaces the older Origin Access Identity (OAI).</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'CloudFront Architecture', content: { title: 'CloudFront: Client → Edge → Origin', width: 750, height: 280,
      nodes: [
          { id: 'client', label: 'Client', icon: '👤', x: 10, y: 110, type: 'client', description: 'User requesting content from nearest edge.' },
          { id: 'edge', label: 'Edge Location', icon: '🌐', x: 200, y: 110, type: 'compute', description: '400+ PoPs worldwide. Caches content based on cache behaviors.' },
          { id: 'cf', label: 'CloudFront', icon: '⚡', x: 390, y: 110, type: 'trigger', description: 'Distribution configuration: origins, behaviors, SSL, WAF.' },
          { id: 's3', label: 'S3 Origin', icon: '🪣', x: 580, y: 50, type: 'storage', description: 'Static assets (HTML, CSS, JS, images). Protected by OAC.' },
          { id: 'alb', label: 'ALB Origin', icon: '⚖️', x: 580, y: 200, type: 'compute', description: 'Dynamic API origin. CloudFront forwards requests to ALB.' }
      ],
      edges: [
          { from: 'client', to: 'edge', label: 'GET /index.html', animated: true },
          { from: 'edge', to: 'cf', label: 'Cache Miss' },
          { from: 'cf', to: 's3', label: 'Static' },
          { from: 'cf', to: 'alb', label: 'Dynamic', animated: true }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `<h4>1. Distributions</h4><p>A distribution maps a domain (d123.cloudfront.net or custom) to one or more origins with cache behaviors.</p><h4>2. Cache Behaviors</h4><table><thead><tr><th>Setting</th><th>Purpose</th></tr></thead><tbody><tr><td><strong>Path Pattern</strong></td><td>/api/* → ALB origin, /* → S3 origin</td></tr><tr><td><strong>TTL</strong></td><td>How long to cache (default 24h)</td></tr><tr><td><strong>Forwarded Headers</strong></td><td>Which headers to forward to origin</td></tr><tr><td><strong>Viewer Protocol</strong></td><td>Redirect HTTP to HTTPS</td></tr></tbody></table><h4>3. Origin Access Control (OAC)</h4><p>Allows CloudFront to access private S3 buckets. S3 bucket policy grants access only to the CloudFront distribution. Replaces deprecated OAI.</p><h4>4. Lambda@Edge</h4><p>Run Lambda functions at edge locations for: URL rewrites, A/B testing, auth at the edge, custom headers. Triggered on viewer-request, origin-request, origin-response, viewer-response events.</p>` } },
    { id: 'lambda-code', type: 'code', title: 'CloudFront Boto3 Operations', content: { title: 'CloudFront Management', languages: [
      { id: 'python-cloudfront', label: 'Core Operations',
        code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
cf = boto3.client('cloudfront')

def create_invalidation(distribution_id, paths):
    """Invalidate cached content at edge locations."""
    response = cf.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            'Paths': {'Quantity': len(paths), 'Items': paths},
            'CallerReference': str(int(__import__('time').time()))
        }
    )
    inv_id = response['Invalidation']['Id']
    logger.info("Invalidation created: %s for paths: %s", inv_id, paths)
    return inv_id


def list_distributions():
    """List all CloudFront distributions."""
    response = cf.list_distributions()
    dists = []
    for d in response.get('DistributionList', {}).get('Items', []):
        dists.append({
            'id': d['Id'],
            'domain': d['DomainName'],
            'status': d['Status'],
            'origins': [o['DomainName'] for o in d['Origins']['Items']]
        })
    return dists`,
        explanations: [
              { line: '10-16', text: 'create_invalidation removes cached content from edge locations. Use /* to invalidate everything. First 1,000 paths/month are free.' },
              { line: '24-32', text: 'list_distributions returns all CDN distributions with their origins and status.' }
        ] }
    ], defaultLang: 'python-cloudfront', expectedOutput: 'Operations completed successfully.' } },
    { id: 'cli-commands', type: 'command', title: 'CloudFront CLI Commands', content: [
        { command: 'aws cloudfront create-invalidation --distribution-id E123 --paths "/*"', category: 'aws-cli', expectedOutput: '{\n  "Invalidation": {"Id": "I123", "Status": "InProgress", "CreateTime": "2026-09-17T12:00:00Z"}\n}', explanation: 'Invalidates all cached content. Takes 5-10 minutes to propagate globally.', interviewQ: 'When would you invalidate CloudFront cache vs setting a lower TTL?' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'CloudFront CLI Lab', mode: 'simulated',
      initialText: 'CloudFront CLI Lab. Try:\n  aws cloudfront list-distributions\n  aws cloudfront get-distribution --id E123',
      commands: {
          'aws cloudfront list-distributions': { text: '{\n  "DistributionList": {"Items": [{"Id": "E123", "DomainName": "d123.cloudfront.net", "Status": "Deployed", "Origins": {"Items": [{"DomainName": "my-bucket.s3.amazonaws.com"}]}}]}\n}', type: 'output' },
          'aws cloudfront get-distribution --id E123': { text: '{\n  "Distribution": {"Id": "E123", "Status": "Deployed", "DomainName": "d123.cloudfront.net", "DistributionConfig": {"DefaultCacheBehavior": {"ViewerProtocolPolicy": "redirect-to-https"}, "Origins": {"Items": [{"DomainName": "my-bucket.s3.amazonaws.com", "OriginAccessControlId": "OAC123"}]}}}\n}', type: 'output' }
      } } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
          { title: '403 Access Denied from S3 origin', error: '403 Forbidden', cause: 'S3 bucket policy doesn\'t allow CloudFront OAC access.', fix: 'Update bucket policy: Principal=cloudfront.amazonaws.com, Condition: StringEquals aws:SourceArn to distribution ARN.' },
          { title: 'Stale content after deployment', error: 'Users see old content', cause: 'CloudFront caches content for TTL duration (default 24h).', fix: 'Create invalidation for changed paths, or use versioned filenames (app.v2.js) instead.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'CloudFront Quiz', type: 'knowledge-check', questions: [
          { id: 'q1', question: 'Best way to serve static assets globally with lowest latency?', options: [
              { id: 'a', text: 'S3 directly' },
              { id: 'b', text: 'CloudFront + S3 with OAC' },
              { id: 'c', text: 'ALB in each region' },
              { id: 'd', text: 'EC2 in each region' }
            ], correctId: 'b', explanation: 'CloudFront caches at 400+ edge locations. OAC keeps S3 private.', difficulty: 'beginner' },
          { id: 'q2', question: 'What replaced Origin Access Identity (OAI)?', options: [
              { id: 'a', text: 'IAM roles' },
              { id: 'b', text: 'Origin Access Control (OAC)' },
              { id: 'c', text: 'S3 bucket policies' },
              { id: 'd', text: 'CloudFront functions' }
            ], correctId: 'b', explanation: 'OAC supports more features: SSE-KMS, HTTP POST/PUT, all S3 regions.', difficulty: 'intermediate' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Cache Invalidation Manager', content: { title: 'Cache Invalidation Manager', description: 'Build a Lambda that invalidates CloudFront cache on S3 object updates.', difficulty: 'intermediate',
      requirements: [
          'Accept S3 event notification',
          'Extract changed object paths',
          'Create CloudFront invalidation'
      ],
      starterCode: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ncf = boto3.client('cloudfront')\n\ndef lambda_handler(event, context):\n    # TODO: Extract S3 paths from event\n    # TODO: Create CloudFront invalidation\n    pass`,
      language: 'python', hints: [
          'event[\'Records\'][0][\'s3\'][\'object\'][\'key\']',
          'cf.create_invalidation(DistributionId=..., InvalidationBatch=...)'
      ],
      testCases: [{ description: 'Implements core logic', keywords: ['boto3'], expectedOutput: 'PASS' }] } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon CloudFront Hands-On Lab', content: {"title":"Amazon CloudFront Hands-On Lab","description":"Configure and test Amazon CloudFront following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open CloudFront Console","instruction":"AWS Console → Search \"CloudFront\" → Open service dashboard.","expectedResult":"CloudFront dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon CloudFront and what problem does it solve?","shortAnswer":"Amazon CloudFront is a managed AWS service that delivers content globally with low latency through 400+ edge locations (CDN). It eliminates the need to deploy servers globally for content delivery, manage caching infrastructure.","commonMistake":"Not configuring cache policies correctly, causing low cache hit ratio.","followUp":"When would you NOT use Amazon CloudFront?"},{"difficulty":"beginner","question":"What are the key components of Amazon CloudFront?","shortAnswer":"Distributions, Origins, Behaviors, Cache Policies, Origin Request Policies, Functions, Lambda@Edge.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon CloudFront integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon CloudFront priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon CloudFront costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon CloudFront?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon CloudFront for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon CloudFront?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon CloudFront achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon CloudFront?"},{"difficulty":"intermediate","question":"Explain the Amazon CloudFront scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon CloudFront handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon CloudFront?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon CloudFront in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon CloudFront architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon CloudFront costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon CloudFront?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon CloudFront using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon CloudFront support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon CloudFront is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon CloudFront from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon CloudFront costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon CloudFront.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon CloudFront across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon CloudFront API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon CloudFront has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon CloudFront from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon CloudFront encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon CloudFront are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete CloudFront resources:</strong> Navigate to CloudFront console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the CloudFront console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },


    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 06: Amazon Route 53', url: 'module-07.html' }, next: { title: 'Chapter 08: Amazon CloudWatch', url: 'module-05.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_29_DATA; } else { window.MODULE_29_DATA = MODULE_29_DATA; }
