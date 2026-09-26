/**
 * ============================================================
 * MODULE 26 — AWS CloudTrail
 * API audit logging, trails, event selectors, forensics
 * ============================================================
 */
const MODULE_26_DATA = {
  id: 'cloudtrail-fundamentals',
  moduleId: 'module-26',
  title: 'AWS CloudTrail — API Audit Logging',
  description: 'Master API auditing. Covers trails, management vs data events, organization trails, log file validation, CloudWatch integration, Athena queries, and security incident investigation.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 02: Amazon S3'],
  objectives: [
    'Create multi-region trails for comprehensive API auditing',
    'Differentiate management events, data events, and Insights',
    'Configure S3 log delivery with encryption and validation',
    'Integrate with CloudWatch Logs for real-time alerting',
    'Investigate security incidents using lookup_events',
    'Set up organization trails for multi-account logging'
  ],

  sections: [
    { id: 'why-cloudtrail', type: 'why', title: 'Why CloudTrail?',
      content: { html: `
        <div class="alert alert-info"><span class="alert-icon">📋</span><div class="alert-content"><div class="alert-title">Who Did What, When, and From Where — Every API Call Logged</div><div class="alert-text">CloudTrail records every API call: who made it, what action, which resources, from what IP, and when. It is the foundation for security auditing, compliance, and incident investigation.</div></div></div>
        <table><thead><tr><th>Feature</th><th>Event History</th><th>Trail (S3)</th></tr></thead><tbody>
          <tr><td><strong>Retention</strong></td><td>90 days</td><td>Unlimited (S3 lifecycle)</td></tr>
          <tr><td><strong>Event Types</strong></td><td>Management only</td><td>Management + Data + Insights</td></tr>
          <tr><td><strong>Search</strong></td><td>Console lookup</td><td>Athena SQL queries</td></tr>
          <tr><td><strong>Cost</strong></td><td>Free</td><td>First trail free, $2/100K data events</td></tr>
        </tbody></table>
        <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Event History is Only 90 Days</div><div class="alert-text">The free Event History shows 90 days of management events. For long-term retention, compliance, and data events, you MUST create a trail delivering to S3.</div></div></div>
      ` } },

    { id: 'architecture', type: 'architecture', title: 'CloudTrail Architecture',
      content: { title: 'API Call → Trail → S3 → Analysis', width: 750, height: 280,
        nodes: [
          { id: 'caller', label: 'API Caller', icon: '👤', x: 10, y: 110, type: 'client', description: 'Any entity making AWS API calls: Console user, CLI, SDK, or AWS service.' },
          { id: 'ct', label: 'CloudTrail', icon: '📋', x: 180, y: 110, type: 'security', description: 'Captures API call metadata. Delivers events to S3 and optionally CloudWatch Logs.' },
          { id: 's3', label: 'S3 Bucket', icon: '🪣', x: 380, y: 50, type: 'storage', description: 'Gzipped JSON log files. Enable SSE-KMS encryption and log file validation.' },
          { id: 'cw', label: 'CloudWatch Logs', icon: '📊', x: 380, y: 200, type: 'storage', description: 'Real-time streaming. Create metric filters and alarms for security alerts.' },
          { id: 'athena', label: 'Athena', icon: '🔍', x: 570, y: 110, type: 'compute', description: 'SQL queries on CloudTrail logs. Find all API calls from a specific IP or user.' }
        ],
        edges: [
          { from: 'caller', to: 'ct', label: 'API Call', animated: true },
          { from: 'ct', to: 's3', label: 'Deliver', animated: true },
          { from: 'ct', to: 'cw', label: 'Stream', animated: true },
          { from: 's3', to: 'athena', label: 'Query' }
        ]
      } },

    { id: 'concepts', type: 'concept', title: 'Core Concepts',
      content: { html: `
        <h4>1. Event Types</h4>
        <table><thead><tr><th>Type</th><th>What</th><th>Example</th><th>Cost</th></tr></thead><tbody>
          <tr><td><strong>Management</strong></td><td>Control plane operations</td><td>CreateBucket, RunInstances</td><td>First trail free</td></tr>
          <tr><td><strong>Data</strong></td><td>Data plane operations</td><td>GetObject, PutObject, Invoke</td><td>$2/100K events</td></tr>
          <tr><td><strong>Insights</strong></td><td>Anomaly detection</td><td>Unusual API call volume</td><td>$0.35/100K analyzed</td></tr>
        </tbody></table>
        <h4>2. Event Structure</h4>
        <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{
  "eventName": "StopInstances",
  "eventSource": "ec2.amazonaws.com",
  "userIdentity": {
    "type": "IAMUser",
    "userName": "admin-bob"
  },
  "sourceIPAddress": "203.0.113.50",
  "requestParameters": { "instancesSet": { "items": [{"instanceId": "i-abc123"}] } }
}</pre>
        <h4>3. Log File Validation</h4>
        <p>CloudTrail creates SHA-256 digest files hourly. Use <code>aws cloudtrail validate-logs</code> to verify no files have been tampered with. Essential for forensics and compliance.</p>
        <h4>4. Organization Trail</h4>
        <p>Single trail logging ALL accounts in an AWS Organization. Logs delivered to a central S3 bucket. Only the management account can create org trails.</p>
      ` } },

    { id: 'lambda-code', type: 'code', title: 'CloudTrail Boto3 Operations',
      content: { title: 'Trail & Event Management', languages: [
        { id: 'python-cloudtrail', label: 'Create Trail & Investigate',
          code: `import boto3
import json
import logging
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ct = boto3.client('cloudtrail')

def create_secure_trail(trail_name, bucket_name, kms_key_id=None):
    """Create a multi-region trail with security best practices."""
    kwargs = {
        'Name': trail_name,
        'S3BucketName': bucket_name,
        'IsMultiRegionTrail': True,
        'EnableLogFileValidation': True,
        'IncludeGlobalServiceEvents': True,
    }
    if kms_key_id:
        kwargs['KmsKeyId'] = kms_key_id
    trail = ct.create_trail(**kwargs)
    ct.start_logging(Name=trail_name)
    logger.info("Trail created and started: %s", trail['TrailARN'])
    return trail['TrailARN']


def lookup_root_logins(hours=24):
    """Find root account console logins in the last N hours."""
    start = datetime.utcnow() - timedelta(hours=hours)
    events = []
    paginator = ct.get_paginator('lookup_events')
    for page in paginator.paginate(
        LookupAttributes=[{
            'AttributeKey': 'EventName',
            'AttributeValue': 'ConsoleLogin'
        }],
        StartTime=start
    ):
        for event in page['Events']:
            data = json.loads(event['CloudTrailEvent'])
            if data.get('userIdentity', {}).get('type') == 'Root':
                events.append({
                    'time': str(event['EventTime']),
                    'ip': data.get('sourceIPAddress'),
                    'mfa': data.get('additionalEventData', {}).get('MFAUsed')
                })
                logger.warning("ROOT LOGIN from %s", data.get('sourceIPAddress'))
    return events`,
          explanations: [
            { line: '16', text: 'IsMultiRegionTrail=True logs API calls from ALL regions. Critical because attackers may use different regions.' },
            { line: '17', text: 'EnableLogFileValidation creates hourly SHA-256 digest files for tamper detection.' },
            { line: '33-38', text: 'lookup_events searches the 90-day event history. Filter by EventName, Username, ResourceType, or EventSource.' }
          ] }
      ], defaultLang: 'python-cloudtrail', expectedOutput: 'Trail created and started: arn:aws:cloudtrail:us-east-1:123456789012:trail/prod-trail' } },

    { id: 'cli-commands', type: 'command', title: 'CloudTrail CLI Commands',
      content: [
        { command: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=ConsoleLogin --max-results 5',
          category: 'aws-cli', expectedOutput: '{\n  "Events": [{\n    "EventName": "ConsoleLogin",\n    "Username": "admin-bob",\n    "EventTime": "2026-09-17T10:30:00Z"\n  }]\n}',
          explanation: 'Looks up console logins for incident investigation.', interviewQ: 'How would you find who deleted an S3 bucket using CloudTrail?' },
        { command: 'aws cloudtrail get-trail-status --name production-trail',
          category: 'aws-cli', expectedOutput: '{\n  "IsLogging": true,\n  "LatestDeliveryTime": "2026-09-17T12:00:00Z",\n  "StartLoggingTime": "2026-01-15T10:00:00Z"\n}',
          explanation: 'Checks if trail is actively logging. IsLogging=false is a security incident.' }
      ] },

    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal',
      content: { title: 'CloudTrail CLI Lab', mode: 'simulated',
        initialText: 'CloudTrail CLI Lab. Try:\n  aws cloudtrail describe-trails\n  aws cloudtrail lookup-events --max-results 3',
        commands: {
          'aws cloudtrail describe-trails': { text: '{\n  "trailList": [{\n    "Name": "production-trail",\n    "S3BucketName": "cloudtrail-logs",\n    "IsMultiRegionTrail": true,\n    "LogFileValidationEnabled": true\n  }]\n}', type: 'output' },
          'aws cloudtrail lookup-events --max-results 3': { text: '{\n  "Events": [\n    {"EventName": "DescribeInstances", "Username": "alice", "EventTime": "2026-09-17T11:55:00Z"},\n    {"EventName": "AssumeRole", "Username": "ci-deploy", "EventTime": "2026-09-17T11:50:00Z"},\n    {"EventName": "GetObject", "Username": "bob", "EventTime": "2026-09-17T11:45:00Z"}\n  ]\n}', type: 'output' }
        } } },

    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues',
      content: { items: [
        { title: 'Trail stopped logging', error: 'IsLogging: false on get-trail-status', cause: 'Someone called StopLogging — possibly an attacker covering tracks.', fix: 'Restart immediately. Create CloudWatch alarm on StopLogging. Use SCP to deny cloudtrail:StopLogging.' },
        { title: 'Log delivery failing', error: 'LatestDeliveryError: Access Denied', cause: 'S3 bucket policy missing CloudTrail write permission.', fix: 'Update bucket policy to allow cloudtrail.amazonaws.com PutObject.' },
        { title: 'Data events not appearing', error: 'No S3 GetObject events found', cause: 'Data events not enabled by default.', fix: 'Configure event selectors with DataResources for S3/Lambda.' }
      ] } },

    { id: 'quiz', type: 'quiz', title: 'Knowledge Check',
      content: { title: 'CloudTrail Quiz', type: 'knowledge-check', questions: [
        { id: 'q1', question: 'Your company requires 7-year API audit retention. What approach?',
          options: [{ id: 'a', text: 'Use Event History (90 days)' }, { id: 'b', text: 'Trail to S3 with 7-year lifecycle policy' }, { id: 'c', text: 'Export logs weekly' }, { id: 'd', text: 'CloudWatch Logs 7-year retention' }],
          correctId: 'b', explanation: 'Event History only keeps 90 days. Trail to S3 with lifecycle (Glacier after 90d) is most cost-effective.', difficulty: 'intermediate' },
        { id: 'q2', question: 'S3 GetObject is what type of CloudTrail event?',
          options: [{ id: 'a', text: 'Management event' }, { id: 'b', text: 'Data event' }, { id: 'c', text: 'Insight event' }, { id: 'd', text: 'Global event' }],
          correctId: 'b', explanation: 'S3 GetObject/PutObject are data events. Not logged by default — must enable data event selectors.', difficulty: 'beginner' },
        { id: 'q3', question: 'Someone stopped your CloudTrail. How to prevent this?',
          options: [{ id: 'a', text: 'IAM policies' }, { id: 'b', text: 'SCP deny StopLogging' }, { id: 'c', text: 'CloudWatch alarm' }, { id: 'd', text: 'All of the above' }],
          correctId: 'd', explanation: 'Defense in depth: IAM restricts, SCP prevents, CloudWatch detects.', difficulty: 'advanced' }
      ] } },

    { id: 'challenge', type: 'challenge', title: 'Challenge: Security Auditor',
      content: { title: 'Build a CloudTrail Security Auditor', description: 'Scan CloudTrail for root logins, IAM changes, and security group modifications.', difficulty: 'intermediate',
        requirements: ['Look up events for last 24 hours', 'Filter security-relevant events', 'Flag root usage as CRITICAL', 'Return categorized report'],
        starterCode: `import boto3\nimport json\nimport logging\nfrom datetime import datetime, timedelta\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nct = boto3.client('cloudtrail')\n\ndef lambda_handler(event, context):\n    # TODO: Look up events from last 24 hours\n    # TODO: Categorize security events\n    # TODO: Return report\n    pass`,
        language: 'python', hints: ['ct.lookup_events(StartTime=...)', 'Check userIdentity type for Root', 'Group by EventName'],
        testCases: [{ description: 'Uses lookup_events', keywords: ['lookup_events'], expectedOutput: 'events' }] } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS CloudTrail Hands-On Lab', content: {"title":"AWS CloudTrail Hands-On Lab","description":"Configure and test AWS CloudTrail following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open CloudTrail Console","instruction":"AWS Console → Search \"CloudTrail\" → Open service dashboard.","expectedResult":"CloudTrail dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS CloudTrail and what problem does it solve?","shortAnswer":"AWS CloudTrail is a managed AWS service that logs all AWS API calls for governance, compliance, and security auditing. It eliminates the need to build custom API logging, manage audit trails.","commonMistake":"Not enabling CloudTrail in all regions — security events can happen in any region.","followUp":"When would you NOT use AWS CloudTrail?"},{"difficulty":"beginner","question":"What are the key components of AWS CloudTrail?","shortAnswer":"Trails, Events, Insights, Event History, CloudTrail Lake, Organization Trail, S3 Data Events.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS CloudTrail integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS CloudTrail priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS CloudTrail costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS CloudTrail?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS CloudTrail for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS CloudTrail?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS CloudTrail achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS CloudTrail?"},{"difficulty":"intermediate","question":"Explain the AWS CloudTrail scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS CloudTrail handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS CloudTrail?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS CloudTrail in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS CloudTrail architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS CloudTrail costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS CloudTrail?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS CloudTrail using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS CloudTrail support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS CloudTrail is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS CloudTrail from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS CloudTrail costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS CloudTrail.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS CloudTrail across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS CloudTrail API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS CloudTrail has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS CloudTrail from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS CloudTrail encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS CloudTrail are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete CloudTrail resources:</strong> Navigate to CloudTrail console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the CloudTrail console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 08: Amazon CloudWatch', url: 'module-05.html' }, next: { title: 'Chapter 10: Amazon RDS', url: 'module-06.html' } } }
  ]
};
if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_26_DATA; } else { window.MODULE_26_DATA = MODULE_26_DATA; }
