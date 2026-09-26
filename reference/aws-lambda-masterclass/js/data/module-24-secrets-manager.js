/**
 * ============================================================
 * MODULE 24 — AWS Secrets Manager
 * Secret storage, rotation, cross-account sharing
 * ============================================================
 */
const MODULE_24_DATA = {
  id: 'secrets-manager-fundamentals',
  moduleId: 'module-24',
  title: 'AWS Secrets Manager',
  description: 'Securely store and automatically rotate database credentials, API keys, and tokens. Covers secret versioning, rotation Lambda functions, and cross-account sharing.',
  difficulty: 'intermediate',
  duration: '60 min',
  prerequisites: ['Module 22: AWS KMS', 'Module 01: AWS IAM'],
  objectives: [
    'Store and retrieve secrets programmatically',
    'Configure automatic rotation with Lambda functions',
    'Understand secret versioning (AWSCURRENT, AWSPREVIOUS)',
    'Share secrets across accounts using resource policies',
    'Integrate Secrets Manager with RDS and Lambda'
  ],

  sections: [
    {
      id: 'why-secrets',
      type: 'why',
      title: 'Why Secrets Manager?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔑</span>
            <div class="alert-content">
              <div class="alert-title">Stop Hardcoding Credentials</div>
              <div class="alert-text">Secrets Manager replaces hardcoded credentials in your code with an API call to retrieve the secret programmatically. It encrypts secrets at rest using KMS, audits access via CloudTrail, and can automatically rotate RDS, Redshift, and DocumentDB credentials.</div>
            </div>
          </div>
          <h4>Secrets Manager vs SSM Parameter Store</h4>
          <table>
            <thead><tr><th>Feature</th><th>Secrets Manager</th><th>SSM Parameter Store</th></tr></thead>
            <tbody>
              <tr><td><strong>Auto Rotation</strong></td><td>Built-in (Lambda-based)</td><td>No built-in rotation</td></tr>
              <tr><td><strong>Cross-Account</strong></td><td>Resource-based policies</td><td>No cross-account sharing</td></tr>
              <tr><td><strong>Cost</strong></td><td>$0.40/secret/month + $0.05/10K API calls</td><td>Free (Standard) / $0.05/advanced param/month</td></tr>
              <tr><td><strong>Max Size</strong></td><td>64 KB</td><td>8 KB (Standard) / 8 KB (Advanced)</td></tr>
              <tr><td><strong>Best For</strong></td><td>DB creds, API keys that need rotation</td><td>Config values, feature flags, non-rotating secrets</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Cache Secrets — Don't Call the API on Every Request</div>
              <div class="alert-text">Each GetSecretValue call costs money and adds latency. Use the AWS Secrets Manager Caching Library (Python, Java, .NET) to cache secrets in memory with configurable TTL. Lambda functions should cache secrets outside the handler.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Secrets Manager Architecture',
      content: {
        title: 'Automatic Secret Rotation Flow',
        width: 750,
        height: 260,
        nodes: [
          { id: 'app', label: 'Lambda / App', icon: '💻', x: 10, y: 120, type: 'client', description: 'Application calls GetSecretValue to retrieve the current DB password. Uses caching library to minimize API calls.' },
          { id: 'sm', label: 'Secrets Manager', icon: '🔑', x: 220, y: 120, type: 'security', description: 'Stores encrypted secrets. Manages versioning: AWSCURRENT (active), AWSPENDING (during rotation), AWSPREVIOUS (last version).', eventPayload: { SecretId: 'prod/db/credentials', VersionStage: 'AWSCURRENT' } },
          { id: 'kms', label: 'KMS', icon: '🔐', x: 220, y: 20, type: 'security', description: 'Encrypts the secret at rest using a CMK. Decryption requires both Secrets Manager permission AND KMS decrypt permission.' },
          { id: 'rotation', label: 'Rotation Lambda', icon: '🔄', x: 430, y: 50, type: 'compute', description: 'Triggered by Secrets Manager on schedule (e.g., every 30 days). Steps: createSecret → setSecret → testSecret → finishSecret.' },
          { id: 'rds', label: 'RDS Database', icon: '🗃️', x: 640, y: 120, type: 'storage', description: 'Database whose password is being rotated. Rotation Lambda connects to RDS, changes the password, and updates the secret.' },
          { id: 'trail', label: 'CloudTrail', icon: '📋', x: 430, y: 220, type: 'trigger', description: 'Logs every GetSecretValue, PutSecretValue, and RotateSecret call. Critical for auditing who accessed which secrets.' }
        ],
        edges: [
          { from: 'app', to: 'sm', label: 'GetSecretValue', animated: true },
          { from: 'sm', to: 'kms', label: 'Decrypt' },
          { from: 'sm', to: 'rotation', label: 'Trigger rotation' },
          { from: 'rotation', to: 'rds', label: 'Change password', animated: true },
          { from: 'rotation', to: 'sm', label: 'Update secret' },
          { from: 'sm', to: 'trail', label: 'Audit log' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Secret Versioning</h4>
          <ul>
            <li><strong>AWSCURRENT</strong>: The active version used by applications</li>
            <li><strong>AWSPENDING</strong>: The new version being created during rotation</li>
            <li><strong>AWSPREVIOUS</strong>: The last successfully rotated version (rollback safety)</li>
          </ul>

          <h4>2. Rotation Steps (4-Step Lambda)</h4>
          <ol>
            <li><strong>createSecret</strong>: Generate new credentials and store as AWSPENDING</li>
            <li><strong>setSecret</strong>: Set the new credentials on the target service (e.g., ALTER USER in RDS)</li>
            <li><strong>testSecret</strong>: Verify the AWSPENDING credentials work (connect to DB)</li>
            <li><strong>finishSecret</strong>: Move AWSPENDING → AWSCURRENT and AWSCURRENT → AWSPREVIOUS</li>
          </ol>

          <h4>3. Caching</h4>
          <p>Use <code>aws-secretsmanager-caching</code> library. In Lambda, initialize the cache OUTSIDE the handler so it persists across warm invocations.</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">from aws_secretsmanager_caching import SecretCache
cache = SecretCache()  # Outside handler = cached across invocations
def handler(event, context):
    secret = cache.get_secret_string('prod/db/credentials')</pre>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Secrets Manager Boto3',
      content: {
        title: 'Store and Retrieve Secrets',
        languages: [
          {
            id: 'python-secrets',
            label: 'Secret Operations',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sm = boto3.client('secretsmanager')

def create_db_secret(secret_name, db_host, db_user, db_password, db_name):
    """Store database credentials as a secret."""
    secret_value = json.dumps({
        'host': db_host,
        'username': db_user,
        'password': db_password,
        'dbname': db_name,
        'port': 5432,
        'engine': 'postgres'
    })
    response = sm.create_secret(
        Name=secret_name,
        Description='Production database credentials',
        SecretString=secret_value,
        Tags=[
            {'Key': 'Environment', 'Value': 'production'},
            {'Key': 'RotationEnabled', 'Value': 'true'}
        ]
    )
    logger.info("Secret created: %s (ARN: %s)", secret_name, response['ARN'])
    return response['ARN']


def get_db_credentials(secret_name):
    """Retrieve database credentials from Secrets Manager."""
    response = sm.get_secret_value(SecretId=secret_name)
    secret = json.loads(response['SecretString'])
    logger.info("Retrieved credentials for: %s@%s/%s",
                secret['username'], secret['host'], secret['dbname'])
    return secret


def enable_rotation(secret_name, rotation_lambda_arn, rotation_days=30):
    """Enable automatic rotation for the secret."""
    sm.rotate_secret(
        SecretId=secret_name,
        RotationLambdaARN=rotation_lambda_arn,
        RotationRules={'AutomaticallyAfterDays': rotation_days}
    )
    logger.info("Rotation enabled for %s (every %d days)", secret_name, rotation_days)`,
            explanations: [
              { line: '12-19', text: 'Store secrets as JSON strings. Follow the standard schema (host, username, password, port, engine) so rotation Lambda functions can work generically.' },
              { line: '21-29', text: 'create_secret stores the value encrypted with the default aws/secretsmanager KMS key. Use KmsKeyId parameter to specify a CMK for cross-account decryption.' },
              { line: '36-37', text: 'get_secret_value returns the decrypted secret. In production, use the caching library instead to avoid API calls on every invocation.' },
              { line: '44-48', text: 'rotate_secret triggers the rotation Lambda immediately AND sets up the schedule. The Lambda must implement the 4-step rotation protocol.' }
            ]
          }
        ],
        defaultLang: 'python-secrets',
        expectedOutput: 'Secret created: prod/db/credentials (ARN: arn:aws:secretsmanager:...)\nRetrieved credentials for: admin@prod-db.example.com/myapp\nRotation enabled for prod/db/credentials (every 30 days)'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'Secrets Manager CLI',
      content: [
        {
          command: 'aws secretsmanager create-secret --name prod/api-key --secret-string \'{"api_key":"sk-live-abc123","api_url":"https://api.example.com"}\'',
          category: 'aws-cli',
          expectedOutput: '{\n  "ARN": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/api-key-AbCdEf",\n  "Name": "prod/api-key"\n}',
          explanation: 'Creates a new secret. The random suffix (-AbCdEf) in the ARN prevents name collisions after deletion (secrets remain for 7-30 days after deletion).'
        },
        {
          command: 'aws secretsmanager get-secret-value --secret-id prod/api-key --query SecretString --output text | python -m json.tool',
          category: 'aws-cli',
          expectedOutput: '{\n  "api_key": "sk-live-abc123",\n  "api_url": "https://api.example.com"\n}',
          explanation: 'Retrieves and pretty-prints the current secret value. Every call is logged in CloudTrail. Use --version-stage AWSPREVIOUS to get the last rotated version.',
          interviewQ: 'How do you retrieve the previous version of a rotated secret?'
        }
      ]
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Issues',
      content: {
        items: [
          { title: 'Rotation fails with "unable to connect to database"', error: 'Rotation Lambda: Unable to connect to PostgreSQL on host prod-db.example.com:5432', cause: 'The rotation Lambda function runs in a VPC but cannot reach the RDS instance. Missing security group rules or no route to the database subnet.', fix: 'Ensure the rotation Lambda is in the SAME VPC as RDS. Add a security group rule allowing the Lambda SG to connect to the RDS SG on port 5432. Also add a VPC endpoint for Secrets Manager (so Lambda can call back to SM).' },
          { title: 'Application gets old password after rotation', error: 'Authentication failed for user "admin"', cause: 'Application is caching the old password. Or the rotation Lambda succeeded on setSecret but the application did not refresh.', fix: 'Use the Secrets Manager Caching Library with a TTL shorter than your rotation interval. Or add a retry-with-AWSPREVIOUS fallback in your connection logic.' },
          { title: 'AccessDeniedException on GetSecretValue', error: 'AccessDeniedException: Not authorized to perform secretsmanager:GetSecretValue', cause: 'Missing IAM permission OR the secret is encrypted with a CMK and the caller lacks kms:Decrypt permission on that key.', fix: 'Grant both: secretsmanager:GetSecretValue on the secret ARN AND kms:Decrypt on the KMS key ARN used to encrypt the secret.' }
        ]
      }
    },

        {
      id: 'terminal-generic',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'AWS Secrets Manager CLI Lab',
        mode: 'simulated',
        initialText: 'AWS Secrets Manager CLI Lab. Try exploring the AWS CLI commands for this service.',
        commands: {
          'aws help': {
            text: 'See AWS CLI documentation for AWS Secrets Manager commands.',
            type: 'output'
          }
        }
      }
    },
{
      id: 'quiz-secrets',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Secrets Manager Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your RDS database password is stored in Secrets Manager with automatic rotation every 30 days. After rotation, your application fails to connect. What is the most likely cause?',
            options: [
              { id: 'a', text: 'The rotation deleted the old secret' },
              { id: 'b', text: 'The application cached the old password and is not refreshing it' },
              { id: 'c', text: 'RDS does not support Secrets Manager rotation' },
              { id: 'd', text: 'The KMS key expired' }
            ],
            correctId: 'b',
            explanation: 'The most common rotation failure: the application caches credentials and does not refresh after rotation. Solution: use the Secrets Manager Caching Library with a TTL (e.g., 1 hour). Also implement retry logic that falls back to AWSPREVIOUS version on auth failure.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'When should you use Secrets Manager instead of SSM Parameter Store SecureString?',
            options: [
              { id: 'a', text: 'When you need automatic credential rotation' },
              { id: 'b', text: 'When you want to store feature flags' },
              { id: 'c', text: 'When the value is less than 4 KB' },
              { id: 'd', text: 'When you need free storage' }
            ],
            correctId: 'a',
            explanation: 'Secrets Manager is designed for secrets that need automatic rotation (DB passwords, API keys). SSM Parameter Store is better for configuration values, feature flags, and non-rotating secrets. The key differentiator is the built-in rotation Lambda framework.',
            difficulty: 'beginner'
          }
        ]
      }
    },

        {
      id: 'challenge-generic',
      type: 'challenge',
      title: 'Challenge: AWS Secrets Manager Security Pipeline',
      content: {
        title: 'Build a AWS Secrets Manager Security Gate',
        description: 'Write a Lambda function that interacts with AWS Secrets Manager and validates its security configuration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept input related to AWS Secrets Manager',
          'Call the appropriate boto3 method',
          'Validate the configuration',
          'Return PASS/FAIL status'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

client = boto3.client('sts') # Change this to the correct service

def lambda_handler(event, context):
    # TODO: Implement validation
    pass`,
        language: 'python',
        hints: [
          'Check the boto3 documentation for AWS Secrets Manager',
          'Ensure IAM permissions are correct'
        ],
        testCases: [
          { description: 'Validates configuration', keywords: ['boto3'], expectedOutput: 'PASS' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS Secrets Manager Hands-On Lab', content: {"title":"AWS Secrets Manager Hands-On Lab","description":"Configure and test AWS Secrets Manager following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open Secrets Manager Console","instruction":"AWS Console → Search \"Secrets Manager\" → Open service dashboard.","expectedResult":"Secrets Manager dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS Secrets Manager and what problem does it solve?","shortAnswer":"AWS Secrets Manager is a managed AWS service that stores, rotates, and retrieves database credentials, API keys, and other secrets. It eliminates the need to hardcode secrets in code, manage rotation scripts, and build secret stores.","commonMistake":"Hardcoding secrets in application code or environment variables instead of using Secrets Manager.","followUp":"When would you NOT use AWS Secrets Manager?"},{"difficulty":"beginner","question":"What are the key components of AWS Secrets Manager?","shortAnswer":"Secrets, Rotation, Resource Policies, Cross-Account Sharing, Caching, Lambda Rotation Functions.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS Secrets Manager integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS Secrets Manager priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS Secrets Manager costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS Secrets Manager?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS Secrets Manager for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS Secrets Manager?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS Secrets Manager achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS Secrets Manager?"},{"difficulty":"intermediate","question":"Explain the AWS Secrets Manager scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS Secrets Manager handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS Secrets Manager?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS Secrets Manager in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS Secrets Manager architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS Secrets Manager costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS Secrets Manager?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS Secrets Manager using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS Secrets Manager support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS Secrets Manager is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS Secrets Manager from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS Secrets Manager costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS Secrets Manager.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS Secrets Manager across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS Secrets Manager API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS Secrets Manager has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS Secrets Manager from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS Secrets Manager encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS Secrets Manager are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete Secrets Manager resources:</strong> Navigate to Secrets Manager console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the Secrets Manager console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },


    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 11: AWS KMS', url: 'module-22.html' }, next: { title: 'Chapter 13: AWS STS', url: 'module-23.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_24_DATA; } else { window.MODULE_24_DATA = MODULE_24_DATA; }
