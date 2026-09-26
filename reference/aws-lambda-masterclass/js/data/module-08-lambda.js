/**
 * ============================================================
 * MODULE 08 — AWS Lambda: Serverless Compute Engine
 * Complete interactive lesson data
 * ============================================================
 */
const MODULE_08_DATA = {
  id: 'what-is-lambda',
  moduleId: 'module-08',
  title: 'AWS Lambda — Serverless Compute Engine',
  description: 'Master the fundamentals of AWS Lambda: execution lifecycle, handler functions, events, context, cold starts, and build your first serverless function.',
  difficulty: 'beginner',
  duration: '90 min',
  prerequisites: ['AWS Account', 'Basic Python/Node.js'],
  objectives: [
    'Explain what AWS Lambda is and how serverless computing works',
    'Understand the Lambda execution lifecycle (INIT → INVOKE → SHUTDOWN)',
    'Write and deploy a Lambda handler function in Python and Node.js',
    'Understand event objects, context objects, and invocation models',
    'Differentiate between cold starts and warm executions',
    'Configure memory, timeout, and environment variables',
    'Read and interpret CloudWatch logs from Lambda executions'
  ],

  sections: [
    // ===== SECTION 1: WHY THIS MATTERS =====
    {
      id: 'why-matters',
      type: 'why',
      title: 'Why Lambda Matters',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">The Shift from Servers to Functions</div>
              <div class="alert-text">Before Lambda, deploying even a simple API required provisioning EC2 instances, configuring web servers, managing OS patches, and setting up auto-scaling groups. You paid 24/7 whether your code ran or not.</div>
            </div>
          </div>
          <p>AWS Lambda eliminates all infrastructure management. You write a function, upload it, and AWS handles everything else — server provisioning, scaling, patching, and high availability.</p>
          <p><strong>Key paradigm shift:</strong> You pay only when your code executes, billed to the millisecond. No requests = $0 cost.</p>
          <table>
            <thead><tr><th>Aspect</th><th>Traditional (EC2)</th><th>Serverless (Lambda)</th></tr></thead>
            <tbody>
              <tr><td>Server Management</td><td>You manage OS, patches, scaling</td><td>AWS manages everything</td></tr>
              <tr><td>Scaling</td><td>Configure Auto Scaling Groups</td><td>Automatic, instant (0 to thousands)</td></tr>
              <tr><td>Billing</td><td>Per hour, even when idle</td><td>Per millisecond of execution</td></tr>
              <tr><td>Availability</td><td>You configure multi-AZ</td><td>Built-in multi-AZ</td></tr>
              <tr><td>Cold Start</td><td>N/A (always running)</td><td>~100ms–1s on first request</td></tr>
            </tbody>
          </table>
        `
      }
    },

    // ===== SECTION 2: ARCHITECTURE DIAGRAM =====
    {
      id: 'architecture',
      type: 'architecture',
      title: 'Lambda Architecture',
      content: {
        title: 'How AWS Lambda Processes a Request',
        width: 750,
        height: 320,
        nodes: [
          { id: 'client', label: 'Client', icon: '👤', x: 10, y: 130, type: 'client', description: 'A user, application, or AWS service that initiates the request.' },
          { id: 'trigger', label: 'API Gateway', icon: '🌐', x: 160, y: 130, type: 'trigger', description: 'Amazon API Gateway receives the HTTP request and routes it to Lambda.', eventPayload: { httpMethod: 'POST', path: '/users', headers: { 'Content-Type': 'application/json' }, body: '{ "name": "Alice" }' } },
          { id: 'iam', label: 'IAM Auth', icon: '🔐', x: 310, y: 40, type: 'security', description: 'AWS IAM verifies the execution role has permission to run the function and access downstream services.' },
          { id: 'lambda', label: 'AWS Lambda', icon: '⚡', x: 310, y: 130, type: 'compute', description: 'Lambda provisions a Firecracker microVM, initializes the runtime, and executes your handler function.', eventPayload: { statusCode: 200, body: '{ "message": "Hello Alice!" }' } },
          { id: 'dynamodb', label: 'DynamoDB', icon: '🗄️', x: 460, y: 130, type: 'storage', description: 'Lambda writes or reads data from DynamoDB using the AWS SDK (Boto3/AWS SDK for JS).' },
          { id: 'cloudwatch', label: 'CloudWatch', icon: '📊', x: 610, y: 130, type: 'monitoring', description: 'Lambda automatically streams execution logs (console.log/print), metrics (duration, errors, throttles), and traces to CloudWatch.' }
        ],
        edges: [
          { from: 'client', to: 'trigger', label: 'HTTPS', animated: true },
          { from: 'trigger', to: 'lambda', label: 'Event JSON', animated: true },
          { from: 'lambda', to: 'iam', label: 'Assume Role' },
          { from: 'lambda', to: 'dynamodb', label: 'SDK Call', animated: true },
          { from: 'lambda', to: 'cloudwatch', label: 'Logs' }
        ]
      }
    },

    // ===== SECTION 3: CORE CONCEPTS =====
    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Lambda Function</h4>
          <p>A Lambda function is a self-contained package of code + configuration. It includes your source code (or container image), a handler entry point, memory/timeout settings, an IAM execution role, and optional environment variables.</p>

          <h4>2. Handler Function</h4>
          <p>The handler is the specific method Lambda calls when your function is invoked. It receives two arguments:</p>
          <ul>
            <li><strong>event</strong> — A JSON object containing the input data (HTTP body, S3 event, SQS message, etc.)</li>
            <li><strong>context</strong> — A runtime object with metadata: function name, request ID, remaining time, memory limit</li>
          </ul>

          <h4>3. Execution Environment</h4>
          <p>Lambda runs your code inside isolated <strong>Firecracker microVMs</strong>. Each environment has its own filesystem, memory, and CPU allocation. Environments are recycled for subsequent invocations (warm starts).</p>

          <h4>4. Cold Start vs Warm Start</h4>
          <div class="alert alert-warning">
            <span class="alert-icon">⚡</span>
            <div class="alert-content">
              <div class="alert-title">Cold Start Lifecycle</div>
              <div class="alert-text">
                <strong>Cold Start</strong> (first invocation): Download code → Boot microVM → Init runtime → Run global code → Call handler<br>
                <strong>Warm Start</strong> (subsequent): Call handler directly (environment already initialized)
              </div>
            </div>
          </div>
          <p>Cold starts typically add 100ms–1s of latency depending on runtime, package size, and VPC configuration. Python and Node.js have the fastest cold starts; Java and .NET are slower but support SnapStart for mitigation.</p>

          <h4>5. Invocation Models</h4>
          <table>
            <thead><tr><th>Model</th><th>Caller Waits?</th><th>Retries</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>Synchronous</strong></td><td>Yes — waits for response</td><td>Caller retries</td><td>API Gateway, SDK invoke</td></tr>
              <tr><td><strong>Asynchronous</strong></td><td>No — returns 202 Accepted</td><td>Lambda retries 2x</td><td>S3, SNS, EventBridge</td></tr>
              <tr><td><strong>Event Source Mapping</strong></td><td>Lambda polls source</td><td>Based on source</td><td>SQS, DynamoDB Streams, Kinesis</td></tr>
            </tbody>
          </table>

          <h4>6. Concurrency</h4>
          <p>Concurrency = number of function instances running simultaneously. Default regional limit: 1,000. Can be increased via Service Quotas.</p>
          <ul>
            <li><strong>Unreserved</strong>: Shared pool across all functions</li>
            <li><strong>Reserved</strong>: Guaranteed capacity for a specific function</li>
            <li><strong>Provisioned</strong>: Pre-warmed environments to eliminate cold starts</li>
          </ul>
        `
      }
    },

    // ===== SECTION 4: EXECUTION LIFECYCLE DIAGRAM =====
    {
      id: 'lifecycle',
      type: 'architecture',
      title: 'Execution Lifecycle',
      content: {
        title: 'Lambda Execution Environment Lifecycle: INIT → INVOKE → SHUTDOWN',
        width: 750,
        height: 200,
        nodes: [
          { id: 'init', label: 'INIT Phase', icon: '🔧', x: 20, y: 70, type: 'event', description: 'Download code, start runtime, execute global/static initialization code. This only happens on cold starts. SDK clients initialized here persist across warm invocations.' },
          { id: 'invoke', label: 'INVOKE Phase', icon: '⚡', x: 195, y: 70, type: 'compute', description: 'Lambda calls your handler function with the event and context. This phase runs on every invocation. Your function processes the event and returns a response.' },
          { id: 'between', label: 'Idle / Freeze', icon: '❄️', x: 370, y: 70, type: 'client', description: 'After handler returns, the environment is frozen. Memory state and /tmp files persist. If a new invocation arrives, the environment thaws for a warm start.' },
          { id: 'shutdown', label: 'SHUTDOWN', icon: '🔌', x: 545, y: 70, type: 'security', description: 'If no invocations arrive for several minutes, Lambda destroys the environment. All in-memory state and /tmp files are lost. Extensions can register for shutdown hooks.' }
        ],
        edges: [
          { from: 'init', to: 'invoke', label: 'Cold Start', animated: true },
          { from: 'invoke', to: 'between', label: 'Freeze' },
          { from: 'between', to: 'invoke', label: 'Warm Start' },
          { from: 'between', to: 'shutdown', label: 'Timeout' }
        ]
      }
    },

    // ===== SECTION 5: CODE EDITOR — HANDLER =====
    {
      id: 'handler-code',
      type: 'code',
      title: 'Lambda Handler — Code',
      content: {
        title: 'Lambda Handler Function',
        languages: [
          {
            id: 'python',
            label: 'Python',
            code: `import json\nimport os\nimport logging\n\n# Global initialization (runs once per cold start)\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    """\n    AWS Lambda handler function.\n    \n    Args:\n        event: Dict containing input data from the trigger\n        context: Lambda runtime information\n    \n    Returns:\n        API Gateway compatible response dict\n    """\n    logger.info("Request ID: %s", context.aws_request_id)\n    logger.info("Function: %s", context.function_name)\n    logger.info("Memory: %s MB", context.memory_limit_in_mb)\n    logger.info("Time remaining: %s ms", context.get_remaining_time_in_millis())\n    \n    try:\n        # Parse the incoming event\n        body = json.loads(event.get("body", "{}"))\n        name = body.get("name", "World")\n        env = os.environ.get("ENVIRONMENT", "development")\n        \n        message = f"Hello {name}! Running in {env} mode."\n        \n        return {\n            "statusCode": 200,\n            "headers": {\n                "Content-Type": "application/json",\n                "X-Request-Id": context.aws_request_id\n            },\n            "body": json.dumps({\n                "status": "success",\n                "message": message,\n                "requestId": context.aws_request_id\n            })\n        }\n    except Exception as err:\n        logger.error("Execution failed: %s", str(err), exc_info=True)\n        return {\n            "statusCode": 500,\n            "body": json.dumps({"status": "error", "message": "Internal Server Error"})\n        }`,
            explanations: [
              { line: '1-3', text: 'Import standard library modules. These are available in the Lambda runtime without additional packaging.' },
              { line: '6-7', text: 'Initialize logger OUTSIDE the handler. This runs once per cold start and persists across warm invocations, saving initialization time.' },
              { line: '9', text: 'Handler function signature. Lambda always passes exactly two arguments: event (input data) and context (runtime metadata).' },
              { line: '20', text: 'context.aws_request_id — Unique identifier for this invocation. Use this to correlate logs across services.' },
              { line: '22', text: 'context.memory_limit_in_mb — The memory you configured. Lambda allocates CPU proportionally to memory.' },
              { line: '23', text: 'context.get_remaining_time_in_millis() — Time left before Lambda terminates your function. Use for graceful shutdown logic.' },
              { line: '27', text: 'Parse the event body. For API Gateway, the HTTP body is a JSON string inside event["body"].' },
              { line: '29', text: 'Read environment variables with os.environ.get(). Never hardcode secrets — use env vars or AWS Secrets Manager.' },
              { line: '32-40', text: 'Return an API Gateway proxy response. Must include statusCode, headers, and body (as a JSON string).' },
              { line: '42-45', text: 'Catch all exceptions. Log the full stack trace but return a generic error to the client. Never leak internal error details.' }
            ]
          },
          {
            id: 'nodejs',
            label: 'Node.js',
            code: `// Global initialization (runs once per cold start)\nconst AWS = require('aws-sdk');\n\nexports.handler = async (event, context) => {\n  console.log('Request ID:', context.awsRequestId);\n  console.log('Function:', context.functionName);\n  console.log('Memory:', context.memoryLimitInMB, 'MB');\n  console.log('Time remaining:', context.getRemainingTimeInMillis(), 'ms');\n  \n  try {\n    const body = JSON.parse(event.body || '{}');\n    const name = body.name || 'World';\n    const env = process.env.ENVIRONMENT || 'development';\n    \n    const message = \`Hello \${name}! Running in \${env} mode.\`;\n    \n    return {\n      statusCode: 200,\n      headers: {\n        'Content-Type': 'application/json',\n        'X-Request-Id': context.awsRequestId\n      },\n      body: JSON.stringify({\n        status: 'success',\n        message: message,\n        requestId: context.awsRequestId\n      })\n    };\n  } catch (err) {\n    console.error('Execution failed:', err);\n    return {\n      statusCode: 500,\n      body: JSON.stringify({ status: 'error', message: 'Internal Server Error' })\n    };\n  }\n};`,
            explanations: [
              { line: '2', text: 'Require AWS SDK outside the handler. The SDK is pre-installed in the Lambda Node.js runtime.' },
              { line: '4', text: 'Export an async handler. Lambda supports both callback and async/await patterns.' },
              { line: '5-8', text: 'Context properties use camelCase in Node.js (awsRequestId vs aws_request_id in Python).' },
              { line: '13', text: 'Environment variables accessed via process.env. Same pattern as any Node.js application.' }
            ]
          }
        ],
        defaultLang: 'python',
        expectedOutput: '{\n  "statusCode": 200,\n  "body": "{\\"status\\":\\"success\\",\\"message\\":\\"Hello Alice! Running in development mode.\\",\\"requestId\\":\\"a1b2c3d4-5678-90ab-cdef-EXAMPLE11111\\"}"\n}',
        onRun: null
      }
    },

    // ===== SECTION 6: CLI COMMANDS =====
    {
      id: 'cli-commands',
      type: 'command',
      title: 'AWS CLI Commands',
      content: [
        {
          command: 'aws lambda list-functions --region us-east-1',
          category: 'aws-cli',
          expectedOutput: '{\n  "Functions": [\n    {\n      "FunctionName": "my-first-function",\n      "Runtime": "python3.12",\n      "Handler": "lambda_function.lambda_handler",\n      "MemorySize": 128,\n      "Timeout": 3,\n      "LastModified": "2026-09-15T10:00:00.000+0000"\n    }\n  ]\n}',
          explanation: 'Lists all Lambda functions in the specified region. Returns function names, runtimes, handler paths, memory, timeout, and last modification timestamps.',
          commonErrors: [
            { error: 'AccessDeniedException', cause: 'IAM user/role lacks lambda:ListFunctions permission', fix: 'Attach AWSLambdaReadOnlyAccess managed policy or add lambda:ListFunctions to the IAM policy' },
            { error: 'UnrecognizedClientException', cause: 'AWS credentials expired or invalid', fix: 'Run "aws configure" or refresh temporary credentials' }
          ],
          interviewQ: 'How would you list all Lambda functions across all regions in a single command?',
          onRun: () => '{\n  "Functions": [\n    {\n      "FunctionName": "my-first-function",\n      "Runtime": "python3.12",\n      "Handler": "lambda_function.lambda_handler",\n      "MemorySize": 128,\n      "Timeout": 3\n    }\n  ]\n}'
        },
        {
          command: 'aws lambda invoke --function-name my-first-function --payload \'{"body": "{\\"name\\": \\"Alice\\"}"}\' --cli-binary-format raw-in-base64-out output.json',
          category: 'aws-cli',
          expectedOutput: '{\n  "StatusCode": 200,\n  "ExecutedVersion": "$LATEST"\n}\n\n--- output.json ---\n{"statusCode": 200, "body": "{\\"status\\":\\"success\\",\\"message\\":\\"Hello Alice!\\"}"}',
          explanation: 'Invokes a Lambda function synchronously with a JSON payload. The --cli-binary-format flag ensures the payload is sent as-is. The response metadata is printed to stdout, while the function output is written to output.json.',
          commonErrors: [
            { error: 'ResourceNotFoundException', cause: 'Function name does not exist in the specified region', fix: 'Verify function name with "aws lambda list-functions" and check the correct region' },
            { error: 'InvalidRequestContentException', cause: 'Payload JSON is malformed', fix: 'Validate JSON with a linter. On Windows, use double-quotes and escape inner quotes.' }
          ],
          interviewQ: 'What is the difference between synchronous and asynchronous Lambda invocation via the CLI?'
        }
      ]
    },

    // ===== SECTION 7: SIMULATED TERMINAL =====
    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'AWS Lambda CLI Lab',
        mode: 'simulated',
        initialText: 'Welcome to the Lambda CLI Lab! Try these commands:\n  aws lambda list-functions\n  aws lambda get-function --function-name my-function\n  aws lambda invoke --function-name my-function output.json\n  aws lambda create-function --help\n\nType "help" for all available commands.',
        commands: {
          'aws lambda list-functions': {
            text: '{\n  "Functions": [\n    {\n      "FunctionName": "enterprise-image-processor",\n      "Runtime": "python3.12",\n      "Handler": "index.lambda_handler",\n      "MemorySize": 512,\n      "Timeout": 15,\n      "Architectures": ["arm64"],\n      "LastModified": "2026-09-15T14:30:00.000+0000"\n    }\n  ]\n}',
            type: 'output',
            explanation: 'This lists all Lambda functions in your default region.'
          },
          'aws lambda get-function --function-name my-function': {
            text: '{\n  "Configuration": {\n    "FunctionName": "my-function",\n    "FunctionArn": "arn:aws:lambda:us-east-1:123456789012:function:my-function",\n    "Runtime": "python3.12",\n    "Role": "arn:aws:iam::123456789012:role/lambda-exec-role",\n    "Handler": "lambda_function.lambda_handler",\n    "MemorySize": 128,\n    "Timeout": 3,\n    "State": "Active"\n  }\n}',
            type: 'output'
          },
          'aws lambda invoke --function-name my-function output.json': {
            text: '{\n  "StatusCode": 200,\n  "ExecutedVersion": "$LATEST"\n}\n\nFunction output written to output.json',
            type: 'success'
          },
          'aws lambda get-account-settings': {
            text: '{\n  "AccountLimit": {\n    "TotalCodeSize": 80530636800,\n    "CodeSizeUnzipped": 262144000,\n    "CodeSizeZipped": 52428800,\n    "ConcurrentExecutions": 1000,\n    "UnreservedConcurrentExecutions": 900\n  },\n  "AccountUsage": {\n    "TotalCodeSize": 15728640,\n    "FunctionCount": 12\n  }\n}',
            type: 'output',
            explanation: 'Shows your account Lambda limits and current usage.'
          },
          'aws sts get-caller-identity': {
            text: '{\n  "UserId": "AIDAEXAMPLEUSERID",\n  "Account": "123456789012",\n  "Arn": "arn:aws:iam::123456789012:user/developer"\n}',
            type: 'output'
          }
        }
      }
    },

    // ===== SECTION 8: WHAT JUST HAPPENED =====
    {
      id: 'what-happened',
      type: 'what-happened',
      title: 'What Just Happened?',
      content: {
        html: `
          <p>When you invoked the Lambda function, here is exactly what AWS did behind the scenes:</p>
          <ol>
            <li><strong>API Call</strong> — Your <code>aws lambda invoke</code> command sent an HTTPS request to the Lambda service endpoint in your region.</li>
            <li><strong>IAM Authorization</strong> — Lambda verified that your IAM identity (user/role) has the <code>lambda:InvokeFunction</code> permission on the function's ARN.</li>
            <li><strong>Execution Environment</strong> — Lambda's internal Worker Manager checked if a warm microVM was available. If not (cold start), it downloaded your code package from S3, booted a Firecracker microVM, and initialized the Python/Node.js runtime.</li>
            <li><strong>INIT Phase</strong> — Your global code (imports, logger setup, SDK client creation) ran once.</li>
            <li><strong>INVOKE Phase</strong> — Lambda called your <code>lambda_handler(event, context)</code> function with the event payload.</li>
            <li><strong>Processing</strong> — Your handler parsed the event, processed the data, and returned a response object.</li>
            <li><strong>Response</strong> — Lambda serialized your return value as JSON and sent it back via HTTPS to the CLI.</li>
            <li><strong>Logging</strong> — All <code>print()</code> and <code>logger.info()</code> calls were streamed to CloudWatch Logs.</li>
            <li><strong>Metrics</strong> — Lambda recorded Duration, Memory Used, and Invocation count as CloudWatch metrics.</li>
            <li><strong>Freeze</strong> — The execution environment was frozen (not destroyed), ready for the next invocation.</li>
          </ol>
        `
      }
    },

    // ===== SECTION 9: TROUBLESHOOTING =====
    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Issues & Troubleshooting',
      content: {
        items: [
          { title: 'Task timed out after 3.00 seconds', error: 'Task timed out after 3.00 seconds', cause: 'Your handler takes longer than the configured timeout (default 3s). Common causes: slow API calls, large data processing, or VPC cold starts.', fix: 'Increase timeout (up to 900s) in function configuration. For VPC functions, ensure NAT Gateway is configured for internet access.', prevention: 'Monitor Duration metric. Set timeout to 3x average execution time.' },
          { title: 'AccessDeniedException when calling DynamoDB', error: 'AccessDeniedException: User: arn:aws:sts::123456789012:assumed-role/lambda-role/my-function is not authorized to perform: dynamodb:PutItem', cause: 'The Lambda execution role lacks the required IAM permissions for the downstream service.', fix: 'Add the specific permission (e.g., dynamodb:PutItem) to the execution role\'s policy. Always use least-privilege — specify the exact table ARN as the Resource.', prevention: 'Design IAM policies before writing Lambda code. Use AWS IAM Policy Simulator to test.' },
          { title: 'Module not found: cannot import name xyz', error: 'Runtime.ImportModuleError', cause: 'Your deployment package is missing a dependency, or the handler path is incorrect.', fix: 'For Python: Include dependencies in the ZIP (pip install -t . package_name). For Node.js: Include node_modules. Verify the handler setting matches your file and function name.', prevention: 'Use Lambda Layers for shared dependencies. Test locally with SAM CLI before deploying.' },
          { title: 'TooManyRequestsException (429)', error: 'TooManyRequestsException: Rate exceeded', cause: 'You have exceeded your account\'s concurrent execution limit (default 1,000) or the function\'s reserved concurrency.', fix: 'Request a Service Quotas increase, configure reserved concurrency, or add SQS as a buffer in front of Lambda.', prevention: 'Set up CloudWatch alarms on ConcurrentExecutions and Throttles metrics.' },
          { title: 'Lambda cannot access the internet', error: 'Connection timed out / ETIMEDOUT', cause: 'Lambda function is configured in a VPC with private subnets but no NAT Gateway or VPC endpoint for the target service.', fix: 'Add a NAT Gateway in a public subnet and update the private subnet route table. Or use VPC endpoints for AWS services (S3, DynamoDB, SQS).', prevention: 'Only attach Lambda to a VPC when necessary (e.g., accessing RDS in private subnets). Most AWS API calls work without VPC attachment.' }
        ]
      }
    },

    // ===== SECTION 10: KNOWLEDGE CHECK =====
    {
      id: 'quiz-fundamentals',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Lambda Fundamentals Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'What are the two arguments that AWS Lambda passes to your handler function?',
            options: [
              { id: 'a', text: 'request and response' },
              { id: 'b', text: 'event and context' },
              { id: 'c', text: 'payload and callback' },
              { id: 'd', text: 'input and output' }
            ],
            correctId: 'b',
            explanation: 'Lambda always passes exactly two arguments: event (JSON input data from the trigger) and context (runtime metadata like request ID, function name, memory limit, and remaining execution time).',
            difficulty: 'beginner'
          },
          {
            id: 'q2',
            question: 'A Lambda function is receiving S3 events but returns AccessDenied when writing to DynamoDB. What should you check first?',
            options: [
              { id: 'a', text: 'Lambda memory setting' },
              { id: 'b', text: 'Lambda IAM execution role permissions' },
              { id: 'c', text: 'API Gateway configuration' },
              { id: 'd', text: 'CloudFront distribution' }
            ],
            correctId: 'b',
            explanation: 'AccessDenied errors indicate missing IAM permissions. The Lambda execution role needs explicit dynamodb:PutItem (or dynamodb:*) permissions on the target DynamoDB table ARN. Memory and API Gateway are unrelated to DynamoDB access.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'What happens when a Lambda function is invoked asynchronously and fails?',
            options: [
              { id: 'a', text: 'The caller receives a 500 error immediately' },
              { id: 'b', text: 'Lambda retries the invocation 2 additional times, then sends to DLQ/destination if configured' },
              { id: 'c', text: 'Lambda retries indefinitely until success' },
              { id: 'd', text: 'The event is immediately discarded' }
            ],
            correctId: 'b',
            explanation: 'For asynchronous invocations, Lambda automatically retries twice (with delays between attempts). After all retries fail, the event is sent to a configured dead-letter queue (DLQ) or on-failure destination. Without DLQ/destination, the event is discarded.',
            difficulty: 'intermediate'
          },
          {
            id: 'q4',
            question: 'Why should you initialize SDK clients (like boto3.client) OUTSIDE the handler function?',
            options: [
              { id: 'a', text: 'It is required by AWS — the function will not work otherwise' },
              { id: 'b', text: 'Global objects persist across warm invocations, avoiding re-initialization overhead on each call' },
              { id: 'c', text: 'Lambda charges more for code inside the handler' },
              { id: 'd', text: 'SDK clients cannot be created inside functions' }
            ],
            correctId: 'b',
            explanation: 'During warm starts, Lambda reuses the execution environment. Code outside the handler (global scope) runs only once during INIT. By creating SDK clients globally, you reuse HTTP connections across invocations, reducing latency by 50-100ms per call.',
            difficulty: 'advanced'
          },
          {
            id: 'q5',
            question: 'What is the maximum execution timeout for a Lambda function?',
            options: [
              { id: 'a', text: '60 seconds' },
              { id: 'b', text: '5 minutes (300 seconds)' },
              { id: 'c', text: '15 minutes (900 seconds)' },
              { id: 'd', text: '1 hour (3600 seconds)' }
            ],
            correctId: 'c',
            explanation: 'Lambda functions can run for a maximum of 15 minutes (900 seconds). The default timeout is 3 seconds. For longer-running tasks, consider Step Functions or ECS/Fargate.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    // ===== SECTION 11: CHALLENGE =====
    {
      id: 'challenge-first-function',
      type: 'challenge',
      title: 'Challenge: Build a JSON Processor',
      content: {
        title: 'Build a Lambda JSON Processor',
        description: 'Create a Lambda function that receives a JSON payload with "length" and "width" fields, calculates the area, and returns a properly formatted API Gateway response.',
        difficulty: 'beginner',
        requirements: [
          'Parse the event body as JSON',
          'Extract "length" and "width" fields',
          'Calculate area = length × width',
          'Return a 200 response with the area in the body',
          'Handle missing fields with a 400 error',
          'Log the request ID using the context object'
        ],
        starterCode: 'import json\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    # TODO: Implement the JSON processor\n    # 1. Parse event body\n    # 2. Extract length and width\n    # 3. Calculate area\n    # 4. Return response\n    pass',
        language: 'python',
        hints: [
          'Use json.loads(event.get("body", "{}")) to parse the body',
          'Check if both "length" and "width" exist in the parsed body',
          'Return statusCode 400 if fields are missing',
          'The response body must be a JSON string: json.dumps({...})'
        ],
        testCases: [
          { description: 'Parses event body with json.loads', keywords: ['json.loads', 'event'], expectedOutput: 'json.loads' },
          { description: 'Extracts length and width fields', keywords: ['length', 'width'], expectedOutput: 'length' },
          { description: 'Calculates area (multiplication)', keywords: ['*', 'area'], expectedOutput: '*' },
          { description: 'Returns statusCode 200', keywords: ['statusCode', '200'], expectedOutput: '200' },
          { description: 'Handles errors with statusCode 400', keywords: ['400'], expectedOutput: '400' },
          { description: 'Logs request ID from context', keywords: ['aws_request_id', 'logger'], expectedOutput: 'aws_request_id' }
        ],
        docRefs: [
          { title: 'Lambda Python Handler', url: 'https://docs.aws.amazon.com/lambda/latest/dg/python-handler.html' },
          { title: 'API Gateway Proxy Response', url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html' }
        ]
      }
    },

    // ===== SECTION 12: CHEAT SHEET =====
    {
      id: 'cheat-sheet',
      type: 'text',
      title: 'Lambda Cheat Sheet',
      content: {
        html: `
          <table>
            <thead><tr><th>Parameter</th><th>Value / Limit</th></tr></thead>
            <tbody>
              <tr><td>Max Timeout</td><td>15 minutes (900 seconds)</td></tr>
              <tr><td>Memory</td><td>128 MB – 10,240 MB (1 MB increments)</td></tr>
              <tr><td>Ephemeral Storage (/tmp)</td><td>512 MB – 10,240 MB</td></tr>
              <tr><td>Deployment Package (ZIP)</td><td>50 MB compressed, 250 MB uncompressed</td></tr>
              <tr><td>Container Image</td><td>Up to 10 GB</td></tr>
              <tr><td>Sync Payload Limit</td><td>6 MB</td></tr>
              <tr><td>Async Payload Limit</td><td>256 KB</td></tr>
              <tr><td>Default Concurrency</td><td>1,000 per region</td></tr>
              <tr><td>Environment Variables</td><td>4 KB total</td></tr>
              <tr><td>Layers</td><td>Up to 5 layers, 250 MB total unzipped</td></tr>
              <tr><td>Default Timeout</td><td>3 seconds</td></tr>
              <tr><td>Billing Granularity</td><td>1 millisecond</td></tr>
            </tbody>
          </table>
        `
      }
    },

    { id: 'lab', type: 'lab', title: 'Practical Lab: Lambda Function Deployment', content: {"title":"AWS Lambda Hands-On Lab","description":"Create, deploy, test, and monitor Lambda functions with event triggers.","difficulty":"intermediate","steps":[{"id":"s1","title":"Create Lambda Function","instruction":"Lambda → Create function → Author from scratch → Name: lab-hello → Runtime: Python 3.12 → Create.","expectedResult":"Function created with default execution role.","hint":"Lambda auto-creates a basic execution role with CloudWatch Logs permissions."},{"id":"s2","title":"Write Handler Code","instruction":"Replace default code with: import json\\ndef lambda_handler(event, context):\\n    return {'statusCode': 200, 'body': json.dumps({'message': 'Hello from Lambda!', 'event': event})}. Deploy.","expectedResult":"Function deployed with custom handler.","hint":"Always json.dumps the response body for API Gateway compatibility."},{"id":"s3","title":"Test Function","instruction":"Click Test → Create test event with {'key1': 'value1'}. Run test.","expectedResult":"200 status code with event echoed back.","hint":"Test events simulate different trigger payloads."},{"id":"s4","title":"Add S3 Trigger","instruction":"Configuration → Triggers → Add trigger → S3 → Select a bucket → Event type: PUT → Prefix: uploads/.","expectedResult":"Lambda triggers on file upload to uploads/ prefix.","hint":"Use prefix/suffix filters to avoid triggering on every object."},{"id":"s5","title":"Configure Environment Variables","instruction":"Configuration → Environment variables → Add: DB_TABLE=lab-table, ENVIRONMENT=dev.","expectedResult":"Variables accessible via os.environ in code.","hint":"Never put secrets in env vars — use Secrets Manager."},{"id":"s6","title":"Monitor in CloudWatch","instruction":"Check CloudWatch → Log groups → /aws/lambda/lab-hello. View invocation metrics.","expectedResult":"Logs show invocation details, duration, memory used.","hint":"Duration and memory metrics help right-size your function."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [
      { difficulty: 'beginner', question: 'What is AWS Lambda and how does it work?', shortAnswer: 'Serverless compute that runs code in response to events. You upload code, define triggers, and Lambda handles servers, scaling, patching. Pay only for compute time (per ms).', commonMistake: 'Not understanding cold starts for latency-sensitive applications.', followUp: 'What triggers can invoke Lambda?' },
      { difficulty: 'beginner', question: 'What is a cold start?', shortAnswer: 'First invocation of a new Lambda container requires downloading code, initializing runtime, and running init code. Adds 100ms-10s latency. Subsequent invocations reuse warm container.', commonMistake: 'Not using Provisioned Concurrency for latency-sensitive production functions.', followUp: 'How does Provisioned Concurrency eliminate cold starts?' },
      { difficulty: 'beginner', question: 'What are Lambda layers?', shortAnswer: 'ZIP archives containing libraries, runtimes, or data. Shared across functions. Max 5 layers per function, 250 MB total unzipped. Reduces deployment package size.', commonMistake: 'Putting application code in layers — layers are for shared dependencies, not app code.', followUp: 'How do layers affect cold start time?' },
      { difficulty: 'beginner', question: 'Lambda execution role vs resource-based policy?', shortAnswer: 'Execution role: what Lambda CAN do (access DynamoDB, S3). Resource-based policy: WHO can invoke Lambda (API Gateway, S3, other accounts).', commonMistake: 'Confusing the two — execution role for outbound access, resource policy for inbound invocation.', followUp: 'How do you allow cross-account Lambda invocation?' },
      { difficulty: 'beginner', question: 'Lambda timeout and memory limits?', shortAnswer: 'Timeout: 3 seconds default, max 15 minutes. Memory: 128 MB to 10 GB. CPU scales proportionally with memory. Billed per ms of execution.', commonMistake: 'Setting timeout too low for functions that call external APIs — network calls can be slow.', followUp: 'How does memory allocation affect CPU and pricing?' },
      { difficulty: 'intermediate', question: 'Synchronous vs asynchronous Lambda invocation?', shortAnswer: 'Sync: caller waits for response (API Gateway, SDK invoke). Async: fire-and-forget, Lambda retries 2x on failure (S3, SNS, EventBridge). Async uses internal queue.', commonMistake: 'Not configuring DLQ for async invocations — failed events are lost after 2 retries.', followUp: 'What are Lambda Destinations and how do they improve async processing?' },
      { difficulty: 'intermediate', question: 'How does Lambda concurrency work?', shortAnswer: 'Account limit: 1000 concurrent (soft). Reserved concurrency: guarantee capacity for critical functions. Provisioned concurrency: pre-initialized containers for zero cold start.', commonMistake: 'Not setting reserved concurrency — one function can consume all account concurrency.', followUp: 'What happens when concurrency limit is reached?' },
      { difficulty: 'intermediate', question: 'Lambda in VPC — pros and cons?', shortAnswer: 'Pro: access VPC resources (RDS, ElastiCache). Con: needs NAT Gateway for internet, VPC endpoints for AWS services. No additional cold start penalty since Hyperplane ENI.', commonMistake: 'Putting Lambda in VPC unnecessarily — only needed for VPC resource access.', followUp: 'How did AWS improve VPC Lambda cold starts with Hyperplane?' },
      { difficulty: 'intermediate', question: 'What are Lambda extensions?', shortAnswer: 'Run alongside function code for monitoring, security, governance. Internal (in-process) or External (separate process). Examples: Datadog, New Relic, AWS Parameters and Secrets.', commonMistake: 'Using too many extensions — each adds to cold start time and memory usage.', followUp: 'How do extensions affect Lambda performance?' },
      { difficulty: 'intermediate', question: 'Lambda event source mappings?', shortAnswer: 'Poll-based triggers for SQS, Kinesis, DynamoDB Streams, Kafka. Lambda service polls the source and invokes your function with batches of records.', commonMistake: 'Not configuring batch size and batch window — wrong settings cause high latency or wasted invocations.', followUp: 'How does error handling work with event source mappings?' },
      { difficulty: 'advanced', question: 'Design a serverless API backend with Lambda.', shortAnswer: 'API Gateway (HTTP API) → Lambda → DynamoDB. Cognito for auth. CloudFront for caching. X-Ray for tracing. CloudWatch for monitoring. Use Lambda Powertools for structured logging.', commonMistake: 'Not implementing idempotency — retries can cause duplicate processing.', followUp: 'How do you implement idempotency in Lambda?' },
      { difficulty: 'advanced', question: 'How to optimize Lambda performance?', shortAnswer: 'Right-size memory (Power Tuning tool), minimize package size, use layers for dependencies, connection pooling outside handler, Provisioned Concurrency, ARM/Graviton for 20% cost savings.', commonMistake: 'Initializing database connections inside the handler instead of outside (global scope for warm container reuse).', followUp: 'How does Lambda Power Tuning work?' },
      { difficulty: 'advanced', question: 'Lambda function URLs vs API Gateway?', shortAnswer: 'Function URLs: built-in HTTPS endpoint, free, simpler. API Gateway: more features (auth, throttling, caching, request/response transformation, WAF integration). Use function URLs for internal/simple APIs.', commonMistake: 'Using API Gateway for simple webhook endpoints where function URL is sufficient and free.', followUp: 'When is API Gateway worth the extra cost?' },
      { difficulty: 'advanced', question: 'Explain Lambda SnapStart.', shortAnswer: 'Java-only optimization: caches initialized snapshot of execution environment after init. Subsequent invocations restore from snapshot instead of cold starting. Reduces cold start from 5-10s to <1s.', commonMistake: 'Using SnapStart without handling uniqueness — snapshots share the same random seed and network connections.', followUp: 'What are the limitations of SnapStart?' },
      { difficulty: 'advanced', question: 'How to handle Lambda failures in event-driven architectures?', shortAnswer: 'DLQ for async invocations, Lambda Destinations for success/failure routing, SQS visibility timeout for queue-based, bisect batch on error for streams, circuit breaker pattern for downstream failures.', commonMistake: 'Not implementing circuit breaker — failed downstream service causes infinite retries.', followUp: 'How do you implement the circuit breaker pattern in Lambda?' },
      { difficulty: 'scenario', question: 'Lambda function timing out after 15 seconds. How to fix?', shortAnswer: 'Check: external API call delays, database connection issues, VPC NAT Gateway connectivity, DNS resolution, large payload processing. Solutions: increase timeout, optimize code, async processing, Step Functions.', commonMistake: 'Just increasing timeout without investigating root cause.', followUp: 'When should you move processing out of Lambda to Step Functions?' },
      { difficulty: 'scenario', question: 'Lambda costs are unexpectedly high. Investigate.', shortAnswer: 'Check: invocation count (unexpected triggers?), duration (inefficient code?), memory (over-provisioned?), Provisioned Concurrency (unused?), data transfer, CloudWatch Logs. Use Power Tuning for right-sizing.', commonMistake: 'Over-provisioning memory — 1 GB when 256 MB is sufficient wastes 4x on memory cost.', followUp: 'How to use Lambda Power Tuning for cost optimization?' },
      { difficulty: 'scenario', question: 'Design a file processing pipeline using Lambda.', shortAnswer: 'S3 upload → SQS (buffer) → Lambda (process) → results to DynamoDB/S3. DLQ for failures. CloudWatch alarms for error rate. Step Functions for complex multi-step processing.', commonMistake: 'Triggering Lambda directly from S3 without SQS buffer — at high volume, hits concurrency limits.', followUp: 'How do you handle files larger than Lambda\'s /tmp storage (10 GB)?' },
      { difficulty: 'scenario', question: 'Migrate a monolithic API to Lambda microservices.', shortAnswer: 'Strangler fig pattern: route specific endpoints to Lambda while keeping monolith running. Start with new features. Use API Gateway path-based routing. Shared auth via Cognito/authorizer.', commonMistake: 'Trying to migrate everything at once — incremental migration reduces risk.', followUp: 'What is the strangler fig migration pattern?' },
      { difficulty: 'scenario', question: 'Lambda function works locally but fails in AWS. Debug.', shortAnswer: 'Check: IAM permissions (execution role), environment variables, VPC configuration, timeout settings, memory limit, dependency packaging, architecture (x86 vs ARM).', commonMistake: 'Not matching local Python/Node.js version with Lambda runtime version.', followUp: 'How do you test Lambda functions locally with SAM CLI?' },
      { difficulty: 'troubleshooting', question: 'Lambda returns "Task timed out" error.', shortAnswer: 'Function exceeded configured timeout. Check: external API delays, database connection pool exhaustion, DNS resolution in VPC, large payload processing. Increase timeout or optimize code.', commonMistake: 'Increasing timeout without fixing root cause — just delays the inevitable timeout.', followUp: 'How to identify the slow portion of Lambda execution?' },
      { difficulty: 'troubleshooting', question: 'Lambda "Unable to import module" error.', shortAnswer: 'Handler configuration wrong, or dependency not in deployment package. Check: handler format (file.function), dependencies installed for correct platform (Linux), correct runtime version.', commonMistake: 'Installing native dependencies on macOS/Windows — they must be compiled for Amazon Linux.', followUp: 'How to package native dependencies using Docker?' },
      { difficulty: 'troubleshooting', question: 'Lambda invocations are being throttled.', shortAnswer: 'Check: account concurrent execution limit (1000 default), reserved concurrency on other functions, event source mapping concurrency. Request limit increase or implement backoff.', commonMistake: 'One function with reserved concurrency consuming all available concurrency.', followUp: 'How to design Lambda architectures to avoid throttling?' },
      { difficulty: 'troubleshooting', question: 'Lambda function has memory issues (out of memory).', shortAnswer: 'Increase memory allocation (up to 10 GB). Profile memory usage. Check for memory leaks in warm containers. Reduce payload size. Stream large files instead of loading entirely.', commonMistake: 'Loading entire large files into memory instead of streaming or using S3 Select.', followUp: 'How to profile Lambda memory usage?' },
      { difficulty: 'troubleshooting', question: 'Lambda environment variables returning undefined.', shortAnswer: 'Check: variable name case-sensitive match, variable exists in current version/alias, deployment completed, not using local .env file. Access via os.environ (Python) or process.env (Node.js).', commonMistake: 'Setting env vars on $LATEST but invoking a published version/alias that doesn\'t have them.', followUp: 'How to manage environment variables across stages?' }
    ] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `
      <h4>Remove Lab Resources</h4>
      <ol>
        <li><strong>Delete Lambda function:</strong> Lambda → Functions → lab-hello → Delete</li>
        <li><strong>Remove S3 trigger:</strong> Lambda will auto-clean, but verify in S3 bucket event notifications</li>
        <li><strong>Delete execution role:</strong> IAM → Roles → lab-hello-role → Delete</li>
        <li><strong>Delete CloudWatch logs:</strong> CloudWatch → Log Groups → /aws/lambda/lab-hello → Delete</li>
      </ol>
      <div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">CloudWatch Logs Persist</div><div class="alert-text">Lambda CloudWatch log groups are NOT deleted when you delete the function. Delete them manually or they will incur storage charges.</div></div></div>
    ` } },

    // ===== SECTION 13: NEXT LESSON =====
    {
      id: 'next',
      type: 'next',
      title: '',
      content: {
        prev: null,
        next: {
          title: 'Module 09: Amazon API Gateway',
          url: 'module-09.html'
        }
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_08_DATA;
} else {
  window.MODULE_08_DATA = MODULE_08_DATA;
}
