/**
 * MODULE 39 — Amazon EC2 Auto Scaling
 * Automatic capacity management for EC2 fleets
 */
const MODULE_39_DATA = {
  id: 'autoscaling-fundamentals', moduleId: 'module-39',
  title: 'Amazon EC2 Auto Scaling — Automatic Capacity Management',
  description: 'Master auto scaling. Covers Launch Templates, ASG configuration, scaling policies (target tracking, step, scheduled, predictive), health checks, lifecycle hooks, and warm pools.',
  difficulty: 'intermediate', duration: '75 min',
  prerequisites: ['Module 03: Amazon EC2', 'Module 18: Elastic Load Balancing'],
  objectives: [
    'Create Launch Templates with production configurations',
    'Configure Auto Scaling Groups with multi-AZ deployment',
    'Implement target tracking, step, and scheduled scaling policies',
    'Configure ELB health checks for application-level monitoring',
    'Use lifecycle hooks for custom initialization',
    'Troubleshoot scaling events and capacity issues'
  ],
  sections: [
    { id: 'why', type: 'why', title: 'Why Auto Scaling?', content: { html: `
      <div class="alert alert-info"><span class="alert-icon">&#128200;</span><div class="alert-content"><div class="alert-title">Right-Size Automatically, Pay Only for What You Need</div><div class="alert-text">Auto Scaling adds EC2 instances when demand increases and removes them when demand drops. No manual intervention. No over-provisioning. Self-healing when instances fail.</div></div></div>
      <h4>Three Benefits</h4>
      <table><thead><tr><th>Benefit</th><th>Without ASG</th><th>With ASG</th></tr></thead><tbody>
        <tr><td><strong>Cost</strong></td><td>Pay for peak capacity 24/7</td><td>Scale down at night, scale up during peaks</td></tr>
        <tr><td><strong>Availability</strong></td><td>Single instance = single point of failure</td><td>Multi-AZ, auto-replace unhealthy instances</td></tr>
        <tr><td><strong>Performance</strong></td><td>Slow response during traffic spikes</td><td>Add capacity in minutes automatically</td></tr>
      </tbody></table>
      <div class="alert alert-warning"><span class="alert-icon">&#9888;&#65039;</span><div class="alert-content"><div class="alert-title">ASG Without Scaling Policy = Manual Scaling</div><div class="alert-text">An ASG without scaling policies only maintains the desired count (self-healing). You need scaling policies to automatically adjust capacity based on metrics.</div></div></div>
    ` } },
    { id: 'architecture', type: 'architecture', title: 'Auto Scaling Architecture', content: { title: 'ALB + ASG + CloudWatch = Auto-Scaling System', width: 750, height: 300,
      nodes: [
        { id: 'cw', label: 'CloudWatch', icon: '&#128202;', x: 10, y: 130, type: 'monitoring', description: 'CloudWatch monitors metrics (CPU, request count, custom). When metric crosses threshold, triggers scaling policy.' },
        { id: 'policy', label: 'Scaling Policy', icon: '&#128203;', x: 180, y: 130, type: 'security', description: 'Target Tracking: maintain CPU at 50%. Step Scaling: add 2 at 70%, add 4 at 90%. Scheduled: scale up at 8 AM.' },
        { id: 'asg', label: 'Auto Scaling Group', icon: '&#128200;', x: 370, y: 130, type: 'compute', description: 'ASG manages EC2 fleet. Min=2, Desired=2, Max=10. Spans multiple AZs. Uses Launch Template for instance config.' },
        { id: 'lt', label: 'Launch Template', icon: '&#128196;', x: 370, y: 250, type: 'storage', description: 'Blueprint: AMI, instance type, key pair, security group, user data, IAM role. Versioned — update without recreation.' },
        { id: 'ec2a', label: 'EC2 AZ-1', icon: '&#128421;&#65039;', x: 560, y: 60, type: 'compute', description: 'Running instance in AZ-1.' },
        { id: 'ec2b', label: 'EC2 AZ-2', icon: '&#128421;&#65039;', x: 560, y: 200, type: 'compute', description: 'Running instance in AZ-2.' },
        { id: 'alb', label: 'ALB', icon: '&#9889;', x: 700, y: 130, type: 'network', description: 'ALB distributes traffic to healthy instances. ELB health check ensures only healthy instances receive traffic.' }
      ],
      edges: [
        { from: 'cw', to: 'policy', label: 'Alarm', animated: true },
        { from: 'policy', to: 'asg', label: 'Scale', animated: true },
        { from: 'asg', to: 'ec2a', label: 'Launch' },
        { from: 'asg', to: 'ec2b', label: 'Launch' },
        { from: 'lt', to: 'asg', label: 'Blueprint' },
        { from: 'ec2a', to: 'alb', label: 'Register' },
        { from: 'ec2b', to: 'alb', label: 'Register' }
      ] } },
    { id: 'concepts', type: 'concept', title: 'Core Concepts', content: { html: `
      <h4>1. Launch Template vs Launch Configuration</h4>
      <table><thead><tr><th>Feature</th><th>Launch Template</th><th>Launch Configuration</th></tr></thead><tbody>
        <tr><td><strong>Versioning</strong></td><td>Yes (multiple versions)</td><td>No (immutable)</td></tr>
        <tr><td><strong>Mixed instances</strong></td><td>Yes (On-Demand + Spot)</td><td>No</td></tr>
        <tr><td><strong>T2/T3 unlimited</strong></td><td>Yes</td><td>No</td></tr>
        <tr><td><strong>Status</strong></td><td>Current (use this)</td><td>Legacy (deprecated)</td></tr>
      </tbody></table>
      <h4>2. Scaling Policies</h4>
      <table><thead><tr><th>Policy</th><th>How It Works</th><th>Best For</th></tr></thead><tbody>
        <tr><td><strong>Target Tracking</strong></td><td>Maintain metric at target (e.g., CPU = 50%)</td><td>Most workloads (simplest)</td></tr>
        <tr><td><strong>Step Scaling</strong></td><td>Add/remove N instances per threshold band</td><td>Granular control per severity</td></tr>
        <tr><td><strong>Scheduled</strong></td><td>Scale at specific times</td><td>Predictable traffic patterns</td></tr>
        <tr><td><strong>Predictive</strong></td><td>ML-based forecast from historical data</td><td>Recurring patterns (daily/weekly)</td></tr>
      </tbody></table>
      <h4>3. Health Checks</h4>
      <ul>
        <li><strong>EC2 (default)</strong>: Only checks if instance is running (ignores app crashes)</li>
        <li><strong>ELB</strong>: Checks application health via ALB health check (recommended for production)</li>
        <li><strong>Custom</strong>: Your application reports health via API</li>
      </ul>
      <h4>4. Capacity Settings</h4>
      <ul>
        <li><strong>Minimum</strong>: Floor — ASG never scales below this (HA guarantee)</li>
        <li><strong>Desired</strong>: Current target — ASG launches/terminates to match</li>
        <li><strong>Maximum</strong>: Ceiling — ASG never scales above this (cost protection)</li>
      </ul>
      <h4>5. Cooldown Period</h4>
      <p>After a scaling activity, ASG waits (default 300s) before allowing another. Prevents "thrashing" where instances are added and removed rapidly. Target tracking has its own cooldown.</p>
      <h4>6. Lifecycle Hooks</h4>
      <p>Pause instance before it enters service (Pending:Wait) or before termination (Terminating:Wait). Use for: pull code, register with service discovery, drain connections, backup data.</p>
      <h4>7. Warm Pools</h4>
      <p>Pre-initialized stopped instances that can start in seconds instead of minutes. Reduces scale-out time from 5+ minutes to ~30 seconds. Cost: only EBS storage while stopped.</p>
    ` } },
    { id: 'lambda-code', type: 'code', title: 'Auto Scaling Boto3', content: { title: 'ASG Management', languages: [
      { id: 'python-asg', label: 'Core Operations',
        code: `import boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\nasg = boto3.client('autoscaling')\n\ndef get_asg_status(name):\n    """Get detailed ASG status including instance health."""\n    response = asg.describe_auto_scaling_groups(AutoScalingGroupNames=[name])\n    group = response['AutoScalingGroups'][0]\n    instances = []\n    for i in group['Instances']:\n        instances.append({\n            'id': i['InstanceId'],\n            'az': i['AvailabilityZone'],\n            'health': i['HealthStatus'],\n            'lifecycle': i['LifecycleState']\n        })\n    return {\n        'name': name,\n        'min': group['MinSize'],\n        'desired': group['DesiredCapacity'],\n        'max': group['MaxSize'],\n        'instances': instances\n    }\n\ndef update_capacity(name, desired=None, min_size=None, max_size=None):\n    """Update ASG capacity settings."""\n    params = {'AutoScalingGroupName': name}\n    if desired is not None: params['DesiredCapacity'] = desired\n    if min_size is not None: params['MinSize'] = min_size\n    if max_size is not None: params['MaxSize'] = max_size\n    asg.update_auto_scaling_group(**params)\n    logger.info("Updated ASG %s: desired=%s min=%s max=%s", name, desired, min_size, max_size)`,
        explanations: [
          { line: '10-11', text: 'describe_auto_scaling_groups returns full ASG details including all instances, their AZ, health, and lifecycle state.' },
          { line: '27-33', text: 'update_auto_scaling_group changes capacity. Setting desired triggers immediate scaling. Min/Max set guardrails.' }
        ] }
    ], defaultLang: 'python-asg', expectedOutput: 'ASG prod-web-asg: min=2 desired=2 max=10, 2 instances healthy' } },
    { id: 'cli-commands', type: 'command', title: 'Auto Scaling CLI', content: [
      { command: 'aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names prod-web-asg', category: 'aws-cli', expectedOutput: '{\n  "AutoScalingGroups": [{\n    "MinSize": 2, "DesiredCapacity": 2, "MaxSize": 10,\n    "Instances": [\n      {"InstanceId": "i-abc", "HealthStatus": "Healthy", "LifecycleState": "InService"},\n      {"InstanceId": "i-def", "HealthStatus": "Healthy", "LifecycleState": "InService"}\n    ]\n  }]\n}', explanation: 'Get full ASG details: capacity settings, instances, health, AZs.' },
      { command: 'aws autoscaling describe-scaling-activities --auto-scaling-group-name prod-web-asg --max-items 5', category: 'aws-cli', expectedOutput: '{\n  "Activities": [\n    {"Description": "Launching a new EC2 instance: i-abc", "StatusCode": "Successful", "Cause": "At 2024-01-15T10:30:00Z an alarm triggered policy HighCPU"}\n  ]\n}', explanation: 'View recent scaling activities — essential for debugging why instances were added or removed.' }
    ] },
    { id: 'terminal-lab', type: 'terminal', title: 'Interactive Terminal', content: { title: 'Auto Scaling CLI Lab', mode: 'simulated',
      initialText: 'Auto Scaling Lab. Try:\n  aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names prod-web-asg\n  aws autoscaling set-desired-capacity --auto-scaling-group-name prod-web-asg --desired-capacity 4',
      commands: {
        'aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names prod-web-asg': { text: '{\n  "AutoScalingGroups": [{\n    "AutoScalingGroupName": "prod-web-asg",\n    "LaunchTemplate": {"LaunchTemplateName": "prod-web-lt", "Version": "$Latest"},\n    "MinSize": 2, "DesiredCapacity": 2, "MaxSize": 10,\n    "AvailabilityZones": ["ap-south-1a", "ap-south-1b"],\n    "HealthCheckType": "ELB",\n    "Instances": [\n      {"InstanceId": "i-0abc123", "AvailabilityZone": "ap-south-1a", "HealthStatus": "Healthy", "LifecycleState": "InService"},\n      {"InstanceId": "i-0def456", "AvailabilityZone": "ap-south-1b", "HealthStatus": "Healthy", "LifecycleState": "InService"}\n    ]\n  }]\n}', type: 'output' },
        'aws autoscaling set-desired-capacity --auto-scaling-group-name prod-web-asg --desired-capacity 4': { text: '(no output — command succeeded)\n\nASG will now launch 2 additional instances to reach desired capacity of 4.', type: 'output' }
      } } },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Auto Scaling with ALB', content: {
      title: 'Create ASG with Target Tracking and Test Scaling',
      description: 'Create a Launch Template, ASG with ALB integration, target tracking policy, and test auto-scaling with load generation.',
      difficulty: 'intermediate', duration: '40 min',
      objectives: ['Create Launch Template', 'Create ASG with multi-AZ', 'Attach to ALB', 'Test scaling with CPU stress'],
      steps: [
        { title: 'Create Launch Template', instructions: 'EC2 > Launch Templates > Create.\n\nName: prod-web-lt\nAMI: Amazon Linux 2023\nInstance type: t2.micro\nSecurity group: prod-ec2-sg\nIAM instance profile: prod-ec2-web-role\nUser data: Install and start Nginx', validation: 'Launch template created with version 1' },
        { title: 'Create Auto Scaling Group', instructions: 'EC2 > Auto Scaling Groups > Create.\n\nName: prod-web-asg\nLaunch template: prod-web-lt\nVPC: prod-vpc, Subnets: both private\nAttach to ALB target group\nHealth check: ELB\nGroup size: Min=2, Desired=2, Max=6', validation: '2 instances launch and register with ALB' },
        { title: 'Add Target Tracking Policy', instructions: 'ASG > Automatic scaling > Create scaling policy.\n\nType: Target tracking\nMetric: Average CPU utilization\nTarget value: 70%', validation: 'Policy created, CloudWatch alarms auto-created' },
        { title: 'Generate Load', instructions: 'Connect to instance via SSM:\n\nsudo dnf install -y stress\nsudo stress --cpu 4 --timeout 300\n\nWait 2-3 minutes for CloudWatch alarm to trigger.', validation: 'New instances launching (3 or 4 total)' },
        { title: 'Observe Scale-In', instructions: 'Stop the stress command.\nWait 5-10 minutes.\nASG removes excess instances (back to 2).', validation: 'Instance count returns to 2' }
      ] } },
    { id: 'troubleshooting', type: 'troubleshooting', title: 'Common Issues', content: { items: [
      { title: 'Instances launch but immediately terminate', error: 'ASG activity: "Launching instance" then "Terminating instance"', cause: 'Instance fails ELB health check within grace period. App not ready fast enough, or wrong health check path.', fix: 'Increase health check grace period (300-600s). Verify ALB health check path returns 200. Check security group allows ALB to reach instances.' },
      { title: 'Scaling too slow', error: 'Takes 5+ minutes to add instances during traffic spike', cause: 'Instance boot time + app initialization + health check grace period.', fix: 'Use warm pools (pre-initialized stopped instances). Create golden AMI with app pre-installed. Reduce health check grace period once stable.' },
      { title: 'Instances stuck in Pending:Wait', error: 'Instance never enters InService', cause: 'Lifecycle hook is configured but never completed.', fix: 'Check lifecycle hook. Send complete-lifecycle-action or set heartbeat timeout. Check Lambda/SNS target of the hook.' }
    ] } },
    { id: 'quiz', type: 'quiz', title: 'Knowledge Check', content: { title: 'Auto Scaling Quiz', type: 'knowledge-check', questions: [
      { id: 'q1', question: 'What happens if you set Min=2, Desired=2, Max=6 and CPU stays at 40%?', options: [
        { id: 'a', text: 'ASG maintains exactly 2 instances' },
        { id: 'b', text: 'ASG scales down to 0' },
        { id: 'c', text: 'ASG scales up to 6' },
        { id: 'd', text: 'ASG removes 1 instance' }
      ], correctId: 'a', explanation: 'ASG maintains the desired count (2). With CPU at 40% and a 70% target tracking policy, no scaling action occurs. ASG never goes below minimum.', difficulty: 'beginner' },
      { id: 'q2', question: 'You manually terminate one instance in an ASG. What happens?', options: [
        { id: 'a', text: 'ASG launches a replacement to maintain desired count' },
        { id: 'b', text: 'ASG reduces desired count by 1' },
        { id: 'c', text: 'Nothing — you must manually launch a replacement' },
        { id: 'd', text: 'ASG terminates all remaining instances' }
      ], correctId: 'a', explanation: 'ASG is self-healing. If an instance is terminated (manually or by failure), ASG automatically launches a replacement to maintain the desired count.', difficulty: 'beginner' },
      { id: 'q3', question: 'Which health check type should you use with an ALB?', options: [
        { id: 'a', text: 'EC2 (default)' },
        { id: 'b', text: 'ELB' },
        { id: 'c', text: 'Both simultaneously' },
        { id: 'd', text: 'Custom only' }
      ], correctId: 'b', explanation: 'ELB health check verifies the application is responding (HTTP 200 on health check path). EC2 health check only verifies the instance is running — an app crash would not be detected.', difficulty: 'intermediate' },
      { id: 'q4', question: 'What is a warm pool?', options: [
        { id: 'a', text: 'A pool of running instances ready to serve traffic' },
        { id: 'b', text: 'Pre-initialized stopped instances that start in seconds' },
        { id: 'c', text: 'A pool of reserved capacity' },
        { id: 'd', text: 'A caching layer for ASG' }
      ], correctId: 'b', explanation: 'Warm pools contain stopped (or hibernated) EC2 instances that have already been initialized. When ASG needs to scale out, these start in ~30 seconds instead of 5+ minutes for a cold launch.', difficulty: 'advanced' }
    ] } },
    { id: 'challenge', type: 'challenge', title: 'Challenge: ASG Health Reporter', content: { title: 'ASG Fleet Health Dashboard', description: 'Build a function that reports the health status of all ASGs, including AZ distribution and unhealthy instances.', difficulty: 'intermediate',
      starterCode: `import boto3\n\ndef fleet_health_report():\n    """Return health report for all ASGs.\n    Format: [{'name': str, 'healthy': int, 'unhealthy': int, 'az_distribution': {}}]\n    """\n    # YOUR CODE HERE\n    pass`,
      solution: `import boto3\n\ndef fleet_health_report():\n    asg_client = boto3.client('autoscaling')\n    groups = asg_client.describe_auto_scaling_groups()['AutoScalingGroups']\n    report = []\n    for g in groups:\n        az_dist = {}\n        healthy = unhealthy = 0\n        for i in g['Instances']:\n            az = i['AvailabilityZone']\n            az_dist[az] = az_dist.get(az, 0) + 1\n            if i['HealthStatus'] == 'Healthy': healthy += 1\n            else: unhealthy += 1\n        report.append({'name': g['AutoScalingGroupName'], 'healthy': healthy, 'unhealthy': unhealthy, 'desired': g['DesiredCapacity'], 'az_distribution': az_dist})\n    return report`,
      testCases: [{ description: 'Returns list of ASG reports', expectedBehavior: 'Each entry has name, healthy, unhealthy, az_distribution' }] } },
    { id: 'cleanup', type: 'cleanup', title: 'Cleanup', content: { html: `<h4>Resources to Remove</h4><ol><li>Delete ASG (force-delete terminates instances)</li><li>Delete Launch Template</li></ol><pre><code>aws autoscaling delete-auto-scaling-group --auto-scaling-group-name prod-web-asg --force-delete\naws ec2 delete-launch-template --launch-template-name prod-web-lt</code></pre>` } },
    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is EC2 Auto Scaling and what problem does it solve?","shortAnswer":"EC2 Auto Scaling is a managed AWS service that automatically adjusts EC2 capacity based on demand with launch templates and scaling policies. It eliminates the need to manually scale servers, over-provision for peak capacity.","commonMistake":"Creating ASG without scaling policies — it only maintains desired count but doesn't auto-scale.","followUp":"When would you NOT use EC2 Auto Scaling?"},{"difficulty":"beginner","question":"What are the key components of EC2 Auto Scaling?","shortAnswer":"ASG, Launch Template, Scaling Policies (Target/Step/Scheduled/Predictive), Health Checks, Lifecycle Hooks, Warm Pools.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does EC2 Auto Scaling integrate with other AWS services?"},{"difficulty":"beginner","question":"How is EC2 Auto Scaling priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate EC2 Auto Scaling costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for EC2 Auto Scaling?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor EC2 Auto Scaling for security events?"},{"difficulty":"beginner","question":"How do you monitor EC2 Auto Scaling?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does EC2 Auto Scaling achieve high availability?","shortAnswer":"Multi-AZ deployment, automatic failover, health checks, and data replication across Availability Zones.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for EC2 Auto Scaling?"},{"difficulty":"intermediate","question":"Explain the EC2 Auto Scaling scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does EC2 Auto Scaling handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for EC2 Auto Scaling?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement EC2 Auto Scaling in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade EC2 Auto Scaling architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize EC2 Auto Scaling costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for EC2 Auto Scaling?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement EC2 Auto Scaling using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does EC2 Auto Scaling support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your EC2 Auto Scaling is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate EC2 Auto Scaling from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"EC2 Auto Scaling costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for EC2 Auto Scaling.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access EC2 Auto Scaling across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"EC2 Auto Scaling API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"EC2 Auto Scaling has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access EC2 Auto Scaling from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"EC2 Auto Scaling encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for EC2 Auto Scaling are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },


    { id: 'next', type: 'next', title: 'Next Steps', content: { currentModule: 'EC2 Auto Scaling', nextModule: { title: 'Amazon EFS', href: 'module-40.html' }, message: 'Next: shared filesystem for multi-instance applications.' } }
  ]
};
