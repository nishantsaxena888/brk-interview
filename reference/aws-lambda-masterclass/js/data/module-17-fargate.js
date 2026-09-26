/**
 * ============================================================
 * MODULE 17 — AWS Fargate
 * Serverless container compute, platform versions, networking
 * ============================================================
 */
const MODULE_17_DATA = {
  id: 'fargate-fundamentals',
  moduleId: 'module-17',
  title: 'AWS Fargate — Serverless Container Compute',
  description: 'Master serverless containers. Covers Fargate launch type, platform versions, task networking, Fargate Spot, vCPU/memory configurations, and cost optimization strategies.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 16: Amazon ECS', 'Module 04: Amazon VPC'],
  objectives: [
    'Understand how Fargate eliminates EC2 instance management',
    'Choose correct vCPU and memory combinations for tasks',
    'Configure Fargate task networking with awsvpc mode',
    'Use Fargate Spot for cost-optimized non-critical workloads',
    'Understand platform versions and their security implications',
    'Implement ephemeral storage and EFS volume mounts',
    'Debug Fargate-specific issues (ENI limits, IP exhaustion)'
  ],

  sections: [
    {
      id: 'why-fargate',
      type: 'why',
      title: 'Why Fargate?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">☁️</span>
            <div class="alert-content">
              <div class="alert-title">Run Containers Without Managing Servers</div>
              <div class="alert-text">Fargate is a serverless compute engine for containers. You specify CPU/memory for your task, and AWS provisions, scales, and patches the underlying infrastructure. No EC2 instances to manage, no AMIs to update, no cluster capacity to plan.</div>
            </div>
          </div>
          <h4>Fargate vs EC2 Launch Type</h4>
          <table>
            <thead><tr><th>Aspect</th><th>Fargate</th><th>EC2 Launch Type</th></tr></thead>
            <tbody>
              <tr><td><strong>Infrastructure</strong></td><td>AWS manages everything</td><td>You manage EC2 instances</td></tr>
              <tr><td><strong>Pricing</strong></td><td>Per vCPU-second + memory-second</td><td>EC2 instance pricing (always on)</td></tr>
              <tr><td><strong>Scaling</strong></td><td>Each task is independent</td><td>Must scale EC2 fleet separately</td></tr>
              <tr><td><strong>Patching</strong></td><td>AWS patches OS/runtime</td><td>You patch AMIs</td></tr>
              <tr><td><strong>GPU Support</strong></td><td>❌ Not supported</td><td>✅ Supported (p3, g4 instances)</td></tr>
              <tr><td><strong>Max Task Size</strong></td><td>16 vCPU / 120 GB RAM</td><td>Limited by instance type</td></tr>
              <tr><td><strong>Cost for Steady Load</strong></td><td>Higher (premium for serverless)</td><td>Lower (Reserved Instances)</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Fargate Requires Specific CPU/Memory Combinations</div>
              <div class="alert-text">You can't pick arbitrary values. Fargate supports specific combos: 0.25 vCPU (512MB-2GB), 0.5 vCPU (1-4GB), 1 vCPU (2-8GB), 2 vCPU (4-16GB), 4 vCPU (8-30GB), 8 vCPU (16-60GB), 16 vCPU (32-120GB). Invalid combos cause task registration failures.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Fargate Architecture',
      content: {
        title: 'Fargate Task Networking & Isolation',
        width: 750,
        height: 280,
        nodes: [
          { id: 'ecs-api', label: 'ECS API', icon: '🎛️', x: 10, y: 120, type: 'trigger', description: 'RunTask or CreateService API call specifies Fargate launch type, vCPU/memory, and network configuration.' },
          { id: 'scheduler', label: 'ECS Scheduler', icon: '⚙️', x: 170, y: 120, type: 'security', description: 'Finds available Fargate capacity across the fleet. Allocates a Firecracker microVM for your task with dedicated CPU/memory.' },
          { id: 'microvm', label: 'Firecracker microVM', icon: '🔒', x: 370, y: 50, type: 'compute', description: 'Each task runs in an isolated Firecracker microVM with its own kernel. No shared tenancy. This provides VM-level security isolation with container-level speed.', eventPayload: { cpu: '1 vCPU', memory: '2048 MB', platformVersion: '1.4.0', ephemeralStorage: '20 GB' } },
          { id: 'eni', label: 'ENI (awsvpc)', icon: '🔌', x: 370, y: 180, type: 'security', description: 'Each task gets a dedicated Elastic Network Interface with a private IP from your VPC subnet and its own Security Group.' },
          { id: 'ecr', label: 'ECR', icon: '📦', x: 570, y: 50, type: 'storage', description: 'Container images pulled via the ENI. In private subnets, requires NAT Gateway or VPC endpoint for ECR access.' },
          { id: 'efs', label: 'EFS', icon: '💾', x: 570, y: 180, type: 'storage', description: 'Optional: Mount EFS file system for shared persistent storage across tasks. Useful for ML models, config files.' }
        ],
        edges: [
          { from: 'ecs-api', to: 'scheduler', label: 'RunTask', animated: true },
          { from: 'scheduler', to: 'microvm', label: 'Provision', animated: true },
          { from: 'scheduler', to: 'eni', label: 'Attach ENI' },
          { from: 'microvm', to: 'ecr', label: 'Pull Image' },
          { from: 'microvm', to: 'efs', label: 'Mount Volume' },
          { from: 'eni', to: 'microvm', label: 'Network' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Valid CPU/Memory Combinations</h4>
          <table>
            <thead><tr><th>vCPU</th><th>Memory Options (GB)</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>0.25</strong></td><td>0.5, 1, 2</td><td>Tiny microservices, sidecars</td></tr>
              <tr><td><strong>0.5</strong></td><td>1, 2, 3, 4</td><td>Small APIs, lightweight workers</td></tr>
              <tr><td><strong>1</strong></td><td>2, 3, 4, 5, 6, 7, 8</td><td>Standard web services</td></tr>
              <tr><td><strong>2</strong></td><td>4–16 (1 GB increments)</td><td>Data processing, medium APIs</td></tr>
              <tr><td><strong>4</strong></td><td>8–30 (1 GB increments)</td><td>Heavy computation</td></tr>
              <tr><td><strong>8</strong></td><td>16–60 (4 GB increments)</td><td>ML inference, large processing</td></tr>
              <tr><td><strong>16</strong></td><td>32–120 (8 GB increments)</td><td>Enterprise workloads</td></tr>
            </tbody>
          </table>

          <h4>2. Platform Versions</h4>
          <p>Fargate platform versions control the runtime environment (kernel, container agent, networking). Key versions:</p>
          <ul>
            <li><strong>1.4.0</strong> (current default): EFS support, ephemeral storage up to 200GB, ECR image pull caching, SYS_PTRACE for debugging</li>
            <li><strong>1.3.0</strong> (legacy): Older kernel, no EFS, 10GB ephemeral storage only</li>
            <li><strong>LATEST</strong>: Always resolves to the newest platform version</li>
          </ul>

          <h4>3. Fargate Spot</h4>
          <p>Run tasks on spare Fargate capacity at up to 70% discount. AWS can interrupt Spot tasks with a 30-second SIGTERM warning. Best for:</p>
          <ul>
            <li>Batch processing, data transformation</li>
            <li>CI/CD builds</li>
            <li>Queue workers (idempotent processing)</li>
          </ul>
          <p>Use <strong>capacity provider strategy</strong>: <code>FARGATE,weight=1</code> + <code>FARGATE_SPOT,weight=3</code> = 75% Spot, 25% on-demand.</p>

          <h4>4. Ephemeral Storage</h4>
          <p>Each Fargate task gets ephemeral storage (scratch space) shared across all containers in the task:</p>
          <ul>
            <li>Default: 20 GB</li>
            <li>Configurable: up to 200 GB (Platform 1.4.0+)</li>
            <li>Destroyed when the task stops</li>
          </ul>

          <h4>5. Networking Requirements</h4>
          <p>Fargate tasks in private subnets need outbound access for:</p>
          <ul>
            <li><strong>ECR</strong>: Pull container images</li>
            <li><strong>CloudWatch</strong>: Push logs</li>
            <li><strong>Secrets Manager / SSM</strong>: Retrieve secrets</li>
          </ul>
          <p>Options: NAT Gateway (simplest, costs $32/month/AZ) or VPC Endpoints (no data transfer charges).</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Fargate Boto3 Operations',
      content: {
        title: 'Fargate Task Management',
        languages: [
          {
            id: 'python-fargate',
            label: 'Run Fargate Task',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ecs = boto3.client('ecs')

def run_fargate_task(cluster, task_def, subnets, security_groups,
                     command=None, environment=None, spot=False):
    """
    Run a one-off Fargate task (batch job, migration, etc.).
    
    Args:
        cluster: ECS cluster name
        task_def: Task definition family:revision
        subnets: List of subnet IDs (private recommended)
        security_groups: List of security group IDs
        command: Optional command override for the container
        environment: Optional dict of environment variables
        spot: If True, use Fargate Spot (up to 70% cheaper)
    """
    kwargs = {
        'cluster': cluster,
        'taskDefinition': task_def,
        'count': 1,
        'launchType': 'FARGATE',
        'networkConfiguration': {
            'awsvpcConfiguration': {
                'subnets': subnets,
                'securityGroups': security_groups,
                'assignPublicIp': 'DISABLED'
            }
        },
        'enableExecuteCommand': True,
        'platformVersion': '1.4.0'  # Explicit version for reproducibility
    }

    # Use Fargate Spot capacity provider instead of launchType
    if spot:
        del kwargs['launchType']
        kwargs['capacityProviderStrategy'] = [
            {'capacityProvider': 'FARGATE_SPOT', 'weight': 1}
        ]

    # Override container command (e.g., run migrations)
    if command:
        kwargs['overrides'] = {
            'containerOverrides': [{
                'name': 'app',
                'command': command
            }]
        }
        # Add environment variables
        if environment:
            kwargs['overrides']['containerOverrides'][0]['environment'] = [
                {'name': k, 'value': v} for k, v in environment.items()
            ]

    response = ecs.run_task(**kwargs)
    
    if response['failures']:
        reason = response['failures'][0]['reason']
        logger.error("Task launch failed: %s", reason)
        raise RuntimeError(f"Fargate task failed: {reason}")

    task = response['tasks'][0]
    task_arn = task['taskArn']
    logger.info("Started Fargate task: %s (spot=%s)", task_arn, spot)
    return task_arn


# Example: Run a database migration
task = run_fargate_task(
    cluster='production',
    task_def='my-api:5',
    subnets=['subnet-abc123', 'subnet-def456'],
    security_groups=['sg-789xyz'],
    command=['python', 'manage.py', 'migrate'],
    environment={'DB_HOST': 'prod-db.cluster-xxx.us-east-1.rds.amazonaws.com'},
    spot=False  # Migrations should run on-demand (not interruptible)
)`,
            explanations: [
              { line: '35', text: 'assignPublicIp=DISABLED — tasks in private subnets. They access ECR/CloudWatch via NAT Gateway or VPC endpoints.' },
              { line: '38', text: 'platformVersion 1.4.0 — explicit version ensures consistent behavior. LATEST auto-upgrades, which can break things.' },
              { line: '41-44', text: 'Fargate Spot: replace launchType with capacityProviderStrategy. Cannot use both simultaneously. Spot tasks get 30s SIGTERM before termination.' },
              { line: '60-62', text: 'Always check response["failures"] — Fargate can fail to place tasks due to: IP exhaustion, insufficient capacity, or invalid subnet configuration.' }
            ]
          }
        ],
        defaultLang: 'python-fargate',
        expectedOutput: 'Started Fargate task: arn:aws:ecs:us-east-1:123456789012:task/production/a1b2c3d4 (spot=False)'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'Fargate CLI Commands',
      content: [
        {
          command: 'aws ecs run-task --cluster prod --task-definition my-api:5 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-abc],securityGroups=[sg-123],assignPublicIp=DISABLED}" --platform-version 1.4.0',
          category: 'aws-cli',
          expectedOutput: '{\n  "tasks": [{\n    "taskArn": "arn:aws:ecs:us-east-1:123456789012:task/prod/a1b2c3d4",\n    "lastStatus": "PROVISIONING",\n    "cpu": "256",\n    "memory": "512",\n    "platformVersion": "1.4.0",\n    "capacityProviderName": "FARGATE"\n  }],\n  "failures": []\n}',
          explanation: 'Runs a one-off Fargate task. The task gets its own ENI and private IP. assignPublicIp=DISABLED means the task runs in a private subnet (requires NAT or VPC endpoints).',
          interviewQ: 'Why would you set assignPublicIp=DISABLED for a Fargate task?'
        },
        {
          command: 'aws ecs describe-task-definition --task-definition my-api:5 --query "taskDefinition.{cpu:cpu,memory:memory,networkMode:networkMode,compatibilities:compatibilities}"',
          category: 'aws-cli',
          expectedOutput: '{\n  "cpu": "256",\n  "memory": "512",\n  "networkMode": "awsvpc",\n  "compatibilities": ["EC2", "FARGATE"]\n}',
          explanation: 'Inspects a task definition\'s Fargate-specific settings. The cpu/memory must be valid Fargate combinations. networkMode must be awsvpc for Fargate. compatibilities shows which launch types are supported.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'Fargate CLI Lab',
        mode: 'simulated',
        initialText: 'Fargate CLI Lab. Try:\n  aws ecs list-tasks --cluster prod --launch-type FARGATE\n  aws ecs describe-tasks --cluster prod --tasks task123\n  aws ecs describe-task-definition --task-definition my-api:5',
        commands: {
          'aws ecs list-tasks --cluster prod --launch-type FARGATE': {
            text: '{\n  "taskArns": [\n    "arn:aws:ecs:us-east-1:123456789012:task/prod/a1b2c3d4e5f6",\n    "arn:aws:ecs:us-east-1:123456789012:task/prod/f6e5d4c3b2a1"\n  ]\n}',
            type: 'output'
          },
          'aws ecs describe-tasks --cluster prod --tasks task123': {
            text: '{\n  "tasks": [{\n    "taskArn": "arn:aws:ecs:us-east-1:123456789012:task/prod/task123",\n    "lastStatus": "RUNNING",\n    "cpu": "1024",\n    "memory": "2048",\n    "platformVersion": "1.4.0",\n    "capacityProviderName": "FARGATE",\n    "attachments": [{\n      "type": "ElasticNetworkInterface",\n      "details": [\n        {"name": "privateIPv4Address", "value": "10.0.1.42"},\n        {"name": "subnetId", "value": "subnet-abc123"}\n      ]\n    }],\n    "containers": [{\n      "name": "api",\n      "lastStatus": "RUNNING",\n      "healthStatus": "HEALTHY"\n    }]\n  }]\n}',
            type: 'output'
          },
          'aws ecs describe-task-definition --task-definition my-api:5': {
            text: '{\n  "taskDefinition": {\n    "family": "my-api",\n    "revision": 5,\n    "cpu": "1024",\n    "memory": "2048",\n    "networkMode": "awsvpc",\n    "requiresCompatibilities": ["FARGATE"],\n    "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",\n    "taskRoleArn": "arn:aws:iam::123456789012:role/myAppTaskRole",\n    "ephemeralStorage": {"sizeInGiB": 40},\n    "containerDefinitions": [{\n      "name": "api",\n      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-api:v2.1",\n      "portMappings": [{"containerPort": 8080, "protocol": "tcp"}]\n    }]\n  }\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Fargate Issues',
      content: {
        items: [
          { title: 'Task stuck in PROVISIONING — ENI allocation failed', error: 'Task remains in PROVISIONING for 5+ minutes, then fails', cause: 'The subnet has no available IP addresses for the ENI, or the security group doesn\'t exist in the VPC. Each Fargate task consumes one IP address from the subnet.', fix: 'Use larger subnets (/20 or /21) for Fargate workloads. Check: aws ec2 describe-subnets --query "Subnets[].AvailableIpAddressCount". Consider using multiple subnets across AZs.' },
          { title: 'Cannot pull image from ECR in private subnet', error: 'CannotPullContainerError: pull image manifest has been retried 5 times', cause: 'Fargate tasks in private subnets (assignPublicIp=DISABLED) have no internet access. They can\'t reach ECR endpoints without NAT or VPC endpoints.', fix: 'Add a NAT Gateway to the private subnet route table, OR create VPC endpoints for: com.amazonaws.region.ecr.dkr, com.amazonaws.region.ecr.api, and com.amazonaws.region.s3 (gateway endpoint, free).' },
          { title: 'Invalid CPU/memory combination', error: 'Invalid setting for container. CPU/Memory values not valid for Fargate', cause: 'Fargate only supports specific vCPU and memory combinations. For example, 0.25 vCPU only works with 512MB, 1GB, or 2GB memory.', fix: 'Reference the valid combinations table. Common mistake: specifying 256 CPU with 4096 memory (0.25 vCPU only goes up to 2GB). Use 512 CPU for 4GB memory.' },
          { title: 'Fargate Spot task interrupted', error: 'Task stopped: Fargate Spot capacity unavailable', cause: 'AWS reclaimed the Spot capacity. Fargate Spot tasks receive SIGTERM 30 seconds before termination. If your app doesn\'t handle SIGTERM, it gets SIGKILL.', fix: 'Handle SIGTERM in your application (graceful shutdown). For critical workloads, use on-demand Fargate (not Spot). Mix strategies: 70% Spot + 30% on-demand using capacity provider strategy.' }
        ]
      }
    },

    {
      id: 'quiz-fargate',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS Fargate Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You need to run a container with 1 vCPU. Which memory configuration is NOT valid for Fargate?',
            options: [
              { id: 'a', text: '2 GB' },
              { id: 'b', text: '4 GB' },
              { id: 'c', text: '8 GB' },
              { id: 'd', text: '16 GB' }
            ],
            correctId: 'd',
            explanation: 'For 1 vCPU (1024 CPU units), valid memory options are 2-8 GB. 16 GB requires at least 2 vCPU. This is a common exam question — memorize the valid Fargate CPU/memory combinations.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'Your Fargate tasks in private subnets cannot pull images from ECR. What is the most cost-effective solution?',
            options: [
              { id: 'a', text: 'Set assignPublicIp=ENABLED' },
              { id: 'b', text: 'Create VPC endpoints for ECR and S3' },
              { id: 'c', text: 'Add a NAT Gateway ($32/month/AZ)' },
              { id: 'd', text: 'Move tasks to public subnets' }
            ],
            correctId: 'b',
            explanation: 'VPC endpoints (interface for ECR, gateway for S3) provide private connectivity without NAT Gateway costs. The S3 gateway endpoint is free. Interface endpoints cost ~$7/month each but avoid NAT data transfer charges, which can add up significantly for large image pulls.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'What isolation mechanism does Fargate use to separate tasks from different customers?',
            options: [
              { id: 'a', text: 'Docker containers with Linux namespaces' },
              { id: 'b', text: 'Firecracker microVMs — each task gets its own kernel' },
              { id: 'c', text: 'EC2 instances — one per customer' },
              { id: 'd', text: 'IAM policies only' }
            ],
            correctId: 'b',
            explanation: 'Fargate uses Firecracker microVMs (developed by AWS for Lambda and Fargate). Each task runs in its own lightweight VM with a dedicated kernel — providing VM-level security isolation with container-level performance. This is stronger than container namespaces alone.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-fargate',
      type: 'challenge',
      title: 'Challenge: Fargate Cost Calculator',
      content: {
        title: 'Build a Fargate Cost Estimator',
        description: 'Write a function that calculates the monthly cost of running Fargate tasks given their CPU, memory, count, and hours per day.',
        difficulty: 'intermediate',
        requirements: [
          'Accept cpu_vcpu (float), memory_gb (float), task_count (int), hours_per_day (int)',
          'Fargate pricing: $0.04048 per vCPU per hour, $0.004445 per GB per hour',
          'Calculate: hourly cost = (cpu * cpu_rate) + (memory * memory_rate)',
          'Calculate: monthly cost = hourly * hours_per_day * 30 * task_count',
          'Compare with Fargate Spot (70% discount)',
          'Return both on-demand and spot monthly costs'
        ],
        starterCode: `def calculate_fargate_cost(cpu_vcpu, memory_gb, task_count, hours_per_day):
    """
    Calculate monthly Fargate cost.
    
    Fargate Pricing (us-east-1):
    - vCPU: $0.04048 per vCPU per hour
    - Memory: $0.004445 per GB per hour
    - Spot: ~70% discount
    """
    # TODO: Calculate hourly cost per task
    # TODO: Calculate monthly on-demand cost
    # TODO: Calculate monthly Spot cost (30% of on-demand)
    # TODO: Return both costs

    pass`,
        language: 'python',
        hints: [
          'hourly = (cpu_vcpu * 0.04048) + (memory_gb * 0.004445)',
          'monthly_ondemand = hourly * hours_per_day * 30 * task_count',
          'monthly_spot = monthly_ondemand * 0.30',
          'Return {"on_demand": round(monthly_ondemand, 2), "spot": round(monthly_spot, 2)}'
        ],
        testCases: [
          { description: 'Uses vCPU pricing', keywords: ['0.04048'], expectedOutput: 'cpu_rate' },
          { description: 'Uses memory pricing', keywords: ['0.004445'], expectedOutput: 'memory_rate' },
          { description: 'Calculates Spot discount', keywords: ['0.30', 'spot'], expectedOutput: 'spot' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS Fargate Hands-On Lab', content: {"title":"AWS Fargate Hands-On Lab","description":"Configure and test AWS Fargate following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open Fargate Console","instruction":"AWS Console → Search \"Fargate\" → Open service dashboard.","expectedResult":"Fargate dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS Fargate and what problem does it solve?","shortAnswer":"AWS Fargate is a managed AWS service that provides serverless compute for containers — no EC2 instances to manage. It eliminates the need to manage EC2 instances for containers, handle patching, capacity planning.","commonMistake":"Using Fargate for all workloads — EC2 launch type can be cheaper for steady-state, large-scale workloads.","followUp":"When would you NOT use AWS Fargate?"},{"difficulty":"beginner","question":"What are the key components of AWS Fargate?","shortAnswer":"Fargate Tasks, Fargate Profiles (EKS), Platform Versions, Spot Fargate, Ephemeral Storage.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS Fargate integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS Fargate priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS Fargate costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS Fargate?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS Fargate for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS Fargate?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS Fargate achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS Fargate?"},{"difficulty":"intermediate","question":"Explain the AWS Fargate scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS Fargate handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS Fargate?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS Fargate in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS Fargate architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS Fargate costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS Fargate?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS Fargate using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS Fargate support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS Fargate is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS Fargate from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS Fargate costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS Fargate.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS Fargate across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS Fargate API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS Fargate has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS Fargate from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS Fargate encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS Fargate are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete Fargate resources:</strong> Navigate to Fargate console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the Fargate console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 24: Amazon ECS', url: 'module-16.html' }, next: { title: 'Chapter 26: AWS CodeBuild', url: 'module-19.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_17_DATA; } else { window.MODULE_17_DATA = MODULE_17_DATA; }
