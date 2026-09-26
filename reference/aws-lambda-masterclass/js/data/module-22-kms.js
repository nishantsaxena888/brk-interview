/**
 * ============================================================
 * MODULE 22 — AWS KMS (Key Management Service)
 * Encryption keys, envelope encryption, key policies
 * ============================================================
 */
const MODULE_22_DATA = {
  id: 'kms-fundamentals',
  moduleId: 'module-22',
  title: 'AWS KMS — Key Management Service',
  description: 'Master encryption on AWS. Covers CMKs, envelope encryption, key policies, grants, key rotation, and integration with S3, EBS, RDS, and Lambda.',
  difficulty: 'intermediate',
  duration: '75 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: [
    'Understand symmetric vs asymmetric KMS keys',
    'Implement envelope encryption for large data sets',
    'Write key policies with least-privilege access',
    'Configure automatic key rotation',
    'Integrate KMS with S3, EBS, RDS, and Lambda',
    'Audit key usage via CloudTrail'
  ],

  sections: [
    {
      id: 'why-kms',
      type: 'why',
      title: 'Why KMS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔐</span>
            <div class="alert-content">
              <div class="alert-title">The Bank Vault Key Custodian for AWS</div>
              <div class="alert-text">AWS KMS is a fully managed service that makes it easy to create and control the cryptographic keys used to protect your data. KMS keys never leave KMS unencrypted — the hardware security modules (HSMs) are FIPS 140-2 Level 3 validated.</div>
            </div>
          </div>
          <h4>Types of KMS Keys</h4>
          <table>
            <thead><tr><th>Type</th><th>Management</th><th>Rotation</th><th>Cost</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>AWS Owned</strong></td><td>AWS manages</td><td>Varies</td><td>Free</td><td>Default encryption (S3-SSE, DynamoDB)</td></tr>
              <tr><td><strong>AWS Managed</strong></td><td>AWS creates, you can't manage</td><td>Every year (auto)</td><td>Free</td><td>aws/s3, aws/ebs, aws/rds keys</td></tr>
              <tr><td><strong>Customer Managed (CMK)</strong></td><td>You create & control</td><td>Configurable (annual)</td><td>$1/month + API calls</td><td>Custom policies, cross-account, audit</td></tr>
              <tr><td><strong>Imported Key Material</strong></td><td>You provide key material</td><td>Manual only</td><td>$1/month + API calls</td><td>Regulatory requirements, BYOK</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Deleting a KMS Key is Irreversible</div>
              <div class="alert-text">Deleting a CMK makes all data encrypted under it <strong>permanently unrecoverable</strong>. AWS enforces a 7-30 day waiting period. Always disable the key first and monitor CloudTrail for any usage before scheduling deletion.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'KMS Architecture',
      content: {
        title: 'Envelope Encryption: How KMS Protects Your Data',
        width: 750,
        height: 280,
        nodes: [
          { id: 'app', label: 'Your Application', icon: '💻', x: 10, y: 130, type: 'client', description: 'Application requests a data key from KMS. KMS returns a plaintext data key AND an encrypted copy of the same key.' },
          { id: 'kms', label: 'AWS KMS', icon: '🔐', x: 200, y: 130, type: 'security', description: 'KMS stores the CMK (Customer Master Key) in HSMs. It generates data keys but never stores them. The CMK never leaves KMS.', eventPayload: { KeyId: 'arn:aws:kms:us-east-1:123456789012:key/abc-123', KeySpec: 'AES_256', KeyState: 'Enabled' } },
          { id: 'hsm', label: 'FIPS 140-2 HSMs', icon: '🛡️', x: 200, y: 20, type: 'security', description: 'Hardware Security Modules validated at Level 3. The CMK material lives only inside these HSMs. Even AWS operators cannot extract key material.' },
          { id: 'encrypt', label: 'Encrypt Data', icon: '🔒', x: 400, y: 60, type: 'compute', description: 'Your app uses the plaintext data key to encrypt data locally (client-side). Then discards the plaintext key from memory.' },
          { id: 'store', label: 'S3 / EBS / RDS', icon: '🗄️', x: 600, y: 60, type: 'storage', description: 'The encrypted data + encrypted data key are stored together. To decrypt later, send the encrypted key back to KMS.' },
          { id: 'decrypt', label: 'Decrypt Flow', icon: '🔓', x: 400, y: 220, type: 'compute', description: 'To decrypt: send the encrypted data key to KMS → KMS decrypts it using the CMK → returns plaintext data key → you decrypt data locally.' },
          { id: 'trail', label: 'CloudTrail', icon: '📋', x: 600, y: 220, type: 'trigger', description: 'Every KMS API call (Encrypt, Decrypt, GenerateDataKey) is logged in CloudTrail. Critical for compliance auditing.' }
        ],
        edges: [
          { from: 'app', to: 'kms', label: 'GenerateDataKey', animated: true },
          { from: 'kms', to: 'hsm', label: 'CMK stored in' },
          { from: 'kms', to: 'encrypt', label: 'Plaintext + Encrypted Key' },
          { from: 'encrypt', to: 'store', label: 'Store encrypted data' },
          { from: 'store', to: 'decrypt', label: 'Retrieve encrypted key' },
          { from: 'decrypt', to: 'kms', label: 'Decrypt data key' },
          { from: 'kms', to: 'trail', label: 'Audit log' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Envelope Encryption</h4>
          <p>KMS uses a two-tier key hierarchy:</p>
          <ul>
            <li><strong>CMK (Customer Master Key)</strong>: The top-level key. Never leaves KMS. Used only to encrypt/decrypt <em>data keys</em>.</li>
            <li><strong>Data Key</strong>: Generated by KMS, used by your application to encrypt the actual data. You store the encrypted copy alongside the data.</li>
          </ul>
          <p>This approach is faster (encrypt large data locally) and more secure (CMK never exposed).</p>

          <h4>2. Key Policies</h4>
          <p>Every KMS key has a <strong>key policy</strong> (resource-based policy). Unlike most AWS resources, KMS keys are <strong>not accessible</strong> even to the root account unless the key policy explicitly grants access.</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{
  "Sid": "Allow use of the key",
  "Effect": "Allow",
  "Principal": {"AWS": "arn:aws:iam::123456789012:role/MyApp"},
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
  "Resource": "*"
}</pre>

          <h4>3. Grants</h4>
          <p>Temporary, scoped permissions to use a KMS key. Ideal for cross-service access (e.g., EBS granting an EC2 instance decrypt access during attach).</p>

          <h4>4. Key Rotation</h4>
          <ul>
            <li><strong>Automatic Rotation (CMK)</strong>: AWS rotates the key material every year. Old material is preserved for decryption. Key ARN and alias don't change.</li>
            <li><strong>Manual Rotation</strong>: Create a new key, update alias to point to new key. Required for imported key material or asymmetric keys.</li>
          </ul>

          <h4>5. Multi-Region Keys</h4>
          <p>Replicate KMS keys across regions for disaster recovery or cross-region encryption. The primary key and replica keys share the same key material and key ID.</p>

          <h4>6. Symmetric vs Asymmetric</h4>
          <table>
            <thead><tr><th>Feature</th><th>Symmetric (AES-256)</th><th>Asymmetric (RSA/ECC)</th></tr></thead>
            <tbody>
              <tr><td><strong>Key Material</strong></td><td>Single shared key</td><td>Public + Private key pair</td></tr>
              <tr><td><strong>Use</strong></td><td>Encrypt/Decrypt via KMS API</td><td>Encrypt outside AWS, verify signatures</td></tr>
              <tr><td><strong>AWS Services</strong></td><td>All (S3, EBS, RDS, etc.)</td><td>Limited</td></tr>
              <tr><td><strong>Default</strong></td><td>Yes</td><td>No</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'KMS Boto3 Operations',
      content: {
        title: 'Encrypt & Decrypt with KMS',
        languages: [
          {
            id: 'python-kms',
            label: 'Envelope Encryption',
            code: `import boto3
import base64
import logging
from cryptography.fernet import Fernet

logger = logging.getLogger()
logger.setLevel(logging.INFO)

kms = boto3.client('kms')

# Your Customer Managed Key ARN or alias
CMK_KEY_ID = 'alias/my-app-encryption-key'


def generate_data_key():
    """Generate a data key for envelope encryption."""
    response = kms.generate_data_key(
        KeyId=CMK_KEY_ID,
        KeySpec='AES_256'
    )
    # Returns:
    #   Plaintext: raw bytes (use to encrypt, then discard!)
    #   CiphertextBlob: encrypted copy (store alongside data)
    plaintext_key = response['Plaintext']       # 32 bytes
    encrypted_key = response['CiphertextBlob']   # ~184 bytes
    logger.info("Data key generated for CMK: %s", CMK_KEY_ID)
    return plaintext_key, encrypted_key


def encrypt_data(plaintext_data):
    """Encrypt data using envelope encryption."""
    plaintext_key, encrypted_key = generate_data_key()

    # Use the plaintext key to encrypt data locally
    # Fernet uses AES-128-CBC + HMAC-SHA256
    fernet_key = base64.urlsafe_b64encode(plaintext_key[:32])
    f = Fernet(fernet_key)
    encrypted_data = f.encrypt(plaintext_data.encode())

    # CRITICAL: Discard plaintext key from memory
    del plaintext_key
    del fernet_key

    logger.info("Data encrypted (%d bytes)", len(encrypted_data))
    # Store encrypted_key + encrypted_data together
    return encrypted_key, encrypted_data


def decrypt_data(encrypted_key, encrypted_data):
    """Decrypt data by first decrypting the data key via KMS."""
    # Ask KMS to decrypt the data key using the CMK
    response = kms.decrypt(
        CiphertextBlob=encrypted_key
    )
    plaintext_key = response['Plaintext']

    # Use decrypted key to decrypt data locally
    fernet_key = base64.urlsafe_b64encode(plaintext_key[:32])
    f = Fernet(fernet_key)
    decrypted_data = f.decrypt(encrypted_data).decode()

    del plaintext_key
    del fernet_key

    logger.info("Data decrypted successfully")
    return decrypted_data`,
            explanations: [
              { line: '17-20', text: 'GenerateDataKey returns TWO copies: plaintext (for immediate use) and encrypted (for storage). The CMK never leaves KMS — only the data key does.' },
              { line: '34-39', text: 'Envelope encryption: use the plaintext data key to encrypt data locally in your application. Much faster than sending all data to KMS (4KB limit on direct Encrypt API).' },
              { line: '42-43', text: 'CRITICAL security practice: immediately delete the plaintext key from memory after encryption. Only keep the encrypted copy.' },
              { line: '50-52', text: 'To decrypt: send the encrypted data key back to KMS. KMS decrypts it using the original CMK and returns the plaintext key. Then decrypt data locally.' }
            ]
          }
        ],
        defaultLang: 'python-kms',
        expectedOutput: 'Data key generated for CMK: alias/my-app-encryption-key\nData encrypted (156 bytes)\nData decrypted successfully'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'KMS CLI Commands',
      content: [
        {
          command: 'aws kms create-key --description "Production encryption key" --key-usage ENCRYPT_DECRYPT --origin AWS_KMS --tags TagKey=Environment,TagValue=production',
          category: 'aws-cli',
          expectedOutput: '{\n  "KeyMetadata": {\n    "KeyId": "abc12345-def6-7890-ghij-klmnopqrstuv",\n    "Arn": "arn:aws:kms:us-east-1:123456789012:key/abc12345...",\n    "KeyState": "Enabled",\n    "KeyUsage": "ENCRYPT_DECRYPT",\n    "KeySpec": "SYMMETRIC_DEFAULT"\n  }\n}',
          explanation: 'Creates a symmetric CMK (default). The key is created in ENABLED state. Key material is generated and stored in HSMs. Add an alias for human-readable reference.',
          interviewQ: 'What is the difference between a CMK and a data key in KMS?'
        },
        {
          command: 'aws kms create-alias --alias-name alias/my-prod-key --target-key-id abc12345-def6-7890-ghij-klmnopqrstuv',
          category: 'aws-cli',
          expectedOutput: '(no output on success)',
          explanation: 'Aliases provide friendly names for keys. Use aliases in code instead of key IDs — makes key rotation seamless (update alias to point to new key).'
        },
        {
          command: 'aws kms encrypt --key-id alias/my-prod-key --plaintext "Hello World" --output text --query CiphertextBlob | base64 --decode > encrypted.bin',
          category: 'aws-cli',
          expectedOutput: '(binary ciphertext written to encrypted.bin)',
          explanation: 'Direct encryption via KMS API. Limited to 4KB of data. For larger data, use GenerateDataKey for envelope encryption instead.'
        },
        {
          command: 'aws kms enable-key-rotation --key-id abc12345-def6-7890-ghij-klmnopqrstuv',
          category: 'aws-cli',
          expectedOutput: '(no output on success)',
          explanation: 'Enables annual automatic rotation. Only for symmetric CMKs with AWS-generated key material. Old key material is preserved so previously encrypted data can still be decrypted.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'KMS CLI Lab',
        mode: 'simulated',
        initialText: 'KMS CLI Lab. Try:\n  aws kms list-keys\n  aws kms describe-key --key-id alias/my-prod-key\n  aws kms get-key-rotation-status --key-id alias/my-prod-key',
        commands: {
          'aws kms list-keys': {
            text: '{\n  "Keys": [\n    {"KeyId": "abc12345-def6-7890-ghij-klmnopqrstuv", "KeyArn": "arn:aws:kms:us-east-1:123456789012:key/abc12345..."},\n    {"KeyId": "xyz98765-uvwx-4321-abcd-efghijklmnop", "KeyArn": "arn:aws:kms:us-east-1:123456789012:key/xyz98765..."}\n  ]\n}',
            type: 'output'
          },
          'aws kms describe-key --key-id alias/my-prod-key': {
            text: '{\n  "KeyMetadata": {\n    "KeyId": "abc12345-def6-7890-ghij-klmnopqrstuv",\n    "KeyState": "Enabled",\n    "KeyUsage": "ENCRYPT_DECRYPT",\n    "KeySpec": "SYMMETRIC_DEFAULT",\n    "KeyManager": "CUSTOMER",\n    "MultiRegion": false,\n    "Description": "Production encryption key",\n    "CreationDate": "2026-01-15T10:30:00+00:00",\n    "KeyRotationEnabled": true\n  }\n}',
            type: 'output'
          },
          'aws kms get-key-rotation-status --key-id alias/my-prod-key': {
            text: '{\n  "KeyRotationEnabled": true\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common KMS Issues',
      content: {
        items: [
          { title: 'AccessDeniedException on Decrypt', error: 'AccessDeniedException: User arn:aws:iam::123456789012:role/MyRole is not authorized to perform kms:Decrypt', cause: 'The IAM role/user is not listed in the key policy AND does not have an IAM policy granting kms:Decrypt on this specific key.', fix: 'KMS requires BOTH: (1) Key policy must allow the account root or specific principal, AND (2) IAM policy must grant kms:Decrypt on the key ARN. Check both.' },
          { title: 'InvalidCiphertextException', error: 'InvalidCiphertextException: (service: AWSKMS; status code: 400)', cause: 'Attempting to decrypt with the wrong key, wrong region, or corrupted ciphertext. Common when data was encrypted with a key in us-east-1 but decrypting in us-west-2.', fix: 'Ensure you decrypt in the same region where the data was encrypted. The encrypted blob includes metadata about which key was used — KMS auto-selects the correct key.' },
          { title: 'KMS key is pending deletion', error: 'KMSInvalidStateException: key is pending deletion', cause: 'Someone scheduled the key for deletion (7-30 day window). All encrypt/decrypt operations fail immediately.', fix: 'Cancel deletion: aws kms cancel-key-deletion --key-id <key-id>. Then re-enable: aws kms enable-key --key-id <key-id>. Set up CloudWatch alarm on key state changes.' },
          { title: 'KMS throttling (rate limit)', error: 'ThrottlingException: Rate exceeded', cause: 'Exceeding KMS API request quota (5,500–30,000 requests/second depending on region and operation). Common with high-volume S3 encryption or Lambda cold starts.', fix: 'Use data key caching (AWS Encryption SDK). Cache plaintext data keys in memory to avoid calling KMS for every operation. Also consider requesting a quota increase.' }
        ]
      }
    },

    {
      id: 'quiz-kms',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS KMS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your S3 bucket uses SSE-KMS encryption. A Lambda function needs to read objects from this bucket. The Lambda execution role has s3:GetObject permission, but reads fail with AccessDenied. Why?',
            options: [
              { id: 'a', text: 'The Lambda function needs s3:Decrypt permission' },
              { id: 'b', text: 'The Lambda execution role also needs kms:Decrypt permission on the KMS key used by the S3 bucket' },
              { id: 'c', text: 'SSE-KMS encryption prevents Lambda from reading objects' },
              { id: 'd', text: 'The S3 bucket policy blocks Lambda access' }
            ],
            correctId: 'b',
            explanation: 'When S3 uses SSE-KMS, reading an object requires BOTH s3:GetObject AND kms:Decrypt on the specific KMS key. S3 calls KMS on your behalf to decrypt the data key, but it uses YOUR credentials (the Lambda execution role) to make that KMS call.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'Why does KMS use envelope encryption instead of encrypting data directly?',
            options: [
              { id: 'a', text: 'The KMS Encrypt API has a 4KB data limit, so large files cannot be sent to KMS directly' },
              { id: 'b', text: 'It is cheaper to encrypt locally' },
              { id: 'c', text: 'Envelope encryption is a legal requirement' },
              { id: 'd', text: 'KMS does not support symmetric encryption' }
            ],
            correctId: 'a',
            explanation: 'The KMS Encrypt/Decrypt API supports a maximum of 4KB of data. Envelope encryption solves this: KMS generates a data key, you encrypt large data locally with that key, and store the encrypted data key alongside. This is also much faster (no network round-trip for each data block).',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'You enable automatic key rotation on a CMK. What happens to data encrypted with the old key material?',
            options: [
              { id: 'a', text: 'It becomes unreadable — you must re-encrypt everything' },
              { id: 'b', text: 'KMS keeps all previous versions of key material and can still decrypt old data' },
              { id: 'c', text: 'The old data is automatically re-encrypted with the new key material' },
              { id: 'd', text: 'You must manually re-encrypt within 30 days' }
            ],
            correctId: 'b',
            explanation: 'KMS retains all previous versions of key material indefinitely. The CMK ID, ARN, and alias do not change. Existing encrypted data continues to decrypt normally. Only new encryption operations use the new key material. This is why rotation is safe to enable.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-kms',
      type: 'challenge',
      title: 'Challenge: KMS Key Policy Auditor',
      content: {
        title: 'Build a KMS Key Policy Auditor',
        description: 'Write a Python function that audits all KMS keys in the account and flags any key where the key policy grants kms:* (wildcard) to any principal.',
        difficulty: 'intermediate',
        requirements: [
          'List all KMS keys in the current region',
          'Get the key policy for each key',
          'Parse the policy JSON and check for kms:* actions',
          'Return a list of non-compliant key IDs',
          'Log findings with severity levels'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

kms = boto3.client('kms')

def audit_key_policies():
    non_compliant = []

    # TODO: List all keys
    # TODO: For each key, get policy
    # TODO: Check for wildcard actions
    # TODO: Return non-compliant keys

    return non_compliant`,
        language: 'python',
        hints: [
          'kms.list_keys() returns paginated results — use Paginator',
          'kms.get_key_policy(KeyId=key_id, PolicyName="default")',
          'Parse the policy with json.loads(response["Policy"])',
          'Check each Statement for "Action": "kms:*" or "Action": "*"',
          'Skip AWS managed keys (KeyManager == "AWS")'
        ],
        testCases: [
          { description: 'Lists all KMS keys', keywords: ['list_keys'], expectedOutput: 'keys' },
          { description: 'Gets key policy', keywords: ['get_key_policy'], expectedOutput: 'policy' },
          { description: 'Checks for wildcard actions', keywords: ['kms:*'], expectedOutput: 'wildcard' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS KMS Hands-On Lab', content: {"title":"AWS KMS Hands-On Lab","description":"Configure and test AWS KMS following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open KMS Console","instruction":"AWS Console → Search \"KMS\" → Open service dashboard.","expectedResult":"KMS dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS KMS and what problem does it solve?","shortAnswer":"AWS KMS is a managed AWS service that creates and manages encryption keys for AWS services and applications. It eliminates the need to manage HSMs, implement key rotation, and build key management infrastructure.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys.","followUp":"When would you NOT use AWS KMS?"},{"difficulty":"beginner","question":"What are the key components of AWS KMS?","shortAnswer":"CMK (Customer Master Key), Data Keys, Key Policies, Grants, Aliases, Key Rotation, Multi-Region Keys.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS KMS integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS KMS priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS KMS costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS KMS?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS KMS for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS KMS?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS KMS achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS KMS?"},{"difficulty":"intermediate","question":"Explain the AWS KMS scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS KMS handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS KMS?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS KMS in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS KMS architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS KMS costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS KMS?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS KMS using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS KMS support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS KMS is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS KMS from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS KMS costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS KMS.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS KMS across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS KMS API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS KMS has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS KMS from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS KMS encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS KMS are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete KMS resources:</strong> Navigate to KMS console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the KMS console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 10: Amazon RDS', url: 'module-06.html' }, next: { title: 'Chapter 12: AWS Secrets Manager', url: 'module-24.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_22_DATA; } else { window.MODULE_22_DATA = MODULE_22_DATA; }
