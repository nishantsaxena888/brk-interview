/**
 * ============================================================
 * MODULE 23 — AWS STS (Security Token Service)
 * Temporary credentials, assuming roles, federation
 * ============================================================
 */
const MODULE_23_DATA = {
  id: 'sts-fundamentals',
  moduleId: 'module-23',
  title: 'AWS STS — Security Token Service',
  description: 'Master temporary credentials on AWS. Covers AssumeRole, cross-account access, web identity federation, session policies, and external ID for third-party access.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: [
    'Understand how STS provides temporary security credentials',
    'Use AssumeRole for cross-account access patterns',
    'Implement web identity federation with Cognito',
    'Apply session policies to scope down permissions',
    'Use external IDs to prevent confused deputy attacks'
  ],

  sections: [
    {
      id: 'why-sts',
      type: 'why',
      title: 'Why STS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🎫</span>
            <div class="alert-content">
              <div class="alert-title">Temporary Credentials — The Foundation of AWS Security</div>
              <div class="alert-text">STS issues temporary, limited-privilege credentials (access key + secret key + session token) that automatically expire. Every time a Lambda function runs, an EC2 instance uses a role, or a user assumes a role — STS is behind the scenes.</div>
            </div>
          </div>
          <h4>STS API Operations</h4>
          <table>
            <thead><tr><th>API</th><th>Who Calls It</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>AssumeRole</strong></td><td>IAM users, roles, services</td><td>Cross-account access, privilege escalation, role chaining</td></tr>
              <tr><td><strong>AssumeRoleWithWebIdentity</strong></td><td>Mobile/web apps</td><td>Login with Google, Facebook, or any OIDC provider</td></tr>
              <tr><td><strong>AssumeRoleWithSAML</strong></td><td>Enterprise SSO</td><td>Active Directory federation, SAML 2.0 IdP</td></tr>
              <tr><td><strong>GetSessionToken</strong></td><td>IAM users</td><td>MFA-protected API access from CLI</td></tr>
              <tr><td><strong>GetCallerIdentity</strong></td><td>Anyone</td><td>Debug: "Who am I?" — returns account, ARN, user ID</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Role Chaining Limits Duration to 1 Hour</div>
              <div class="alert-text">When a role assumes another role (role chaining), the maximum session duration is capped at <strong>1 hour</strong> regardless of the role's configured max session duration. This is a common gotcha in multi-account architectures.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Cross-Account AssumeRole',
      content: {
        title: 'Cross-Account Access Pattern with STS',
        width: 750,
        height: 260,
        nodes: [
          { id: 'dev', label: 'Dev Account (111)', icon: '👨‍💻', x: 10, y: 120, type: 'client', description: 'Developer or automation in Account A wants to access resources in Account B.' },
          { id: 'sts', label: 'AWS STS', icon: '🎫', x: 220, y: 120, type: 'security', description: 'STS validates the trust policy on the target role, generates temporary credentials (access key + secret key + session token), valid for 1-12 hours.' },
          { id: 'role', label: 'Cross-Account Role', icon: '🔑', x: 430, y: 50, type: 'security', description: 'IAM role in Account B with a trust policy allowing Account A to assume it. The role has permissions policies attached.' },
          { id: 'resources', label: 'Prod Resources', icon: '🗄️', x: 640, y: 50, type: 'storage', description: 'S3 buckets, DynamoDB tables, Lambda functions in Account B that the cross-account role can access.' },
          { id: 'trail', label: 'CloudTrail', icon: '📋', x: 430, y: 210, type: 'trigger', description: 'AssumeRole call logged in BOTH accounts. Shows who assumed what role, when, and from which source IP.' }
        ],
        edges: [
          { from: 'dev', to: 'sts', label: 'sts:AssumeRole', animated: true },
          { from: 'sts', to: 'role', label: 'Validate trust policy' },
          { from: 'sts', to: 'dev', label: 'Temp credentials' },
          { from: 'dev', to: 'resources', label: 'Access with temp creds', animated: true },
          { from: 'sts', to: 'trail', label: 'Audit log' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Trust Policy vs Permissions Policy</h4>
          <ul>
            <li><strong>Trust Policy</strong>: Attached to the ROLE. Defines WHO can assume this role (principals).</li>
            <li><strong>Permissions Policy</strong>: Attached to the ROLE. Defines WHAT the assumed role can do (actions on resources).</li>
          </ul>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">// Trust Policy — WHO can assume
{
  "Principal": {"AWS": "arn:aws:iam::111111111111:root"},
  "Action": "sts:AssumeRole",
  "Condition": {"StringEquals": {"sts:ExternalId": "my-secret-id"}}
}

// Permissions Policy — WHAT they can do
{
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": "arn:aws:s3:::prod-data-bucket/*"
}</pre>

          <h4>2. External ID (Confused Deputy Prevention)</h4>
          <p>When a third-party service assumes a role in your account, an external ID prevents another customer from tricking the service into accessing YOUR resources. Always require ExternalId in trust policies for third-party access.</p>

          <h4>3. Session Policies</h4>
          <p>Optional JSON policy passed during AssumeRole that further restricts (never expands) the assumed role's permissions for that specific session.</p>

          <h4>4. Credential Expiration</h4>
          <table>
            <thead><tr><th>Scenario</th><th>Default Duration</th><th>Max Duration</th></tr></thead>
            <tbody>
              <tr><td>AssumeRole (direct)</td><td>1 hour</td><td>12 hours (configurable)</td></tr>
              <tr><td>Role Chaining</td><td>1 hour</td><td>1 hour (hard limit)</td></tr>
              <tr><td>Web Identity / SAML</td><td>1 hour</td><td>12 hours</td></tr>
              <tr><td>GetSessionToken</td><td>12 hours</td><td>36 hours</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'STS Boto3 Operations',
      content: {
        title: 'Cross-Account Access with STS',
        languages: [
          {
            id: 'python-sts',
            label: 'AssumeRole Pattern',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sts = boto3.client('sts')

def get_caller_identity():
    """Check current identity (debug helper)."""
    response = sts.get_caller_identity()
    logger.info("Account: %s, ARN: %s", response['Account'], response['Arn'])
    return response


def assume_cross_account_role(role_arn, session_name, external_id=None):
    """Assume a role in another AWS account."""
    params = {
        'RoleArn': role_arn,
        'RoleSessionName': session_name,
        'DurationSeconds': 3600  # 1 hour
    }
    if external_id:
        params['ExternalId'] = external_id

    response = sts.assume_role(**params)
    credentials = response['Credentials']

    logger.info("Assumed role: %s (expires: %s)",
                response['AssumedRoleUser']['Arn'],
                credentials['Expiration'])

    # Create a new boto3 session with temporary credentials
    session = boto3.Session(
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken']
    )
    return session


def list_prod_s3_buckets():
    """Example: List S3 buckets in the production account."""
    prod_session = assume_cross_account_role(
        role_arn='arn:aws:iam::222222222222:role/ProdReadOnly',
        session_name='dev-audit-session',
        external_id='unique-external-id-12345'
    )

    s3 = prod_session.client('s3')
    buckets = s3.list_buckets()['Buckets']
    for b in buckets:
        logger.info("Prod bucket: %s", b['Name'])
    return buckets`,
            explanations: [
              { line: '10-13', text: 'GetCallerIdentity is the AWS equivalent of "whoami". Always call this first when debugging permission issues to verify which identity is making the API call.' },
              { line: '19-27', text: 'AssumeRole parameters: RoleArn (target role), RoleSessionName (appears in CloudTrail for auditing), ExternalId (confused deputy prevention for third-party access).' },
              { line: '35-39', text: 'Create a NEW boto3 Session using the temporary credentials. All clients created from this session will use the assumed role permissions.' },
              { line: '48-50', text: 'Real-world pattern: assume a read-only role in the production account from a dev/automation account. External ID ensures only your service can assume the role.' }
            ]
          }
        ],
        defaultLang: 'python-sts',
        expectedOutput: 'Account: 111111111111, ARN: arn:aws:iam::111111111111:user/dev-user\nAssumed role: arn:aws:sts::222222222222:assumed-role/ProdReadOnly/dev-audit-session\nProd bucket: prod-data-bucket'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'STS CLI Commands',
      content: [
        {
          command: 'aws sts get-caller-identity',
          category: 'aws-cli',
          expectedOutput: '{\n  "UserId": "AIDACKCEVSQ6C2EXAMPLE",\n  "Account": "123456789012",\n  "Arn": "arn:aws:iam::123456789012:user/dev-user"\n}',
          explanation: 'The "whoami" of AWS. Shows which identity is making API calls. Works even with assumed roles (shows the assumed role ARN). Always your first debugging step.',
          interviewQ: 'How do you determine which IAM identity is making API calls in your current terminal session?'
        },
        {
          command: 'aws sts assume-role --role-arn arn:aws:iam::222222222222:role/ProdReadOnly --role-session-name my-session --external-id unique-id-123',
          category: 'aws-cli',
          expectedOutput: '{\n  "Credentials": {\n    "AccessKeyId": "ASIAIOSFODNN7EXAMPLE",\n    "SecretAccessKey": "wJalrXUtnFEMI...",\n    "SessionToken": "FwoGZXIvYXdzE...",\n    "Expiration": "2026-09-16T17:00:00Z"\n  }\n}',
          explanation: 'Returns temporary credentials. Export them as AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_SESSION_TOKEN environment variables to use in subsequent CLI commands.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'STS CLI Lab',
        mode: 'simulated',
        initialText: 'STS CLI Lab. Try:\n  aws sts get-caller-identity\n  aws sts decode-authorization-message --encoded-message <message>',
        commands: {
          'aws sts get-caller-identity': {
            text: '{\n  "UserId": "AIDACKCEVSQ6C2EXAMPLE",\n  "Account": "123456789012",\n  "Arn": "arn:aws:iam::123456789012:user/dev-user"\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common STS Issues',
      content: {
        items: [
          { title: 'AccessDenied when assuming role', error: 'AccessDenied: User is not authorized to perform sts:AssumeRole', cause: 'Either the trust policy on the target role does not allow the calling principal, OR the calling principal does not have sts:AssumeRole permission in their IAM policy.', fix: 'Check BOTH: (1) Trust policy on the target role allows the source principal, (2) Source principal has sts:AssumeRole on the target role ARN. Also check for condition keys like ExternalId.' },
          { title: 'Role chaining duration error', error: 'DurationSeconds exceeds the MaxSessionDuration for role chaining', cause: 'Role chaining (Role A assumes Role B) has a hard limit of 1 hour. You cannot extend this.', fix: 'Redesign to avoid role chaining. Have the original principal assume the final role directly. Or use separate sessions.' },
          { title: 'Confused deputy attack', error: 'Third-party service accessing wrong customer resources', cause: 'Trust policy without ExternalId condition allows any customer of the third-party service to trick it into assuming your role.', fix: 'Always require ExternalId in trust policies for third-party access. The third party provides a unique ExternalId per customer.' }
        ]
      }
    },

    {
      id: 'quiz-sts',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS STS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'A Lambda function in Account A needs to write to a DynamoDB table in Account B. What is the recommended approach?',
            options: [
              { id: 'a', text: 'Create an IAM user in Account B and hardcode credentials in the Lambda' },
              { id: 'b', text: 'Create a cross-account IAM role in Account B, have the Lambda assume it via STS' },
              { id: 'c', text: 'Make the DynamoDB table public' },
              { id: 'd', text: 'Use VPC peering between the accounts' }
            ],
            correctId: 'b',
            explanation: 'Cross-account IAM roles are the standard pattern. Create a role in Account B with a trust policy allowing Account A\'s Lambda execution role. The Lambda calls sts:AssumeRole, gets temporary credentials, and uses them to write to DynamoDB. Never hardcode credentials.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What is the purpose of the ExternalId condition in an IAM trust policy?',
            options: [
              { id: 'a', text: 'It provides an additional password for assuming the role' },
              { id: 'b', text: 'It prevents confused deputy attacks when granting cross-account access to third parties' },
              { id: 'c', text: 'It encrypts the temporary credentials' },
              { id: 'd', text: 'It extends the maximum session duration' }
            ],
            correctId: 'b',
            explanation: 'ExternalId is a unique string that prevents the confused deputy problem. Without it, a malicious third-party customer could trick the service into assuming YOUR role. The ExternalId must match what the third party passes during AssumeRole.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

        {
      id: 'challenge-generic',
      type: 'challenge',
      title: 'Challenge: AWS STS Security Pipeline',
      content: {
        title: 'Build a AWS STS Security Gate',
        description: 'Write a Lambda function that interacts with AWS STS and validates its security configuration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept input related to AWS STS',
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
          'Check the boto3 documentation for AWS STS',
          'Ensure IAM permissions are correct'
        ],
        testCases: [
          { description: 'Validates configuration', keywords: ['boto3'], expectedOutput: 'PASS' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS STS Hands-On Lab', content: {"title":"AWS STS Hands-On Lab","description":"Configure and test AWS STS following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open STS Console","instruction":"AWS Console → Search \"STS\" → Open service dashboard.","expectedResult":"STS dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS STS and what problem does it solve?","shortAnswer":"AWS STS is a managed AWS service that provides temporary security credentials for cross-account access, federation, and role assumption. It eliminates the need to manage long-lived credentials, build federation infrastructure.","commonMistake":"Not understanding session duration limits and credential refresh requirements.","followUp":"When would you NOT use AWS STS?"},{"difficulty":"beginner","question":"What are the key components of AWS STS?","shortAnswer":"AssumeRole, AssumeRoleWithSAML, AssumeRoleWithWebIdentity, GetSessionToken, GetFederationToken.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS STS integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS STS priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS STS costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS STS?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS STS for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS STS?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS STS achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS STS?"},{"difficulty":"intermediate","question":"Explain the AWS STS scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS STS handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS STS?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS STS in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS STS architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS STS costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS STS?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS STS using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS STS support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS STS is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS STS from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS STS costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS STS.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS STS across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS STS API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS STS has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS STS from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS STS encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS STS are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete STS resources:</strong> Navigate to STS console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the STS console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },


    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 12: AWS Secrets Manager', url: 'module-24.html' }, next: { title: 'Chapter 14: AWS Systems Manager', url: 'module-25.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_23_DATA; } else { window.MODULE_23_DATA = MODULE_23_DATA; }
