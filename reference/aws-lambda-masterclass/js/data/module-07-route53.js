/**
 * ============================================================
 * MODULE 07 — Amazon Route 53
 * DNS, hosted zones, routing policies, health checks, domain registration
 * ============================================================
 */
const MODULE_07_DATA = {
  id: 'route53-fundamentals',
  moduleId: 'module-07',
  title: 'Amazon Route 53 — DNS & Traffic Management',
  description: 'Master AWS DNS and traffic routing. Covers Hosted Zones, record types (A, AAAA, CNAME, Alias), routing policies (Simple, Weighted, Latency, Failover, Geolocation), health checks, and domain registration.',
  difficulty: 'intermediate',
  duration: '75 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 04: Amazon VPC', 'Basic DNS knowledge'],
  objectives: [
    'Create and manage Route 53 Hosted Zones for domain management',
    'Differentiate between record types: A, AAAA, CNAME, and Alias records',
    'Implement routing policies for load balancing and disaster recovery',
    'Configure health checks for automated failover',
    'Use Alias records to point to AWS resources (ALB, CloudFront, S3)',
    'Register and transfer domains through Route 53',
    'Design multi-region active-active and active-passive architectures'
  ],

  sections: [
    {
      id: 'why-route53',
      type: 'why',
      title: 'Why Route 53?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🌐</span>
            <div class="alert-content">
              <div class="alert-title">DNS is the Foundation of Every Web Application</div>
              <div class="alert-text">Route 53 is a highly available, scalable DNS service with 100% uptime SLA. It translates human-friendly domain names (api.example.com) to IP addresses and AWS resource endpoints. Named after TCP/UDP port 53 — the DNS port.</div>
            </div>
          </div>
          <h4>Record Types</h4>
          <table>
            <thead><tr><th>Type</th><th>Points To</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>A</strong></td><td>IPv4 address</td><td>Map domain to an IP: 203.0.113.1</td></tr>
              <tr><td><strong>AAAA</strong></td><td>IPv6 address</td><td>Map domain to IPv6</td></tr>
              <tr><td><strong>CNAME</strong></td><td>Another domain name</td><td>Redirect api.example.com → lb-123.elb.amazonaws.com</td></tr>
              <tr><td><strong>Alias</strong></td><td>AWS resource directly</td><td>Free, works at zone apex, native AWS integration</td></tr>
              <tr><td><strong>MX</strong></td><td>Mail servers</td><td>Email routing</td></tr>
              <tr><td><strong>TXT</strong></td><td>Text data</td><td>Domain verification, SPF, DKIM</td></tr>
              <tr><td><strong>NS</strong></td><td>Name servers</td><td>Delegation (auto-created per hosted zone)</td></tr>
            </tbody>
          </table>
          <div class="alert alert-tip">
            <span class="alert-icon">💡</span>
            <div class="alert-content">
              <div class="alert-title">Alias Records > CNAME for AWS Resources</div>
              <div class="alert-text">Alias records are free (no query charges), work at the zone apex (example.com, not just sub.example.com), and resolve directly to the resource IP. CNAME adds an extra DNS hop and cannot be used at the zone apex. Always prefer Alias for ALB, CloudFront, S3, and API Gateway.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Route 53 DNS Resolution & Failover',
      content: {
        title: 'Route 53 Failover Routing with Health Checks',
        width: 750,
        height: 280,
        nodes: [
          { id: 'user', label: 'User Browser', icon: '👤', x: 10, y: 120, type: 'client', description: 'User types api.example.com in the browser. The browser makes a DNS query to resolve the domain to an IP address.' },
          { id: 'r53', label: 'Route 53', icon: '🌐', x: 170, y: 120, type: 'trigger', description: 'Route 53 receives the DNS query. Evaluates the routing policy and health check status. Returns the appropriate IP/endpoint based on the active routing policy.' },
          { id: 'health', label: 'Health Checks', icon: '💚', x: 170, y: 240, type: 'security', description: 'Route 53 health checkers ping your endpoints every 10 or 30 seconds from multiple regions. If an endpoint fails, Route 53 stops routing traffic to it.' },
          { id: 'primary', label: 'Primary (us-east-1)', icon: '🖥️', x: 400, y: 60, type: 'compute', description: 'Primary ALB in us-east-1. Active target for failover routing. Health check monitors /health endpoint.' },
          { id: 'secondary', label: 'Secondary (eu-west-1)', icon: '🖥️', x: 400, y: 200, type: 'compute', description: 'Secondary ALB in eu-west-1. Standby for failover. Route 53 routes here only if primary health check fails.' },
          { id: 'cloudfront', label: 'CloudFront', icon: '🌍', x: 600, y: 120, type: 'trigger', description: 'For static content, Route 53 Alias record points to CloudFront distribution. Cached at 400+ edge locations globally.' }
        ],
        edges: [
          { from: 'user', to: 'r53', label: 'DNS Query', animated: true },
          { from: 'r53', to: 'primary', label: 'Failover: Primary', animated: true },
          { from: 'r53', to: 'secondary', label: 'Failover: Secondary' },
          { from: 'health', to: 'primary', label: 'Check /health' },
          { from: 'health', to: 'secondary', label: 'Check /health' },
          { from: 'r53', to: 'cloudfront', label: 'Alias Record' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Hosted Zones</h4>
          <ul>
            <li><strong>Public Hosted Zone</strong>: Resolves domains on the public internet. Cost: $0.50/month per zone.</li>
            <li><strong>Private Hosted Zone</strong>: Resolves domains only within associated VPCs. For internal service discovery (db.internal.myapp.com).</li>
          </ul>

          <h4>2. Routing Policies</h4>
          <table>
            <thead><tr><th>Policy</th><th>How It Works</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>Simple</strong></td><td>Returns a single value (or random from multiple)</td><td>Single resource, no health checks</td></tr>
              <tr><td><strong>Weighted</strong></td><td>Distributes traffic by percentage (e.g., 70/30)</td><td>Blue-green deployments, canary releases</td></tr>
              <tr><td><strong>Latency</strong></td><td>Routes to the region with lowest latency for the user</td><td>Multi-region apps, global user base</td></tr>
              <tr><td><strong>Failover</strong></td><td>Primary/secondary — routes to secondary if primary fails</td><td>Disaster recovery, active-passive HA</td></tr>
              <tr><td><strong>Geolocation</strong></td><td>Routes based on user's geographic location</td><td>Content localization, compliance (data residency)</td></tr>
              <tr><td><strong>Geoproximity</strong></td><td>Routes based on proximity with bias shifting</td><td>Fine-tuned geographic routing with bias to shift traffic between regions</td></tr>
              <tr><td><strong>Multi-Value Answer</strong></td><td>Returns up to 8 healthy records randomly</td><td>Client-side load balancing with health checks</td></tr>
            </tbody>
          </table>

          <h4>3. Health Checks</h4>
          <ul>
            <li>HTTP, HTTPS, or TCP protocol</li>
            <li>Interval: 10 or 30 seconds (10s costs more)</li>
            <li>Threshold: number of consecutive checks to mark healthy/unhealthy</li>
            <li>String matching: check if response body contains a specific string</li>
            <li>Calculated health checks: AND/OR logic across multiple checks</li>
          </ul>

          <h4>4. Alias vs CNAME</h4>
          <table>
            <thead><tr><th>Feature</th><th>Alias</th><th>CNAME</th></tr></thead>
            <tbody>
              <tr><td>Zone apex (example.com)?</td><td>✅ Yes</td><td>❌ No</td></tr>
              <tr><td>DNS query charge?</td><td>Free for AWS resources</td><td>Standard charges</td></tr>
              <tr><td>Targets</td><td>ALB, CloudFront, S3, API Gateway, etc.</td><td>Any hostname</td></tr>
              <tr><td>Health check integration</td><td>Inherits from target</td><td>Must configure separately</td></tr>
            </tbody>
          </table>

          <h4>5. TTL (Time to Live)</h4>
          <p>DNS caching duration in seconds. Lower TTL = faster failover but more DNS queries (more cost). Higher TTL = fewer queries but slower failover. Alias records don't have configurable TTL — Route 53 sets it automatically.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'Route 53 Boto3 Operations',
      content: {
        title: 'Manage DNS Records Programmatically',
        languages: [
          {
            id: 'python-r53',
            label: 'DNS Record Management',
            code: `import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

r53 = boto3.client('route53')

def create_failover_records(hosted_zone_id, domain, primary_alb, secondary_alb, health_check_id):
    """
    Create failover routing records:
    Primary → us-east-1 ALB (active)
    Secondary → eu-west-1 ALB (standby)
    """
    response = r53.change_resource_record_sets(
        HostedZoneId=hosted_zone_id,
        ChangeBatch={
            'Comment': f'Failover routing for {domain}',
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': domain,
                        'Type': 'A',
                        'SetIdentifier': 'primary-us-east-1',
                        'Failover': 'PRIMARY',
                        'AliasTarget': {
                            'HostedZoneId': 'Z35SXDOTRQ7X7K',  # ALB hosted zone
                            'DNSName': primary_alb,
                            'EvaluateTargetHealth': True
                        },
                        'HealthCheckId': health_check_id
                    }
                },
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': domain,
                        'Type': 'A',
                        'SetIdentifier': 'secondary-eu-west-1',
                        'Failover': 'SECONDARY',
                        'AliasTarget': {
                            'HostedZoneId': 'Z32O12XQLNTSW2',
                            'DNSName': secondary_alb,
                            'EvaluateTargetHealth': True
                        }
                    }
                }
            ]
        }
    )
    logger.info("Failover records created: %s", response['ChangeInfo']['Status'])
    return response


def create_health_check(target_domain, path='/health'):
    """Create an HTTP health check for failover routing."""
    response = r53.create_health_check(
        CallerReference=f'{target_domain}-{path}-healthcheck',
        HealthCheckConfig={
            'FullyQualifiedDomainName': target_domain,
            'Port': 443,
            'Type': 'HTTPS',
            'ResourcePath': path,
            'RequestInterval': 30,         # seconds between checks
            'FailureThreshold': 3,         # 3 consecutive failures = unhealthy
            'EnableSNI': True
        }
    )
    hc_id = response['HealthCheck']['Id']
    logger.info("Health check created: %s for %s%s", hc_id, target_domain, path)
    return hc_id`,
            explanations: [
              { line: '16', text: 'UPSERT creates the record if it doesn\'t exist or updates it if it does. Safer than CREATE which fails if the record exists.' },
              { line: '22', text: 'SetIdentifier is required for routing policies (failover, weighted, latency, etc.). Must be unique within the record set.' },
              { line: '26-28', text: 'AliasTarget for ALB: HostedZoneId is the ALB\'s hosted zone (not your hosted zone). Each region has a specific ALB hosted zone ID.' },
              { line: '30', text: 'HealthCheckId on PRIMARY record — Route 53 routes to SECONDARY when this health check fails.' },
              { line: '61', text: 'FailureThreshold=3 means 3 consecutive failed checks mark the endpoint unhealthy. With RequestInterval=30s, failover triggers in ~90 seconds.' }
            ]
          }
        ],
        defaultLang: 'python-r53',
        expectedOutput: 'Health check created: hc-abc123 for alb-primary.us-east-1.elb.amazonaws.com/health\nFailover records created: PENDING'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'Route 53 CLI Commands',
      content: [
        {
          command: 'aws route53 list-hosted-zones --query "HostedZones[].[Id,Name,Config.PrivateZone]" --output table',
          category: 'aws-cli',
          expectedOutput: '---------------------------------------------------\n| /hostedzone/Z0123456789 | example.com.  | False |\n| /hostedzone/Z9876543210 | internal.app. | True  |\n---------------------------------------------------',
          explanation: 'Lists all hosted zones. Note: domain names end with a dot (DNS convention). PrivateZone=True means it only resolves within associated VPCs.',
          interviewQ: 'What is the difference between a public and private hosted zone?'
        },
        {
          command: 'aws route53 list-resource-record-sets --hosted-zone-id Z0123456789 --query "ResourceRecordSets[?Type==\'A\']"',
          category: 'aws-cli',
          expectedOutput: '[\n  {\n    "Name": "api.example.com.",\n    "Type": "A",\n    "AliasTarget": {\n      "DNSName": "alb-prod-123.us-east-1.elb.amazonaws.com.",\n      "HostedZoneId": "Z35SXDOTRQ7X7K",\n      "EvaluateTargetHealth": true\n    },\n    "Failover": "PRIMARY",\n    "SetIdentifier": "primary-us-east-1"\n  }\n]',
          explanation: 'Lists A records for a hosted zone. Shows Alias target and routing policy configuration. Use this to verify failover, weighted, or latency routing setup.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'Route 53 CLI Lab',
        mode: 'simulated',
        initialText: 'Route 53 CLI Lab. Try:\n  aws route53 list-hosted-zones\n  aws route53 list-health-checks\n  aws route53 get-health-check-status --health-check-id hc-abc123',
        commands: {
          'aws route53 list-hosted-zones': {
            text: '{\n  "HostedZones": [\n    {"Id": "/hostedzone/Z0123456789", "Name": "example.com.", "Config": {"PrivateZone": false}, "ResourceRecordSetCount": 12},\n    {"Id": "/hostedzone/Z9876543210", "Name": "internal.app.", "Config": {"PrivateZone": true}, "ResourceRecordSetCount": 8}\n  ]\n}',
            type: 'output'
          },
          'aws route53 list-health-checks': {
            text: '{\n  "HealthChecks": [{\n    "Id": "hc-abc123",\n    "HealthCheckConfig": {\n      "FullyQualifiedDomainName": "alb-prod.us-east-1.elb.amazonaws.com",\n      "Port": 443,\n      "Type": "HTTPS",\n      "ResourcePath": "/health",\n      "RequestInterval": 30,\n      "FailureThreshold": 3\n    }\n  }]\n}',
            type: 'output'
          },
          'aws route53 get-health-check-status --health-check-id hc-abc123': {
            text: '{\n  "HealthCheckObservations": [\n    {"Region": "us-east-1", "StatusReport": {"Status": "Success: HTTP Status Code 200"}},\n    {"Region": "eu-west-1", "StatusReport": {"Status": "Success: HTTP Status Code 200"}},\n    {"Region": "ap-southeast-1", "StatusReport": {"Status": "Success: HTTP Status Code 200"}}\n  ]\n}',
            type: 'success'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common Route 53 Issues',
      content: {
        items: [
          { title: 'DNS changes not taking effect', error: 'Updated Route 53 record but domain still resolves to old IP', cause: 'DNS caching at multiple levels: browser, OS resolver, ISP recursive resolver. Old records cached for TTL duration.', fix: 'Wait for the previous TTL to expire (check with dig or nslookup). Lower TTL to 60 seconds BEFORE making changes, wait for old TTL to expire, then make the change. After propagation, raise TTL back.' },
          { title: 'CNAME at zone apex fails', error: 'Cannot create CNAME record for example.com (only sub.example.com)', cause: 'DNS RFC prohibits CNAME records at the zone apex because CNAME would conflict with the required SOA and NS records.', fix: 'Use Route 53 Alias record instead of CNAME. Alias records work at the zone apex and are free for AWS resource targets.' },
          { title: 'Health check failing unexpectedly', error: 'Route 53 health check reports "Failure" but the endpoint is accessible', cause: 'Route 53 health checkers come from AWS IP ranges. If your Security Group or firewall doesn\'t allow these IPs, health checks fail.', fix: 'Allow Route 53 health checker IP ranges in your Security Group/firewall. AWS publishes these at https://ip-ranges.amazonaws.com/ip-ranges.json (filter for service=ROUTE53_HEALTHCHECKS).' },
          { title: 'Failover routing not switching to secondary', error: 'Primary endpoint is down but traffic not routing to secondary', cause: 'Health check is checking wrong port/path, or EvaluateTargetHealth not enabled on Alias target, or health check interval + threshold haven\'t been exceeded yet.', fix: 'Verify health check path matches your app\'s health endpoint. Set EvaluateTargetHealth=true on Alias target. With RequestInterval=30s and FailureThreshold=3, failover takes ~90 seconds minimum.' }
        ]
      }
    },

    {
      id: 'quiz-r53',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon Route 53 Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'You want to route api.example.com to an ALB. Should you use a CNAME record or an Alias record?',
            options: [
              { id: 'a', text: 'CNAME — it supports pointing to other hostnames' },
              { id: 'b', text: 'Alias — it\'s free for AWS resources, faster (no extra DNS hop), and works at the zone apex' },
              { id: 'c', text: 'A record with the ALB\'s IP address' },
              { id: 'd', text: 'Either works identically' }
            ],
            correctId: 'b',
            explanation: 'Alias records are the correct choice for AWS resources. They\'re free (no per-query charge), resolve directly to the target IP (no extra DNS hop like CNAME), integrate with health checks natively, and work at the zone apex (example.com). ALB IPs change dynamically, so you cannot use a static A record.',
            difficulty: 'beginner'
          },
          {
            id: 'q2',
            question: 'You want to do a canary deployment: 10% of traffic to the new version, 90% to the current version. Which routing policy should you use?',
            options: [
              { id: 'a', text: 'Simple routing with two A records' },
              { id: 'b', text: 'Failover routing with health checks' },
              { id: 'c', text: 'Weighted routing with 10/90 weight split' },
              { id: 'd', text: 'Latency routing across two regions' }
            ],
            correctId: 'c',
            explanation: 'Weighted routing distributes traffic by percentage based on weights. Set weight=10 for the canary and weight=90 for the stable version. Gradually increase the canary weight as confidence builds. Add health checks to auto-remove unhealthy endpoints.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'Your app serves users globally from us-east-1 and eu-west-1. You want each user routed to the region with the lowest latency. Which routing policy do you use?',
            options: [
              { id: 'a', text: 'Geolocation routing — routes based on user location' },
              { id: 'b', text: 'Latency-based routing — routes to the region with lowest measured latency' },
              { id: 'c', text: 'Weighted routing with 50/50 split' },
              { id: 'd', text: 'Simple routing with both IPs' }
            ],
            correctId: 'b',
            explanation: 'Latency-based routing measures the actual network latency between the user and each region, then routes to the fastest. Geolocation routes by country/continent (not latency). A user in London might have lower latency to us-east-1 than eu-west-1 due to network topology — latency routing would correctly route there.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-r53',
      type: 'challenge',
      title: 'Challenge: DNS Failover Setup',
      content: {
        title: 'Configure DNS Failover with Health Checks',
        description: 'Write a function that sets up Route 53 failover routing: create a health check for the primary endpoint, then create PRIMARY and SECONDARY failover Alias records pointing to ALBs in two regions.',
        difficulty: 'advanced',
        requirements: [
          'Create an HTTPS health check for the primary ALB with /health path',
          'Set RequestInterval=30 and FailureThreshold=3',
          'Create a PRIMARY failover A/Alias record pointing to the primary ALB',
          'Attach the health check to the PRIMARY record',
          'Create a SECONDARY failover A/Alias record pointing to the secondary ALB',
          'Set EvaluateTargetHealth=True on both Alias targets',
          'Log the health check ID and change status'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

r53 = boto3.client('route53')

def setup_failover(hosted_zone_id, domain, primary_alb_dns, secondary_alb_dns):
    """
    Set up Route 53 failover routing with health checks.
    """
    # TODO: Create health check for primary endpoint
    # TODO: Create PRIMARY failover Alias record with health check
    # TODO: Create SECONDARY failover Alias record
    # TODO: Return health check ID and change info
    pass`,
        language: 'python',
        hints: [
          'r53.create_health_check(CallerReference="unique-string", HealthCheckConfig={...})',
          'HealthCheckConfig: Type="HTTPS", Port=443, ResourcePath="/health"',
          'UPSERT changes: Action="UPSERT", Failover="PRIMARY", SetIdentifier="primary"',
          'AliasTarget: DNSName=alb_dns, HostedZoneId=ALB_ZONE_ID, EvaluateTargetHealth=True',
          'HealthCheckId goes on the PRIMARY record only'
        ],
        testCases: [
          { description: 'Creates health check', keywords: ['create_health_check'], expectedOutput: 'health_check' },
          { description: 'Sets HTTPS health check type', keywords: ['HTTPS', '/health'], expectedOutput: 'HTTPS' },
          { description: 'Creates PRIMARY failover record', keywords: ['PRIMARY', 'UPSERT'], expectedOutput: 'PRIMARY' },
          { description: 'Creates SECONDARY failover record', keywords: ['SECONDARY'], expectedOutput: 'SECONDARY' },
          { description: 'Sets EvaluateTargetHealth', keywords: ['EvaluateTargetHealth'], expectedOutput: 'True' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: Amazon Route 53 Hands-On Lab', content: {"title":"Amazon Route 53 Hands-On Lab","description":"Configure and test Amazon Route 53 following AWS best practices.","difficulty":"intermediate","steps":[{"id":"s1","title":"Open Route 53 Console","instruction":"AWS Console → Search \"Route 53\" → Open service dashboard.","expectedResult":"Route 53 dashboard loaded.","hint":"Verify you are in the correct AWS region."},{"id":"s2","title":"Create Resource","instruction":"Click \"Create\" and follow the wizard. Use \"lab-\" prefix for naming. Apply tags: Environment=Lab, Project=Masterclass.","expectedResult":"Resource created successfully.","hint":"Tags are essential for cost tracking and cleanup."},{"id":"s3","title":"Configure IAM Permissions","instruction":"Create an IAM role with minimum required permissions for the service.","expectedResult":"Role created with least-privilege policy.","hint":"Check AWS documentation for service-linked roles."},{"id":"s4","title":"Test with CLI","instruction":"Use AWS CLI to interact with the created resource. Run describe/list commands.","expectedResult":"CLI commands return expected results.","hint":"Use --output json for detailed responses."},{"id":"s5","title":"Monitor in CloudWatch","instruction":"Check CloudWatch metrics and logs for the resource. Create a dashboard widget.","expectedResult":"Metrics and logs visible in CloudWatch.","hint":"Some metrics have a 1-5 minute delay."},{"id":"s6","title":"Test Error Handling","instruction":"Intentionally trigger an error (wrong permissions, invalid input) and verify error handling.","expectedResult":"Error captured in CloudWatch Logs with clear message.","hint":"Good error handling is critical for production systems."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is Amazon Route 53 and what problem does it solve?","shortAnswer":"Amazon Route 53 is a managed AWS service that provides DNS, domain registration, and health checking with 100% availability SLA. It eliminates the need to manage DNS infrastructure, BIND servers, and complex failover configurations.","commonMistake":"Using simple routing for production without health checks or failover routing.","followUp":"When would you NOT use Amazon Route 53?"},{"difficulty":"beginner","question":"What are the key components of Amazon Route 53?","shortAnswer":"Hosted Zones, Record Sets, Health Checks, Routing Policies, Traffic Flow, Resolver.","commonMistake":"Skipping IAM permissions configuration and using overly permissive policies.","followUp":"How does Amazon Route 53 integrate with other AWS services?"},{"difficulty":"beginner","question":"How is Amazon Route 53 priced?","shortAnswer":"Priced based on usage — requests, data transfer, and provisioned capacity. Free tier available for 12 months.","commonMistake":"Not accounting for data transfer costs between services and regions.","followUp":"How do you estimate Amazon Route 53 costs before deployment?"},{"difficulty":"beginner","question":"What are the security best practices for Amazon Route 53?","shortAnswer":"Use least-privilege IAM policies, enable encryption at rest and in transit, use VPC endpoints where available, enable CloudTrail logging, and implement resource-based policies.","commonMistake":"Using AWS managed policies that grant broader access than needed.","followUp":"How do you monitor Amazon Route 53 for security events?"},{"difficulty":"beginner","question":"How do you monitor Amazon Route 53?","shortAnswer":"Use CloudWatch metrics for operational monitoring, CloudWatch Logs for detailed logging, CloudTrail for API auditing, and set up alarms for critical thresholds.","commonMistake":"Not setting up alarms for error rates and latency — relying only on dashboards.","followUp":"What CloudWatch metrics are most important to monitor?"},{"difficulty":"intermediate","question":"How does Amazon Route 53 achieve high availability?","shortAnswer":"Route 53 is a global service with 100% availability SLA. Health checks from multiple global locations.","commonMistake":"Deploying in single AZ for cost savings without understanding availability impact.","followUp":"What is the RPO and RTO for Amazon Route 53?"},{"difficulty":"intermediate","question":"Explain the Amazon Route 53 scaling strategy.","shortAnswer":"Supports both vertical (instance size) and horizontal (instance count) scaling. Auto-scaling available based on CloudWatch metrics.","commonMistake":"Not load testing before production to determine correct scaling thresholds.","followUp":"How do you handle scaling during unexpected traffic spikes?"},{"difficulty":"intermediate","question":"How does Amazon Route 53 handle encryption?","shortAnswer":"Supports encryption at rest (KMS keys) and in transit (TLS). Can use AWS-managed or customer-managed KMS keys. Key rotation supported.","commonMistake":"Using AWS-managed keys when compliance requires customer-managed keys with custom key policies.","followUp":"How do you rotate encryption keys without downtime?"},{"difficulty":"intermediate","question":"What are the limits and quotas for Amazon Route 53?","shortAnswer":"Service has default quotas per region per account. Soft limits can be increased via Service Quotas. Hard limits cannot be changed.","commonMistake":"Hitting service limits during peak traffic without having requested increases in advance.","followUp":"How do you proactively monitor service quota usage?"},{"difficulty":"intermediate","question":"How do you implement Amazon Route 53 in a multi-account strategy?","shortAnswer":"Use AWS Organizations with SCPs, resource sharing via RAM where supported, cross-account IAM roles, and centralized logging.","commonMistake":"Not using separate accounts for production and development workloads.","followUp":"How do you share resources across accounts securely?"},{"difficulty":"advanced","question":"Design a production-grade Amazon Route 53 architecture.","shortAnswer":"Multi-AZ deployment, encryption, monitoring with alarms, automated backups, infrastructure as code (CloudFormation/Terraform), blue/green deployments, and disaster recovery plan.","commonMistake":"Deploying to production without a runbook for common failure scenarios.","followUp":"How do you test disaster recovery for this architecture?"},{"difficulty":"advanced","question":"How do you optimize Amazon Route 53 costs?","shortAnswer":"Right-size resources using CloudWatch metrics, use Reserved capacity for predictable workloads, implement auto-scaling, clean up unused resources, use Cost Explorer for analysis.","commonMistake":"Over-provisioning resources based on peak capacity estimates without actual usage data.","followUp":"How do you implement continuous cost optimization?"},{"difficulty":"advanced","question":"What is the disaster recovery strategy for Amazon Route 53?","shortAnswer":"Pilot Light: core infrastructure in DR region. Warm Standby: scaled-down version running in DR region. Multi-Site: active-active across regions.","commonMistake":"Not regularly testing DR procedures — failover should be rehearsed quarterly.","followUp":"How do you automate DR failover?"},{"difficulty":"advanced","question":"How do you implement Amazon Route 53 using Infrastructure as Code?","shortAnswer":"Use CloudFormation or Terraform to define resources declaratively. Include all dependencies (IAM roles, security groups, monitoring). Use parameters for environment-specific values.","commonMistake":"Not parameterizing templates — hardcoding account IDs, region, and environment-specific values.","followUp":"How do you handle state management in IaC for this service?"},{"difficulty":"advanced","question":"What compliance frameworks does Amazon Route 53 support?","shortAnswer":"SOC 1/2/3, PCI DSS, HIPAA, ISO 27001, FedRAMP. Use Config rules and Security Hub for continuous compliance monitoring.","commonMistake":"Assuming AWS compliance covers your application — shared responsibility model means you must secure your configuration.","followUp":"How do you generate compliance evidence for auditors?"},{"difficulty":"scenario","question":"Your Amazon Route 53 is experiencing intermittent errors. How do you diagnose?","shortAnswer":"Check CloudWatch metrics (error rate, latency, throttling), CloudWatch Logs for error details, X-Ray traces for request flow, CloudTrail for API changes, and service health dashboard.","commonMistake":"Only checking application logs without looking at AWS service-level metrics and limits.","followUp":"How do you set up proactive alerting for this service?"},{"difficulty":"scenario","question":"Migrate Amazon Route 53 from one AWS account to another.","shortAnswer":"Export configuration, create resources in target account via IaC, migrate data using service-specific tools, update DNS/endpoints, test, then cutover. Use cross-account roles during migration.","commonMistake":"Not planning for the DNS cutover — TTL should be lowered well before migration.","followUp":"How do you minimize downtime during migration?"},{"difficulty":"scenario","question":"Amazon Route 53 costs have doubled unexpectedly. Investigate.","shortAnswer":"Cost Explorer → filter by service and usage type, check for unused resources, verify auto-scaling is working (not just scaling up), check for data transfer costs, review recent configuration changes.","commonMistake":"Only looking at compute costs and ignoring data transfer between services/regions.","followUp":"How do you set up billing alerts for this service?"},{"difficulty":"scenario","question":"Design a zero-downtime update strategy for Amazon Route 53.","shortAnswer":"Blue/green deployment: create new version alongside old, test new version, switch traffic gradually (canary → full), rollback instantly if issues. Use CloudFormation update policies.","commonMistake":"Not having a rollback plan — every deployment should have a tested rollback procedure.","followUp":"How do you implement canary deployments?"},{"difficulty":"scenario","question":"Your team needs to access Amazon Route 53 across 5 AWS accounts. Design the access pattern.","shortAnswer":"IAM Identity Center with permission sets per account/role. Cross-account roles for programmatic access. Centralized logging account for audit. RAM for resource sharing where applicable.","commonMistake":"Creating separate IAM users in each account instead of using centralized SSO.","followUp":"How do you enforce least privilege across accounts?"},{"difficulty":"troubleshooting","question":"Amazon Route 53 API calls are being throttled.","shortAnswer":"Implement exponential backoff with jitter, check service quotas and request increases, cache responses, use batch operations where available, distribute requests across time.","commonMistake":"Retrying throttled requests immediately without backoff, making the throttling worse.","followUp":"How do you design applications to be resilient to API throttling?"},{"difficulty":"troubleshooting","question":"Amazon Route 53 has high latency. Investigate.","shortAnswer":"Check: CloudWatch latency metrics, network connectivity (VPC endpoints vs internet), resource right-sizing, connection pooling, caching layer, regional endpoint proximity.","commonMistake":"Not using VPC endpoints — traffic going over internet instead of AWS backbone adds latency.","followUp":"How do you implement caching to reduce latency?"},{"difficulty":"troubleshooting","question":"Cannot access Amazon Route 53 from Lambda function.","shortAnswer":"Check: Lambda execution role has required permissions, Lambda is in VPC with correct subnets/SG, VPC endpoint exists or NAT Gateway for internet access, resource-based policy allows Lambda.","commonMistake":"Putting Lambda in VPC without NAT Gateway or VPC endpoint — Lambda loses internet access.","followUp":"When should you put Lambda in a VPC vs outside VPC?"},{"difficulty":"troubleshooting","question":"Amazon Route 53 encryption at rest is failing.","shortAnswer":"Check: KMS key policy allows the service principal, key is in the same region, key is not disabled/pending deletion, IAM role has kms:GenerateDataKey and kms:Decrypt permissions.","commonMistake":"Using a KMS key from a different region — KMS keys are regional.","followUp":"How do you troubleshoot KMS key policy issues?"},{"difficulty":"troubleshooting","question":"CloudWatch metrics for Amazon Route 53 are missing.","shortAnswer":"Check: detailed monitoring enabled (not just basic), correct namespace and metric name, data exists for the time range, metric dimensions correct, IAM permissions for CloudWatch.","commonMistake":"Looking at the wrong CloudWatch namespace or not enabling detailed monitoring.","followUp":"How do you create custom metrics for this service?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4>
<ol>
  <li><strong>Delete Route 53 resources:</strong> Navigate to Route 53 console → Select lab resources → Delete</li>
  <li><strong>Delete IAM roles:</strong> IAM → Roles → Delete lab-specific roles</li>
  <li><strong>Check CloudWatch:</strong> Delete any lab-specific log groups and alarms</li>
  <li><strong>Verify in Cost Explorer:</strong> Confirm no ongoing charges from lab resources</li>
</ol>
<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Verify Complete Cleanup</div><div class="alert-text">Check the Route 53 console and billing dashboard to ensure all lab resources are deleted.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 05: Elastic Load Balancing', url: 'module-18.html' }, next: { title: 'Chapter 07: Amazon CloudFront', url: 'module-29.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_07_DATA;
} else {
  window.MODULE_07_DATA = MODULE_07_DATA;
}
