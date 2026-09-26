/**
 * ============================================================
 * MODULE 19 — AWS CodeBuild
 * Managed build service, buildspec.yml, phases, artifacts
 * ============================================================
 */
const MODULE_19_DATA = {
  id: 'codebuild-fundamentals',
  moduleId: 'module-19',
  title: 'AWS CodeBuild — Managed Build Service',
  description: 'Master CI build automation. Covers build projects, buildspec.yml, build phases, artifacts, environment variables, Docker builds, caching, and integration with CodePipeline.',
  difficulty: 'intermediate',
  duration: '65 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 15: Amazon ECR'],
  objectives: [
    'Create CodeBuild projects for compiling, testing, and packaging code',
    'Write buildspec.yml files with install, pre_build, build, and post_build phases',
    'Configure environment variables and secrets injection',
    'Build and push Docker images to ECR from CodeBuild',
    'Set up S3 and local caching to speed up builds',
    'Troubleshoot common build failures'
  ],

  sections: [
    {
      id: 'why-codebuild',
      type: 'why',
      title: 'Why CodeBuild?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔨</span>
            <div class="alert-content">
              <div class="alert-title">Fully Managed Build Service — No Jenkins to Maintain</div>
              <div class="alert-text">CodeBuild is a fully managed CI service that compiles source code, runs tests, and produces deployable artifacts. No servers to provision, patch, or scale. It scales automatically to handle multiple concurrent builds.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>CodeBuild</th><th>Jenkins</th><th>GitHub Actions</th></tr></thead>
            <tbody>
              <tr><td><strong>Management</strong></td><td>Fully managed</td><td>Self-hosted</td><td>SaaS</td></tr>
              <tr><td><strong>Scaling</strong></td><td>Auto-scales to any concurrency</td><td>Manual (add agents)</td><td>Limited by plan</td></tr>
              <tr><td><strong>AWS Integration</strong></td><td>Native (IAM, ECR, S3, SSM)</td><td>Plugins required</td><td>AWS CLI actions</td></tr>
              <tr><td><strong>Docker Builds</strong></td><td>Privileged mode built-in</td><td>DinD or DooD setup</td><td>Built-in</td></tr>
              <tr><td><strong>Pricing</strong></td><td>Per build minute</td><td>EC2/hosting costs</td><td>Per minute (paid plans)</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Never Hardcode Secrets in buildspec.yml</div>
              <div class="alert-text">Use SSM Parameter Store or Secrets Manager to inject secrets at build time. CodeBuild natively supports <code>parameter-store</code> and <code>secrets-manager</code> reference types in environment variables.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CodeBuild Architecture',
      content: {
        title: 'CodeBuild: Source → Build Container → Artifacts',
        width: 750,
        height: 260,
        nodes: [
          { id: 'source', label: 'Source', icon: '📁', x: 10, y: 110, type: 'storage', description: 'Source code from: CodeCommit, GitHub, Bitbucket, S3 bucket, or CodePipeline.' },
          { id: 'project', label: 'Build Project', icon: '🔨', x: 170, y: 110, type: 'compute', description: 'Defines the build environment: compute type (small/medium/large), Docker image, IAM role, timeout, VPC config.', eventPayload: { computeType: 'BUILD_GENERAL1_MEDIUM', image: 'aws/codebuild/amazonlinux2-x86_64-standard:5.0', privilegedMode: true } },
          { id: 'container', label: 'Build Container', icon: '📦', x: 370, y: 50, type: 'compute', description: 'Fresh Docker container spun up for each build. Runs buildspec.yml phases: install → pre_build → build → post_build.' },
          { id: 'buildspec', label: 'buildspec.yml', icon: '📝', x: 370, y: 200, type: 'security', description: 'YAML file defining build commands for each phase. Located in the source root or specified in the project.' },
          { id: 'artifacts', label: 'Artifacts (S3)', icon: '📤', x: 570, y: 50, type: 'storage', description: 'Build outputs (JAR, ZIP, Docker image) uploaded to S3 or pushed to ECR.' },
          { id: 'logs', label: 'CloudWatch Logs', icon: '📊', x: 570, y: 200, type: 'storage', description: 'Build logs streamed in real-time to CloudWatch Logs for debugging.' }
        ],
        edges: [
          { from: 'source', to: 'project', label: 'Triggers', animated: true },
          { from: 'project', to: 'container', label: 'Provisions', animated: true },
          { from: 'buildspec', to: 'container', label: 'Commands' },
          { from: 'container', to: 'artifacts', label: 'Outputs', animated: true },
          { from: 'container', to: 'logs', label: 'Logs' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. buildspec.yml Structure</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">version: 0.2

env:
  variables:
    APP_ENV: "production"
  parameter-store:
    DB_PASSWORD: "/myapp/db-password"  # From SSM
  secrets-manager:
    API_KEY: "prod/api-key:API_KEY"    # From Secrets Manager

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install -r requirements.txt

  pre_build:
    commands:
      - echo "Logging into ECR..."
      - aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
      - echo "Running tests..."
      - pytest tests/ -v

  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .
      - docker push $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION

  post_build:
    commands:
      - echo "Build completed at $(date)"
      - echo "Image: $ECR_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION"

artifacts:
  files:
    - imagedefinitions.json
  discard-paths: yes

cache:
  paths:
    - '/root/.cache/pip/**/*'</pre>

          <h4>2. Build Phases</h4>
          <table>
            <thead><tr><th>Phase</th><th>Purpose</th><th>Failure Behavior</th></tr></thead>
            <tbody>
              <tr><td><strong>INSTALL</strong></td><td>Install dependencies, runtime versions</td><td>Build fails immediately</td></tr>
              <tr><td><strong>PRE_BUILD</strong></td><td>Login to registries, run tests, linting</td><td>Build fails, skips build/post_build</td></tr>
              <tr><td><strong>BUILD</strong></td><td>Compile code, build Docker images</td><td>Build fails, post_build still runs</td></tr>
              <tr><td><strong>POST_BUILD</strong></td><td>Push images, generate reports, notifications</td><td>Build marked as failed</td></tr>
            </tbody>
          </table>

          <h4>3. Compute Types</h4>
          <table>
            <thead><tr><th>Type</th><th>vCPU</th><th>Memory</th><th>Cost/min</th></tr></thead>
            <tbody>
              <tr><td>BUILD_GENERAL1_SMALL</td><td>2</td><td>3 GB</td><td>$0.005</td></tr>
              <tr><td>BUILD_GENERAL1_MEDIUM</td><td>4</td><td>7 GB</td><td>$0.010</td></tr>
              <tr><td>BUILD_GENERAL1_LARGE</td><td>8</td><td>15 GB</td><td>$0.020</td></tr>
              <tr><td>BUILD_GENERAL1_2XLARGE</td><td>72</td><td>145 GB</td><td>$0.200</td></tr>
            </tbody>
          </table>

          <h4>4. Environment Variables</h4>
          <ul>
            <li><code>CODEBUILD_BUILD_ID</code> — Unique build identifier</li>
            <li><code>CODEBUILD_RESOLVED_SOURCE_VERSION</code> — Git commit SHA</li>
            <li><code>CODEBUILD_BUILD_NUMBER</code> — Sequential build number</li>
            <li><code>CODEBUILD_SRC_DIR</code> — Path to source code</li>
          </ul>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CodeBuild Boto3 Operations',
      content: {
        title: 'CodeBuild Project Management',
        languages: [
          {
            id: 'python-codebuild',
            label: 'Create Build Project',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

codebuild = boto3.client('codebuild')

def create_docker_build_project(project_name, repo_url, ecr_uri, service_role_arn):
    """Create a CodeBuild project for building Docker images."""
    response = codebuild.create_project(
        name=project_name,
        source={
            'type': 'GITHUB',
            'location': repo_url,
            'buildspec': 'buildspec.yml',
            'auth': {'type': 'OAUTH'}  # GitHub OAuth connection
        },
        artifacts={'type': 'NO_ARTIFACTS'},  # We push to ECR, not S3
        environment={
            'type': 'LINUX_CONTAINER',
            'image': 'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
            'computeType': 'BUILD_GENERAL1_MEDIUM',
            'privilegedMode': True,   # Required for Docker builds
            'environmentVariables': [
                {'name': 'ECR_URI', 'value': ecr_uri, 'type': 'PLAINTEXT'},
                {'name': 'DB_PASSWORD', 'value': '/myapp/db-password',
                 'type': 'PARAMETER_STORE'}  # Injected from SSM
            ]
        },
        serviceRole=service_role_arn,
        timeoutInMinutes=30,
        cache={'type': 'LOCAL', 'modes': ['LOCAL_DOCKER_LAYER_CACHE']},
        logsConfig={
            'cloudWatchLogs': {
                'status': 'ENABLED',
                'groupName': f'/codebuild/{project_name}'
            }
        }
    )
    logger.info("Created project: %s", project_name)
    return response['project']['arn']


def start_build(project_name, branch='main'):
    """Trigger a build manually."""
    response = codebuild.start_build(
        projectName=project_name,
        sourceVersion=branch,
        environmentVariablesOverride=[
            {'name': 'APP_ENV', 'value': 'staging', 'type': 'PLAINTEXT'}
        ]
    )
    build_id = response['build']['id']
    logger.info("Started build: %s", build_id)
    return build_id`,
            explanations: [
              { line: '23', text: 'privilegedMode=True is REQUIRED for Docker-in-Docker builds. Without it, docker build commands fail with permission errors.' },
              { line: '27', text: 'type=PARAMETER_STORE injects the value from SSM at build time. The actual secret never appears in the project config.' },
              { line: '30', text: 'LOCAL_DOCKER_LAYER_CACHE reuses Docker layers between builds, dramatically speeding up Docker builds (from minutes to seconds for unchanged layers).' }
            ]
          }
        ],
        defaultLang: 'python-codebuild',
        expectedOutput: 'Created project: my-api-build\nStarted build: my-api-build:a1b2c3d4-5678-90ab-cdef-example'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CodeBuild CLI Commands',
      content: [
        {
          command: 'aws codebuild start-build --project-name my-api-build --source-version main',
          category: 'aws-cli',
          expectedOutput: '{\n  "build": {\n    "id": "my-api-build:a1b2c3d4-5678-90ab-cdef-example",\n    "buildNumber": 42,\n    "buildStatus": "IN_PROGRESS",\n    "currentPhase": "SUBMITTED",\n    "sourceVersion": "main"\n  }\n}',
          explanation: 'Triggers a build from the specified branch. The build runs in a fresh container each time. Use --environment-variables-override to inject build-specific values.',
          interviewQ: 'How do you pass secrets to a CodeBuild project without hardcoding them?'
        },
        {
          command: 'aws codebuild batch-get-builds --ids my-api-build:a1b2c3d4-5678-90ab-cdef-example',
          category: 'aws-cli',
          expectedOutput: '{\n  "builds": [{\n    "id": "my-api-build:a1b2c3d4",\n    "buildStatus": "SUCCEEDED",\n    "phases": [\n      {"phaseType": "INSTALL", "phaseStatus": "SUCCEEDED", "durationInSeconds": 12},\n      {"phaseType": "PRE_BUILD", "phaseStatus": "SUCCEEDED", "durationInSeconds": 45},\n      {"phaseType": "BUILD", "phaseStatus": "SUCCEEDED", "durationInSeconds": 120},\n      {"phaseType": "POST_BUILD", "phaseStatus": "SUCCEEDED", "durationInSeconds": 8}\n    ]\n  }]\n}',
          explanation: 'Retrieves detailed build information including phase-by-phase status and duration. Use this to identify which phase failed and how long each phase took.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CodeBuild CLI Lab',
        mode: 'simulated',
        initialText: 'CodeBuild CLI Lab. Try:\n  aws codebuild list-projects\n  aws codebuild batch-get-projects --names my-api-build\n  aws codebuild list-builds-for-project --project-name my-api-build',
        commands: {
          'aws codebuild list-projects': {
            text: '{\n  "projects": [\n    "my-api-build",\n    "frontend-build",\n    "lambda-deploy"\n  ]\n}',
            type: 'output'
          },
          'aws codebuild batch-get-projects --names my-api-build': {
            text: '{\n  "projects": [{\n    "name": "my-api-build",\n    "source": {"type": "GITHUB", "location": "https://github.com/org/my-api.git"},\n    "environment": {"type": "LINUX_CONTAINER", "image": "aws/codebuild/amazonlinux2-x86_64-standard:5.0", "computeType": "BUILD_GENERAL1_MEDIUM", "privilegedMode": true},\n    "cache": {"type": "LOCAL", "modes": ["LOCAL_DOCKER_LAYER_CACHE"]},\n    "timeoutInMinutes": 30\n  }]\n}',
            type: 'output'
          },
          'aws codebuild list-builds-for-project --project-name my-api-build': {
            text: '{\n  "ids": [\n    "my-api-build:build-44",\n    "my-api-build:build-43",\n    "my-api-build:build-42"\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CodeBuild Issues',
      content: {
        items: [
          { title: 'Build fails: "docker: command not found"', error: 'COMMAND_EXECUTION_ERROR: docker: command not found', cause: 'privilegedMode is not enabled on the build project. Docker commands require privileged mode to run Docker-in-Docker.', fix: 'Update the project: set privilegedMode=True in the environment configuration. Or use aws/codebuild/standard image which includes Docker.' },
          { title: 'Build fails: "Unable to locate credentials"', error: 'Unable to locate credentials. You can configure credentials by running "aws configure"', cause: 'The CodeBuild service role doesn\'t have the required IAM permissions. CodeBuild assumes the service role to execute AWS CLI commands.', fix: 'Add the missing permissions to the CodeBuild service role. Common ones: ecr:GetAuthorizationToken, ecr:BatchGetImage, s3:PutObject, ssm:GetParameters.' },
          { title: 'Build times out', error: 'Build timed out after 60 minutes', cause: 'Build process takes longer than the configured timeout. Or the build is hanging on a command that requires user input.', fix: 'Increase timeoutInMinutes. Check for commands requiring interactive input (add -y flags). Use caching (LOCAL_DOCKER_LAYER_CACHE) to speed up Docker builds.' },
          { title: 'Secrets not injected from SSM', error: 'Parameter /myapp/db-password not found', cause: 'The SSM parameter doesn\'t exist, or the CodeBuild service role lacks ssm:GetParameters permission, or the parameter is in a different region.', fix: 'Verify the parameter exists: aws ssm get-parameter --name /myapp/db-password. Add ssm:GetParameters to the service role. Ensure the region matches.' }
        ]
      }
    },

    {
      id: 'quiz-codebuild',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS CodeBuild Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'Your CodeBuild project needs to build Docker images and push them to ECR. What must be enabled?',
            options: [
              { id: 'a', text: 'VPC configuration' },
              { id: 'b', text: 'Privileged mode in the environment configuration' },
              { id: 'c', text: 'Batch build mode' },
              { id: 'd', text: 'S3 artifact upload' }
            ],
            correctId: 'b',
            explanation: 'Privileged mode allows the build container to run Docker-in-Docker (DinD). Without it, docker build and docker push commands fail with permission errors. This is required for any build that creates Docker images.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'In a buildspec.yml, the BUILD phase fails. What happens to the POST_BUILD phase?',
            options: [
              { id: 'a', text: 'POST_BUILD is skipped entirely' },
              { id: 'b', text: 'POST_BUILD still executes (but the build is marked as failed)' },
              { id: 'c', text: 'The build retries the BUILD phase' },
              { id: 'd', text: 'POST_BUILD runs only if there are cleanup commands' }
            ],
            correctId: 'b',
            explanation: 'Unlike PRE_BUILD failure (which skips subsequent phases), a BUILD phase failure still runs POST_BUILD. This allows cleanup actions like sending failure notifications. However, the overall build status is FAILED.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'How should you inject a database password into a CodeBuild environment?',
            options: [
              { id: 'a', text: 'Hardcode it in buildspec.yml' },
              { id: 'b', text: 'Use type: PARAMETER_STORE or SECRETS_MANAGER in environment variables' },
              { id: 'c', text: 'Pass it as a command-line argument' },
              { id: 'd', text: 'Store it in the source code repository' }
            ],
            correctId: 'b',
            explanation: 'CodeBuild natively supports injecting secrets from SSM Parameter Store (type: PARAMETER_STORE) and Secrets Manager (type: SECRETS_MANAGER). The values are resolved at build time and never appear in the project configuration or logs.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    {
      id: 'challenge-codebuild',
      type: 'challenge',
      title: 'Challenge: Build Status Reporter',
      content: {
        title: 'Build a CodeBuild Status Dashboard',
        description: 'Write a Lambda function that gets the last 5 builds for a project and reports their status and duration.',
        difficulty: 'intermediate',
        requirements: [
          'Accept project_name as input',
          'List the last 5 build IDs using list_builds_for_project',
          'Get detailed info using batch_get_builds',
          'Calculate total build duration from phases',
          'Return a summary: build_id, status, duration_seconds, source_version'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

codebuild = boto3.client('codebuild')

def lambda_handler(event, context):
    project = event['project_name']

    # TODO: Get last 5 build IDs
    # TODO: Get detailed build info
    # TODO: Calculate duration from phases
    # TODO: Return summary

    pass`,
        language: 'python',
        hints: [
          'codebuild.list_builds_for_project(projectName=project, sortOrder="DESCENDING")["ids"][:5]',
          'codebuild.batch_get_builds(ids=build_ids)["builds"]',
          'duration = sum(p.get("durationInSeconds", 0) for p in build["phases"])',
          'Return [{build_id, status, duration, source_version}]'
        ],
        testCases: [
          { description: 'Uses list_builds_for_project', keywords: ['list_builds_for_project'], expectedOutput: 'builds' },
          { description: 'Uses batch_get_builds', keywords: ['batch_get_builds'], expectedOutput: 'details' },
          { description: 'Calculates duration', keywords: ['durationInSeconds'], expectedOutput: 'duration' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS CodeBuild Hands-On Lab', content: {"title":"AWS CodeBuild Hands-On Lab","description":"Configure and test AWS CodeBuild following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open CodeBuild Console","instruction":"AWS Console → Search \"CodeBuild\" → Open service dashboard.","expectedResult":"CodeBuild dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS CodeBuild and what problem does it solve?","shortAnswer":"AWS CodeBuild is a managed AWS service that compiles source code, runs tests, and produces deployable artifacts — fully managed CI service. It eliminates the need to manage Jenkins servers, handle build agent scaling, and maintain build infrastructure.","commonMistake":"Not using build cache — builds take much longer without caching dependencies.","followUp":"When would you NOT use AWS CodeBuild?"},{"difficulty":"beginner","question":"What are the key components of AWS CodeBuild?","shortAnswer":"Build Projects, Buildspec, Build Environments, Artifacts, Reports, Cache, VPC Support.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS CodeBuild integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS CodeBuild priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS CodeBuild costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS CodeBuild?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS CodeBuild for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS CodeBuild?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS CodeBuild achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS CodeBuild?"},{"difficulty":"intermediate","question":"Explain the AWS CodeBuild scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS CodeBuild handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS CodeBuild?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS CodeBuild in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS CodeBuild architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS CodeBuild costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS CodeBuild?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS CodeBuild using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS CodeBuild support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS CodeBuild is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS CodeBuild from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS CodeBuild costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS CodeBuild.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS CodeBuild across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS CodeBuild API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS CodeBuild has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS CodeBuild from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS CodeBuild encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS CodeBuild are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete CodeBuild resources:</strong> Navigate to CodeBuild console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the CodeBuild console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 25: AWS Fargate', url: 'module-17.html' }, next: { title: 'Chapter 27: AWS CodePipeline', url: 'module-20.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_19_DATA; } else { window.MODULE_19_DATA = MODULE_19_DATA; }
