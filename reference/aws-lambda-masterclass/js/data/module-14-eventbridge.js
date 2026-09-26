/**
 * ============================================================
 * MODULE 14 — Amazon EventBridge
 * Event-driven architecture, buses, rules, patterns, scheduler
 * ============================================================
 */
const MODULE_14_DATA = {
  id: 'eventbridge-fundamentals',
  moduleId: 'module-14',
  title: 'Amazon EventBridge — Event-Driven Architecture',
  description: 'Build sophisticated event-driven systems with Amazon EventBridge. Covers event buses, rules, event patterns, content filtering, pipes, EventBridge Scheduler, and Lambda targets.',
  difficulty: 'advanced',
  duration: '85 min',
  prerequisites: ['Module 08: AWS Lambda', 'Module 12: SQS', 'Module 13: SNS'],
  objectives: [
    'Explain EventBridge event buses (default, custom, partner) and when to use each',
    'Write event pattern rules to filter and route events to Lambda targets',
    'Publish custom events to EventBridge from Lambda',
    'Use EventBridge Scheduler to replace CloudWatch Events cron jobs',
    'Implement content-based routing with complex filter patterns',
    'Design event-driven microservices with EventBridge as the backbone',
    'Monitor EventBridge with CloudWatch metrics and archive events for replay'
  ],

  sections: [
    {
      id: 'why-eventbridge',
      type: 'why',
      title: 'Why EventBridge?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔔</span>
            <div class="alert-content">
              <div class="alert-title">The Event Router for AWS</div>
              <div class="alert-text">EventBridge is a serverless event bus that routes events from AWS services, your applications, and SaaS providers to targets. Unlike SNS (point-to-point fan-out), EventBridge enables complex content-based routing, transformation, and replay without any code changes to publishers.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>SNS</th><th>EventBridge</th></tr></thead>
            <tbody>
              <tr><td>Routing</td><td>Topic + subscription filters</td><td>Content-based rules on any event field</td></tr>
              <tr><td>Event Sources</td><td>Your code (explicit publish)</td><td>200+ AWS services emit automatically</td></tr>
              <tr><td>Schema Registry</td><td>❌</td><td>✅ Auto-discovers and stores event schemas</td></tr>
              <tr><td>Event Archive</td><td>❌</td><td>✅ Archive for replay (debugging, migration)</td></tr>
              <tr><td>Input Transformation</td><td>❌</td><td>✅ Transform event before delivery to target</td></tr>
              <tr><td>Dead Letter Queue</td><td>Subscription-level DLQ</td><td>Rule target DLQ</td></tr>
              <tr><td>Partner Events</td><td>❌</td><td>✅ Datadog, GitHub, Shopify, Stripe, etc.</td></tr>
              <tr><td>Scheduler</td><td>❌</td><td>✅ One-time and recurring schedules</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">EventBridge is the Modern CloudWatch Events</div>
              <div class="alert-text">CloudWatch Events is now EventBridge. The default event bus IS CloudWatch Events. All your CloudWatch Events rules appear in EventBridge. EventBridge adds custom buses, schema registry, pipes, and Scheduler on top.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'EventBridge Architecture',
      content: {
        title: 'EventBridge — Content-Based Routing & Multi-Target Fan-Out',
        width: 750,
        height: 300,
        nodes: [
          { id: 'aws-service', label: 'AWS Services', icon: '☁️', x: 10, y: 60, type: 'trigger', description: 'AWS services automatically emit events to the default event bus: EC2 state changes, S3 events, CodePipeline stage changes, ECS task state changes, etc.' },
          { id: 'custom-app', label: 'Custom App Lambda', icon: '⚡', x: 10, y: 160, type: 'compute', description: 'Your Lambda functions publish custom events to a custom event bus using PutEvents API.', eventPayload: { Source: 'com.myapp.orders', DetailType: 'OrderPlaced', Detail: { orderId: 'ord-001', amount: 99.99, tier: 'premium' } } },
          { id: 'eb-bus', label: 'EventBridge Bus', icon: '🔔', x: 210, y: 110, type: 'event', description: 'Event bus receives events from all sources. Rules evaluate each incoming event against their patterns and route matching events to configured targets.' },
          { id: 'rule-premium', label: 'Rule: Premium Orders', icon: '🎯', x: 390, y: 40, type: 'security', description: 'Pattern: {"source": ["com.myapp.orders"], "detail": {"tier": ["premium"]}}. Only premium orders trigger this rule.' },
          { id: 'rule-all', label: 'Rule: All Orders', icon: '🎯', x: 390, y: 130, type: 'security', description: 'Pattern: {"source": ["com.myapp.orders"]}. Matches all order events regardless of tier.' },
          { id: 'rule-schedule', label: 'Scheduled Rule', icon: '⏰', x: 390, y: 220, type: 'security', description: 'Cron expression: cron(0 9 * * ? *). Fires every day at 9am UTC to trigger daily reports.' },
          { id: 'lambda-premium', label: 'VIP Lambda', icon: '⚡', x: 600, y: 40, type: 'compute', description: 'Sends VIP treatment email for premium orders.' },
          { id: 'lambda-all', label: 'Analytics Lambda', icon: '⚡', x: 600, y: 130, type: 'compute', description: 'Records all orders to data warehouse.' },
          { id: 'lambda-report', label: 'Report Lambda', icon: '⚡', x: 600, y: 220, type: 'compute', description: 'Generates and sends daily summary report.' }
        ],
        edges: [
          { from: 'aws-service', to: 'eb-bus', label: 'Auto-emit', animated: true },
          { from: 'custom-app', to: 'eb-bus', label: 'PutEvents', animated: true },
          { from: 'eb-bus', to: 'rule-premium', label: 'Match' },
          { from: 'eb-bus', to: 'rule-all', label: 'Match' },
          { from: 'eb-bus', to: 'rule-schedule', label: 'Cron' },
          { from: 'rule-premium', to: 'lambda-premium', label: 'Invoke', animated: true },
          { from: 'rule-all', to: 'lambda-all', label: 'Invoke', animated: true },
          { from: 'rule-schedule', to: 'lambda-report', label: 'Invoke', animated: true }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Event Buses</h4>
          <ul>
            <li><strong>Default Bus</strong>: AWS service events. One per region per account. Cannot be deleted.</li>
            <li><strong>Custom Bus</strong>: Your application events. Create separate buses per domain (orders, users, payments) for clear ownership.</li>
            <li><strong>Partner Bus</strong>: SaaS partner events (Datadog, Shopify, GitHub). No publish code needed — partners push directly.</li>
          </ul>

          <h4>2. Event Structure</h4>
          <p>Every EventBridge event has the same envelope:</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">{
  "version": "0",
  "id": "12345678-1234-1234-1234-123456789012",
  "source": "com.myapp.orders",      // Who sent it
  "account": "123456789012",
  "time": "2026-09-16T02:00:00Z",
  "region": "us-east-1",
  "detail-type": "OrderPlaced",     // What happened
  "detail": {                        // Your business payload
    "orderId": "ord-001",
    "amount": 99.99,
    "tier": "premium"
  }
}</pre>

          <h4>3. Event Patterns (Rules)</h4>
          <p>Rules filter events using pattern matching. Patterns can match on any field including nested detail fields:</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">// Simple pattern — all order events
{"source": ["com.myapp.orders"]}

// Content-based — premium orders only
{"source": ["com.myapp.orders"], "detail": {"tier": ["premium"]}}

// Numeric range — orders over $100
{"detail": {"amount": [{"numeric": [">", 100]}]}}

// Prefix match — any EC2 event
{"source": ["aws.ec2"]}</pre>

          <h4>4. Input Transformation</h4>
          <p>Transform the event before delivering to the target — reshape the payload without Lambda code:</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">// Input transformer — extract only what Lambda needs
InputPathsMap: {"orderId": "$.detail.orderId", "amount": "$.detail.amount"}
InputTemplate: '{"order": "<orderId>", "value": "<amount>"}'</pre>

          <h4>5. EventBridge Scheduler</h4>
          <p>Replaces cron-based CloudWatch Events for invoking Lambda on a schedule. Supports:</p>
          <ul>
            <li><strong>Cron expressions</strong>: <code>cron(0 9 * * ? *)</code> — 9am UTC daily</li>
            <li><strong>Rate expressions</strong>: <code>rate(5 minutes)</code></li>
            <li><strong>One-time schedules</strong>: Specific date/time (great for deferred jobs)</li>
          </ul>

          <h4>6. Archive & Replay</h4>
          <p>Archive events for any period (or indefinitely). Replay archived events to a bus to:</p>
          <ul>
            <li>Debug production issues by re-processing historical events</li>
            <li>Backfill new services when they come online</li>
            <li>Test new rule configurations against real historical data</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'EventBridge Publisher & Handler',
      content: {
        title: 'EventBridge PutEvents + Lambda Target Handler',
        languages: [
          {
            id: 'python-publish',
            label: 'Publisher',
            code: `import json
import boto3
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Global EventBridge client
events = boto3.client('events')
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'default')

def lambda_handler(event, context):
    """
    Publish custom events to EventBridge.
    Called after order is created in DynamoDB.
    """
    body = json.loads(event.get('body') or '{}')
    order_id = body.get('orderId')
    user_id  = body.get('userId')
    amount   = body.get('amount', 0)
    tier     = 'premium' if amount >= 100 else 'standard'

    # Build EventBridge event entries
    entries = [
        {
            'Source': 'com.myapp.orders',
            'DetailType': 'OrderPlaced',
            'Detail': json.dumps({
                'orderId':   order_id,
                'userId':    user_id,
                'amount':    amount,
                'tier':      tier,
                'timestamp': datetime.utcnow().isoformat()
            }),
            'EventBusName': EVENT_BUS_NAME,
            # Optional: resources this event relates to
            'Resources': [
                f'arn:aws:dynamodb:us-east-1:123456789012:table/Orders/item/{order_id}'
            ]
        }
    ]

    # PutEvents supports up to 10 entries per call
    response = events.put_events(Entries=entries)

    failed = response.get('FailedEntryCount', 0)
    if failed > 0:
        logger.error("EventBridge failures: %s", response['Entries'])
        return build_response(500, {'error': 'Failed to publish events'})

    entry = response['Entries'][0]
    event_id = entry.get('EventId')
    logger.info("Published OrderPlaced: eventId=%s orderId=%s tier=%s",
                event_id, order_id, tier)

    return build_response(202, {
        'eventId': event_id,
        'orderId': order_id,
        'tier': tier
    })

def build_response(status, body):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(body)
    }`,
            explanations: [
              { line: '22', text: '"Source" is your application identifier. Use reverse-domain notation (com.company.domain) to avoid conflicts with AWS sources (aws.*).' },
              { line: '23', text: '"DetailType" describes WHAT happened in human-readable terms. Think of it as the event name. Consumers use this for routing and logging.' },
              { line: '24', text: '"Detail" is your business payload as a JSON string. EventBridge limits Detail to 256 KB.' },
              { line: '43', text: 'PutEvents accepts up to 10 events per call. FailedEntryCount > 0 means some events failed — inspect Entries[i].ErrorCode and ErrorMessage.' }
            ]
          },
          {
            id: 'python-handler',
            label: 'Lambda Target Handler',
            code: `import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ses = boto3.client('ses')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@myapp.com')

def lambda_handler(event, context):
    """
    EventBridge Lambda target — invoked when an OrderPlaced event matches
    the "premium orders" rule pattern.
    
    EventBridge delivers the FULL event envelope as the Lambda event.
    Unlike SNS/SQS, there's no Records wrapper — event IS the EventBridge event.
    """
    # EventBridge event structure
    source      = event.get('source')           # com.myapp.orders
    detail_type = event.get('detail-type')      # OrderPlaced
    detail      = event.get('detail', {})       # Your business payload
    event_time  = event.get('time')
    event_id    = event.get('id')

    order_id = detail.get('orderId')
    user_id  = detail.get('userId')
    amount   = detail.get('amount', 0)
    tier     = detail.get('tier', 'standard')

    logger.info(
        "EventBridge event received: source=%s type=%s id=%s orderId=%s tier=%s",
        source, detail_type, event_id, order_id, tier
    )

    if detail_type == 'OrderPlaced' and tier == 'premium':
        send_vip_email(order_id, user_id, amount)

    elif detail_type == 'OrderCancelled':
        handle_cancellation(order_id, user_id)

    # EventBridge Lambda targets are async — no response needed
    # Returning anything is fine; EventBridge ignores it

def send_vip_email(order_id, user_id, amount):
    logger.info("Sending VIP confirmation for order: %s (user=%s amount=$%.2f)",
                order_id, user_id, amount)
    # ses.send_email(...)  # SES email logic here

def handle_cancellation(order_id, user_id):
    logger.info("Processing cancellation: order=%s user=%s", order_id, user_id)


# =========================================================
# SCHEDULED RULE HANDLER — daily report
# =========================================================
def scheduled_report_handler(event, context):
    """
    Invoked by EventBridge scheduled rule: cron(0 9 * * ? *)
    The event.source for scheduled rules is: "aws.events"
    """
    logger.info("Running daily report. Scheduled at: %s", event.get('time'))
    # Generate and send daily report...`,
            explanations: [
              { line: '13-14', text: 'CRITICAL DIFFERENCE: EventBridge invokes Lambda with the full event envelope directly — no Records wrapper, no Sns envelope. event IS the EventBridge event object.' },
              { line: '20', text: '"detail-type" (with hyphen) not "detail_type". Python dicts use the key as-is from JSON. Must use event.get("detail-type").' },
              { line: '21', text: '"detail" is already a Python dict (EventBridge parses it from JSON string before delivery). No json.loads() needed.' },
              { line: '44', text: 'EventBridge invokes Lambda asynchronously. Return value is ignored. Lambda must handle idempotency — EventBridge may retry on throttle or error.' }
            ]
          }
        ],
        defaultLang: 'python-publish',
        expectedOutput: '{\n  "statusCode": 202,\n  "body": "{\\"eventId\\":\\"a1b2c3d4-...\\",\\"orderId\\":\\"ord-001\\",\\"tier\\":\\"premium\\"}"\n}'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'EventBridge CLI Commands',
      content: [
        {
          command: 'aws events put-events --entries \'[{"Source":"com.myapp.orders","DetailType":"OrderPlaced","Detail":"{\\"orderId\\":\\"ord-001\\",\\"amount\\":99.99,\\"tier\\":\\"premium\\"}","EventBusName":"myapp-orders-bus"}]\'',
          category: 'aws-cli',
          expectedOutput: '{\n  "FailedEntryCount": 0,\n  "Entries": [{\n    "EventId": "a1b2c3d4-5678-90ab-cdef-EXAMPLE11111"\n  }]\n}',
          explanation: 'Publishes an event to a custom EventBridge bus. FailedEntryCount=0 means success. Check Entries[].ErrorCode if FailedEntryCount > 0.',
          interviewQ: 'What does FailedEntryCount > 0 mean in a PutEvents response, and how do you handle partial failures?',
          onRun: () => '{\n  "FailedEntryCount": 0,\n  "Entries": [{"EventId": "a1b2c3d4-5678-90ab-cdef-EXAMPLE11111"}]\n}'
        },
        {
          command: 'aws events list-rules --event-bus-name myapp-orders-bus',
          category: 'aws-cli',
          expectedOutput: '{\n  "Rules": [\n    {\n      "Name": "premium-orders-rule",\n      "EventPattern": "{\\"source\\":[\\"com.myapp.orders\\"],\\"detail\\":{\\"tier\\":[\\"premium\\"]}}",\n      "State": "ENABLED",\n      "EventBusName": "myapp-orders-bus"\n    },\n    {\n      "Name": "daily-report-schedule",\n      "ScheduleExpression": "cron(0 9 * * ? *)",\n      "State": "ENABLED",\n      "EventBusName": "default"\n    }\n  ]\n}',
          explanation: 'Lists all rules on a specific event bus. Rules can have EventPattern (for event-based routing) OR ScheduleExpression (for cron), but not both.',
          commonErrors: [
            { error: 'ResourceNotFoundException', cause: 'Event bus name doesn\'t exist or is misspelled', fix: 'List event buses first: aws events list-event-buses' }
          ],
          interviewQ: 'What is the difference between an EventBridge rule with EventPattern vs ScheduleExpression?'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'EventBridge CLI Lab',
        mode: 'simulated',
        initialText: 'EventBridge CLI Lab. Try:\n  aws events list-event-buses\n  aws events list-rules --event-bus-name default\n  aws events describe-rule --name premium-orders-rule --event-bus-name myapp-orders-bus\n  aws events put-events ...',
        commands: {
          'aws events list-event-buses': {
            text: '{\n  "EventBuses": [\n    {"Name": "default", "Arn": "arn:aws:events:us-east-1:123456789012:event-bus/default"},\n    {"Name": "myapp-orders-bus", "Arn": "arn:aws:events:us-east-1:123456789012:event-bus/myapp-orders-bus"},\n    {"Name": "myapp-users-bus", "Arn": "arn:aws:events:us-east-1:123456789012:event-bus/myapp-users-bus"}\n  ]\n}',
            type: 'output'
          },
          'aws events list-rules --event-bus-name default': {
            text: '{\n  "Rules": [\n    {"Name": "daily-report", "ScheduleExpression": "cron(0 9 * * ? *)", "State": "ENABLED"},\n    {"Name": "ec2-state-monitor", "EventPattern": "{\\"source\\":[\\"aws.ec2\\"]}", "State": "ENABLED"}\n  ]\n}',
            type: 'output'
          },
          'aws events describe-rule --name premium-orders-rule --event-bus-name myapp-orders-bus': {
            text: '{\n  "Name": "premium-orders-rule",\n  "EventBusName": "myapp-orders-bus",\n  "EventPattern": "{\\"source\\":[\\"com.myapp.orders\\"],\\"detail\\":{\\"tier\\":[\\"premium\\"]}}",\n  "State": "ENABLED",\n  "Description": "Route premium orders to VIP Lambda"\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common EventBridge Issues',
      content: {
        items: [
          { title: 'Events published but Lambda not invoked', error: 'PutEvents succeeds, Lambda never fires', cause: 'Rule pattern doesn\'t match the event. Most common: source or detail-type has a typo, or detail fields don\'t match the pattern structure.', fix: 'Use EventBridge console "Test event pattern" tool with a sample event. Check that source, detail-type, and detail field values exactly match. Remember: patterns use arrays for values (["ORDER_PLACED"] not "ORDER_PLACED").' },
          { title: 'Lambda lacks permission to be invoked by EventBridge', error: 'AccessDeniedException from EventBridge', cause: 'Lambda resource-based policy doesn\'t allow events.amazonaws.com to invoke the function.', fix: 'Add resource policy: aws lambda add-permission --action lambda:InvokeFunction --principal events.amazonaws.com --source-arn arn:aws:events:...:rule/your-rule-name' },
          { title: 'FailedEntryCount > 0 in PutEvents', error: 'Some events failed to publish', cause: 'Individual entries in the batch failed: missing required fields (Source, DetailType, Detail), Detail > 256KB, or invalid bus name.', fix: 'Check Entries[i].ErrorCode and ErrorMessage for each failed entry. Each entry fails/succeeds independently. Re-send only the failed entries.' },
          { title: 'Scheduled rule not firing at expected time', error: 'Cron rule misses expected invocations', cause: 'EventBridge cron uses UTC timezone (? for day-of-week or day-of-month), not the local timezone. Common mistake: cron(0 9 * * ? *) fires at 9am UTC, not local time.', fix: 'Convert your local time to UTC. Use EventBridge Scheduler for timezone-aware scheduling with named timezones (e.g., America/New_York).' }
        ]
      }
    },

    {
      id: 'quiz-eventbridge',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon EventBridge Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You publish events with source="com.myapp.orders" and detail.tier="premium". Your EventBridge rule pattern is {"source": ["com.myapp.orders"], "detail": {"tier": ["premium"]}}. Will this rule match?',
            options: [
              { id: 'a', text: 'No — detail must use prefix matching, not exact match' },
              { id: 'b', text: 'Yes — the source and detail.tier both match the pattern arrays' },
              { id: 'c', text: 'No — you cannot filter on nested detail fields' },
              { id: 'd', text: 'Yes, but only if the event is on the default bus' }
            ],
            correctId: 'b',
            explanation: 'EventBridge patterns match when ALL specified fields match. Array values in patterns mean "any of these values". source matches "com.myapp.orders" ✓, detail.tier matches "premium" ✓. Both match → rule fires.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'How does Lambda receive an EventBridge event delivered via a rule, compared to an SQS message?',
            options: [
              { id: 'a', text: 'EventBridge uses event.Records[0].detail, SQS uses event.Records[0].body' },
              { id: 'b', text: 'EventBridge delivers the full event envelope directly as the Lambda event (no Records wrapper). SQS uses event.Records[].' },
              { id: 'c', text: 'They use the same format — both have event.Records[]' },
              { id: 'd', text: 'EventBridge only invokes Lambda via SQS queue, not directly' }
            ],
            correctId: 'b',
            explanation: 'Critical difference: EventBridge delivers the event directly — event.source, event["detail-type"], event.detail are top-level fields. SQS uses event.Records[]. SNS (direct) also uses event.Records[]. Always check the specific trigger type in the Lambda docs.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'You want to trigger a Lambda at 6pm New York time every weekday. What is the best approach?',
            options: [
              { id: 'a', text: 'Use EventBridge rule with cron(0 18 ? * MON-FRI *) — EventBridge handles timezone conversion' },
              { id: 'b', text: 'Calculate UTC offset and use EventBridge Scheduler with America/New_York timezone' },
              { id: 'c', text: 'Use a Lambda running every minute that checks the current time' },
              { id: 'd', text: 'EventBridge schedules cannot target specific timezones' }
            ],
            correctId: 'b',
            explanation: 'EventBridge Scheduler (not Rules) supports named timezones like America/New_York. Rules cron expressions only support UTC. For timezone-aware scheduling, always use EventBridge Scheduler, which handles DST transitions automatically.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-eventbridge',
      type: 'challenge',
      title: 'Challenge: Event-Driven Order Processor',
      content: {
        title: 'Build a Complete Event-Driven Order System',
        description: 'Write both the publisher Lambda (publishes order events to EventBridge) and the subscriber Lambda (processes premium order events). The subscriber must extract the business payload from the EventBridge envelope.',
        difficulty: 'advanced',
        requirements: [
          'Publisher: Parse request body and publish to EVENT_BUS_NAME env var',
          'Publisher: Set source="com.myapp.orders" and detail-type="OrderPlaced"',
          'Publisher: Set tier="premium" if amount >= 100, else "standard"',
          'Publisher: Check FailedEntryCount and return appropriate error if > 0',
          'Subscriber: Extract detail-type and detail from EventBridge event (no Records wrapper)',
          'Subscriber: Log source, detail-type, orderId, and tier',
          'Subscriber: Call handle_premium_order() only for tier="premium"'
        ],
        starterCode: `import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

events = boto3.client('events')
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'default')

# ---- PUBLISHER ----
def publish_handler(event, context):
    body = json.loads(event.get('body') or '{}')
    order_id = body.get('orderId')
    amount   = body.get('amount', 0)

    # TODO: Determine tier
    # TODO: Build and publish event entry
    # TODO: Check FailedEntryCount
    pass

# ---- SUBSCRIBER ----
def subscribe_handler(event, context):
    # EventBridge delivers full event as Lambda event (no Records wrapper)
    # TODO: Extract source, detail-type, and detail from event
    # TODO: Get orderId and tier from detail
    # TODO: Log all fields
    # TODO: Call handle_premium_order() if tier == "premium"
    pass

def handle_premium_order(order_id, amount):
    logger.info("VIP order handling: orderId=%s amount=%.2f", order_id, amount)`,
        language: 'python',
        hints: [
          'Tier: tier = "premium" if amount >= 100 else "standard"',
          'PutEvents entry needs Source, DetailType, Detail (JSON string), EventBusName',
          'Check: if response["FailedEntryCount"] > 0: return error',
          'Subscriber: detail_type = event.get("detail-type") (hyphen, not underscore)',
          'Subscriber: detail = event.get("detail", {}) — already a dict, no json.loads needed'
        ],
        testCases: [
          { description: 'Publisher uses put_events', keywords: ['put_events'], expectedOutput: 'put_events' },
          { description: 'Sets correct source for events', keywords: ['com.myapp.orders'], expectedOutput: 'com.myapp.orders' },
          { description: 'Determines tier by amount threshold', keywords: ['premium', 'standard', '100'], expectedOutput: 'premium' },
          { description: 'Checks FailedEntryCount', keywords: ['FailedEntryCount'], expectedOutput: 'FailedEntryCount' },
          { description: 'Subscriber reads detail-type correctly', keywords: ['detail-type'], expectedOutput: 'detail-type' },
          { description: 'Calls handle_premium_order for premium tier', keywords: ['handle_premium_order', 'premium'], expectedOutput: 'handle_premium_order' }
        ]
      }
    },

    {
      id: 'cheat-sheet',
      type: 'text',
      title: 'EventBridge Cheat Sheet',
      content: {
        html: `
          <table>
            <thead><tr><th>Feature</th><th>Value / Limit</th></tr></thead>
            <tbody>
              <tr><td>Event size</td><td>256 KB (Detail field)</td></tr>
              <tr><td>PutEvents batch size</td><td>Up to 10 events per call</td></tr>
              <tr><td>Rules per bus</td><td>300 (soft limit)</td></tr>
              <tr><td>Targets per rule</td><td>5 per rule</td></tr>
              <tr><td>Rule evaluation</td><td>~500ms from publish</td></tr>
              <tr><td>Archive retention</td><td>Configurable (0 = indefinite)</td></tr>
              <tr><td>Scheduler one-time</td><td>Up to 1 year in advance</td></tr>
              <tr><td>Scheduler timezones</td><td>All IANA timezones supported</td></tr>
              <tr><td>Partner event sources</td><td>200+ SaaS integrations</td></tr>
              <tr><td>Cross-account delivery</td><td>Requires resource-based bus policy</td></tr>
            </tbody>
          </table>
          <h4 style="margin-top:20px;">Cron Expression Reference</h4>
          <table>
            <thead><tr><th>Expression</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td><code>cron(0 9 * * ? *)</code></td><td>Every day at 9:00 AM UTC</td></tr>
              <tr><td><code>cron(0/5 * * * ? *)</code></td><td>Every 5 minutes</td></tr>
              <tr><td><code>cron(0 18 ? * MON-FRI *)</code></td><td>6:00 PM UTC, Mon–Fri</td></tr>
              <tr><td><code>cron(0 0 1 * ? *)</code></td><td>Midnight UTC on 1st of each month</td></tr>
              <tr><td><code>rate(5 minutes)</code></td><td>Every 5 minutes (simpler)</td></tr>
            </tbody>
          </table>
        `
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon EventBridge Hands-On Lab', content: {"title":"Amazon EventBridge Hands-On Lab","description":"Configure and test Amazon EventBridge following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open EventBridge Console","instruction":"AWS Console → Search \"EventBridge\" → Open service dashboard.","expectedResult":"EventBridge dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon EventBridge and what problem does it solve?","shortAnswer":"Amazon EventBridge is a managed AWS service that provides serverless event bus for building event-driven architectures with rules-based routing. It eliminates the need to build custom event routing, manage event schemas, and handle cross-account event delivery.","commonMistake":"Using SNS for event routing when EventBridge provides better filtering and transformation.","followUp":"When would you NOT use Amazon EventBridge?"},{"difficulty":"beginner","question":"What are the key components of Amazon EventBridge?","shortAnswer":"Event Bus, Rules, Targets, Schemas, Pipes, Archive and Replay, Partner Integrations.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon EventBridge integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon EventBridge priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon EventBridge costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon EventBridge?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon EventBridge for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon EventBridge?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon EventBridge achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon EventBridge?"},{"difficulty":"intermediate","question":"Explain the Amazon EventBridge scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon EventBridge handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon EventBridge?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon EventBridge in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon EventBridge architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon EventBridge costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon EventBridge?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon EventBridge using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon EventBridge support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon EventBridge is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon EventBridge from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon EventBridge costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon EventBridge.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon EventBridge across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon EventBridge API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon EventBridge has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon EventBridge from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon EventBridge encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon EventBridge are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete EventBridge resources:</strong> Navigate to EventBridge console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the EventBridge console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 20: Amazon SNS', url: 'module-13.html' }, next: { title: 'Chapter 22: AWS Step Functions', url: 'module-35.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_14_DATA;
} else {
  window.MODULE_14_DATA = MODULE_14_DATA;
}
