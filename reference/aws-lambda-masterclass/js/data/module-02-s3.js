/**
 * ============================================================
 * MODULE 02 — Amazon S3
 * Object storage, buckets, storage classes, versioning, security
 * ============================================================
 */
const MODULE_02_DATA = {
  id: 's3-fundamentals',
  moduleId: 'module-02',
  title: 'Amazon S3 — Simple Storage Service',
  description: 'Master the most used AWS service. Covers buckets, objects, storage classes, versioning, lifecycle policies, pre-signed URLs, bucket policies, static website hosting, S3 event notifications, and cost optimization.',
  difficulty: 'beginner',
  duration: '90 min',
  prerequisites: ['Module 01: AWS IAM'],
  objectives: [
    'Create and configure S3 buckets with proper security settings',
    'Choose the right storage class based on access patterns and cost',
    'Implement versioning and lifecycle policies for data management',
    'Secure buckets using bucket policies, ACLs, and Block Public Access',
    'Generate pre-signed URLs for temporary object access',
    'Configure S3 event notifications to trigger Lambda functions',
    'Host a static website on S3 with CloudFront distribution'
  ],

  sections: [
    {
      id: 'why-s3',
      type: 'why',
      title: 'Why S3?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🪣</span>
            <div class="alert-content">
              <div class="alert-title">The Universal Storage Layer of AWS</div>
              <div class="alert-text">S3 stores over 100 trillion objects. Every AWS service uses S3 — CloudTrail logs, Lambda deployment packages, ELB access logs, EMR data, SageMaker datasets. It's 99.999999999% (11 nines) durable — you'd lose 1 object out of 10 billion every 10,000 years.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Storage Class</th><th>Availability</th><th>Min Duration</th><th>Use Case</th><th>Cost (per GB/mo)</th></tr></thead>
            <tbody>
              <tr><td><strong>S3 Standard</strong></td><td>99.99%</td><td>None</td><td>Frequently accessed data</td><td>~$0.023</td></tr>
              <tr><td><strong>S3 Intelligent-Tiering</strong></td><td>99.9%</td><td>None</td><td>Unknown/changing access patterns</td><td>~$0.023 + monitoring</td></tr>
              <tr><td><strong>S3 Standard-IA</strong></td><td>99.9%</td><td>30 days</td><td>Infrequent but rapid access needed</td><td>~$0.0125</td></tr>
              <tr><td><strong>S3 One Zone-IA</strong></td><td>99.5%</td><td>30 days</td><td>Re-creatable infrequent data</td><td>~$0.01</td></tr>
              <tr><td><strong>S3 Glacier Instant</strong></td><td>99.9%</td><td>90 days</td><td>Archive with instant retrieval</td><td>~$0.004</td></tr>
              <tr><td><strong>S3 Glacier Flexible</strong></td><td>99.99%</td><td>90 days</td><td>Archive (1-12 hour retrieval)</td><td>~$0.0036</td></tr>
              <tr><td><strong>S3 Glacier Deep Archive</strong></td><td>99.99%</td><td>180 days</td><td>Long-term compliance (12-48hr)</td><td>~$0.00099</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">S3 Buckets Are Global — Names Are Unique Worldwide</div>
              <div class="alert-text">Bucket names must be globally unique across ALL AWS accounts. Data is stored in a specific region, but the bucket namespace is global. Choose names carefully — once taken by anyone, no one else can use it.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'S3 Architecture & Event Flow',
      content: {
        title: 'S3 Object Storage & Event-Driven Processing',
        width: 750,
        height: 280,
        nodes: [
          { id: 'client', label: 'Client App', icon: '📱', x: 10, y: 120, type: 'client', description: 'Any application uploading/downloading objects: web app, mobile app, CLI, SDK, or another AWS service.' },
          { id: 's3', label: 'S3 Bucket', icon: '🪣', x: 200, y: 120, type: 'storage', description: 'Objects stored across minimum 3 AZs (Standard). 11 nines durability. Max object size: 5 TB. Max single PUT: 5 GB (use multipart for larger).', eventPayload: { Bucket: 'my-app-uploads', Key: 'images/photo.jpg', ContentType: 'image/jpeg', StorageClass: 'STANDARD', VersionId: 'v3.2.1' } },
          { id: 'event', label: 'S3 Event Notification', icon: '📨', x: 390, y: 40, type: 'event', description: 'S3 emits events: s3:ObjectCreated:*, s3:ObjectRemoved:*, s3:LifecycleTransition. Route to Lambda, SQS, SNS, or EventBridge.' },
          { id: 'lambda', label: 'Lambda Processor', icon: '⚡', x: 580, y: 40, type: 'compute', description: 'Process uploads in real-time: resize images, extract metadata, scan for viruses, index for search.' },
          { id: 'lifecycle', label: 'Lifecycle Rules', icon: '🔄', x: 390, y: 200, type: 'security', description: 'Automatically transition objects between storage classes or delete after expiration. Example: Standard → IA after 30 days → Glacier after 90 days → Delete after 365.' },
          { id: 'cloudfront', label: 'CloudFront CDN', icon: '🌍', x: 390, y: 120, type: 'trigger', description: 'Distribute S3 content globally via edge locations. Reduces latency, offloads S3 requests, and enables HTTPS for static websites.' }
        ],
        edges: [
          { from: 'client', to: 's3', label: 'PUT/GET', animated: true },
          { from: 's3', to: 'event', label: 'Object Created' },
          { from: 'event', to: 'lambda', label: 'Invoke', animated: true },
          { from: 's3', to: 'lifecycle', label: 'Auto-transition' },
          { from: 's3', to: 'cloudfront', label: 'Origin' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Bucket & Object Model</h4>
          <ul>
            <li><strong>Bucket</strong>: Top-level container. Globally unique name. Belongs to a specific region.</li>
            <li><strong>Object</strong>: A file (up to 5 TB) stored with a key (path), metadata, and optional version ID.</li>
            <li><strong>Key</strong>: The full path including "folder" prefixes. S3 has no actual folders — <code>images/2026/photo.jpg</code> is just a key string.</li>
          </ul>

          <h4>2. Versioning</h4>
          <p>Once enabled on a bucket, every PUT overwrites the version — not the object. Deleting creates a "delete marker." You can restore any previous version. Versioning cannot be disabled, only suspended.</p>

          <h4>3. Pre-Signed URLs</h4>
          <p>Generate a time-limited URL that grants temporary access to a private object without changing bucket permissions. Ideal for: file downloads behind auth, secure uploads from browsers, sharing links that expire.</p>

          <h4>4. Server-Side Encryption</h4>
          <table>
            <thead><tr><th>Type</th><th>Key Management</th><th>When to Use</th></tr></thead>
            <tbody>
              <tr><td><strong>SSE-S3</strong></td><td>AWS manages keys</td><td>Default — simple, no overhead</td></tr>
              <tr><td><strong>SSE-KMS</strong></td><td>AWS KMS customer-managed keys</td><td>Audit trail, key rotation, compliance</td></tr>
              <tr><td><strong>SSE-C</strong></td><td>Customer provides keys per request</td><td>When you must control keys externally</td></tr>
            </tbody>
          </table>

          <h4>5. S3 Block Public Access</h4>
          <p>Account-level and bucket-level setting that overrides any public ACLs or bucket policies. Enable at the account level as the first security measure. Turn off only for intentional public buckets (static websites).</p>

          <h4>6. Multipart Upload</h4>
          <p>Required for objects > 5 GB. Recommended for > 100 MB. Uploads parts in parallel for speed. If one part fails, only that part is retried. Remember to call <code>CompleteMultipartUpload</code> or <code>AbortMultipartUpload</code> — incomplete uploads still incur storage costs.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'S3 Operations with Boto3',
      content: {
        title: 'S3 CRUD Operations & Pre-Signed URLs',
        languages: [
          {
            id: 'python-crud',
            label: 'CRUD + Pre-Signed URL',
            code: `import boto3
import json
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
BUCKET = os.environ.get('BUCKET_NAME', 'my-app-uploads')

def lambda_handler(event, context):
    """S3 Lambda trigger — process uploaded objects."""
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key    = record['s3']['object']['key']
        size   = record['s3']['object'].get('size', 0)
        event_name = record['eventName']  # e.g. ObjectCreated:Put

        logger.info("S3 event: %s | bucket=%s key=%s size=%d",
                     event_name, bucket, key, size)

        # Get the object
        response = s3.get_object(Bucket=bucket, Key=key)
        content_type = response['ContentType']
        body = response['Body'].read()

        logger.info("Object type: %s, size: %d bytes", content_type, len(body))

        # Copy with new storage class
        s3.copy_object(
            CopySource={'Bucket': bucket, 'Key': key},
            Bucket=bucket,
            Key=f'processed/{key}',
            StorageClass='STANDARD_IA',
            ServerSideEncryption='aws:kms'
        )

        # Generate pre-signed URL (valid 1 hour)
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=3600  # seconds
        )
        logger.info("Pre-signed URL: %s", presigned_url)

    return {'statusCode': 200, 'body': 'Processed'}


def upload_with_metadata(file_path, key, metadata):
    """Upload a file with custom metadata."""
    s3.upload_file(
        Filename=file_path,
        Bucket=BUCKET,
        Key=key,
        ExtraArgs={
            'Metadata': metadata,
            'ServerSideEncryption': 'aws:kms',
            'StorageClass': 'INTELLIGENT_TIERING',
            'ContentType': 'application/json'
        }
    )
    logger.info("Uploaded %s to s3://%s/%s", file_path, BUCKET, key)`,
            explanations: [
              { line: '13', text: 'S3 Event Notification triggers Lambda with event.Records containing bucket name, object key, size, and event type.' },
              { line: '24', text: 'get_object returns a streaming Body. Call .read() to get bytes. For large files, stream in chunks to avoid memory issues.' },
              { line: '35', text: 'ServerSideEncryption=aws:kms uses KMS encryption. For SSE-S3, use AES256. KMS provides audit trail of key usage in CloudTrail.' },
              { line: '39-43', text: 'Pre-signed URLs grant temporary access to private objects. The URL contains your credentials embedded — anyone with the URL can access the object until expiry.' }
            ]
          }
        ],
        defaultLang: 'python-crud',
        expectedOutput: 'S3 event: ObjectCreated:Put | bucket=my-app-uploads key=images/photo.jpg size=245760\nObject type: image/jpeg, size: 245760 bytes\nPre-signed URL: https://my-app-uploads.s3.amazonaws.com/images/photo.jpg?X-Amz-Algorithm=...'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'S3 CLI Commands',
      content: [
        {
          command: 'aws s3 cp ./report.pdf s3://my-bucket/reports/2026/report.pdf --storage-class STANDARD_IA --sse aws:kms',
          category: 'aws-cli',
          expectedOutput: 'upload: ./report.pdf to s3://my-bucket/reports/2026/report.pdf',
          explanation: 'Uploads a file with Standard-IA storage class and KMS encryption. Use s3 cp for single files, s3 sync for directories.',
          interviewQ: 'When would you choose Standard-IA over S3 Standard?'
        },
        {
          command: 'aws s3api put-bucket-versioning --bucket my-bucket --versioning-configuration Status=Enabled',
          category: 'aws-cli',
          expectedOutput: '(no output — success)',
          explanation: 'Enables versioning on a bucket. Once enabled, it cannot be disabled (only suspended). Every PUT creates a new version instead of overwriting.',
          commonErrors: [
            { error: 'AccessDenied', cause: 'Caller lacks s3:PutBucketVersioning permission', fix: 'Add s3:PutBucketVersioning to the IAM policy for the bucket ARN' }
          ]
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'S3 CLI Lab',
        mode: 'simulated',
        initialText: 'S3 CLI Lab. Try:\n  aws s3 ls\n  aws s3 ls s3://my-app-uploads/\n  aws s3api head-object --bucket my-app-uploads --key images/photo.jpg\n  aws s3 presign s3://my-app-uploads/images/photo.jpg --expires-in 3600',
        commands: {
          'aws s3 ls': {
            text: '2025-06-15 08:30:00 my-app-uploads\n2025-08-22 14:15:00 company-logs-prod\n2026-01-10 09:00:00 static-website-hosting',
            type: 'output'
          },
          'aws s3 ls s3://my-app-uploads/': {
            text: '                           PRE images/\n                           PRE processed/\n                           PRE reports/\n2026-09-15 10:30:00     245760 index.html\n2026-09-15 10:30:00      12048 styles.css',
            type: 'output'
          },
          'aws s3api head-object --bucket my-app-uploads --key images/photo.jpg': {
            text: '{\n  "ContentType": "image/jpeg",\n  "ContentLength": 245760,\n  "ETag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"",\n  "StorageClass": "STANDARD",\n  "ServerSideEncryption": "aws:kms",\n  "VersionId": "v3.2.1",\n  "LastModified": "2026-09-15T10:30:00+00:00"\n}',
            type: 'output'
          },
          'aws s3 presign s3://my-app-uploads/images/photo.jpg --expires-in 3600': {
            text: 'https://my-app-uploads.s3.amazonaws.com/images/photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA...&X-Amz-Date=20260916&X-Amz-Expires=3600&X-Amz-Signature=abc123...',
            type: 'success'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common S3 Issues',
      content: {
        items: [
          { title: '403 Forbidden on S3 GET request', error: 'AccessDenied when trying to read an object', cause: 'Block Public Access enabled (correct!) but you expected public access, or IAM policy missing s3:GetObject, or bucket policy has explicit deny.', fix: 'For private access: verify IAM role has s3:GetObject on the bucket ARN/*. For public website: disable Block Public Access AND add a bucket policy allowing s3:GetObject to Principal "*".' },
          { title: 'Incomplete Multipart Upload consuming storage', error: 'S3 costs increasing without new uploads', cause: 'Multipart uploads that were started but never completed (AbortMultipartUpload never called). Each incomplete upload stores uploaded parts.', fix: 'Add a lifecycle rule: AbortIncompleteMultipartUpload with DaysAfterInitiation: 7. This auto-cleans abandoned uploads.' },
          { title: 'S3 event triggers Lambda twice', error: 'Lambda processes the same S3 upload event multiple times', cause: 'S3 event notifications are at-least-once delivery. Lambda may be invoked more than once for the same event.', fix: 'Make your Lambda idempotent. Use the S3 object ETag or version ID as an idempotency key. Check DynamoDB for existing records before processing.' },
          { title: 'Static website returns 404 for routes', error: 'SPA routes return 404 after page refresh', cause: 'S3 static hosting serves files by key path. /about maps to a key named "about" which doesn\'t exist as a file.', fix: 'Set the Error Document to index.html in S3 static hosting config. Or use CloudFront with a custom error response that returns index.html for 404s.' }
        ]
      }
    },

    {
      id: 'quiz-s3',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon S3 Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You need to store log files that are accessed daily for the first 30 days, rarely accessed for the next 60 days, and must be retained for 7 years for compliance. What S3 strategy should you use?',
            options: [
              { id: 'a', text: 'Store everything in S3 Standard forever' },
              { id: 'b', text: 'S3 Standard → Lifecycle to Standard-IA at 30 days → Glacier Deep Archive at 90 days → Delete at 2555 days' },
              { id: 'c', text: 'Store directly in Glacier Deep Archive from day 1' },
              { id: 'd', text: 'Use S3 One Zone-IA for everything' }
            ],
            correctId: 'b',
            explanation: 'Lifecycle policies automate storage class transitions based on age. Standard for active access (30 days), Standard-IA for infrequent (30-90), Glacier Deep Archive for long-term compliance (cheapest). Delete after retention period. This optimizes cost while meeting access and compliance needs.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What is the maximum size of a single S3 object, and how do you upload files larger than 5 GB?',
            options: [
              { id: 'a', text: '5 GB max. Cannot upload larger files.' },
              { id: 'b', text: '5 TB max. Use Multipart Upload for files > 5 GB (recommended for > 100 MB).' },
              { id: 'c', text: 'Unlimited size. S3 handles chunking automatically.' },
              { id: 'd', text: '5 TB max. Use S3 Transfer Acceleration only.' }
            ],
            correctId: 'b',
            explanation: 'S3 max object size is 5 TB. Single PUT is limited to 5 GB. For larger files, use Multipart Upload which uploads parts in parallel (max 10,000 parts, min 5 MB per part). Recommended for any file > 100 MB for faster uploads and automatic retry of individual parts.',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'How does S3 achieve 99.999999999% (11 nines) durability?',
            options: [
              { id: 'a', text: 'S3 stores each object in a single AZ with RAID-6 disk arrays' },
              { id: 'b', text: 'S3 automatically replicates each object across a minimum of 3 Availability Zones within the region' },
              { id: 'c', text: 'S3 backs up all data to Glacier automatically' },
              { id: 'd', text: 'S3 uses cross-region replication by default' }
            ],
            correctId: 'b',
            explanation: 'S3 Standard stores objects redundantly across a minimum of 3 physically separated AZs. This protects against AZ-level failures (fire, flood, power loss). Cross-region replication is NOT automatic — it must be configured explicitly for disaster recovery.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    {
      id: 'challenge-s3',
      type: 'challenge',
      title: 'Challenge: S3 Event Processor',
      content: {
        title: 'Build an S3 Upload Processor',
        description: 'Write a Lambda function triggered by S3 ObjectCreated events. It should extract the object metadata, copy the object to an "archive/" prefix with Standard-IA storage class, and generate a pre-signed URL.',
        difficulty: 'intermediate',
        requirements: [
          'Extract bucket name and object key from event.Records[0].s3',
          'Use s3.head_object to get metadata (ContentType, ContentLength)',
          'Copy the object to archive/{original_key} with STANDARD_IA storage class',
          'Generate a pre-signed URL valid for 1 hour (3600 seconds)',
          'Log the file size and pre-signed URL',
          'Return a response with statusCode 200'
        ],
        starterCode: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')

def lambda_handler(event, context):
    """Process S3 upload event."""
    record = event['Records'][0]

    # TODO: Extract bucket and key from the S3 event record
    # TODO: Get object metadata with head_object
    # TODO: Copy to archive/ prefix with STANDARD_IA
    # TODO: Generate pre-signed URL (1 hour)
    # TODO: Log and return response

    pass`,
        language: 'python',
        hints: [
          'bucket = record["s3"]["bucket"]["name"]',
          'key = record["s3"]["object"]["key"]',
          's3.head_object(Bucket=bucket, Key=key) returns ContentType and ContentLength',
          's3.copy_object(CopySource={"Bucket": bucket, "Key": key}, Bucket=bucket, Key=f"archive/{key}", StorageClass="STANDARD_IA")',
          's3.generate_presigned_url("get_object", Params={...}, ExpiresIn=3600)'
        ],
        testCases: [
          { description: 'Extracts bucket from event', keywords: ['bucket', 'name'], expectedOutput: 'bucket' },
          { description: 'Extracts key from event', keywords: ['object', 'key'], expectedOutput: 'key' },
          { description: 'Copies to archive/ prefix', keywords: ['copy_object', 'archive'], expectedOutput: 'archive' },
          { description: 'Uses STANDARD_IA storage class', keywords: ['STANDARD_IA'], expectedOutput: 'STANDARD_IA' },
          { description: 'Generates pre-signed URL', keywords: ['generate_presigned_url'], expectedOutput: 'presigned' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: S3 Security & Lifecycle', content: {
      title: 'S3 Bucket Security & Lifecycle Lab',
      description: 'Create, secure, and manage S3 buckets with versioning, encryption, and lifecycle policies.',
      difficulty: 'intermediate',
      steps: [
        { id: 's1', title: 'Create S3 Bucket with Versioning', instruction: 'S3 → Create bucket → Name: "lab-secure-[account-id]" → Enable versioning → Create.', expectedResult: 'Bucket created with versioning enabled.', hint: 'Bucket names must be globally unique.' },
        { id: 's2', title: 'Configure Encryption', instruction: 'Bucket → Properties → Default encryption → SSE-S3 (AES-256). Then add bucket policy denying unencrypted uploads.', expectedResult: 'All uploads auto-encrypted. Unencrypted PUT requests rejected.', hint: 'Use condition StringNotEquals s3:x-amz-server-side-encryption.' },
        { id: 's3', title: 'Block Public Access', instruction: 'Verify all 4 Block Public Access settings are enabled at account and bucket level.', expectedResult: 'All public access blocked.', hint: 'Account-level BPA overrides bucket-level.' },
        { id: 's4', title: 'Upload and Version Objects', instruction: 'Upload a file, modify and re-upload. List versions. Delete the object. Verify delete marker. Restore previous version.', expectedResult: 'Multiple versions visible. Delete marker created. Previous version recoverable.', hint: 'Use aws s3api list-object-versions.' },
        { id: 's5', title: 'Create Lifecycle Rule', instruction: 'Management → Lifecycle rules → Transition to IA after 30d, Glacier after 90d, expire after 365d.', expectedResult: 'Lifecycle configuration saved.', hint: 'Transitions must follow storage class hierarchy.' },
        { id: 's6', title: 'Generate Pre-signed URL', instruction: 'Run: aws s3 presign s3://bucket/file.txt --expires-in 300. Open URL in incognito browser.', expectedResult: 'File accessible via pre-signed URL for 5 minutes.', hint: 'Pre-signed URLs inherit permissions of the credentials used to generate them.' }
      ] } },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [
      { difficulty: 'beginner', question: 'What are S3 storage classes and when to use each?', shortAnswer: 'Standard (frequent access), IA (infrequent, fast retrieval), One Zone-IA (single AZ, cheaper), Glacier Instant (ms retrieval), Glacier Flexible (min-hrs), Deep Archive (12-48h).', deepExplanation: 'All classes have 11 9s durability. Standard: 99.99% availability. IA: retrieval fee per GB. Intelligent-Tiering: auto-moves between tiers based on access patterns.', commonMistake: 'Storing frequently accessed data in Glacier, causing high retrieval costs.', followUp: 'How does Intelligent-Tiering work?' },
      { difficulty: 'beginner', question: 'How does S3 versioning work?', shortAnswer: 'Keeps all versions of an object. Each upload creates a new version. Deletes add a delete marker. Previous versions are recoverable.', deepExplanation: 'Once enabled, cannot be disabled (only suspended). Each version has unique ID. Storage costs include all versions. Use lifecycle rules to expire old versions.', commonMistake: 'Not using lifecycle rules to delete old versions, causing unbounded costs.', followUp: 'What happens when versioning is suspended?' },
      { difficulty: 'beginner', question: 'What is a pre-signed URL?', shortAnswer: 'Time-limited URL granting temporary access to a private S3 object without AWS credentials.', deepExplanation: 'Contains signature, expiration, permissions. For GET or PUT. Max 7 days with IAM user. Generated server-side.', commonMistake: 'Setting very long expiration times, reducing security.', followUp: 'What if the generating credentials are revoked?' },
      { difficulty: 'beginner', question: 'What is S3 Block Public Access?', shortAnswer: 'Safety net preventing accidental public exposure. Account and bucket-level settings override public grants in policies/ACLs.', deepExplanation: 'Four settings: BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets. Account-level overrides bucket-level.', commonMistake: 'Disabling account-level BPA to make one bucket public, exposing all buckets.', followUp: 'Can you make a bucket public with BPA enabled?' },
      { difficulty: 'beginner', question: 'Max object size in S3?', shortAnswer: '5 TB per object. Single PUT limit 5 GB. Use multipart upload for objects over 100 MB.', deepExplanation: 'Multipart: 5 MB to 5 GB parts, up to 10,000 parts, parallel upload. S3 Transfer Acceleration for long-distance transfers.', commonMistake: 'Not using multipart for large files, causing timeouts.', followUp: 'How does Transfer Acceleration work?' },
      { difficulty: 'intermediate', question: 'Explain S3 event notifications.', shortAnswer: 'Trigger Lambda, SQS, SNS, or EventBridge on object create/delete/restore. Use for real-time processing pipelines.', deepExplanation: 'Events: ObjectCreated:*, ObjectRemoved:*, ObjectRestore:*. Filter by prefix/suffix. One destination per event per prefix unless using EventBridge.', commonMistake: 'Creating recursive triggers (Lambda writes to same bucket).', followUp: 'How to prevent recursive Lambda invocations?' },
      { difficulty: 'intermediate', question: 'S3 replication: SRR vs CRR?', shortAnswer: 'SRR: Same-Region for compliance/aggregation. CRR: Cross-Region for DR/latency. Both require versioning, replicate new objects only.', deepExplanation: 'Not retroactive — use Batch Replication for existing. Can replicate cross-account with ownership override. Supports encrypted objects with KMS key configuration.', commonMistake: 'Expecting existing objects to replicate automatically.', followUp: 'How to replicate existing objects?' },
      { difficulty: 'intermediate', question: 'Server-side encryption options?', shortAnswer: 'SSE-S3 (AWS-managed, default), SSE-KMS (KMS with audit trail), SSE-C (customer-provided keys). All encrypt at rest.', deepExplanation: 'SSE-S3: AES-256, zero config. SSE-KMS: CloudTrail logging, key policies, S3 Bucket Key reduces KMS costs. SSE-C: you provide key per request, AWS doesn\'t store it.', commonMistake: 'Using SSE-C without proper key management — lose key = lose data.', followUp: 'What is S3 Bucket Key and how does it reduce KMS costs?' },
      { difficulty: 'intermediate', question: 'What is S3 Object Lock?', shortAnswer: 'WORM protection. Governance mode: override with special permissions. Compliance mode: nobody can delete, not even root.', deepExplanation: 'Requires versioning. Legal Hold: indefinite lock independent of retention. Compliance mode retention is immutable.', commonMistake: 'Enabling Compliance mode in testing — truly immutable until retention expires.', followUp: 'Object Lock vs Glacier Vault Lock?' },
      { difficulty: 'intermediate', question: 'What are S3 access points?', shortAnswer: 'Named endpoints with dedicated access policies. Simplify managing access for different teams to shared data.', deepExplanation: 'Each has own DNS, policy, network controls (VPC/internet). Bucket can have thousands. Delegates management from one complex bucket policy to multiple simple ones.', commonMistake: 'Not restricting access points to VPC-only for sensitive data.', followUp: 'How do access points simplify data lake access?' },
      { difficulty: 'advanced', question: 'Optimize S3 for high request rates?', shortAnswer: 'Auto-scales to 3,500 PUT and 5,500 GET per prefix per second. Use random prefixes, multipart upload, Transfer Acceleration, byte-range fetches.', deepExplanation: 'Partition key is object key prefix. Distribute across prefixes. CloudFront for reads. S3 Select for querying inside objects.', commonMistake: 'Sequential date prefixes (2024/01/01/) causing partition hotspots.', followUp: 'How does S3 Select reduce costs?' },
      { difficulty: 'advanced', question: 'Design a cost-efficient data lake on S3?', shortAnswer: 'Intelligent-Tiering, lifecycle rules, Parquet/ORC formats, partitioning by date, compression, S3 analytics for tier recommendations.', deepExplanation: 'Raw → Standard, processed → IA after 30d, archive → Glacier after 90d. Columnar formats reduce Athena scan costs 90%. Glue Data Catalog for metadata.', commonMistake: 'CSV without partitioning = full table scans = 100x cost.', followUp: 'How to calculate Athena query costs by format?' },
      { difficulty: 'advanced', question: 'Explain S3 batch operations.', shortAnswer: 'Process billions of objects: copy, invoke Lambda, restore, tag, ACL, Object Lock. Uses manifest from Inventory or CSV.', deepExplanation: 'Components: manifest + operation + IAM role. Tracks progress, retries failures. Integrates with S3 Inventory.', commonMistake: 'Running batch ops without testing on small subset first.', followUp: 'How to generate manifest from S3 Inventory?' },
      { difficulty: 'advanced', question: 'What is S3 Storage Lens?', shortAnswer: 'Org-wide analytics: storage usage, activity metrics, cost optimization recommendations across all buckets.', deepExplanation: 'Free: 28 metrics, 14 days. Advanced: 35+ metrics, 15 months, CloudWatch publishing. Identifies: incomplete multipart uploads, non-current versions, missing lifecycle rules.', commonMistake: 'Not enabling advanced metrics for activity-based insights.', followUp: 'How to set up Storage Lens across an Organization?' },
      { difficulty: 'advanced', question: 'S3 Glacier Vault Lock vs Object Lock?', shortAnswer: 'Vault Lock: vault-level WORM for Glacier archives, irreversible once completed. Object Lock: object-level for S3 buckets, flexible modes.', deepExplanation: 'Vault Lock: 24-hour abort window then irreversible. Designed for SEC/CFTC/FINRA compliance. Different services, different granularity.', commonMistake: 'Completing Vault Lock in test environment — truly irreversible.', followUp: 'Design compliant archival using both?' },
      { difficulty: 'scenario', question: 'S3 costs jumped 300%. How to investigate?', shortAnswer: 'Cost Explorer → S3 usage type, Storage Lens → bucket growth, check versioning without lifecycle, incomplete multipart uploads, unexpected external access, replication costs.', deepExplanation: 'Don\'t just check storage — request costs (LIST/GET) can spike. Check for bots scanning public buckets.', commonMistake: 'Only looking at storage costs, ignoring request costs.', followUp: 'How to set up S3 request-level CloudWatch metrics?' },
      { difficulty: 'scenario', question: 'Design secure file sharing for 500 external partners.', shortAnswer: 'Access points per partner, pre-signed URLs for time-limited access, CloudFront signed URLs, Cognito auth, malware scanning Lambda.', deepExplanation: 'Partner-specific prefix, staging → scan → approved pipeline. All access logged in CloudTrail and S3 logs.', commonMistake: 'Public bucket policies instead of pre-signed URLs.', followUp: 'How to implement virus scanning for uploads?' },
      { difficulty: 'scenario', question: 'Migrate 50 TB on-prem to S3?', shortAnswer: 'DataSync over Direct Connect for ongoing sync, Snowball Edge for one-time if bandwidth limited, Transfer Acceleration for internet.', deepExplanation: '50 TB over 1 Gbps ≈ 5 days. Over 100 Mbps ≈ 50 days → use Snowball. Verify with checksums.', commonMistake: 'Using simple s3 cp — no resume, no parallelism, no throttling.', followUp: 'When to choose Snowball vs DataSync vs Transfer Acceleration?' },
      { difficulty: 'scenario', question: 'Prove to auditor no S3 data modified in past year?', shortAnswer: 'Object Lock compliance mode, CloudTrail logs, S3 versioning, MFA Delete, S3 Inventory with checksums.', deepExplanation: 'Object Lock prevents modification, CloudTrail proves who did what, versioning preserves all versions, MFA Delete prevents version deletion.', commonMistake: 'Only CloudTrail without Object Lock — proves WHO but doesn\'t prevent WHAT.', followUp: 'How to meet SEC 17a-4 with S3?' },
      { difficulty: 'scenario', question: 'Process 10,000 image uploads per second?', shortAnswer: 'Random hash prefixes, S3 events → SQS → Lambda (SQS as buffer), processed images → CloudFront-backed bucket.', deepExplanation: 'S3: 3,500 PUTs per prefix. 3 prefixes = 10,500. SQS provides buffering vs direct Lambda invocation which can hit concurrency limits.', commonMistake: 'Direct Lambda trigger at this scale hits concurrency limits. Use SQS buffer.', followUp: 'How to handle S3 event delivery failures?' },
      { difficulty: 'troubleshooting', question: '403 Forbidden accessing S3 object despite bucket policy allowing your role.', shortAnswer: 'Check: object-level ACL, Block Public Access, VPC endpoint policy, KMS key policy, cross-account object ownership.', deepExplanation: 'Cross-account: uploader owns object, bucket owner can\'t access unless ACL grants bucket-owner-full-control or BucketOwnerEnforced is set.', commonMistake: 'Forgetting object ownership in cross-account scenarios.', followUp: 'What is BucketOwnerEnforced?' },
      { difficulty: 'troubleshooting', question: 'S3 replication not working for new objects.', shortAnswer: 'Check: versioning on both buckets, replication role permissions, KMS key policy, rule status, filter matching.', deepExplanation: 'KMS objects need kms:Decrypt on source key + kms:Encrypt on destination key in replication role.', commonMistake: 'Expecting existing objects to replicate. Use Batch Replication.', followUp: 'How to monitor replication lag?' },
      { difficulty: 'troubleshooting', question: 'Lifecycle rule not transitioning objects.', shortAnswer: 'Check: rule enabled, filter matches, 30-day minimum for IA, objects must be >128 KB for IA, runs asynchronously.', deepExplanation: 'Objects <128 KB skip IA/One Zone-IA transition. Cannot go IA→Standard. Check Storage Lens for effectiveness.', commonMistake: 'Expecting immediate transition — 30-day minimum for IA.', followUp: 'How to audit lifecycle effectiveness with Storage Lens?' },
      { difficulty: 'troubleshooting', question: 'Multipart upload failing with EntityTooSmall.', shortAnswer: 'Each part except last must be ≥5 MB. Set lifecycle rule to auto-abort incomplete multipart uploads.', deepExplanation: 'Constraints: 5 MB min part, 5 GB max part, 10,000 max parts, 5 TB max object. Incomplete uploads still incur storage costs.', commonMistake: 'No lifecycle rule for incomplete uploads = orphaned parts = hidden costs.', followUp: 'How to clean up incomplete multipart uploads?' },
      { difficulty: 'troubleshooting', question: 'S3 Select returning empty results.', shortAnswer: 'Check: format spec matches actual (CSV/JSON/Parquet), compression type, column names case-sensitive, SQL syntax. Test with SELECT * LIMIT 1.', deepExplanation: 'Common: specifying CSV but file is JSON, missing header row config, wrong compression codec, SSE-C not supported.', commonMistake: 'Not setting FileHeaderInfo:USE for CSV with headers.', followUp: 'S3 Select vs Athena for queries?' }
    ] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `
      <h4>Remove Lab Resources</h4>
      <ol>
        <li><strong>Empty bucket:</strong> <code>aws s3 rm s3://lab-secure-[id] --recursive</code> (delete all versions)</li>
        <li><strong>Delete versions:</strong> <code>aws s3api delete-objects</code> with all version IDs</li>
        <li><strong>Delete bucket:</strong> <code>aws s3api delete-bucket --bucket lab-secure-[id]</code></li>
      </ol>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Delete All Versions First</div><div class="alert-text">With versioning, you must delete ALL object versions and delete markers before bucket deletion.</div></div></div>
    ` } },

    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 02: Amazon EC2', url: 'module-03.html' }, next: { title: 'Chapter 04: AWS IAM', url: 'module-01.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_02_DATA;
} else {
  window.MODULE_02_DATA = MODULE_02_DATA;
}
