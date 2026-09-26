/**
 * ============================================================
 * MODULE 05 — Amazon CloudWatch
 * Monitoring, metrics, alarms, logs, dashboards
 * ============================================================
 */
const MODULE_05_DATA = {
  id: 'cloudwatch-fundamentals',
  moduleId: 'module-05',
  title: 'Amazon CloudWatch — Monitoring & Observability',
  description: 'Master AWS observability. Covers metrics, custom metrics, alarms, Log Groups/Streams, Metric Filters, Logs Insights queries, dashboards, and anomaly detection.',
  difficulty: 'intermediate',
  duration: '80 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 03: Amazon EC2'],
  objectives: [
    'Navigate CloudWatch metrics and understand namespaces, dimensions, and statistics',
    'Create CloudWatch Alarms with SNS notifications for production alerting',
    'Publish custom metrics from Lambda and EC2 applications',
    'Query CloudWatch Logs Insights for operational debugging',
    'Build operational dashboards with widgets for key metrics',
    'Use Metric Filters to extract metrics from log patterns',
    'Implement composite alarms for complex alerting logic'
  ],

  sections: [
    {
      id: 'why-cloudwatch',
      type: 'why',
      title: 'Why CloudWatch?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">📊</span>
            <div class="alert-content">
              <div class="alert-title">You Can't Fix What You Can't See</div>
              <div class="alert-text">CloudWatch is the central nervous system of AWS. Every service emits metrics and logs to CloudWatch automatically. Without monitoring, you're flying blind — outages, performance degradation, and cost overruns go undetected until customers complain.</div>
            </div>
          </div>
          <table>
            <thead><tr><th>Component</th><th>Purpose</th><th>Example</th></tr></thead>
            <tbody>
              <tr><td><strong>Metrics</strong></td><td>Time-series numerical data</td><td>CPUUtilization, Invocations, 4XXError</td></tr>
              <tr><td><strong>Alarms</strong></td><td>Watch metrics and trigger actions</td><td>CPU > 80% for 5 min → notify SNS</td></tr>
              <tr><td><strong>Logs</strong></td><td>Centralized log collection</td><td>Lambda execution logs, VPC Flow Logs</td></tr>
              <tr><td><strong>Logs Insights</strong></td><td>SQL-like log queries</td><td>Find all ERROR logs in last 1 hour</td></tr>
              <tr><td><strong>Dashboards</strong></td><td>Visual operational displays</td><td>Real-time application health view</td></tr>
              <tr><td><strong>Events/EventBridge</strong></td><td>React to state changes</td><td>EC2 instance stopped → notify team</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">Free Tier: 10 Custom Metrics, 5 GB Log Data, 3 Dashboards</div>
              <div class="alert-text">CloudWatch free tier is generous for small workloads. But custom metrics ($0.30/metric/month) and Log data ingestion ($0.50/GB) add up quickly at scale. Use Embedded Metric Format (EMF) for cost-efficient custom metrics.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'CloudWatch Architecture',
      content: {
        title: 'CloudWatch Observability Pipeline',
        width: 750,
        height: 260,
        nodes: [
          { id: 'lambda', label: 'Lambda', icon: '⚡', x: 10, y: 60, type: 'compute', description: 'Lambda auto-publishes: Invocations, Duration, Errors, Throttles, ConcurrentExecutions. Logs go to /aws/lambda/<fn-name>.' },
          { id: 'ec2', label: 'EC2', icon: '🖥️', x: 10, y: 170, type: 'compute', description: 'EC2 auto-publishes: CPUUtilization, NetworkIn/Out, DiskReadOps. Install CloudWatch Agent for memory, disk, custom metrics.' },
          { id: 'metrics', label: 'CloudWatch Metrics', icon: '📊', x: 220, y: 60, type: 'event', description: 'Time-series data organized by Namespace (AWS/Lambda), MetricName, Dimensions (FunctionName). Stored for 15 months at decreasing resolution.' },
          { id: 'logs', label: 'CloudWatch Logs', icon: '📝', x: 220, y: 170, type: 'storage', description: 'Log Groups → Log Streams. Retention: configurable (1 day to 10 years or never expire). Query with Logs Insights.' },
          { id: 'alarm', label: 'Alarm', icon: '🚨', x: 420, y: 60, type: 'security', description: 'Monitors a metric against a threshold. States: OK, ALARM, INSUFFICIENT_DATA. Actions: SNS, Auto Scaling, EC2 action.' },
          { id: 'dashboard', label: 'Dashboard', icon: '📈', x: 420, y: 170, type: 'trigger', description: 'Custom dashboards with metric widgets, log widgets, and text widgets. Auto-refresh. Shareable.' },
          { id: 'sns', label: 'SNS → PagerDuty', icon: '📱', x: 600, y: 60, type: 'event', description: 'Alarm triggers SNS topic which fans out to email, SMS, PagerDuty, Slack, or Lambda.' },
          { id: 'insights', label: 'Logs Insights', icon: '🔍', x: 600, y: 170, type: 'trigger', description: 'SQL-like query language for log analysis. Fast — scans TB of logs in seconds.' }
        ],
        edges: [
          { from: 'lambda', to: 'metrics', label: 'Auto-publish', animated: true },
          { from: 'lambda', to: 'logs', label: 'stdout/stderr', animated: true },
          { from: 'ec2', to: 'metrics', label: 'Auto-publish', animated: true },
          { from: 'ec2', to: 'logs', label: 'CW Agent', animated: true },
          { from: 'metrics', to: 'alarm', label: 'Threshold', animated: true },
          { from: 'metrics', to: 'dashboard', label: 'Widget' },
          { from: 'alarm', to: 'sns', label: 'Notify', animated: true },
          { from: 'logs', to: 'insights', label: 'Query' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Metric Anatomy</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">Namespace:  AWS/Lambda
MetricName: Duration
Dimensions: FunctionName=MyFunc, Resource=MyFunc:$LATEST
Statistics: Average, Sum, Min, Max, p99
Period:     60 seconds (1-minute resolution)</pre>

          <h4>2. Alarm Configuration</h4>
          <ul>
            <li><strong>Threshold</strong>: Static value or anomaly detection band</li>
            <li><strong>Evaluation Periods</strong>: "3 out of 5 data points breaching" = reduces noise</li>
            <li><strong>Actions</strong>: SNS topic, Auto Scaling policy, EC2 stop/terminate</li>
            <li><strong>Composite Alarm</strong>: AND/OR logic across multiple alarms (e.g., CPU high AND memory high)</li>
          </ul>

          <h4>3. Logs Insights Query Language</h4>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);"># Find coldest Lambda cold starts
fields @timestamp, @duration, @billedDuration
| filter @type = "REPORT"
| filter @initDuration > 0
| sort @initDuration desc
| limit 20

# Count errors per function in last 1 hour
fields @message
| filter @message like /ERROR/
| stats count(*) as errorCount by @logStream
| sort errorCount desc</pre>

          <h4>4. Custom Metrics</h4>
          <p>Two methods:</p>
          <ul>
            <li><strong>PutMetricData API</strong>: Explicitly publish metrics. $0.30/metric/month.</li>
            <li><strong>Embedded Metric Format (EMF)</strong>: Print structured JSON to stdout. CloudWatch extracts metrics automatically. Same cost but easier in Lambda.</li>
          </ul>

          <h4>5. Metric Resolution</h4>
          <table>
            <thead><tr><th>Resolution</th><th>Retention</th></tr></thead>
            <tbody>
              <tr><td>1-second (high-res)</td><td>3 hours</td></tr>
              <tr><td>60-second</td><td>15 days</td></tr>
              <tr><td>5-minute</td><td>63 days</td></tr>
              <tr><td>1-hour</td><td>455 days (15 months)</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'CloudWatch Boto3 Operations',
      content: {
        title: 'Custom Metrics, Alarms & Log Queries',
        languages: [
          {
            id: 'python-cw',
            label: 'Custom Metrics & Alarms',
            code: `import boto3
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cw = boto3.client('cloudwatch')

def publish_custom_metric(metric_name, value, unit, dimensions):
    """Publish a custom CloudWatch metric."""
    cw.put_metric_data(
        Namespace='MyApp/Orders',
        MetricData=[{
            'MetricName': metric_name,
            'Value': value,
            'Unit': unit,                # Count, Seconds, Bytes, etc.
            'Timestamp': datetime.utcnow(),
            'Dimensions': [
                {'Name': k, 'Value': v}
                for k, v in dimensions.items()
            ]
        }]
    )
    logger.info("Published metric: %s = %s %s", metric_name, value, unit)


def create_alarm(alarm_name, metric_name, threshold, sns_arn):
    """Create a CloudWatch alarm."""
    cw.put_metric_alarm(
        AlarmName=alarm_name,
        Namespace='MyApp/Orders',
        MetricName=metric_name,
        Statistic='Sum',
        Period=300,                       # 5 minutes
        EvaluationPeriods=3,             # Must breach 3 of 3 periods
        DatapointsToAlarm=3,
        Threshold=threshold,
        ComparisonOperator='GreaterThanThreshold',
        AlarmActions=[sns_arn],          # Notify on ALARM
        OKActions=[sns_arn],             # Notify on recovery
        TreatMissingData='notBreaching', # Missing data = OK (safe default)
        Tags=[{'Key': 'Team', 'Value': 'Platform'}]
    )
    logger.info("Created alarm: %s (threshold: %s)", alarm_name, threshold)


# EMF — Embedded Metric Format (print to stdout, CW extracts metrics)
def log_emf_metric(order_id, processing_time_ms, order_value):
    """
    Embedded Metric Format: print structured JSON → CloudWatch
    extracts metrics automatically. No PutMetricData API call needed.
    """
    emf = {
        "_aws": {
            "Timestamp": int(datetime.utcnow().timestamp() * 1000),
            "CloudWatchMetrics": [{
                "Namespace": "MyApp/Orders",
                "Dimensions": [["Environment", "Region"]],
                "Metrics": [
                    {"Name": "ProcessingTime", "Unit": "Milliseconds"},
                    {"Name": "OrderValue", "Unit": "None"}
                ]
            }]
        },
        "Environment": "production",
        "Region": "us-east-1",
        "ProcessingTime": processing_time_ms,
        "OrderValue": order_value,
        "orderId": order_id  # Non-metric field — just logged
    }
    print(json.dumps(emf))  # CloudWatch extracts metrics from stdout`,
            explanations: [
              { line: '13', text: 'put_metric_data publishes to a custom Namespace. Dimensions are key-value pairs that identify the metric source (e.g., Environment=prod).' },
              { line: '36', text: 'EvaluationPeriods=3 with DatapointsToAlarm=3 means ALL 3 periods must breach. Use "2 of 3" for critical alarms to reduce noise.' },
              { line: '43', text: 'TreatMissingData=notBreaching means "no data = OK." Use "breaching" if missing data itself indicates a problem.' },
              { line: '53-70', text: 'Embedded Metric Format: print JSON with _aws metadata to stdout. CloudWatch Logs automatically extracts metrics — no API calls, lower latency, same cost.' }
            ]
          }
        ],
        defaultLang: 'python-cw',
        expectedOutput: 'Published metric: OrderProcessingTime = 245 Milliseconds\nCreated alarm: HighOrderErrors (threshold: 10)'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'CloudWatch CLI Commands',
      content: [
        {
          command: 'aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration --dimensions Name=FunctionName,Value=MyFunction --start-time 2026-09-15T00:00:00Z --end-time 2026-09-16T00:00:00Z --period 3600 --statistics Average Maximum p99',
          category: 'aws-cli',
          expectedOutput: '{\n  "Datapoints": [\n    {"Timestamp": "2026-09-15T10:00:00Z", "Average": 245.3, "Maximum": 1523.0, "ExtendedStatistics": {"p99": 890.0}},\n    {"Timestamp": "2026-09-15T11:00:00Z", "Average": 198.7, "Maximum": 987.0, "ExtendedStatistics": {"p99": 650.0}}\n  ]\n}',
          explanation: 'Gets Lambda Duration metrics with 1-hour periods. Track Average for typical performance, p99 for tail latency, and Maximum for worst case. Use these to right-size Lambda memory.',
          interviewQ: 'Why is p99 latency more important than average latency for production monitoring?'
        },
        {
          command: 'aws logs start-query --log-group-name /aws/lambda/MyFunction --start-time 1726358400 --end-time 1726444800 --query-string "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 25"',
          category: 'aws-cli',
          expectedOutput: '{\n  "queryId": "12345678-1234-1234-1234-123456789012"\n}',
          explanation: 'Starts an async Logs Insights query. Use get-query-results with the queryId to retrieve results. Start/end times are Unix epoch seconds. Logs Insights scans at ~$0.005/GB.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'CloudWatch CLI Lab',
        mode: 'simulated',
        initialText: 'CloudWatch CLI Lab. Try:\n  aws cloudwatch list-metrics --namespace AWS/Lambda --metric-name Errors\n  aws cloudwatch describe-alarms --state-value ALARM\n  aws logs describe-log-groups --log-group-name-prefix /aws/lambda/',
        commands: {
          'aws cloudwatch list-metrics --namespace AWS/Lambda --metric-name Errors': {
            text: '{\n  "Metrics": [\n    {"Namespace": "AWS/Lambda", "MetricName": "Errors", "Dimensions": [{"Name": "FunctionName", "Value": "OrderProcessor"}]},\n    {"Namespace": "AWS/Lambda", "MetricName": "Errors", "Dimensions": [{"Name": "FunctionName", "Value": "AuthHandler"}]}\n  ]\n}',
            type: 'output'
          },
          'aws cloudwatch describe-alarms --state-value ALARM': {
            text: '{\n  "MetricAlarms": [{\n    "AlarmName": "HighErrorRate-OrderProcessor",\n    "StateValue": "ALARM",\n    "MetricName": "Errors",\n    "Namespace": "AWS/Lambda",\n    "Threshold": 5.0,\n    "StateUpdatedTimestamp": "2026-09-15T14:30:00Z"\n  }]\n}',
            type: 'output'
          },
          'aws logs describe-log-groups --log-group-name-prefix /aws/lambda/': {
            text: '{\n  "logGroups": [\n    {"logGroupName": "/aws/lambda/OrderProcessor", "storedBytes": 15728640, "retentionInDays": 30},\n    {"logGroupName": "/aws/lambda/AuthHandler", "storedBytes": 5242880, "retentionInDays": 14}\n  ]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common CloudWatch Issues',
      content: {
        items: [
          { title: 'Lambda metrics not appearing', error: 'No metrics visible for a Lambda function in CloudWatch', cause: 'Lambda was never invoked (no data points to publish). Or you\'re looking in the wrong region. Metrics appear after the first invocation.', fix: 'Invoke the function at least once. Verify you\'re in the correct region. Metrics may take 1-2 minutes to appear after invocation.' },
          { title: 'Alarm stuck in INSUFFICIENT_DATA', error: 'Alarm shows INSUFFICIENT_DATA state indefinitely', cause: 'No metric data points match the specified dimensions, or the period is longer than the data retention for that resolution.', fix: 'Verify the metric exists (list-metrics). Check dimensions match exactly (case-sensitive). Set TreatMissingData=notBreaching if gaps are expected.' },
          { title: 'CloudWatch Logs costs too high', error: 'Log ingestion costs exceeding budget', cause: 'Log retention set to "Never Expire" (default). High-volume functions logging at DEBUG level. No log filtering.', fix: 'Set retention policies (30 days for dev, 90 days for prod). Lower Lambda log level to INFO/WARN. Use Log Subscription Filters to send specific patterns to cheaper storage (S3/Kinesis Firehose).' },
          { title: 'Custom metric not showing in console', error: 'put_metric_data succeeds but metric not visible', cause: 'Custom metrics take 2-5 minutes to appear. Or the Namespace spelling doesn\'t match what you\'re searching for (case-sensitive).', fix: 'Wait 5 minutes. Verify the exact Namespace string. Use list-metrics to confirm: aws cloudwatch list-metrics --namespace "MyApp/Orders"' }
        ]
      }
    },

    {
      id: 'quiz-cw',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon CloudWatch Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You set a CloudWatch Alarm with EvaluationPeriods=5, DatapointsToAlarm=3, Period=60. When does the alarm trigger?',
            options: [
              { id: 'a', text: 'When the threshold is breached for 5 consecutive minutes' },
              { id: 'b', text: 'When 3 out of 5 consecutive 1-minute data points breach the threshold' },
              { id: 'c', text: 'When the metric breaches for 3 seconds' },
              { id: 'd', text: 'When the average of 5 periods exceeds the threshold' }
            ],
            correctId: 'b',
            explanation: '3 out of 5 means: within any 5 consecutive 1-minute evaluation periods, if 3 or more data points breach the threshold, the alarm transitions to ALARM state. This "M out of N" pattern reduces false positives from momentary spikes.',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'EC2 reports CPUUtilization automatically. But you need memory utilization. How do you get it?',
            options: [
              { id: 'a', text: 'Enable detailed monitoring — it includes memory metrics' },
              { id: 'b', text: 'Install the CloudWatch Agent on the instance to collect and publish memory metrics' },
              { id: 'c', text: 'Memory utilization is not available in AWS' },
              { id: 'd', text: 'Use EC2 Systems Manager to automatically publish memory metrics' }
            ],
            correctId: 'b',
            explanation: 'EC2 hypervisor can only see CPU, network, and disk I/O from outside the instance. Memory and disk space require an agent INSIDE the OS. Install the CloudWatch Agent (unified agent) to collect memory, disk, and custom app metrics.',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'What is the advantage of Embedded Metric Format (EMF) over PutMetricData for Lambda custom metrics?',
            options: [
              { id: 'a', text: 'EMF is cheaper — no per-metric cost' },
              { id: 'b', text: 'EMF avoids an API call (prints to stdout) so it has lower latency and doesn\'t increase Lambda duration' },
              { id: 'c', text: 'EMF supports more metric types than PutMetricData' },
              { id: 'd', text: 'EMF bypasses IAM permissions' }
            ],
            correctId: 'b',
            explanation: 'EMF writes structured JSON to stdout. CloudWatch Logs agent extracts metrics asynchronously. No additional API call during Lambda execution = lower latency and no added duration. PutMetricData is an API call that adds ~50-100ms to execution time. Cost is the same for both.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-cw',
      type: 'challenge',
      title: 'Challenge: Production Alarm Builder',
      content: {
        title: 'Build a Production Monitoring Alarm',
        description: 'Write a function that creates a CloudWatch alarm for Lambda error rate monitoring. The alarm should trigger when errors exceed a threshold and notify an SNS topic.',
        difficulty: 'intermediate',
        requirements: [
          'Create an alarm for AWS/Lambda Errors metric',
          'Use FunctionName dimension for a specific Lambda function',
          'Set threshold, period (5 min), and evaluation periods (3 of 3)',
          'Configure both AlarmActions and OKActions with an SNS topic ARN',
          'Set TreatMissingData to "notBreaching"',
          'Log the alarm creation with its name and threshold'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

cw = boto3.client('cloudwatch')

def create_lambda_error_alarm(function_name, threshold, sns_topic_arn):
    """Create a CloudWatch alarm for Lambda function errors."""

    # TODO: Define alarm name
    # TODO: Call put_metric_alarm with correct parameters
    # TODO: Log success

    pass`,
        language: 'python',
        hints: [
          'alarm_name = f"Lambda-Errors-{function_name}"',
          'Namespace="AWS/Lambda", MetricName="Errors"',
          'Dimensions=[{"Name": "FunctionName", "Value": function_name}]',
          'Statistic="Sum", Period=300, EvaluationPeriods=3',
          'ComparisonOperator="GreaterThanThreshold"'
        ],
        testCases: [
          { description: 'Calls put_metric_alarm', keywords: ['put_metric_alarm'], expectedOutput: 'put_metric_alarm' },
          { description: 'Uses AWS/Lambda namespace', keywords: ['AWS/Lambda'], expectedOutput: 'AWS/Lambda' },
          { description: 'Sets Errors metric', keywords: ['Errors'], expectedOutput: 'Errors' },
          { description: 'Configures SNS alarm actions', keywords: ['AlarmActions'], expectedOutput: 'AlarmActions' },
          { description: 'Sets TreatMissingData', keywords: ['notBreaching'], expectedOutput: 'notBreaching' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon CloudWatch Hands-On Lab', content: {"title":"Amazon CloudWatch Hands-On Lab","description":"Configure and test Amazon CloudWatch following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open CloudWatch Console","instruction":"AWS Console → Search \"CloudWatch\" → Open service dashboard.","expectedResult":"CloudWatch dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon CloudWatch and what problem does it solve?","shortAnswer":"Amazon CloudWatch is a managed AWS service that monitors AWS resources and applications with metrics, logs, alarms, and dashboards. It eliminates the need to build custom monitoring infrastructure.","commonMistake":"Not enabling detailed monitoring (1-minute intervals) for production EC2 instances.","followUp":"When would you NOT use Amazon CloudWatch?"},{"difficulty":"beginner","question":"What are the key components of Amazon CloudWatch?","shortAnswer":"Metrics, Alarms, Dashboards, Logs, Log Insights, Events/EventBridge, Synthetics, ServiceLens.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon CloudWatch integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon CloudWatch priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon CloudWatch costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon CloudWatch?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon CloudWatch for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon CloudWatch?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon CloudWatch achieve high availability?","shortAnswer":"CloudWatch is a regional service that stores data redundantly across AZs. Multi-region dashboards aggregate cross-region data.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon CloudWatch?"},{"difficulty":"intermediate","question":"Explain the Amazon CloudWatch scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon CloudWatch handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon CloudWatch?","shortAnswer":"Default: 5000 alarms, 500 metrics per dashboard, 10 custom namespaces. PutMetricData: 150 TPS.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon CloudWatch in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon CloudWatch architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon CloudWatch costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon CloudWatch?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon CloudWatch using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon CloudWatch support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon CloudWatch is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon CloudWatch from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon CloudWatch costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon CloudWatch.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon CloudWatch across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon CloudWatch API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon CloudWatch has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon CloudWatch from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon CloudWatch encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon CloudWatch are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete CloudWatch resources:</strong> Navigate to CloudWatch console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the CloudWatch console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 07: Amazon CloudFront', url: 'module-29.html' }, next: { title: 'Chapter 09: AWS CloudTrail', url: 'module-26.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_05_DATA;
} else {
  window.MODULE_05_DATA = MODULE_05_DATA;
}
