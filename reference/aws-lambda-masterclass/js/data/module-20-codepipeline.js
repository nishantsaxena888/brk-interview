/**
 * ============================================================
 * MODULE 20 — AWS CodePipeline
 * CI/CD pipeline orchestration, stages, actions, approvals
 * ============================================================
 */
const MODULE_20_DATA = {
  id: 'codepipeline-fundamentals',
  moduleId: 'module-20',
  title: 'AWS CodePipeline — CI/CD Pipeline Orchestration',
  description: 'Master CI/CD automation. Covers pipeline stages, source/build/deploy actions, manual approval gates, cross-region deployments, and pipeline-as-code with CloudFormation.',
  difficulty: 'intermediate',
  duration: '70 min',
  prerequisites: ['Module 19: AWS CodeBuild', 'Module 16: Amazon ECS'],
  objectives: [
    'Create multi-stage pipelines with Source, Build, Test, and Deploy stages',
    'Configure source actions for GitHub, CodeCommit, and S3',
    'Add manual approval gates for production deployments',
    'Implement cross-region pipeline actions',
    'Handle pipeline artifacts and action variables',
    'Troubleshoot pipeline execution failures'
  ],

  sections: [
    {
      id: 'why-codepipeline',
      type: 'why',
      title: 'Why CodePipeline?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🔄</span>
            <div class="alert-content">
              <div class="alert-title">Orchestrate Your Entire Release Process — Automatically</div>
              <div class="alert-text">CodePipeline is a fully managed CI/CD orchestration service. It connects your source repository to build, test, and deploy stages — automatically triggering on every commit. No Jenkins master to maintain, no cron jobs to schedule.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Feature</th><th>CodePipeline</th><th>Jenkins</th><th>GitHub Actions</th></tr></thead>
            <tbody>
              <tr><td><strong>Pipeline Model</strong></td><td>Stage → Action (visual)</td><td>Declarative/Scripted Groovy</td><td>YAML workflows</td></tr>
              <tr><td><strong>AWS Deploy</strong></td><td>Native (ECS, Lambda, S3, CFN)</td><td>Plugins/scripts</td><td>AWS actions</td></tr>
              <tr><td><strong>Approval Gates</strong></td><td>Built-in (SNS notification)</td><td>Input step</td><td>Environment protection</td></tr>
              <tr><td><strong>Cross-Region</strong></td><td>Built-in</td><td>Manual config</td><td>Manual config</td></tr>
              <tr><td><strong>Pricing</strong></td><td>$1/pipeline/month</td><td>EC2 hosting costs</td><td>Per minute</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">Always Add Manual Approval Before Production</div>
              <div class="alert-text">Never deploy directly to production without a manual approval gate. Add an Approval action between staging and production stages. It sends an SNS notification and waits for a human to approve or reject.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CodePipeline Architecture',
      content: {
        title: 'Pipeline: Source → Build → Stage → Approve → Deploy',
        width: 750,
        height: 260,
        nodes: [
          { id: 'source', label: 'Source Stage', icon: '📁', x: 10, y: 110, type: 'storage', description: 'Polls for changes in GitHub/CodeCommit/S3. Triggers pipeline on new commits. Outputs source artifact.' },
          { id: 'build', label: 'Build Stage', icon: '🔨', x: 160, y: 110, type: 'compute', description: 'CodeBuild compiles, tests, and packages the application. Produces build artifacts (Docker image, ZIP).' },
          { id: 'staging', label: 'Deploy to Staging', icon: '🧪', x: 320, y: 60, type: 'compute', description: 'Deploy to staging environment for integration testing. ECS, Lambda, or CloudFormation deploy action.' },
          { id: 'approve', label: 'Manual Approval', icon: '✋', x: 480, y: 110, type: 'security', description: 'Sends SNS notification to team. Pipeline pauses until a human approves. Has configurable timeout (1-7 days).', eventPayload: { status: 'InProgress', approver: 'team-lead@company.com', timeout: '7 days' } },
          { id: 'prod', label: 'Deploy to Prod', icon: '🚀', x: 640, y: 110, type: 'compute', description: 'After approval, deploys to production. Uses the same artifact from Build stage (immutable artifact).' },
          { id: 'artifact', label: 'S3 Artifact Store', icon: '📦', x: 320, y: 220, type: 'storage', description: 'Pipeline artifacts are stored in S3 between stages. Each action reads input artifacts and writes output artifacts.' }
        ],
        edges: [
          { from: 'source', to: 'build', label: 'Source Artifact', animated: true },
          { from: 'build', to: 'staging', label: 'Build Artifact', animated: true },
          { from: 'staging', to: 'approve', label: 'Deployed ✓' },
          { from: 'approve', to: 'prod', label: 'Approved ✓', animated: true },
          { from: 'build', to: 'artifact', label: 'Store' },
          { from: 'artifact', to: 'prod', label: 'Retrieve' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Pipeline Structure</h4>
          <p>A pipeline consists of <strong>Stages</strong>, each containing one or more <strong>Actions</strong>:</p>
          <ul>
            <li><strong>Stage</strong>: A logical grouping (Source, Build, Test, Approve, Deploy). Stages execute sequentially.</li>
            <li><strong>Action</strong>: A task within a stage (CodeBuild, ECS Deploy, Lambda Invoke, Manual Approval). Actions within a stage can run in parallel.</li>
            <li><strong>Artifact</strong>: Output from one action passed as input to another (stored in S3).</li>
          </ul>

          <h4>2. Action Types</h4>
          <table>
            <thead><tr><th>Category</th><th>Provider</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td><strong>Source</strong></td><td>GitHub, CodeCommit, S3, ECR</td><td>Detect changes and output source</td></tr>
              <tr><td><strong>Build</strong></td><td>CodeBuild, Jenkins</td><td>Compile, test, package</td></tr>
              <tr><td><strong>Test</strong></td><td>CodeBuild, DeviceFarm</td><td>Run integration/E2E tests</td></tr>
              <tr><td><strong>Deploy</strong></td><td>ECS, Lambda, S3, CloudFormation, CodeDeploy</td><td>Deploy to target environment</td></tr>
              <tr><td><strong>Approval</strong></td><td>Manual</td><td>Human review gate</td></tr>
              <tr><td><strong>Invoke</strong></td><td>Lambda, Step Functions</td><td>Custom logic</td></tr>
            </tbody>
          </table>

          <h4>3. Pipeline Execution</h4>
          <ul>
            <li>Triggered by source changes (webhook or polling)</li>
            <li>Each execution uses a <strong>unique execution ID</strong></li>
            <li>If a new commit arrives while pipeline is running, it queues (or supersedes, depending on config)</li>
            <li>Artifacts are <strong>immutable per execution</strong> — the same build artifact deploys to staging and production</li>
          </ul>

          <h4>4. Cross-Region Deployments</h4>
          <p>CodePipeline can deploy to multiple regions in a single pipeline. It automatically replicates artifacts to the target region's S3 artifact store. Useful for multi-region ECS or CloudFormation deployments.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CodePipeline Boto3 Operations',
      content: {
        title: 'Pipeline Management',
        languages: [
          {
            id: 'python-pipeline',
            label: 'Create Pipeline',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

pipeline = boto3.client('codepipeline')

def create_ecs_deploy_pipeline(name, repo, branch, build_project, 
                                cluster, service, role_arn):
    """Create a Source → Build → Deploy pipeline for ECS."""
    response = pipeline.create_pipeline(
        pipeline={
            'name': name,
            'roleArn': role_arn,
            'artifactStore': {
                'type': 'S3',
                'location': f'{name}-artifacts'
            },
            'stages': [
                {
                    'name': 'Source',
                    'actions': [{
                        'name': 'GitHubSource',
                        'actionTypeId': {
                            'category': 'Source',
                            'owner': 'AWS',
                            'provider': 'CodeStarSourceConnection',
                            'version': '1'
                        },
                        'configuration': {
                            'ConnectionArn': 'arn:aws:codestar-connections:...',
                            'FullRepositoryId': repo,
                            'BranchName': branch
                        },
                        'outputArtifacts': [{'name': 'SourceOutput'}]
                    }]
                },
                {
                    'name': 'Build',
                    'actions': [{
                        'name': 'CodeBuild',
                        'actionTypeId': {
                            'category': 'Build',
                            'owner': 'AWS',
                            'provider': 'CodeBuild',
                            'version': '1'
                        },
                        'configuration': {
                            'ProjectName': build_project
                        },
                        'inputArtifacts': [{'name': 'SourceOutput'}],
                        'outputArtifacts': [{'name': 'BuildOutput'}]
                    }]
                },
                {
                    'name': 'Approval',
                    'actions': [{
                        'name': 'ManualApproval',
                        'actionTypeId': {
                            'category': 'Approval',
                            'owner': 'AWS',
                            'provider': 'Manual',
                            'version': '1'
                        },
                        'configuration': {
                            'NotificationArn': 'arn:aws:sns:...:deploy-approvals',
                            'CustomData': 'Please review and approve production deployment'
                        }
                    }]
                },
                {
                    'name': 'Deploy',
                    'actions': [{
                        'name': 'ECS-Deploy',
                        'actionTypeId': {
                            'category': 'Deploy',
                            'owner': 'AWS',
                            'provider': 'ECS',
                            'version': '1'
                        },
                        'configuration': {
                            'ClusterName': cluster,
                            'ServiceName': service,
                            'FileName': 'imagedefinitions.json'
                        },
                        'inputArtifacts': [{'name': 'BuildOutput'}]
                    }]
                }
            ]
        }
    )
    logger.info("Pipeline created: %s", name)
    return response['pipeline']['name']`,
            explanations: [
              { line: '28-29', text: 'CodeStarSourceConnection is the recommended way to connect GitHub (v2). It uses OAuth apps instead of personal access tokens.' },
              { line: '58-67', text: 'Manual Approval stage sends an SNS notification and pauses the pipeline. Someone must approve/reject before it proceeds. Essential for production safety.' },
              { line: '79', text: 'imagedefinitions.json maps container names to image URIs. CodeBuild generates this file, and the ECS deploy action uses it to update the task definition.' }
            ]
          }
        ],
        defaultLang: 'python-pipeline',
        expectedOutput: 'Pipeline created: my-api-pipeline'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CodePipeline CLI Commands',
      content: [
        {
          command: 'aws codepipeline get-pipeline-state --name my-api-pipeline',
          category: 'aws-cli',
          expectedOutput: '{\n  "pipelineName": "my-api-pipeline",\n  "stageStates": [\n    {"stageName": "Source", "latestExecution": {"status": "Succeeded"}},\n    {"stageName": "Build", "latestExecution": {"status": "Succeeded"}},\n    {"stageName": "Approval", "latestExecution": {"status": "InProgress"}},\n    {"stageName": "Deploy", "latestExecution": {"status": "NotStarted"}}\n  ]\n}',
          explanation: 'Shows the current state of each pipeline stage. "InProgress" on Approval means it\'s waiting for manual approval. Essential for monitoring deployments.',
          interviewQ: 'How do you implement a manual approval gate in CodePipeline?'
        },
        {
          command: 'aws codepipeline put-approval-result --pipeline-name my-api-pipeline --stage-name Approval --action-name ManualApproval --result summary="Reviewed and approved",status=Approved --token abc123',
          category: 'aws-cli',
          expectedOutput: '{\n  "approvedAt": "2026-09-17T12:00:00Z"\n}',
          explanation: 'Programmatically approves a pending approval action. The token comes from the approval notification (SNS). status can be "Approved" or "Rejected".'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CodePipeline CLI Lab',
        mode: 'simulated',
        initialText: 'CodePipeline CLI Lab. Try:\n  aws codepipeline list-pipelines\n  aws codepipeline get-pipeline-state --name my-api-pipeline\n  aws codepipeline list-pipeline-executions --pipeline-name my-api-pipeline',
        commands: {
          'aws codepipeline list-pipelines': {
            text: '{\n  "pipelines": [\n    {"name": "my-api-pipeline", "version": 3, "created": "2026-06-15T10:00:00Z", "updated": "2026-09-10T14:30:00Z"},\n    {"name": "frontend-pipeline", "version": 1, "created": "2026-08-01T09:00:00Z"}\n  ]\n}',
            type: 'output'
          },
          'aws codepipeline get-pipeline-state --name my-api-pipeline': {
            text: '{\n  "pipelineName": "my-api-pipeline",\n  "stageStates": [\n    {"stageName": "Source", "latestExecution": {"status": "Succeeded", "lastStatusChange": "2026-09-17T11:00:00Z"}},\n    {"stageName": "Build", "latestExecution": {"status": "Succeeded", "lastStatusChange": "2026-09-17T11:05:00Z"}},\n    {"stageName": "Approval", "latestExecution": {"status": "InProgress"}, "actionStates": [{"actionName": "ManualApproval", "latestExecution": {"status": "InProgress", "token": "abc-123-def"}}]},\n    {"stageName": "Deploy", "inboundExecution": {"status": "NotStarted"}}\n  ]\n}',
            type: 'output'
          },
          'aws codepipeline list-pipeline-executions --pipeline-name my-api-pipeline': {
            text: '{\n  "pipelineExecutionSummaries": [\n    {"pipelineExecutionId": "exec-001", "status": "InProgress", "trigger": {"triggerType": "Webhook", "triggerDetail": "push to main"}},\n    {"pipelineExecutionId": "exec-000", "status": "Succeeded", "trigger": {"triggerType": "Webhook"}}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CodePipeline Issues',
      content: {
        items: [
          { title: 'Pipeline doesn\'t trigger on commit', error: 'No pipeline execution after pushing to the repository', cause: 'Webhook is not configured or the connection (CodeStar) is in PENDING status. For CodeCommit, EventBridge rule might be missing.', fix: 'Check the source connection status: aws codestar-connections list-connections. If PENDING, complete the handshake in the Console. For GitHub (v1), verify the webhook URL in repo settings.' },
          { title: 'Deploy to ECS fails: imagedefinitions.json not found', error: 'ActionConfigurationException: imagedefinitions.json not found in build artifact', cause: 'CodeBuild didn\'t produce imagedefinitions.json in the artifacts section. The ECS deploy action expects this file to know which container image to deploy.', fix: 'Add to buildspec.yml artifacts: { files: [imagedefinitions.json] }. The file format is: [{"name":"container-name","imageUri":"123.dkr.ecr.region.amazonaws.com/repo:tag"}]' },
          { title: 'Approval timeout', error: 'Approval action timed out after 7 days', cause: 'No one approved or rejected within the timeout period (default 7 days). The pipeline execution fails.', fix: 'Set up SNS notifications so the team gets alerted. Consider reducing timeout or using a Slack/Teams integration for approval notifications.' },
          { title: 'Stage stuck in "InProgress"', error: 'Pipeline stage shows InProgress indefinitely', cause: 'The action (usually CodeBuild or CloudFormation) is hanging. CloudFormation might be waiting for a resource that\'s stuck (e.g., ECS service can\'t stabilize).', fix: 'Check the action\'s detail page for logs. For CodeBuild: check build logs. For CloudFormation: check stack events. You can manually retry or stop the execution.' }
        ]
      }
    },

    {
      id: 'quiz-codepipeline',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'AWS CodePipeline Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'What file format does the ECS deploy action in CodePipeline expect to determine which Docker image to deploy?',
            options: [
              { id: 'a', text: 'Dockerfile' },
              { id: 'b', text: 'imagedefinitions.json' },
              { id: 'c', text: 'appspec.yml' },
              { id: 'd', text: 'task-definition.json' }
            ],
            correctId: 'b',
            explanation: 'The ECS deploy action uses imagedefinitions.json, which maps container names to image URIs: [{"name":"api","imageUri":"123.dkr.ecr.region.amazonaws.com/api:v1.2"}]. CodeBuild generates this file during the post_build phase.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'A pipeline has Source → Build → Deploy stages. A new commit arrives while Build is executing. What happens?',
            options: [
              { id: 'a', text: 'The new commit is ignored until the current execution finishes' },
              { id: 'b', text: 'The current execution is cancelled and restarted with the new commit' },
              { id: 'c', text: 'The new source change waits and starts a new execution after the current one completes' },
              { id: 'd', text: 'Both executions run simultaneously' }
            ],
            correctId: 'c',
            explanation: 'By default, CodePipeline queues the new source change. After the current execution completes (or fails), it starts a new execution with the latest source. Only one execution per stage can run at a time. You can also configure SUPERSEDED mode to cancel stale executions.',
            difficulty: 'advanced'
          },
          {
            id: 'q3',
            question: 'How does CodePipeline pass data between stages?',
            options: [
              { id: 'a', text: 'Directly through memory between actions' },
              { id: 'b', text: 'Through S3 artifacts — each action produces output artifacts consumed by downstream actions' },
              { id: 'c', text: 'Through DynamoDB tables shared across stages' },
              { id: 'd', text: 'Through environment variables only' }
            ],
            correctId: 'b',
            explanation: 'CodePipeline uses S3 as the artifact store. Each action declares inputArtifacts and outputArtifacts. Source outputs source code, Build outputs compiled artifacts, and Deploy consumes them. Artifacts are immutable per execution ID.',
            difficulty: 'beginner'
          }
        ]
      }
    },

    {
      id: 'challenge-codepipeline',
      type: 'challenge',
      title: 'Challenge: Pipeline Status Dashboard',
      content: {
        title: 'Build a Pipeline Health Dashboard',
        description: 'Write a Lambda function that checks all pipelines and reports any with failed or stalled stages.',
        difficulty: 'intermediate',
        requirements: [
          'List all pipelines using list_pipelines',
          'Get the state of each pipeline using get_pipeline_state',
          'Check each stage for status == "Failed" or long-running "InProgress"',
          'Return a summary with pipeline name, stage name, status, and last update time'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cp = boto3.client('codepipeline')

def lambda_handler(event, context):
    # TODO: List all pipelines
    # TODO: Get state of each pipeline
    # TODO: Check for failed or stalled stages
    # TODO: Return summary

    pass`,
        language: 'python',
        hints: [
          'cp.list_pipelines()["pipelines"]',
          'cp.get_pipeline_state(name=pipeline_name)',
          'Check stage["latestExecution"]["status"] for "Failed"',
          'Return [{pipeline, stage, status, lastChange}]'
        ],
        testCases: [
          { description: 'Lists pipelines', keywords: ['list_pipelines'], expectedOutput: 'pipelines' },
          { description: 'Gets pipeline state', keywords: ['get_pipeline_state'], expectedOutput: 'state' },
          { description: 'Checks for failures', keywords: ['Failed'], expectedOutput: 'failed' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: AWS CodePipeline Hands-On Lab', content: {"title":"AWS CodePipeline Hands-On Lab","description":"Configure and test AWS CodePipeline following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open CodePipeline Console","instruction":"AWS Console → Search \"CodePipeline\" → Open service dashboard.","expectedResult":"CodePipeline dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS CodePipeline and what problem does it solve?","shortAnswer":"AWS CodePipeline is a managed AWS service that automates release pipelines for fast and reliable application updates (CI/CD). It eliminates the need to build custom deployment automation, manage release workflows.","commonMistake":"Not adding manual approval stages before production deployment.","followUp":"When would you NOT use AWS CodePipeline?"},{"difficulty":"beginner","question":"What are the key components of AWS CodePipeline?","shortAnswer":"Pipelines, Stages, Actions, Transitions, Approvals, Cross-Region, Cross-Account.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS CodePipeline integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS CodePipeline priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS CodePipeline costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS CodePipeline?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS CodePipeline for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS CodePipeline?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS CodePipeline achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS CodePipeline?"},{"difficulty":"intermediate","question":"Explain the AWS CodePipeline scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS CodePipeline handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS CodePipeline?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS CodePipeline in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS CodePipeline architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS CodePipeline costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS CodePipeline?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS CodePipeline using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS CodePipeline support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS CodePipeline is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS CodePipeline from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS CodePipeline costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS CodePipeline.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS CodePipeline across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS CodePipeline API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS CodePipeline has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS CodePipeline from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS CodePipeline encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS CodePipeline are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete CodePipeline resources:</strong> Navigate to CodePipeline console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the CodePipeline console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 26: AWS CodeBuild', url: 'module-19.html' }, next: { title: 'Chapter 28: AWS CloudFormation', url: 'module-21.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) { module.exports = MODULE_20_DATA; } else { window.MODULE_20_DATA = MODULE_20_DATA; }
