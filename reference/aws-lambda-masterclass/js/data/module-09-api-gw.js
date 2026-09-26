/**
 * ============================================================
 * MODULE 09 — Amazon API Gateway
 * REST APIs, HTTP APIs, Lambda integration, auth, throttling
 * ============================================================
 */
const MODULE_09_DATA = {
  id: 'api-gateway-fundamentals',
  moduleId: 'module-09',
  title: 'Amazon API Gateway — Build & Manage APIs',
  description: 'Learn to build production REST and HTTP APIs with Amazon API Gateway. Covers Lambda proxy integration, authorizers, throttling, CORS, stage variables, and monitoring.',
  difficulty: 'intermediate',
  duration: '90 min',
  prerequisites: ['Module 08: AWS Lambda', 'HTTP fundamentals (GET, POST, PUT, DELETE)'],
  objectives: [
    'Explain the difference between REST API and HTTP API in API Gateway',
    'Configure Lambda Proxy Integration to handle HTTP requests in Lambda',
    'Implement API key authentication and Lambda authorizers',
    'Set up CORS for browser-based clients',
    'Configure usage plans, throttling, and rate limits',
    'Deploy APIs to named stages (dev, staging, prod)',
    'Monitor API health with CloudWatch metrics and X-Ray tracing'
  ],

  sections: [
    // ===== WHY API GATEWAY =====
    {
      id: 'why-api-gateway',
      type: 'why',
      title: 'Why API Gateway?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🌐</span>
            <div class="alert-content">
              <div class="alert-title">The "Front Door" for Serverless APIs</div>
              <div class="alert-text">API Gateway acts as the front door for your Lambda functions. It handles HTTP routing, authentication, throttling, SSL termination, and request/response transformation — so your Lambda doesn't have to.</div>
            </div>
          </div>
          <p>Without API Gateway, you'd need a web server (EC2, ECS) to route HTTP traffic to Lambda functions, manage TLS certificates, enforce rate limits, and handle CORS. API Gateway provides all of this as a managed service.</p>
          <table>
            <thead><tr><th>Feature</th><th>REST API</th><th>HTTP API</th></tr></thead>
            <tbody>
              <tr><td>Latency</td><td>~6ms added</td><td>~1ms added (60% faster)</td></tr>
              <tr><td>Cost</td><td>$3.50 / million requests</td><td>$1.00 / million requests (71% cheaper)</td></tr>
              <tr><td>Lambda Authorizer</td><td>✅ Full control</td><td>✅ Simplified (v2 payload)</td></tr>
              <tr><td>JWT Authorizer</td><td>❌ DIY in Lambda</td><td>✅ Native Cognito/Auth0</td></tr>
              <tr><td>Request Validation</td><td>✅ Schema validation</td><td>❌ Manually in Lambda</td></tr>
              <tr><td>Caching</td><td>✅ Per-stage caching</td><td>❌ Not supported</td></tr>
              <tr><td>Usage Plans</td><td>✅ API keys + quotas</td><td>❌ Not supported</td></tr>
              <tr><td>WebSocket</td><td>✅ Separate WebSocket API</td><td>❌ Not supported</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">Which should you choose?</div>
              <div class="alert-text">Choose <strong>HTTP API</strong> for new projects — it's faster, cheaper, and has native JWT auth. Choose <strong>REST API</strong> only if you need request validation, caching, API key usage plans, or WAF integration.</div>
            </div>
          </div>
        `
      }
    },

    // ===== ARCHITECTURE DIAGRAM =====
    {
      id: 'architecture',
      type: 'architecture',
      title: 'API Gateway Architecture',
      content: {
        title: 'API Gateway → Lambda Request Flow',
        width: 750,
        height: 280,
        nodes: [
          { id: 'browser', label: 'Browser/App', icon: '🌍', x: 10, y: 110, type: 'client', description: 'Client sends an HTTP request (GET /products) to the API Gateway endpoint URL.' },
          { id: 'waf', label: 'AWS WAF', icon: '🛡️', x: 155, y: 20, type: 'security', description: 'Optional: AWS WAF inspects requests for SQL injection, XSS, and IP-based rules before they reach API Gateway.' },
          { id: 'apigw', label: 'API Gateway', icon: '🌐', x: 155, y: 110, type: 'trigger', description: 'API Gateway matches the route (GET /products), checks throttle limits, validates the request, runs the authorizer, and constructs the Lambda event.', eventPayload: { httpMethod: 'GET', path: '/products', headers: { Authorization: 'Bearer token...' }, queryStringParameters: { category: 'electronics' } } },
          { id: 'authorizer', label: 'Lambda Auth', icon: '🔐', x: 300, y: 20, type: 'security', description: 'Optional Lambda Authorizer validates the JWT/API key and returns an IAM policy. The result is cached for configurable TTL.' },
          { id: 'lambda', label: 'Lambda', icon: '⚡', x: 430, y: 110, type: 'compute', description: 'Lambda receives the full event object including path, headers, body, and context. For proxy integration, it handles routing internally.', eventPayload: { statusCode: 200, body: '[{"id":"p1","name":"Laptop"}]', headers: { 'Content-Type': 'application/json' } } },
          { id: 'dynamo', label: 'DynamoDB', icon: '🗄️', x: 590, y: 110, type: 'storage', description: 'Lambda queries DynamoDB using the AWS SDK. Results are returned to Lambda, serialized to JSON, and sent back via API Gateway.' },
          { id: 'xray', label: 'X-Ray', icon: '📊', x: 430, y: 210, type: 'monitoring', description: 'AWS X-Ray traces the full request across API Gateway, Lambda, and DynamoDB, showing latency breakdowns and errors.' }
        ],
        edges: [
          { from: 'browser', to: 'apigw', label: 'HTTPS', animated: true },
          { from: 'apigw', to: 'waf', label: 'Inspect' },
          { from: 'apigw', to: 'authorizer', label: 'Auth Check' },
          { from: 'apigw', to: 'lambda', label: 'Proxy Event', animated: true },
          { from: 'lambda', to: 'dynamo', label: 'Query', animated: true },
          { from: 'lambda', to: 'xray', label: 'Trace' }
        ]
      }
    },

    // ===== CORE CONCEPTS =====
    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Lambda Proxy Integration</h4>
          <p>The most common integration mode. API Gateway passes the <strong>entire HTTP request</strong> as a JSON event to your Lambda function. Your Lambda is responsible for parsing the route, query string, body, and returning a response with statusCode, headers, and body.</p>

          <h4>2. Stages</h4>
          <p>A stage is a named reference to a deployment of your API (e.g., <code>dev</code>, <code>staging</code>, <code>prod</code>). Each stage has its own URL, settings, and stage variables. You can configure different Lambda function aliases per stage.</p>

          <h4>3. Resource & Method</h4>
          <p>Resources are URL paths (<code>/users</code>, <code>/users/{id}</code>). Methods are HTTP verbs (GET, POST, PUT, DELETE) attached to resources. Each method has an integration type, request/response mapping, and authorization settings.</p>

          <h4>4. Authorizers</h4>
          <ul>
            <li><strong>No Auth</strong> — Public endpoints</li>
            <li><strong>API Key</strong> — Usage plan-based rate limiting (not secure auth)</li>
            <li><strong>IAM Auth</strong> — SigV4-signed requests for AWS clients</li>
            <li><strong>Lambda Authorizer</strong> — Custom logic: JWT, OAuth, LDAP</li>
            <li><strong>Cognito Authorizer</strong> — Cognito user pool JWT validation</li>
          </ul>

          <h4>5. Throttling</h4>
          <p>API Gateway enforces two levels:</p>
          <ul>
            <li><strong>Account-level</strong>: 10,000 RPS steady, 5,000 burst</li>
            <li><strong>Method-level</strong>: Custom rate + burst via usage plans</li>
          </ul>
          <p>Throttled requests return HTTP 429 Too Many Requests.</p>

          <h4>6. Mapping Templates (REST API only)</h4>
          <p>Velocity Template Language (VTL) templates that transform request/response bodies between API Gateway and Lambda without code changes.</p>
        `
      }
    },

    // ===== LAMBDA HANDLER FOR API GATEWAY =====
    {
      id: 'lambda-code',
      type: 'code',
      title: 'Lambda Handler for API Gateway',
      content: {
        title: 'REST API — Lambda Proxy Integration Handler',
        languages: [
          {
            id: 'python',
            label: 'Python',
            code: `import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB client globally (warm start optimization)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Products')

# Route handler registry — decouples routing from business logic
ROUTES = {}

def route(method, path):
    """Decorator to register route handlers."""
    def decorator(func):
        ROUTES[f"{method}:{path}"] = func
        return func
    return decorator

@route('GET', '/products')
def list_products(event):
    response = table.scan()
    return 200, response['Items']

@route('POST', '/products')
def create_product(event):
    body = json.loads(event.get('body') or '{}')
    if not body.get('name'):
        return 400, {'error': 'name is required'}
    table.put_item(Item=body)
    return 201, body

def lambda_handler(event, context):
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    route_key = f"{method}:{path}"

    logger.info("Route: %s | Request: %s", route_key, context.aws_request_id)

    handler = ROUTES.get(route_key)
    if not handler:
        return build_response(404, {'error': f"Route {route_key} not found"})

    try:
        status, body = handler(event)
        return build_response(status, body)
    except Exception as err:
        logger.error("Route error: %s", str(err), exc_info=True)
        return build_response(500, {'error': 'Internal Server Error'})

def build_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',      # CORS
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
        },
        'body': json.dumps(body, default=str)
    }`,
            explanations: [
              { line: '10-11', text: 'DynamoDB resource initialized OUTSIDE the handler. Reused across warm invocations — avoids re-creating boto3 session and connection pool on every request.' },
              { line: '14-19', text: 'Decorator-based routing registry. Maps "METHOD:/path" keys to handler functions. Keeps lambda_handler clean and handlers unit-testable in isolation.' },
              { line: '26', text: 'event.get("body") returns the raw HTTP request body as a string (or None for GET requests). Always use or "{}") to safely handle no-body requests.' },
              { line: '36-38', text: 'event["httpMethod"] = GET/POST/PUT/DELETE. event["path"] = /products. Build a composite key to look up the handler.' },
              { line: '49-53', text: 'build_response always returns the 3 required fields for API Gateway proxy integration. Access-Control-Allow-Origin: * enables CORS for all origins.' }
            ]
          },
          {
            id: 'nodejs',
            label: 'Node.js',
            code: `const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

const routes = {
  'GET:/products': listProducts,
  'POST:/products': createProduct,
};

async function listProducts(event) {
  const result = await dynamodb.scan({ TableName: TABLE_NAME }).promise();
  return [200, result.Items];
}

async function createProduct(event) {
  const body = JSON.parse(event.body || '{}');
  if (!body.name) return [400, { error: 'name is required' }];
  await dynamodb.put({ TableName: TABLE_NAME, Item: body }).promise();
  return [201, body];
}

exports.handler = async (event, context) => {
  const routeKey = \`\${event.httpMethod}:\${event.path}\`;
  const handler = routes[routeKey];
  if (!handler) return buildResponse(404, { error: 'Route not found' });

  try {
    const [status, body] = await handler(event);
    return buildResponse(status, body);
  } catch (err) {
    console.error(err);
    return buildResponse(500, { error: 'Internal Server Error' });
  }
};

const buildResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body)
});`
          }
        ],
        defaultLang: 'python',
        expectedOutput: '{\n  "statusCode": 200,\n  "headers": { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },\n  "body": "[{\\"id\\":\\"p1\\",\\"name\\":\\"Laptop\\",\\"price\\":999}]"\n}'
      }
    },

    // ===== CLI COMMANDS =====
    {
      id: 'cli-commands',
      type: 'command',
      title: 'API Gateway CLI Commands',
      content: [
        {
          command: 'aws apigateway get-rest-apis --region us-east-1',
          category: 'aws-cli',
          expectedOutput: '{\n  "items": [\n    {\n      "id": "abc123xyz",\n      "name": "products-api",\n      "createdDate": "2026-09-01T10:00:00+00:00",\n      "apiKeySource": "HEADER",\n      "endpointConfiguration": { "types": ["REGIONAL"] }\n    }\n  ]\n}',
          explanation: 'Lists all REST APIs in a region. The "id" field is needed for most other API Gateway CLI commands.',
          interviewQ: 'What is the difference between a regional and edge-optimized API Gateway endpoint?',
          onRun: () => '{\n  "items": [{\n    "id": "abc123xyz",\n    "name": "products-api",\n    "createdDate": "2026-09-01T10:00:00+00:00"\n  }]\n}'
        },
        {
          command: 'aws apigatewayv2 create-api --name "products-http-api" --protocol-type HTTP --target "arn:aws:lambda:us-east-1:123456789012:function:products-fn"',
          category: 'aws-cli',
          expectedOutput: '{\n  "ApiId": "xyz789abc",\n  "ApiEndpoint": "https://xyz789abc.execute-api.us-east-1.amazonaws.com",\n  "Name": "products-http-api",\n  "ProtocolType": "HTTP",\n  "RouteSelectionExpression": "$request.method $request.path"\n}',
          explanation: 'Creates an HTTP API (v2) with a quick-create integration. The --target automatically creates a route $default → Lambda integration. This is the fastest way to expose a Lambda via HTTP.',
          commonErrors: [
            { error: 'AccessDeniedException', cause: 'Missing apigateway:POST permission', fix: 'Attach AmazonAPIGatewayAdministrator policy or specific apigateway:* permissions' }
          ],
          interviewQ: 'When would you use API Gateway HTTP API vs REST API?'
        }
      ]
    },

    // ===== TERMINAL =====
    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'API Gateway CLI Lab',
        mode: 'simulated',
        initialText: 'API Gateway CLI Lab. Try:\n  aws apigateway get-rest-apis\n  aws apigatewayv2 get-apis\n  aws apigateway get-stages --rest-api-id abc123xyz\n  curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/products',
        commands: {
          'aws apigateway get-rest-apis': {
            text: '{\n  "items": [{\n    "id": "abc123xyz",\n    "name": "products-api",\n    "createdDate": "2026-09-01T10:00:00+00:00",\n    "endpointConfiguration": { "types": ["REGIONAL"] }\n  }]\n}',
            type: 'output'
          },
          'aws apigatewayv2 get-apis': {
            text: '{\n  "Items": [{\n    "ApiId": "xyz789abc",\n    "Name": "products-http-api",\n    "ProtocolType": "HTTP",\n    "ApiEndpoint": "https://xyz789abc.execute-api.us-east-1.amazonaws.com"\n  }]\n}',
            type: 'output'
          },
          'aws apigateway get-stages --rest-api-id abc123xyz': {
            text: '{\n  "item": [{\n    "stageName": "prod",\n    "methodSettings": {},\n    "defaultRouteSettings": { "ThrottlingBurstLimit": 5000, "ThrottlingRateLimit": 10000 },\n    "deploymentId": "deploy123"\n  }]\n}',
            type: 'output'
          },
          'curl https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod/products': {
            text: '[{"id":"p1","name":"Laptop","price":999},{"id":"p2","name":"Mouse","price":29}]',
            type: 'success'
          }
        }
      }
    },

    // ===== TROUBLESHOOTING =====
    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common API Gateway Issues',
      content: {
        items: [
          { title: 'CORS Error in Browser', error: 'Access-Control-Allow-Origin header missing', cause: 'Lambda response does not include CORS headers, or the OPTIONS preflight method is not configured.', fix: 'Add "Access-Control-Allow-Origin": "*" to every Lambda response. For REST API, enable CORS on the resource in console or add OPTIONS method with mock integration.' },
          { title: '502 Bad Gateway', error: '{"message": "Internal server error"} with 502', cause: 'Lambda returned an invalid proxy response. The response must have statusCode (int) and body (string).', fix: 'Ensure your Lambda returns: { statusCode: 200, body: JSON.stringify(data) }. statusCode must be an integer, body must be a string.' },
          { title: '403 Forbidden — Missing API Key', error: '{"message": "Forbidden"}', cause: 'API method requires an API key but the x-api-key header is missing.', fix: 'Include x-api-key: <your-api-key> header in the request. Retrieve the key from API Gateway → API Keys.' },
          { title: '429 Too Many Requests', error: '{"message": "Too Many Requests"}', cause: 'Request rate exceeds account limit (10,000 RPS) or usage plan limit.', fix: 'Increase usage plan rate/quota, or implement client-side exponential backoff.' },
          { title: 'Lambda Invocation Error: execution failed', error: 'Lambda integration response has unexpected format', cause: 'Lambda threw an unhandled exception — the response body is the error object, not a proxy response.', fix: 'Wrap your handler in try/catch and always return a properly formatted response object, even on errors.' }
        ]
      }
    },

    // ===== QUIZ =====
    {
      id: 'quiz-api-gw',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'API Gateway Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your browser app gets a CORS error when calling your API Gateway endpoint. Your Lambda and API Gateway are correctly configured. What is the most likely cause?',
            options: [
              { id: 'a', text: 'Lambda timeout is too short' },
              { id: 'b', text: 'Lambda response is missing Access-Control-Allow-Origin header' },
              { id: 'c', text: 'API Gateway does not support CORS' },
              { id: 'd', text: 'The API is not deployed to a stage' }
            ],
            correctId: 'b',
            explanation: 'With Lambda proxy integration, API Gateway passes the Lambda response directly to the browser. If your Lambda does not include the CORS headers in its response object, the browser will block the response. Always include Access-Control-Allow-Origin in every Lambda response.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'A Lambda function is returning 502 from API Gateway even though it runs successfully. What is the most likely cause?',
            options: [
              { id: 'a', text: 'The function execution time exceeded the API Gateway timeout (29 seconds)' },
              { id: 'b', text: 'The Lambda IAM role lacks API Gateway invoke permissions' },
              { id: 'c', text: 'Lambda returned a response missing statusCode or with a non-integer statusCode' },
              { id: 'd', text: 'The API is missing a Usage Plan' }
            ],
            correctId: 'c',
            explanation: 'A 502 Bad Gateway from API Gateway almost always means Lambda returned an invalid proxy integration response. The response MUST have a numeric statusCode field (integer) and body must be a string. If body is an object (not JSON.stringify\'d), API Gateway returns 502.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'You need to add JWT authentication to your HTTP API without writing a Lambda authorizer. What is the best approach?',
            options: [
              { id: 'a', text: 'Use API key authentication' },
              { id: 'b', text: 'Use HTTP API native JWT authorizer with Cognito or Auth0' },
              { id: 'c', text: 'Parse and validate JWT manually in every Lambda function' },
              { id: 'd', text: 'Switch to REST API to get Lambda authorizer support' }
            ],
            correctId: 'b',
            explanation: 'HTTP API (v2) has a built-in JWT authorizer that natively validates tokens from any OIDC/OAuth2 provider (Cognito, Auth0, Okta) without code. You just configure the issuer URL and audience. This is faster and cheaper than a Lambda authorizer.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    // ===== CHALLENGE =====
    {
      id: 'challenge-products-api',
      type: 'challenge',
      title: 'Challenge: Build a Products API Handler',
      content: {
        title: 'Products REST API — Lambda Handler',
        description: 'Build a Lambda handler for a Products REST API that handles GET /products (list) and POST /products (create) with proper CORS headers and error handling.',
        difficulty: 'intermediate',
        requirements: [
          'Handle GET /products — return all products from a mock list',
          'Handle POST /products — parse body and add to products list',
          'Return 405 Method Not Allowed for unsupported methods',
          'Include CORS headers in every response',
          'Return a 400 if POST body is missing the "name" field',
          'Build responses using a helper function'
        ],
        starterCode: `import json

PRODUCTS = [
    {"id": "1", "name": "Laptop", "price": 999},
    {"id": "2", "name": "Mouse", "price": 29}
]

def lambda_handler(event, context):
    # TODO: Implement routing
    method = event.get('httpMethod')
    path = event.get('path')
    pass

def build_response(status_code, body):
    # TODO: Return proper proxy integration response with CORS headers
    pass`,
        language: 'python',
        hints: [
          'Check event["httpMethod"] to determine GET vs POST',
          'For POST, parse event["body"] with json.loads()',
          'build_response must return { statusCode, headers, body } where body is json.dumps()',
          'CORS header: "Access-Control-Allow-Origin": "*"'
        ],
        testCases: [
          { description: 'Returns build_response helper function', keywords: ['build_response'], expectedOutput: 'build_response' },
          { description: 'Handles GET method', keywords: ['GET'], expectedOutput: 'GET' },
          { description: 'Handles POST method', keywords: ['POST'], expectedOutput: 'POST' },
          { description: 'Includes statusCode in response', keywords: ['statusCode'], expectedOutput: 'statusCode' },
          { description: 'Includes CORS headers', keywords: ['Access-Control-Allow-Origin'], expectedOutput: 'Access-Control-Allow-Origin' },
          { description: 'Returns 400 for missing fields', keywords: ['400'], expectedOutput: '400' }
        ]
      }
    },

    // ===== NEXT =====
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon API Gateway Hands-On Lab', content: {"title":"Amazon API Gateway Hands-On Lab","description":"Configure and test Amazon API Gateway following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open API Gateway Console","instruction":"AWS Console → Search \"API Gateway\" → Open service dashboard.","expectedResult":"API Gateway dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon API Gateway and what problem does it solve?","shortAnswer":"Amazon API Gateway is a managed AWS service that creates, publishes, and manages REST, HTTP, and WebSocket APIs at any scale. It eliminates the need to build API infrastructure, handle throttling, authentication, and monitoring.","commonMistake":"Using REST API when HTTP API is sufficient — HTTP API is 70% cheaper and faster.","followUp":"When would you NOT use Amazon API Gateway?"},{"difficulty":"beginner","question":"What are the key components of Amazon API Gateway?","shortAnswer":"REST API, HTTP API, WebSocket API, Stages, Authorizers, Usage Plans, API Keys, Models.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon API Gateway integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon API Gateway priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon API Gateway costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon API Gateway?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon API Gateway for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon API Gateway?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon API Gateway achieve high availability?","shortAnswer":"Multi-AZ by default. Regional and Edge-optimized endpoints. Cross-region with Route 53 failover.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon API Gateway?"},{"difficulty":"intermediate","question":"Explain the Amazon API Gateway scaling strategy.","shortAnswer":"Auto-scales to handle any number of API calls. Default: 10,000 RPS per region (burstable to 5,000). Throttling per stage/method.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon API Gateway handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon API Gateway?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon API Gateway in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon API Gateway architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon API Gateway costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon API Gateway?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon API Gateway using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon API Gateway support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon API Gateway is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon API Gateway from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon API Gateway costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon API Gateway.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon API Gateway across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon API Gateway API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon API Gateway has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon API Gateway from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon API Gateway encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon API Gateway are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete API Gateway resources:</strong> Navigate to API Gateway console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the API Gateway console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },


    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 15: AWS Lambda', url: 'module-08.html' }, next: { title: 'Chapter 17: Amazon DynamoDB', url: 'module-10.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_09_DATA;
} else {
  window.MODULE_09_DATA = MODULE_09_DATA;
}
