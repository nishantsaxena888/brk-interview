/**
 * MODULE 42 — AWS CodeDeploy — Automated Deployments
 */
const MODULE_42_DATA = {
  id: 'codedeploy-fundamentals', moduleId: 'module-42',
  title: 'AWS CodeDeploy — Automated Deployment Strategies',
  description: 'Master deployment automation. Covers in-place and blue/green deployments, AppSpec files, lifecycle hooks, rollback strategies, and integration with CodePipeline.',
  difficulty: 'advanced', duration: '70 min',
  prerequisites: ['Module 03: Amazon EC2', 'Module 19: AWS CodeBuild'],
  objectives: ['Configure in-place and blue/green deployment strategies', 'Write AppSpec files for EC2 and ECS', 'Implement lifecycle hooks for custom deployment logic', 'Configure automatic rollback on failure', 'Integrate CodeDeploy with CodePipeline', 'Troubleshoot failed deployments'],
  sections: [
    { id: 'why', type: 'why', title: 'Why CodeDeploy?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128640;</span><div class="alert-content"><div class="alert-title">Deploy Without Downtime, Rollback Instantly</div><div class="alert-text">CodeDeploy automates code deployments to EC2, Lambda, and ECS. Blue/green deployments provide zero-downtime releases with instant rollback. No manual SSH deployments.</div></div></div>
      <h4>Deployment Strategies</h4>
      <table><thead><tr><th>Strategy</th><th>How</th><th>Downtime</th><th>Rollback</th><th>Cost</th></tr></thead><tbody>
        <tr><td><strong>In-Place</strong></td><td>Update instances one-by-one</td><td>Brief (per instance)</td><td>Re-deploy previous</td><td>No extra infra</td></tr>
        <tr><td><strong>Blue/Green (EC2)</strong></td><td>New fleet, switch traffic</td><td>Zero</td><td>Switch back instantly</td><td>2x during deploy</td></tr>
        <tr><td><strong>Blue/Green (ECS)</strong></td><td>New task set, shift traffic</td><td>Zero</td><td>Route back to old tasks</td><td>2x during deploy</td></tr>
        <tr><td><strong>Canary (Lambda)</strong></td><td>10% traffic &rarr; wait &rarr; 100%</td><td>Zero</td><td>Shift back to old version</td><td>Minimal</td></tr>
      </tbody></table>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Blue/Green Architecture', content: { title: 'Blue/Green: Zero-Downtime Deployment', width: 700, height: 260,
      nodes: [
        { id: 'alb', label: 'ALB', icon: '&#9889;', x: 10, y: 110, type: 'network', description: 'ALB routes traffic. During deployment, traffic shifts from blue to green.' },
        { id: 'blue', label: 'Blue (Current)', icon: '&#128309;', x: 220, y: 50, type: 'compute', description: 'Current production instances running v1. Continue serving until green is verified.' },
        { id: 'green', label: 'Green (New)', icon: '&#128994;', x: 220, y: 190, type: 'compute', description: 'New instances running v2. CodeDeploy provisions, deploys, and health-checks.' },
        { id: 'cd', label: 'CodeDeploy', icon: '&#128640;', x: 430, y: 110, type: 'security', description: 'Orchestrates: provision green > deploy > health check > shift traffic > terminate blue.' },
        { id: 'appspec', label: 'AppSpec', icon: '&#128196;', x: 600, y: 110, type: 'storage', description: 'YAML file defining: files to copy, lifecycle hooks (BeforeInstall, AfterInstall, ValidateService).' }
      ],
      edges: [
        { from: 'alb', to: 'blue', label: '100% traffic' },
        { from: 'alb', to: 'green', label: '0% (then shift)', animated: true },
        { from: 'cd', to: 'green', label: 'Deploy v2' },
        { from: 'appspec', to: 'cd', label: 'Instructions' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. AppSpec File</h4>
      <p>YAML file that tells CodeDeploy what to do during each lifecycle event.</p>
      <pre><code>version: 0.0
os: linux
files:
  - source: /
    destination: /var/www/html
hooks:
  BeforeInstall:
    - location: scripts/stop_server.sh
      timeout: 60
  AfterInstall:
    - location: scripts/start_server.sh
      timeout: 60
  ValidateService:
    - location: scripts/health_check.sh
      timeout: 120</code></pre>
      <h4>2. Lifecycle Events (EC2/On-Premises)</h4>
      <table><thead><tr><th>Event</th><th>Phase</th><th>Use Case</th></tr></thead><tbody>
        <tr><td><strong>BeforeInstall</strong></td><td>Before files are copied</td><td>Stop server, backup config</td></tr>
        <tr><td><strong>AfterInstall</strong></td><td>After files are copied</td><td>Install dependencies, set permissions</td></tr>
        <tr><td><strong>ApplicationStart</strong></td><td>Start application</td><td>Start web server</td></tr>
        <tr><td><strong>ValidateService</strong></td><td>Verify deployment</td><td>Health check, smoke test</td></tr>
      </tbody></table>
      <h4>3. Rollback</h4>
      <ul>
        <li><strong>Automatic</strong> &mdash; Rollback if deployment fails or CloudWatch alarm triggers</li>
        <li><strong>Manual</strong> &mdash; Stop deployment and roll back via console/CLI</li>
        <li><strong>Blue/Green</strong> &mdash; Instant rollback by routing traffic back to blue</li>
      </ul>
      <h4>4. CodeDeploy Agent</h4>
      <p>Required on EC2 instances. Agent polls CodeDeploy for deployment instructions. Install via SSM or user data.</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'CodeDeploy Boto3', content: { title: 'Deployment Management', languages: [
      { id: 'python-cd', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\ncd = boto3.client('codedeploy')\n\ndef get_deployment_status(deployment_id):\n    """Get detailed deployment status."""\n    response = cd.get_deployment(deploymentId=deployment_id)\n    info = response['deploymentInfo']\n    overview = info.get('deploymentOverview', {})\n    return {\n        'status': info['status'],\n        'succeeded': overview.get('Succeeded', 0),\n        'failed': overview.get('Failed', 0),\n        'in_progress': overview.get('InProgress', 0),\n        'strategy': info.get('deploymentStyle', {}).get('deploymentType', 'IN_PLACE')\n    }\n\ndef rollback_deployment(deployment_id):\n    """Stop and roll back a deployment."""\n    cd.stop_deployment(deploymentId=deployment_id, autoRollbackEnabled=True)\n    logger.warning("Deployment %s stopped and rolling back", deployment_id)`,
        explanations: [
          { line: '8-18', text: 'deploymentOverview shows how many instances succeeded, failed, or are in progress.' },
          { line: '20-23', text: 'stop_deployment with autoRollbackEnabled triggers automatic rollback to previous version.' }
        ] }
    ], defaultLang: 'python-cd', expectedOutput: 'Deployment d-ABC123: Succeeded=3, Failed=0' } },
    { id: 'cli-commands', type: 'command', title: 'CodeDeploy CLI', content: [
      { command: 'aws deploy create-deployment --application-name prod-app --deployment-group-name prod-dg --s3-location bucket=prod-artifacts,key=app.zip,bundleType=zip', category: 'aws-cli', expectedOutput: '{\n  "deploymentId": "d-ABC123DEF"\n}', explanation: 'Create a deployment from an S3 artifact. The deployment group defines the target instances and strategy.' },
      { command: 'aws deploy get-deployment --deployment-id d-ABC123DEF', category: 'aws-cli', expectedOutput: '{\n  "deploymentInfo": {\n    "status": "Succeeded",\n    "deploymentOverview": {"Succeeded": 3, "Failed": 0, "InProgress": 0}\n  }\n}', explanation: 'Check deployment status. Statuses: Created, Queued, InProgress, Succeeded, Failed, Stopped.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'CodeDeploy CLI Lab', mode: 'simulated',
      initialText: 'CodeDeploy Lab. Try:\n  aws deploy list-applications\n  aws deploy list-deployments --application-name prod-app',
      commands: {
        'aws deploy list-applications': { text: '{\n  "applications": ["prod-app", "staging-app"]\n}', type: 'output' },
        'aws deploy list-deployments --application-name prod-app': { text: '{\n  "deployments": ["d-ABC123", "d-DEF456", "d-GHI789"]\n}', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Blue/Green Deployment', content: {
      title: 'Deploy Application with Blue/Green Strategy',
      description: 'Create a CodeDeploy application, write AppSpec, deploy with blue/green strategy, and test rollback.',
      difficulty: 'advanced', duration: '35 min',
      objectives: ['Create application and deployment group', 'Write AppSpec with lifecycle hooks', 'Execute blue/green deployment', 'Test rollback'],
      steps: [
        { title: 'Create AppSpec', instructions: 'Create appspec.yml in your application root with file mappings and lifecycle hooks.', validation: 'appspec.yml created with hooks' },
        { title: 'Create Application', instructions: 'CodeDeploy > Applications > Create.\nPlatform: EC2/On-Premises.', validation: 'Application created' },
        { title: 'Create Blue/Green Deployment Group', instructions: 'Deployment group with Blue/Green type.\nALB target group.\nTraffic rerouting: immediately.\nTerminate blue: 1 hour.', validation: 'Deployment group created' },
        { title: 'Deploy and Monitor', instructions: 'Create deployment > Watch blue/green transition.\nMonitor lifecycle events.', validation: 'Traffic shifted to green, blue waiting for termination' },
        { title: 'Test Rollback', instructions: 'Stop deployment > Roll back.\nTraffic returns to blue instances.', validation: 'Rollback successful, original version serving traffic' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Deployment failed: Script timeout', error: 'LifecycleEvent AfterInstall failed with timeout', cause: 'Script in lifecycle hook took longer than the specified timeout.', fix: 'Increase timeout in appspec.yml. Check script for blocking operations. Add logging to identify where it hangs.' },
      { title: 'CodeDeploy agent not running', error: 'Instance not responding to deployment', cause: 'CodeDeploy agent not installed or not running on the EC2 instance.', fix: 'Install agent: sudo yum install codedeploy-agent. Start: sudo service codedeploy-agent start. Check IAM role has CodeDeploy permissions.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'CodeDeploy Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'Blue/Green vs In-Place deployment?', options: [
        { id: 'a', text: 'Blue/Green: zero downtime + instant rollback. In-Place: updates existing instances, brief downtime' },
        { id: 'b', text: 'They are the same' },
        { id: 'c', text: 'In-Place is always better' },
        { id: 'd', text: 'Blue/Green only works with Lambda' }
      ], correctId: 'a', explanation: 'Blue/Green provisions new instances, deploys, then shifts traffic. Zero downtime. Instant rollback by shifting back. In-Place updates instances one by one with brief per-instance downtime.', difficulty: 'intermediate' },
      { id: 'q2', question: 'What file tells CodeDeploy how to deploy?', options: [
        { id: 'a', text: 'buildspec.yml' }, { id: 'b', text: 'appspec.yml' }, { id: 'c', text: 'deploy.json' }, { id: 'd', text: 'Dockerfile' }
      ], correctId: 'b', explanation: 'appspec.yml (or appspec.json) defines file mappings and lifecycle hooks. buildspec.yml is for CodeBuild.', difficulty: 'beginner' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: Deployment Monitor', content: { title: 'Deployment Status Dashboard', description: 'Build a function that monitors all active deployments and flags any failures.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef monitor_deployments(app_name):\n    """List recent deployments and their status.\n    Return: [{'id': str, 'status': str, 'succeeded': int, 'failed': int}]\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef monitor_deployments(app_name):\n    cd = boto3.client('codedeploy')\n    deploys = cd.list_deployments(applicationName=app_name)['deployments'][:10]\n    results = []\n    for d_id in deploys:\n        info = cd.get_deployment(deploymentId=d_id)['deploymentInfo']\n        ov = info.get('deploymentOverview', {})\n        results.append({'id': d_id, 'status': info['status'], 'succeeded': ov.get('Succeeded', 0), 'failed': ov.get('Failed', 0)})\n    return results`,
      testCases: [{ description: 'Returns deployment list', expectedBehavior: 'Each entry has id, status, succeeded, failed counts' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<ol><li>Delete deployment group</li><li>Delete application</li><li>Terminate green instances if still running</li></ol><pre><code>aws deploy delete-deployment-group --application-name prod-app --deployment-group-name prod-dg\naws deploy delete-application --application-name prod-app</code></pre>` } },
    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is AWS CodeDeploy and what problem does it solve?","shortAnswer":"AWS CodeDeploy is a managed AWS service that automates code deployments to EC2, Lambda, and ECS with rollback capabilities. It eliminates the need to build custom deployment scripts, manage rolling updates, implement rollback logic.","commonMistake":"Not configuring automatic rollback on deployment failure.","followUp":"When would you NOT use AWS CodeDeploy?"},{"difficulty":"beginner","question":"What are the key components of AWS CodeDeploy?","shortAnswer":"Applications, Deployment Groups, Deployment Configurations, AppSpec, Hooks, Blue/Green, Canary.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does AWS CodeDeploy integrate with other AWS services?"},{"difficulty":"beginner","question":"How is AWS CodeDeploy priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate AWS CodeDeploy costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for AWS CodeDeploy?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor AWS CodeDeploy for security events?"},{"difficulty":"beginner","question":"How do you monitor AWS CodeDeploy?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does AWS CodeDeploy achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for AWS CodeDeploy?"},{"difficulty":"intermediate","question":"Explain the AWS CodeDeploy scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does AWS CodeDeploy handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for AWS CodeDeploy?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement AWS CodeDeploy in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade AWS CodeDeploy architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize AWS CodeDeploy costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for AWS CodeDeploy?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement AWS CodeDeploy using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does AWS CodeDeploy support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your AWS CodeDeploy is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate AWS CodeDeploy from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"AWS CodeDeploy costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for AWS CodeDeploy.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access AWS CodeDeploy across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"AWS CodeDeploy API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"AWS CodeDeploy has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access AWS CodeDeploy from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"AWS CodeDeploy encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for AWS CodeDeploy are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },


    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'AWS CodeDeploy', nextModule: { title: 'Amazon GuardDuty', href: 'module-43.html' }, message: 'Next: threat detection and security monitoring.' } }
  ]
};
