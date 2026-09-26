/**
 * ============================================================
 * MODULE 10 — Amazon DynamoDB
 * NoSQL data modeling, CRUD, Streams, GSI/LSI, Lambda integration
 * ============================================================
 */
const MODULE_10_DATA = {
  id: 'dynamodb-fundamentals',
  moduleId: 'module-10',
  title: 'Amazon DynamoDB — NoSQL Database for Serverless',
  description: 'Master DynamoDB for serverless architectures. Covers single-table design, CRUD operations with Boto3/SDK, Global Secondary Indexes, DynamoDB Streams with Lambda, and best practices.',
  difficulty: 'intermediate',
  duration: '90 min',
  prerequisites: ['Module 08: AWS Lambda', 'Basic JSON/key-value concepts'],
  objectives: [
    'Explain DynamoDB core concepts: tables, items, attributes, partition key, sort key',
    'Design an efficient single-table data model with access pattern analysis',
    'Perform CRUD operations using Boto3 and the AWS SDK for JavaScript',
    'Use Query vs Scan and understand when each is appropriate',
    'Create and query Global Secondary Indexes (GSI)',
    'Trigger Lambda from DynamoDB Streams for real-time event processing',
    'Understand DynamoDB pricing: on-demand vs provisioned capacity'
  ],

  sections: [
    {
      id: 'why-dynamodb',
      type: 'why',
      title: 'Why DynamoDB?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🗄️</span>
            <div class="alert-content">
              <div class="alert-title">The Natural Match for Serverless</div>
              <div class="alert-text">DynamoDB and Lambda are designed for the same world: zero server management, instant scaling, and pay-per-use billing. Unlike RDS, DynamoDB has no idle connection overhead, no VPC complexity for basic access, and scales automatically.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Concern</th><th>RDS (Relational)</th><th>DynamoDB (NoSQL)</th></tr></thead>
            <tbody>
              <tr><td>Connection Model</td><td>TCP connections — Limited pool, cold start issue with Lambda</td><td>HTTP API — Stateless, no connection limits</td></tr>
              <tr><td>Scaling</td><td>Vertical (instance size) + Read replicas</td><td>Horizontal — Unlimited throughput on-demand</td></tr>
              <tr><td>Latency</td><td>5–20ms single-digit queries</td><td>Single-digit milliseconds at any scale</td></tr>
              <tr><td>Schema</td><td>Fixed — requires migrations</td><td>Flexible — per-item attributes</td></tr>
              <tr><td>Pricing</td><td>Per hour (EC2-like)</td><td>Per request + GB storage</td></tr>
              <tr><td>Joins</td><td>Native SQL JOINs</td><td>Single-table design (precomputed joins)</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">DynamoDB ≠ a Replacement for Every Database</div>
              <div class="alert-text">DynamoDB excels when access patterns are known upfront and data is read by key. For complex reporting, ad-hoc queries, or relational data with many-to-many relationships, Aurora or Redshift may be more appropriate.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'DynamoDB + Lambda Architecture',
      content: {
        title: 'Lambda ↔ DynamoDB Event-Driven Data Flow',
        width: 750,
        height: 280,
        nodes: [
          { id: 'api', label: 'API Gateway', icon: '🌐', x: 10, y: 110, type: 'trigger', description: 'HTTP requests trigger Lambda via API Gateway proxy integration.' },
          { id: 'lambda-crud', label: 'CRUD Lambda', icon: '⚡', x: 160, y: 110, type: 'compute', description: 'Lambda function performs DynamoDB operations using Boto3/SDK. Reads and writes items by primary key.', eventPayload: { operation: 'PutItem', TableName: 'orders', Item: { orderId: 'ord-001', userId: 'u-123', status: 'PENDING', amount: 59.99 } } },
          { id: 'dynamodb', label: 'DynamoDB Table', icon: '🗄️', x: 340, y: 110, type: 'storage', description: 'Stores items with partition key (PK) and optional sort key (SK). Each item can have different attributes.' },
          { id: 'gsi', label: 'GSI', icon: '🔍', x: 340, y: 220, type: 'storage', description: 'Global Secondary Index enables querying on non-primary key attributes. Projects copies of items with different PK/SK.' },
          { id: 'streams', label: 'DynamoDB Streams', icon: '📡', x: 510, y: 110, type: 'event', description: 'Streams capture INSERT, MODIFY, REMOVE events as ordered records. Each record contains old and new item images.' },
          { id: 'lambda-stream', label: 'Stream Lambda', icon: '⚡', x: 620, y: 110, type: 'compute', description: 'Lambda polls the stream shard, receives batches of change records, and processes them (e.g., send notifications, update search index, audit log).', eventPayload: { Records: [{ eventName: 'INSERT', dynamodb: { NewImage: { orderId: { S: 'ord-001' }, status: { S: 'PENDING' } } } }] } }
        ],
        edges: [
          { from: 'api', to: 'lambda-crud', label: 'HTTP', animated: true },
          { from: 'lambda-crud', to: 'dynamodb', label: 'SDK', animated: true },
          { from: 'dynamodb', to: 'gsi', label: 'Index' },
          { from: 'dynamodb', to: 'streams', label: 'Change Feed', animated: true },
          { from: 'streams', to: 'lambda-stream', label: 'Batch', animated: true }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Primary Key</h4>
          <p>Every item must have a unique primary key. Two options:</p>
          <ul>
            <li><strong>Simple PK</strong>: Partition Key (PK) only — e.g., <code>userId</code></li>
            <li><strong>Composite PK</strong>: Partition Key + Sort Key (SK) — e.g., <code>userId</code> + <code>orderDate</code></li>
          </ul>

          <h4>2. Single-Table Design</h4>
          <p>Store multiple entity types in one table using a generic PK/SK convention. This precomputes joins at write time and enables all access patterns with a single Query call.</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">PK              | SK                | attributes
USER#u-123      | PROFILE           | name, email, createdAt
USER#u-123      | ORDER#ord-001     | amount, status, items
USER#u-123      | ORDER#ord-002     | amount, status, items
ORDER#ord-001   | METADATA          | userId, totalAmount, shippingAddr</pre>

          <h4>3. Query vs Scan</h4>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Never Scan in Production</div>
              <div class="alert-text">Scan reads every item in your table — O(n) cost and latency. Always use Query with a known partition key. If you need to query by a non-key attribute, create a GSI.</div>
            </div>
          </div>

          <h4>4. Global Secondary Indexes (GSI)</h4>
          <p>Create up to 20 GSIs per table. A GSI has its own PK/SK and projects copies of items. Example: table PK is <code>userId</code> but you need to query by <code>email</code> — create a GSI with PK=<code>email</code>.</p>

          <h4>5. DynamoDB Streams</h4>
          <p>An ordered, 24-hour log of item-level modifications. Each record contains:</p>
          <ul>
            <li><code>eventName</code>: INSERT | MODIFY | REMOVE</li>
            <li><code>NewImage</code>: Item after the change</li>
            <li><code>OldImage</code>: Item before the change (if StreamViewType includes it)</li>
          </ul>

          <h4>6. Capacity Modes</h4>
          <ul>
            <li><strong>On-Demand</strong>: Pay per request. No capacity planning. Best for spiky/unpredictable workloads.</li>
            <li><strong>Provisioned</strong>: Set RCU/WCU. Cheaper at steady, predictable load. Auto Scaling adjusts within configured bounds.</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Lambda + DynamoDB — CRUD Operations',
      content: {
        title: 'DynamoDB CRUD with Boto3 (Python)',
        languages: [
          {
            id: 'python',
            label: 'Python (Boto3)',
            code: `import json
import boto3
import os
import uuid
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr

# Global: DynamoDB resource — reused across warm invocations
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    method = event.get('httpMethod')
    path   = event.get('path', '')

    if method == 'GET' and path == '/orders':
        return get_orders(event)
    elif method == 'GET' and '{orderId}' in path:
        return get_order(event)
    elif method == 'POST' and path == '/orders':
        return create_order(event)
    elif method == 'PUT':
        return update_order(event)
    elif method == 'DELETE':
        return delete_order(event)
    return build_response(404, {'error': 'Route not found'})

# ---- GET all orders for a user ----
def get_orders(event):
    user_id = event.get('queryStringParameters', {}).get('userId')
    if not user_id:
        return build_response(400, {'error': 'userId query param required'})

    # Query by PK — efficient! Never scan for this.
    response = table.query(
        KeyConditionExpression=Key('PK').eq(f'USER#{user_id}') &
                               Key('SK').begins_with('ORDER#')
    )
    return build_response(200, response['Items'])

# ---- GET single order ----
def get_order(event):
    order_id = event['pathParameters']['orderId']
    user_id  = event.get('queryStringParameters', {}).get('userId')

    response = table.get_item(
        Key={'PK': f'USER#{user_id}', 'SK': f'ORDER#{order_id}'}
    )
    item = response.get('Item')
    if not item:
        return build_response(404, {'error': 'Order not found'})
    return build_response(200, item)

# ---- POST create order ----
def create_order(event):
    body = json.loads(event.get('body') or '{}')
    user_id  = body.get('userId')
    items    = body.get('items', [])
    if not user_id or not items:
        return build_response(400, {'error': 'userId and items are required'})

    order_id = str(uuid.uuid4())
    order = {
        'PK':        f'USER#{user_id}',
        'SK':        f'ORDER#{order_id}',
        'orderId':   order_id,
        'userId':    user_id,
        'items':     items,
        'status':    'PENDING',
        'createdAt': datetime.utcnow().isoformat(),
    }
    table.put_item(Item=order)
    return build_response(201, order)

# ---- PUT update order status ----
def update_order(event):
    order_id = event['pathParameters']['orderId']
    body     = json.loads(event.get('body') or '{}')
    user_id  = body.get('userId')
    status   = body.get('status')
    if not status:
        return build_response(400, {'error': 'status is required'})

    # Conditional update — only update if order exists
    response = table.update_item(
        Key={'PK': f'USER#{user_id}', 'SK': f'ORDER#{order_id}'},
        UpdateExpression='SET #s = :status, updatedAt = :now',
        ExpressionAttributeNames={'#s': 'status'},   # 'status' is reserved
        ExpressionAttributeValues={
            ':status': status,
            ':now': datetime.utcnow().isoformat()
        },
        ConditionExpression=Attr('orderId').exists(),
        ReturnValues='ALL_NEW'
    )
    return build_response(200, response.get('Attributes', {}))

# ---- DELETE order ----
def delete_order(event):
    order_id = event['pathParameters']['orderId']
    user_id  = event.get('queryStringParameters', {}).get('userId')

    table.delete_item(Key={'PK': f'USER#{user_id}', 'SK': f'ORDER#{order_id}'})
    return build_response(204, {})

def build_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(body, default=str)
    }`,
            explanations: [
              { line: '9', text: 'boto3.resource (high-level) vs boto3.client (low-level). The resource abstraction handles serialization and deserialization of DynamoDB types automatically.' },
              { line: '10', text: 'TABLE_NAME from environment variable — never hardcode table names. Allows the same code to run across dev/staging/prod stages.' },
              { line: '30-34', text: 'KeyConditionExpression with begins_with enables "all orders for user X" — reads only the user\'s partition, not the whole table.' },
              { line: '59', text: 'uuid.uuid4() generates a UUID for the order ID. Using time-based IDs (timestamp) creates hot partitions in DynamoDB — avoid for high-traffic scenarios.' },
              { line: '72-75', text: 'UpdateExpression with SET atomically updates specific attributes. ExpressionAttributeNames uses #s to avoid the reserved keyword "status".' },
              { line: '78', text: 'ConditionExpression ensures the item exists before updating. Without this, DynamoDB silently creates a new item with only the updated attributes.' }
            ]
          },
          {
            id: 'nodejs',
            label: 'Node.js (SDK v3)',
            code: `const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const { httpMethod, path, pathParameters, queryStringParameters } = event;
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    if (httpMethod === 'GET' && path === '/orders') {
      const { userId } = queryStringParameters || {};
      if (!userId) return respond(400, { error: 'userId required' });
      const { Items } = await ddb.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': \`USER#\${userId}\`, ':sk': 'ORDER#' }
      }));
      return respond(200, Items);
    }

    if (httpMethod === 'POST' && path === '/orders') {
      const orderId = randomUUID();
      const item = { PK: \`USER#\${body.userId}\`, SK: \`ORDER#\${orderId}\`, orderId, status: 'PENDING', ...body };
      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
      return respond(201, item);
    }
  } catch (err) {
    console.error(err);
    return respond(500, { error: 'Internal Server Error' });
  }
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body)
});`
          }
        ],
        defaultLang: 'python',
        expectedOutput: '{\n  "statusCode": 201,\n  "body": "{\\"orderId\\":\\"a1b2c3-...\\",\\"userId\\":\\"u-123\\",\\"status\\":\\"PENDING\\",\\"createdAt\\":\\"2026-09-16T02:30:00\\"}"\n}'
      }
    },

    {
      id: 'streams-code',
      type: 'code',
      title: 'DynamoDB Streams — Lambda Trigger',
      content: {
        title: 'DynamoDB Streams Event Handler',
        languages: [
          {
            id: 'python',
            label: 'Python',
            code: `import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

sns = boto3.client('sns')
TOPIC_ARN = __import__('os').environ.get('NOTIFICATION_TOPIC_ARN')

def lambda_handler(event, context):
    """Process DynamoDB Streams records."""
    logger.info("Processing %d stream records", len(event['Records']))

    for record in event['Records']:
        event_name = record['eventName']  # INSERT | MODIFY | REMOVE
        dynamodb   = record['dynamodb']

        if event_name == 'INSERT':
            new_item = dynamodb.get('NewImage', {})
            handle_new_order(new_item)

        elif event_name == 'MODIFY':
            old_item = dynamodb.get('OldImage', {})
            new_item = dynamodb.get('NewImage', {})
            handle_status_change(old_item, new_item)

        elif event_name == 'REMOVE':
            old_item = dynamodb.get('OldImage', {})
            logger.info("Order deleted: %s", old_item.get('orderId', {}).get('S'))

def handle_new_order(item):
    order_id = item.get('orderId', {}).get('S')
    user_id  = item.get('userId', {}).get('S')
    logger.info("New order created: orderId=%s userId=%s", order_id, user_id)

    if TOPIC_ARN:
        sns.publish(
            TopicArn=TOPIC_ARN,
            Subject='New Order Received',
            Message=json.dumps({'orderId': order_id, 'userId': user_id})
        )

def handle_status_change(old_item, new_item):
    old_status = old_item.get('status', {}).get('S', '')
    new_status = new_item.get('status', {}).get('S', '')

    if old_status != new_status:
        order_id = new_item.get('orderId', {}).get('S')
        logger.info("Order %s status changed: %s → %s", order_id, old_status, new_status)`,
            explanations: [
              { line: '14', text: 'event["Records"] contains a batch of stream records. Lambda polls the shard and delivers records in batches (configurable: 1–10,000).' },
              { line: '16', text: 'eventName is always INSERT, MODIFY, or REMOVE. Never "UPDATE" — DynamoDB calls modifications "MODIFY".' },
              { line: '19-20', text: 'NewImage contains the full item after the change, in DynamoDB typed format: {"S": "string-value"} or {"N": "123"}. Use TypeDeserializer to normalize.' },
              { line: '22-25', text: 'For MODIFY events, both OldImage and NewImage are available, enabling "what changed" comparisons.' }
            ]
          }
        ],
        defaultLang: 'python',
        expectedOutput: 'Processing 2 stream records\nNew order created: orderId=ord-001 userId=u-123\nOrder ord-002 status changed: PENDING → SHIPPED'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'DynamoDB CLI Commands',
      content: [
        {
          command: 'aws dynamodb put-item --table-name Orders --item \'{"PK":{"S":"USER#u-123"},"SK":{"S":"ORDER#ord-001"},"status":{"S":"PENDING"},"amount":{"N":"59.99"}}\'',
          category: 'aws-cli',
          expectedOutput: '(empty — successful PutItem returns nothing)',
          explanation: 'PutItem writes an item to DynamoDB. If an item with the same key exists, it is completely replaced. To update specific attributes without overwriting, use UpdateItem instead.',
          interviewQ: 'What is the difference between PutItem and UpdateItem in DynamoDB?',
          onRun: () => '(empty — PutItem completed successfully)'
        },
        {
          command: 'aws dynamodb query --table-name Orders --key-condition-expression "PK = :pk AND begins_with(SK, :sk)" --expression-attribute-values \'{":pk":{"S":"USER#u-123"},":sk":{"S":"ORDER#"}}\'',
          category: 'aws-cli',
          expectedOutput: '{\n  "Items": [\n    {"PK":{"S":"USER#u-123"},"SK":{"S":"ORDER#ord-001"},"status":{"S":"PENDING"},"amount":{"N":"59.99"}}\n  ],\n  "Count": 1,\n  "ScannedCount": 1,\n  "ConsumedCapacity": null\n}',
          explanation: 'Query reads items within a single partition key efficiently. ScannedCount should equal Count — if ScannedCount >> Count, your FilterExpression is wasteful and a GSI would be more efficient.',
          commonErrors: [
            { error: 'ValidationException: Reserved keyword', cause: '"status", "name", "order" etc. are reserved words in DynamoDB', fix: 'Use ExpressionAttributeNames: {"#s": "status"} and reference #s in your expression' }
          ],
          interviewQ: 'When should you use a FilterExpression in a DynamoDB Query and when is it a code smell?'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'DynamoDB CLI Lab',
        mode: 'simulated',
        initialText: 'DynamoDB CLI Lab. Commands:\n  aws dynamodb list-tables\n  aws dynamodb describe-table --table-name Orders\n  aws dynamodb put-item --table-name Orders ...\n  aws dynamodb get-item --table-name Orders ...\n  aws dynamodb query --table-name Orders ...',
        commands: {
          'aws dynamodb list-tables': { text: '{\n  "TableNames": ["Orders", "Products", "Sessions"]\n}', type: 'output' },
          'aws dynamodb describe-table --table-name Orders': {
            text: '{\n  "Table": {\n    "TableName": "Orders",\n    "TableStatus": "ACTIVE",\n    "BillingModeSummary": {"BillingMode": "PAY_PER_REQUEST"},\n    "ItemCount": 1523,\n    "TableSizeBytes": 458240,\n    "KeySchema": [\n      {"AttributeName":"PK","KeyType":"HASH"},\n      {"AttributeName":"SK","KeyType":"RANGE"}\n    ],\n    "StreamSpecification": {"StreamEnabled":true,"StreamViewType":"NEW_AND_OLD_IMAGES"}\n  }\n}', type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common DynamoDB Issues',
      content: {
        items: [
          { title: 'ProvisionedThroughputExceededException', error: 'ProvisionedThroughputExceededException', cause: 'Request rate exceeds table\'s provisioned RCU/WCU. Hot partition caused by non-uniform key distribution.', fix: 'Switch to On-Demand capacity, enable Auto Scaling, or redesign keys to distribute load. Use exponential backoff with jitter in application code.' },
          { title: 'ValidationException: Reserved keyword', error: 'ValidationException: Attribute name is a reserved keyword', cause: 'Using reserved DynamoDB keywords (status, name, order, date, etc.) in expressions.', fix: 'Use ExpressionAttributeNames: {"#s": "status"} and reference #s in UpdateExpression, ConditionExpression, or FilterExpression.' },
          { title: 'Item collection too large (LSI limit)', error: 'ItemCollectionSizeLimitExceededException', cause: 'All items with the same partition key exceed 10 GB limit on a table with a Local Secondary Index.', fix: 'Shard the partition key, remove the LSI and use a GSI, or archive old items.' },
          { title: 'ConditionalCheckFailedException', error: 'ConditionalCheckFailedException', cause: 'ConditionExpression evaluated to false — item doesn\'t exist or attribute condition failed.', fix: 'Expected behavior for optimistic locking. Retry with fresh data or handle the exception gracefully to show a meaningful error to users.' }
        ]
      }
    },

    {
      id: 'quiz-dynamodb',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'DynamoDB Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You need to query DynamoDB by email address, but the table\'s partition key is userId. What is the correct approach?',
            options: [
              { id: 'a', text: 'Use Scan with FilterExpression on the email attribute' },
              { id: 'b', text: 'Create a Global Secondary Index with email as the partition key' },
              { id: 'c', text: 'Store email in the partition key instead of userId' },
              { id: 'd', text: 'Use a DynamoDB transaction to look up by email' }
            ],
            correctId: 'b',
            explanation: 'A GSI with email as the PK allows efficient Query operations by email. Scan reads the entire table which is expensive and slow. Never change your primary key design just to support one query pattern — that breaks other patterns.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What does StreamViewType: NEW_AND_OLD_IMAGES mean for DynamoDB Streams?',
            options: [
              { id: 'a', text: 'Streams are enabled for both INSERT and DELETE operations' },
              { id: 'b', text: 'Each stream record includes both the item before AND after the change' },
              { id: 'c', text: 'Two stream shards are created for redundancy' },
              { id: 'd', text: 'Stream records are retained for 48 hours instead of 24' }
            ],
            correctId: 'b',
            explanation: 'NEW_AND_OLD_IMAGES means each stream record contains OldImage (item before change) and NewImage (item after change). This is essential for "what changed" audit logging. KEYS_ONLY only includes the key attributes, NEW_IMAGE only has the new state.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'You have 5 Lambda functions all doing heavy Scan operations on the same DynamoDB table. What is the most impactful fix?',
            options: [
              { id: 'a', text: 'Increase DynamoDB provisioned capacity to handle more read throughput' },
              { id: 'b', text: 'Replace Scan with Query by designing proper partition keys and GSIs for each access pattern' },
              { id: 'c', text: 'Add a DAX (DynamoDB Accelerator) cache layer' },
              { id: 'd', text: 'Enable DynamoDB Streams to pre-compute the scan results' }
            ],
            correctId: 'b',
            explanation: 'Scan is inherently O(n) and reads every item regardless of capacity. The root fix is always data modeling: define access patterns first, then design PK/SK and GSIs to support them with Query. DAX helps with read latency for repeated queries but doesn\'t fix the scan anti-pattern.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-dynamo',
      type: 'challenge',
      title: 'Challenge: Single-Table Design',
      content: {
        title: 'Design a Single-Table Model for an E-commerce App',
        description: 'Write a Lambda function that implements single-table design for Users and Orders in one DynamoDB table. Use PK/SK convention with entity prefixes.',
        difficulty: 'intermediate',
        requirements: [
          'Create items with PK=USER#<userId>, SK=PROFILE for user profiles',
          'Create items with PK=USER#<userId>, SK=ORDER#<orderId> for orders',
          'Implement get_user_with_orders() using a single Query call',
          'Use a GSI to query orders by status (PK=STATUS#<status>, SK=ORDER#<orderId>)',
          'Include all items in the same table (no separate tables)'
        ],
        starterCode: `import json
import boto3
import os
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('TABLE_NAME', 'AppTable'))

def create_user(user_id, name, email):
    """Create a user profile item."""
    # TODO: PK='USER#<user_id>', SK='PROFILE'
    pass

def create_order(user_id, order_id, items, amount):
    """Create an order item for a user."""
    # TODO: PK='USER#<user_id>', SK='ORDER#<order_id>'
    pass

def get_user_with_orders(user_id):
    """Get user profile and all orders with a SINGLE Query call."""
    # TODO: Query PK='USER#<user_id>' — returns both PROFILE and ORDER# items
    pass

def lambda_handler(event, context):
    pass`,
        language: 'python',
        hints: [
          'All items use the same table — distinguish entity type by SK prefix',
          'Query with KeyConditionExpression=Key("PK").eq(f"USER#{user_id}") returns all items for that user',
          'Separate PROFILE from ORDER# items by filtering items where SK starts with ORDER#',
          'For GSI: Add GSI_PK=f"STATUS#{status}" and GSI_SK=f"ORDER#{order_id}" to order items'
        ],
        testCases: [
          { description: 'Uses USER# prefix for partition key', keywords: ['USER#'], expectedOutput: 'USER#' },
          { description: 'Uses ORDER# prefix for sort key', keywords: ['ORDER#'], expectedOutput: 'ORDER#' },
          { description: 'Uses PROFILE for user profile SK', keywords: ['PROFILE'], expectedOutput: 'PROFILE' },
          { description: 'Uses Key() for query expression', keywords: ['Key('], expectedOutput: 'Key(' },
          { description: 'Implements get_user_with_orders with Query', keywords: ['query', 'KeyConditionExpression'], expectedOutput: 'query' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon DynamoDB Hands-On Lab', content: {"title":"Amazon DynamoDB Hands-On Lab","description":"Configure and test Amazon DynamoDB following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open DynamoDB Console","instruction":"AWS Console → Search \"DynamoDB\" → Open service dashboard.","expectedResult":"DynamoDB dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon DynamoDB and what problem does it solve?","shortAnswer":"Amazon DynamoDB is a managed AWS service that provides a serverless NoSQL key-value and document database with single-digit millisecond performance at any scale. It eliminates the need to manage database servers, capacity planning, and replication.","commonMistake":"Choosing a bad partition key leading to hot partitions.","followUp":"When would you NOT use Amazon DynamoDB?"},{"difficulty":"beginner","question":"What are the key components of Amazon DynamoDB?","shortAnswer":"Tables, Items, Attributes, Primary Key (Partition+Sort), GSI, LSI, Streams, DAX, Global Tables.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon DynamoDB integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon DynamoDB priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon DynamoDB costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon DynamoDB?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon DynamoDB for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon DynamoDB?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon DynamoDB achieve high availability?","shortAnswer":"Data replicated across 3 AZs automatically. Global Tables for multi-region active-active. 99.999% availability SLA.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon DynamoDB?"},{"difficulty":"intermediate","question":"Explain the Amazon DynamoDB scaling strategy.","shortAnswer":"On-Demand: auto-scales per request. Provisioned: set RCU/WCU with auto-scaling. Scales to millions of requests per second.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon DynamoDB handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon DynamoDB?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon DynamoDB in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon DynamoDB architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon DynamoDB costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon DynamoDB?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon DynamoDB using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon DynamoDB support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon DynamoDB is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon DynamoDB from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon DynamoDB costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon DynamoDB.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon DynamoDB across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon DynamoDB API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon DynamoDB has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon DynamoDB from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon DynamoDB encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon DynamoDB are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete DynamoDB resources:</strong> Navigate to DynamoDB console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the DynamoDB console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 16: Amazon API Gateway', url: 'module-09.html' }, next: { title: 'Chapter 18: Amazon Cognito', url: 'module-11.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_10_DATA;
} else {
  window.MODULE_10_DATA = MODULE_10_DATA;
}
