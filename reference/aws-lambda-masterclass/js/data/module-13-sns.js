/**
 * ============================================================
 * MODULE 13 — Amazon SNS
 * Pub/sub, fan-out patterns, message filtering, Lambda subscriptions
 * ============================================================
 */
const MODULE_13_DATA = {
  id: 'sns-fundamentals',
  moduleId: 'module-13',
  title: 'Amazon SNS — Pub/Sub Messaging & Fan-Out',
  description: 'Master Amazon SNS for event-driven fan-out architectures. Covers topics, subscriptions, Lambda subscribers, message filtering, SNS → SQS fan-out, and mobile push notifications.',
  difficulty: 'intermediate',
  duration: '70 min',
  prerequisites: ['Module 08: AWS Lambda', 'Module 12: Amazon SQS (recommended)'],
  objectives: [
    'Explain SNS topics, subscriptions, and the publish/subscribe model',
    'Implement Lambda functions as SNS subscribers',
    'Design fan-out patterns using SNS → multiple SQS queues',
    'Use message filtering to route messages to specific subscribers',
    'Differentiate SNS from SQS and choose the right service',
    'Handle SNS message format in Lambda (wrapped envelope)',
    'Configure SNS dead-letter queues for failed deliveries'
  ],

  sections: [
    {
      id: 'why-sns',
      type: 'why',
      title: 'Why SNS?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">📢</span>
            <div class="alert-content">
              <div class="alert-title">One Event → Many Consumers</div>
              <div class="alert-text">SNS enables a single publish action to notify many subscribers simultaneously. Without SNS, you'd need to maintain a list of downstream services and call each one — tightly coupling your publisher to consumers.</div>
            </div>
          </div>
          <h4>SNS vs SQS — Which to Use?</h4>
          <table>
            <thead><tr><th>Aspect</th><th>SNS (Pub/Sub)</th><th>SQS (Queue)</th></tr></thead>
            <tbody>
              <tr><td>Pattern</td><td>Push — SNS pushes to subscribers</td><td>Pull — consumer polls the queue</td></tr>
              <tr><td>Recipients</td><td>Multiple subscribers simultaneously</td><td>One consumer per message</td></tr>
              <tr><td>Persistence</td><td>Not persistent — deliver or fail (up to 3 retries)</td><td>Persistent — up to 14 days</td></tr>
              <tr><td>Ordering</td><td>No ordering guarantee (Standard) / FIFO topic</td><td>FIFO queue guarantees order</td></tr>
              <tr><td>Use Case</td><td>Notifications, fan-out, alerts</td><td>Async job processing, decoupling</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">SNS + SQS = Best of Both Worlds</div>
              <div class="alert-text">The most common pattern: SNS fan-out → multiple SQS queues. SNS delivers immediately to all queues (fan-out). SQS persists messages and Lambda processes them reliably. This combines SNS's broadcast with SQS's reliability.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'SNS Fan-Out Architecture',
      content: {
        title: 'SNS → Multiple Subscribers (Fan-Out Pattern)',
        width: 750,
        height: 300,
        nodes: [
          { id: 'publisher', label: 'Publisher Lambda', icon: '⚡', x: 10, y: 130, type: 'compute', description: 'Any Lambda function (or service) publishes an event to the SNS topic with a single API call.', eventPayload: { TopicArn: 'arn:aws:sns:us-east-1:123456789012:OrderEvents', Message: '{"orderId":"ord-001","event":"ORDER_PLACED","amount":59.99}', MessageAttributes: { eventType: { DataType: 'String', StringValue: 'ORDER_PLACED' } } } },
          { id: 'topic', label: 'SNS Topic', icon: '📢', x: 200, y: 130, type: 'event', description: 'SNS topic receives the message and fans it out to ALL subscribed endpoints simultaneously.' },
          { id: 'sqs-email', label: 'Email SQS Queue', icon: '📨', x: 400, y: 40, type: 'storage', description: 'Filtered subscription: receives only ORDER_PLACED events. Lambda consumer sends confirmation emails.' },
          { id: 'sqs-inventory', label: 'Inventory SQS', icon: '📨', x: 400, y: 130, type: 'storage', description: 'Filtered subscription: receives ORDER_PLACED and ORDER_CANCELLED events. Lambda updates inventory.' },
          { id: 'sqs-analytics', label: 'Analytics SQS', icon: '📨', x: 400, y: 220, type: 'storage', description: 'Unfiltered subscription: receives ALL events for data lake ingestion.' },
          { id: 'lambda-email', label: 'Email Lambda', icon: '⚡', x: 600, y: 40, type: 'compute', description: 'Sends order confirmation email via SES.' },
          { id: 'lambda-inv', label: 'Inventory Lambda', icon: '⚡', x: 600, y: 130, type: 'compute', description: 'Decrements inventory in DynamoDB.' },
          { id: 'lambda-analytics', label: 'Analytics Lambda', icon: '⚡', x: 600, y: 220, type: 'compute', description: 'Writes events to Kinesis Data Firehose → S3.' }
        ],
        edges: [
          { from: 'publisher', to: 'topic', label: 'Publish', animated: true },
          { from: 'topic', to: 'sqs-email', label: 'Filter: ORDER_PLACED', animated: true },
          { from: 'topic', to: 'sqs-inventory', label: 'Filter: ORDER_*', animated: true },
          { from: 'topic', to: 'sqs-analytics', label: 'No Filter', animated: true },
          { from: 'sqs-email', to: 'lambda-email', label: 'ESM' },
          { from: 'sqs-inventory', to: 'lambda-inv', label: 'ESM' },
          { from: 'sqs-analytics', to: 'lambda-analytics', label: 'ESM' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Topic & Subscription</h4>
          <p>A <strong>Topic</strong> is a communication channel. <strong>Subscriptions</strong> link the topic to endpoints (Lambda, SQS, HTTP, email, SMS, mobile push). When a message is published, SNS delivers it to ALL subscriptions concurrently.</p>

          <h4>2. Message Filtering</h4>
          <p>Subscription filter policies route messages based on message attributes — so each subscriber only receives relevant events. This avoids the need for consumers to check event type before processing.</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">// Email subscriber filter — only ORDER_PLACED events
{
  "eventType": ["ORDER_PLACED"]
}

// Inventory subscriber filter — ORDER_PLACED or ORDER_CANCELLED
{
  "eventType": ["ORDER_PLACED", "ORDER_CANCELLED"]
}</pre>

          <h4>3. SNS Message Envelope in Lambda</h4>
          <p>When SNS directly invokes Lambda (without SQS), the Lambda event is an SNS envelope — the actual message is inside <code>event.Records[0].Sns.Message</code> as a JSON string.</p>

          <h4>4. SNS + SQS vs SNS → Lambda Direct</h4>
          <ul>
            <li><strong>SNS → Lambda direct</strong>: No buffering. If Lambda is throttled or errors, SNS retries 3 times then discards.</li>
            <li><strong>SNS → SQS → Lambda</strong>: Messages are buffered in SQS. Lambda retries per SQS maxReceiveCount. DLQ available. Recommended for production.</li>
          </ul>

          <h4>5. Message Attributes vs Message Body</h4>
          <p>Filtering is based on <strong>message attributes</strong> (metadata), not the message body. Keep the body clean with your business payload. Put routing/type info in attributes.</p>

          <h4>6. SNS FIFO Topics</h4>
          <p>SNS FIFO topics maintain message ordering and deduplication within a message group. Must be used with SQS FIFO queues as subscribers. Use for ordered event streams like financial ledgers.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'SNS Publisher & Subscriber Lambda',
      content: {
        title: 'SNS Publisher + Lambda Subscriber Handler',
        languages: [
          {
            id: 'python-publish',
            label: 'Publisher',
            code: `import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Global SNS client
sns = boto3.client('sns')
ORDER_TOPIC_ARN = os.environ['ORDER_TOPIC_ARN']

def lambda_handler(event, context):
    """
    Publish order events to SNS topic.
    All downstream services (email, inventory, analytics) subscribe independently.
    """
    body = json.loads(event.get('body') or '{}')
    order_id  = body.get('orderId')
    event_type = body.get('eventType', 'ORDER_PLACED')
    amount    = body.get('amount', 0)

    if not order_id:
        return build_response(400, {'error': 'orderId required'})

    # Build the event payload
    message_payload = {
        'orderId':   order_id,
        'eventType': event_type,
        'amount':    amount,
        'timestamp': __import__('datetime').datetime.utcnow().isoformat()
    }

    # Publish to SNS — all subscribers receive this
    response = sns.publish(
        TopicArn=ORDER_TOPIC_ARN,
        Message=json.dumps(message_payload),
        Subject=f'Order Event: {event_type}',
        # MessageAttributes are used for subscription filtering
        MessageAttributes={
            'eventType': {
                'DataType': 'String',
                'StringValue': event_type
            },
            'orderAmount': {
                'DataType': 'Number',
                'StringValue': str(amount)
            }
        }
    )

    message_id = response['MessageId']
    logger.info("Published event: %s | MessageId: %s", event_type, message_id)

    return build_response(202, {
        'messageId': message_id,
        'event': event_type,
        'orderId': order_id
    })

def build_response(status, body):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(body)
    }`,
            explanations: [
              { line: '31', text: 'Publish the business payload as the Message body (JSON string). All subscribers get this.' },
              { line: '34', text: 'Subject is optional — used for email subscriptions as the email subject line.' },
              { line: '36-44', text: 'MessageAttributes are metadata used for subscription filter policies. Subscribers with a filter on eventType=ORDER_PLACED only receive matching messages.' }
            ]
          },
          {
            id: 'python-subscriber',
            label: 'Subscriber (via SQS)',
            code: `import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    SNS → SQS → Lambda subscriber.
    
    When SNS delivers to SQS, the SQS message body is the SNS envelope.
    We must unwrap it to get our actual business payload.
    """
    for record in event['Records']:
        # SQS wraps the SNS message — unwrap it
        sqs_body = json.loads(record['body'])

        # SNS envelope fields
        sns_message_id = sqs_body.get('MessageId')
        topic_arn      = sqs_body.get('TopicArn')
        subject        = sqs_body.get('Subject', '')
        timestamp      = sqs_body.get('Timestamp')

        # The actual business payload is in 'Message' (another JSON string)
        payload = json.loads(sqs_body['Message'])
        order_id   = payload.get('orderId')
        event_type = payload.get('eventType')
        amount     = payload.get('amount', 0)

        logger.info(
            "Processing SNS event: type=%s orderId=%s msgId=%s",
            event_type, order_id, sns_message_id
        )

        # Route to appropriate handler based on event type
        if event_type == 'ORDER_PLACED':
            handle_order_placed(order_id, amount)
        elif event_type == 'ORDER_CANCELLED':
            handle_order_cancelled(order_id)
        else:
            logger.warning("Unknown event type: %s", event_type)

    return {'batchItemFailures': []}

def handle_order_placed(order_id, amount):
    logger.info("Updating inventory for order: %s (amount=$%.2f)", order_id, amount)
    # ... DynamoDB update inventory logic

def handle_order_cancelled(order_id):
    logger.info("Restoring inventory for cancelled order: %s", order_id)
    # ... DynamoDB restore inventory logic`,
            explanations: [
              { line: '16', text: 'SQS record body is the SNS envelope — a JSON object with SNS metadata plus the actual message in the "Message" field.' },
              { line: '24', text: 'sqs_body["Message"] is our actual business payload as a JSON string. Double-decode: first SQS body, then SNS Message.' },
              { line: '38', text: 'Route based on eventType — even though the subscription filter already narrowed this, defensive handling makes the function robust.' }
            ]
          }
        ],
        defaultLang: 'python-subscriber',
        expectedOutput: 'Processing SNS event: type=ORDER_PLACED orderId=ord-001 msgId=abc-123\nUpdating inventory for order: ord-001 (amount=$59.99)'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'SNS CLI Commands',
      content: [
        {
          command: 'aws sns publish --topic-arn arn:aws:sns:us-east-1:123456789012:OrderEvents --message \'{"orderId":"ord-001","eventType":"ORDER_PLACED","amount":59.99}\' --message-attributes \'{"eventType":{"DataType":"String","StringValue":"ORDER_PLACED"}}\'',
          category: 'aws-cli',
          expectedOutput: '{\n  "MessageId": "12345678-1234-1234-1234-123456789012"\n}',
          explanation: 'Publishes a message to an SNS topic. All subscriptions that match the message attributes filter receive this message.',
          interviewQ: 'What is the difference between SNS message attributes and the message body, and why does it matter for filtering?',
          onRun: () => '{\n  "MessageId": "12345678-1234-1234-1234-123456789012"\n}'
        },
        {
          command: 'aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:123456789012:OrderEvents',
          category: 'aws-cli',
          expectedOutput: '{\n  "Subscriptions": [\n    {"SubscriptionArn": "arn:aws:sns:...","Protocol": "sqs","Endpoint": "arn:aws:sqs:...email-queue","Owner": "123456789012"},\n    {"SubscriptionArn": "arn:aws:sns:...","Protocol": "sqs","Endpoint": "arn:aws:sqs:...inventory-queue","Owner": "123456789012"},\n    {"SubscriptionArn": "arn:aws:sns:...","Protocol": "lambda","Endpoint": "arn:aws:lambda:...direct-handler","Owner": "123456789012"}\n  ]\n}',
          explanation: 'Lists all subscriptions for a topic. Shows protocol (sqs, lambda, http, email) and endpoint ARN. Useful to verify fan-out is configured correctly.',
          commonErrors: [
            { error: 'AuthorizationError', cause: 'Missing sns:ListSubscriptionsByTopic permission', fix: 'Add sns:ListSubscriptionsByTopic to the IAM policy' }
          ]
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'SNS CLI Lab',
        mode: 'simulated',
        initialText: 'SNS CLI Lab. Try:\n  aws sns list-topics\n  aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:123:OrderEvents\n  aws sns publish --topic-arn arn:aws:sns:us-east-1:123:OrderEvents --message "test"',
        commands: {
          'aws sns list-topics': {
            text: '{\n  "Topics": [\n    {"TopicArn": "arn:aws:sns:us-east-1:123456789012:OrderEvents"},\n    {"TopicArn": "arn:aws:sns:us-east-1:123456789012:Notifications"},\n    {"TopicArn": "arn:aws:sns:us-east-1:123456789012:DeploymentAlerts"}\n  ]\n}',
            type: 'output'
          },
          'aws sns publish --topic-arn arn:aws:sns:us-east-1:123:OrderEvents --message "test"': {
            text: '{\n  "MessageId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"\n}',
            type: 'success'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common SNS Issues',
      content: {
        items: [
          { title: 'Lambda not receiving SNS messages', error: 'SNS publish succeeds but Lambda is never invoked', cause: 'Lambda resource-based policy does not allow sns.amazonaws.com to invoke it. Or subscription filter is too restrictive.', fix: 'Add resource-based policy: aws lambda add-permission --action lambda:InvokeFunction --principal sns.amazonaws.com. Verify filter policy matches your MessageAttributes.' },
          { title: 'Messages lost after SNS publish', error: 'Messages published but no delivery confirmation', cause: 'SNS → Lambda direct: Lambda was throttled, SNS retried 3 times and discarded. No DLQ configured.', fix: 'Use SNS → SQS → Lambda instead. SQS persists messages through Lambda throttling and retries. Configure subscription DLQ (redrive policy on SQS or SNS subscription DLQ).' },
          { title: 'SNS message body not parsing correctly', error: 'json.JSONDecodeError when parsing SNS message', cause: 'Common mistake: trying to json.loads the SQS body directly without unwrapping the SNS envelope first.', fix: 'Double-decode: first sqs_body = json.loads(record["body"]), then payload = json.loads(sqs_body["Message"]). The SNS envelope wraps your payload in the "Message" field.' },
          { title: 'Filter policy not working', error: 'All subscribers receive all messages despite filter', cause: 'Filter policy is on message body fields, not MessageAttributes. SNS filtering only works on MessageAttributes.', fix: 'Move filter criteria to MessageAttributes when publishing: MessageAttributes={"eventType": {"DataType": "String", "StringValue": "ORDER_PLACED"}}' }
        ]
      }
    },

    {
      id: 'quiz-sns',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon SNS Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You publish an order event to SNS. You have 3 SQS subscribers with different filter policies. What happens if the message matches filters for subscribers 1 and 2 but NOT subscriber 3?',
            options: [
              { id: 'a', text: 'All 3 queues receive the message' },
              { id: 'b', text: 'Only subscriber 1 and 2 queues receive the message; subscriber 3 does not' },
              { id: 'c', text: 'No messages are delivered — all filters must match' },
              { id: 'd', text: 'SNS throws an error if any filter fails' }
            ],
            correctId: 'b',
            explanation: 'SNS filter policies are per-subscription. SNS evaluates each subscription\'s filter independently and delivers only to matching subscriptions. Subscribers with non-matching filters simply don\'t receive the message — this is the whole point of filtering.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'Your Lambda SNS subscriber throws an exception. SNS retries delivery. What happens after all retries are exhausted with no DLQ configured?',
            options: [
              { id: 'a', text: 'The message is stored for 24 hours and retried later' },
              { id: 'b', text: 'The message is permanently lost' },
              { id: 'c', text: 'SNS falls back to email delivery' },
              { id: 'd', text: 'The message is sent back to the publisher' }
            ],
            correctId: 'b',
            explanation: 'SNS direct Lambda delivery: SNS retries 3 times with exponential backoff. After all retries, if no DLQ is configured on the subscription, the message is permanently discarded. This is why SNS → SQS → Lambda is preferred in production — SQS adds persistence.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'When Lambda processes an SQS message that came from SNS (SNS → SQS → Lambda), where is your actual business data in the event?',
            options: [
              { id: 'a', text: 'event.Records[0].body directly' },
              { id: 'b', text: 'event.Records[0].Sns.Message' },
              { id: 'c', text: 'json.loads(event.Records[0].body)["Message"]' },
              { id: 'd', text: 'event.Records[0].attributes.Message' }
            ],
            correctId: 'c',
            explanation: 'SNS → SQS → Lambda involves double-wrapping: SQS record body contains the SNS envelope JSON. Inside that is the "Message" field (string) containing your actual payload. You must parse twice: body = json.loads(record["body"]), then payload = json.loads(body["Message"]).',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-sns',
      type: 'challenge',
      title: 'Challenge: Fan-Out Publisher',
      content: {
        title: 'Build an Order Events Fan-Out Publisher',
        description: 'Write a Lambda function that publishes order events to an SNS topic with correct message attributes for filtering. Different subscribers will receive different event types.',
        difficulty: 'intermediate',
        requirements: [
          'Parse the request body to get orderId, eventType, and amount',
          'Publish to SNS_TOPIC_ARN environment variable',
          'Include eventType as a MessageAttribute (DataType: String) for subscriber filtering',
          'Include orderTier as a MessageAttribute based on amount (premium if ≥ 100, standard otherwise)',
          'Log the MessageId after successful publish',
          'Return 202 Accepted with the MessageId'
        ],
        starterCode: `import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
    body = json.loads(event.get('body') or '{}')
    order_id   = body.get('orderId')
    event_type = body.get('eventType', 'ORDER_PLACED')
    amount     = body.get('amount', 0)

    if not order_id:
        return {'statusCode': 400, 'body': json.dumps({'error': 'orderId required'})}

    # TODO: Determine order tier based on amount
    # TODO: Build message attributes dict with eventType and orderTier
    # TODO: Publish to SNS with message + attributes
    # TODO: Log MessageId
    # TODO: Return 202 with messageId

    pass`,
        language: 'python',
        hints: [
          'tier = "premium" if amount >= 100 else "standard"',
          'MessageAttributes format: {"key": {"DataType": "String", "StringValue": "value"}}',
          'sns.publish(TopicArn=TOPIC_ARN, Message=json.dumps(body), MessageAttributes={...})',
          'response["MessageId"] contains the SNS message ID'
        ],
        testCases: [
          { description: 'Publishes to SNS topic', keywords: ['sns.publish', 'TopicArn'], expectedOutput: 'publish' },
          { description: 'Includes eventType in MessageAttributes', keywords: ['MessageAttributes', 'eventType'], expectedOutput: 'MessageAttributes' },
          { description: 'Determines premium vs standard tier', keywords: ['premium', 'standard'], expectedOutput: 'premium' },
          { description: 'Returns 202 status code', keywords: ['202'], expectedOutput: '202' },
          { description: 'Logs the MessageId', keywords: ['MessageId', 'logger'], expectedOutput: 'MessageId' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon SNS Hands-On Lab', content: {"title":"Amazon SNS Hands-On Lab","description":"Configure and test Amazon SNS following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open SNS Console","instruction":"AWS Console → Search \"SNS\" → Open service dashboard.","expectedResult":"SNS dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon SNS and what problem does it solve?","shortAnswer":"Amazon SNS is a managed AWS service that provides pub/sub messaging for sending notifications to multiple subscribers (Lambda, SQS, HTTP, email, SMS). It eliminates the need to build custom notification systems, manage fan-out logic, and handle subscriber management.","commonMistake":"Not using message filtering — all subscribers receive all messages without it.","followUp":"When would you NOT use Amazon SNS?"},{"difficulty":"beginner","question":"What are the key components of Amazon SNS?","shortAnswer":"Topics, Subscriptions, Message Filtering, Dead-Letter Queue, FIFO Topics, Message Attributes.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon SNS integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon SNS priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon SNS costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon SNS?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon SNS for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon SNS?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon SNS achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon SNS?"},{"difficulty":"intermediate","question":"Explain the Amazon SNS scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon SNS handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon SNS?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon SNS in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon SNS architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon SNS costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon SNS?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon SNS using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon SNS support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon SNS is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon SNS from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon SNS costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon SNS.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon SNS across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon SNS API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon SNS has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon SNS from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon SNS encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon SNS are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete SNS resources:</strong> Navigate to SNS console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the SNS console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 19: Amazon SQS', url: 'module-12.html' }, next: { title: 'Chapter 21: Amazon EventBridge', url: 'module-14.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_13_DATA;
} else {
  window.MODULE_13_DATA = MODULE_13_DATA;
}
