/**
 * ============================================================
 * MODULE 03 — Amazon EC2
 * Compute instances, AMIs, security groups, instance types
 * ============================================================
 */
const MODULE_03_DATA = {
  id: 'ec2-fundamentals',
  moduleId: 'module-03',
  title: 'Amazon EC2 — Elastic Compute Cloud',
  description: 'Master virtual server provisioning in AWS. Covers instance types, AMIs, Security Groups, Key Pairs, Elastic IPs, EBS volumes, Auto Scaling, purchasing options, and production best practices.',
  difficulty: 'beginner',
  duration: '90 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 02: Amazon S3'],
  objectives: [
    'Launch and connect to EC2 instances using the CLI and Console',
    'Choose the right instance type family for your workload',
    'Configure Security Groups as stateful firewalls',
    'Understand On-Demand, Reserved, Spot, and Savings Plans pricing',
    'Attach and manage EBS volumes for persistent storage',
    'Implement Auto Scaling Groups with launch templates',
    'Use Instance Metadata Service (IMDS) v2 securely'
  ],

  sections: [
    {
      id: 'why-ec2',
      type: 'why',
      title: 'Why EC2?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🖥️</span>
            <div class="alert-content">
              <div class="alert-title">Virtual Servers in Minutes, Not Months</div>
              <div class="alert-text">EC2 replaced the 6-12 week hardware procurement cycle with on-demand virtual servers launched in seconds. It's the backbone of AWS — even Lambda, ECS, and RDS run on EC2 under the hood.</div>
            </div>
          </div>
          <h4>Instance Type Families</h4>
          <table>
            <thead><tr><th>Family</th><th>Optimized For</th><th>Examples</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>T (Burstable)</strong></td><td>General purpose, burst CPU</td><td>t3.micro, t3.medium</td><td>Dev/test, small web apps, bastion hosts</td></tr>
              <tr><td><strong>M (General)</strong></td><td>Balanced CPU/memory/network</td><td>m6i.large, m7g.xlarge</td><td>Web servers, app servers, small databases</td></tr>
              <tr><td><strong>C (Compute)</strong></td><td>High CPU performance</td><td>c6i.2xlarge, c7g.4xlarge</td><td>Batch processing, ML inference, HPC</td></tr>
              <tr><td><strong>R (Memory)</strong></td><td>High memory ratio</td><td>r6i.xlarge, r7g.2xlarge</td><td>In-memory caches, real-time analytics</td></tr>
              <tr><td><strong>G/P (Accelerated)</strong></td><td>GPU compute</td><td>g5.xlarge, p4d.24xlarge</td><td>ML training, video encoding, 3D rendering</td></tr>
              <tr><td><strong>I/D (Storage)</strong></td><td>High local storage I/O</td><td>i3.large, d3.xlarge</td><td>Databases, data warehouses, HDFS</td></tr>
            </tbody>
          </table>
          <h4>Purchasing Options</h4>
          <table>
            <thead><tr><th>Option</th><th>Discount</th><th>Commitment</th><th>Best For</th></tr></thead>
            <tbody>
              <tr><td><strong>On-Demand</strong></td><td>0% (full price)</td><td>None</td><td>Short-term, unpredictable workloads</td></tr>
              <tr><td><strong>Reserved (1yr/3yr)</strong></td><td>Up to 72%</td><td>1 or 3 years</td><td>Steady-state production workloads</td></tr>
              <tr><td><strong>Savings Plans</strong></td><td>Up to 72%</td><td>$/hour commitment</td><td>Flexible — applies across instance families</td></tr>
              <tr><td><strong>Spot Instances</strong></td><td>Up to 90%</td><td>Can be interrupted</td><td>Fault-tolerant: batch, CI/CD, data processing</td></tr>
            </tbody>
          </table>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'EC2 Architecture',
      content: {
        title: 'EC2 Instance in a VPC with Security Groups & EBS',
        width: 750,
        height: 280,
        nodes: [
          { id: 'internet', label: 'Internet', icon: '🌍', x: 10, y: 120, type: 'client', description: 'Public internet traffic hits the EC2 instance via its public IP or Elastic IP.' },
          { id: 'igw', label: 'Internet Gateway', icon: '🚪', x: 150, y: 120, type: 'trigger', description: 'Internet Gateway allows communication between instances in the VPC and the internet.' },
          { id: 'sg', label: 'Security Group', icon: '🛡️', x: 300, y: 120, type: 'security', description: 'Stateful firewall at the instance level. Rules define allowed inbound/outbound traffic by protocol, port, and source. Default: deny all inbound, allow all outbound.', eventPayload: { InboundRules: [{ Protocol: 'tcp', Port: 22, Source: 'MyIP/32' }, { Protocol: 'tcp', Port: 443, Source: '0.0.0.0/0' }] } },
          { id: 'ec2', label: 'EC2 Instance', icon: '🖥️', x: 470, y: 120, type: 'compute', description: 'Virtual server running your AMI. Attached to a subnet (public or private). Has an instance profile (IAM role) for AWS API access.' },
          { id: 'ebs', label: 'EBS Volume', icon: '💾', x: 470, y: 240, type: 'storage', description: 'Block storage volumes attached to EC2. Persist independently from the instance lifecycle. Support encryption (KMS), snapshots, and different types (gp3, io2, st1).' },
          { id: 'iam-role', label: 'Instance Profile', icon: '🔑', x: 630, y: 120, type: 'security', description: 'IAM role attached to EC2 via Instance Profile. Provides temporary credentials automatically — no access keys needed on the instance.' }
        ],
        edges: [
          { from: 'internet', to: 'igw', label: 'HTTPS', animated: true },
          { from: 'igw', to: 'sg', label: 'Route', animated: true },
          { from: 'sg', to: 'ec2', label: 'Allow/Deny' },
          { from: 'ec2', to: 'ebs', label: 'Block I/O' },
          { from: 'ec2', to: 'iam-role', label: 'Temp Creds' }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. AMI (Amazon Machine Image)</h4>
          <p>A template containing the OS, application server, and applications. Launch multiple identical instances from one AMI. You can create custom AMIs from running instances (golden images).</p>

          <h4>2. Security Groups (Stateful Firewall)</h4>
          <p><strong>Key principle</strong>: Security Groups are STATEFUL — if inbound traffic is allowed, the response is automatically allowed (no outbound rule needed for responses).</p>
          <ul>
            <li>Default: ALL inbound denied, ALL outbound allowed</li>
            <li>Rules are ALLOW only — you cannot create DENY rules</li>
            <li>Reference other SGs as source: "Allow inbound from the ALB security group"</li>
          </ul>

          <h4>3. Key Pairs</h4>
          <p>SSH key pairs for Linux instance access. AWS stores the public key, you keep the private key. For Windows, use the key pair to decrypt the admin password. <strong>Best practice</strong>: Use SSM Session Manager instead of SSH for production access.</p>

          <h4>4. EBS Volume Types</h4>
          <table>
            <thead><tr><th>Type</th><th>IOPS</th><th>Throughput</th><th>Use Case</th></tr></thead>
            <tbody>
              <tr><td><strong>gp3</strong></td><td>3,000 - 16,000</td><td>125 - 1,000 MB/s</td><td>General purpose (default choice)</td></tr>
              <tr><td><strong>io2 Block Express</strong></td><td>Up to 256,000</td><td>Up to 4,000 MB/s</td><td>Mission-critical databases</td></tr>
              <tr><td><strong>st1</strong></td><td>N/A</td><td>Up to 500 MB/s</td><td>Big data, log processing (sequential)</td></tr>
              <tr><td><strong>sc1</strong></td><td>N/A</td><td>Up to 250 MB/s</td><td>Cold storage (lowest cost)</td></tr>
            </tbody>
          </table>

          <h4>5. Instance Metadata Service (IMDS v2)</h4>
          <p>HTTP endpoint at <code>169.254.169.254</code> providing instance info (ID, region, IAM role credentials). Always use IMDSv2 (requires session token) — IMDSv1 is vulnerable to SSRF attacks.</p>

          <h4>6. User Data</h4>
          <p>Bootstrap script that runs at first launch. Use for installing software, configuring services, pulling code from S3. Runs as root. Limited to 16 KB.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'EC2 Management with Boto3',
      content: {
        title: 'EC2 Instance Operations',
        languages: [
          {
            id: 'python-ec2',
            label: 'Launch & Manage',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.resource('ec2')
ec2_client = boto3.client('ec2')

def launch_instance(ami_id, instance_type, key_name, sg_id, subnet_id):
    """
    Launch an EC2 instance with best practices.
    """
    instances = ec2.create_instances(
        ImageId=ami_id,
        InstanceType=instance_type,
        KeyName=key_name,
        MinCount=1,
        MaxCount=1,
        SecurityGroupIds=[sg_id],
        SubnetId=subnet_id,
        # IMDSv2 required — blocks SSRF attacks
        MetadataOptions={
            'HttpTokens': 'required',       # Enforce IMDSv2
            'HttpEndpoint': 'enabled',
            'HttpPutResponseHopLimit': 1     # Prevent container breakout
        },
        # EBS volume: gp3, encrypted
        BlockDeviceMappings=[{
            'DeviceName': '/dev/xvda',
            'Ebs': {
                'VolumeSize': 20,            # 20 GB
                'VolumeType': 'gp3',
                'Encrypted': True,
                'DeleteOnTermination': True
            }
        }],
        # IAM Instance Profile for AWS API access
        IamInstanceProfile={'Name': 'EC2-S3-ReadOnly-Profile'},
        # Bootstrap script
        UserData="""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "Hello from $(hostname)" > /var/www/html/index.html
""",
        TagSpecifications=[{
            'ResourceType': 'instance',
            'Tags': [
                {'Key': 'Name', 'Value': 'web-server-01'},
                {'Key': 'Environment', 'Value': 'production'}
            ]
        }]
    )

    instance = instances[0]
    instance.wait_until_running()
    instance.reload()

    logger.info("Instance %s running. Public IP: %s",
                instance.id, instance.public_ip_address)
    return instance.id


def stop_instances_by_tag(tag_key, tag_value):
    """Stop all instances matching a tag (cost savings)."""
    filters = [{'Name': f'tag:{tag_key}', 'Values': [tag_value]},
               {'Name': 'instance-state-name', 'Values': ['running']}]

    instances = ec2.instances.filter(Filters=filters)
    ids = [i.id for i in instances]

    if ids:
        ec2_client.stop_instances(InstanceIds=ids)
        logger.info("Stopped %d instances: %s", len(ids), ids)
    return ids`,
            explanations: [
              { line: '22-26', text: 'MetadataOptions enforces IMDSv2. HttpTokens=required means the instance MUST use a session token to access metadata — blocks SSRF attacks that exploit IMDSv1.' },
              { line: '29-35', text: 'gp3 is the default and most cost-effective EBS type. Always enable encryption. DeleteOnTermination=True cleans up when the instance terminates.' },
              { line: '38', text: 'Instance Profile wraps an IAM Role. The instance gets temporary credentials automatically via IMDS — no hardcoded access keys.' },
              { line: '40-45', text: 'UserData is a bootstrap script that runs once at first launch as root. Use it for initial software installation and config.' }
            ]
          }
        ],
        defaultLang: 'python-ec2',
        expectedOutput: 'Instance i-0abc123def456789 running. Public IP: 54.123.45.67'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'EC2 CLI Commands',
      content: [
        {
          command: 'aws ec2 run-instances --image-id ami-0abcdef1234567890 --instance-type t3.micro --key-name my-key --security-group-ids sg-0123456789abcdef0 --subnet-id subnet-0123456789abcdef0 --count 1 --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=web-01}]"',
          category: 'aws-cli',
          expectedOutput: '{\n  "Instances": [{\n    "InstanceId": "i-0abc123def456789",\n    "InstanceType": "t3.micro",\n    "State": {"Name": "pending"},\n    "PrivateIpAddress": "10.0.1.25",\n    "SubnetId": "subnet-0123456789abcdef0"\n  }]\n}',
          explanation: 'Launches a single EC2 instance. State starts as "pending" then transitions to "running". Use describe-instances to check status.',
          interviewQ: 'What is the difference between stopping and terminating an EC2 instance?'
        },
        {
          command: 'aws ec2 describe-instances --filters "Name=instance-state-name,Values=running" --query "Reservations[].Instances[].[InstanceId,InstanceType,PublicIpAddress,Tags[?Key==\'Name\'].Value|[0]]" --output table',
          category: 'aws-cli',
          expectedOutput: '---------------------------------------------------\n|            DescribeInstances                    |\n+-----------+-----------+---------------+---------+\n| i-0abc... | t3.micro  | 54.123.45.67  | web-01  |\n| i-0def... | m6i.large | 18.234.56.78  | api-01  |\n+-----------+-----------+---------------+---------+',
          explanation: 'Lists running instances with JMESPath query to extract specific fields. --output table formats as a readable table. This is the most useful EC2 command for operations.',
          commonErrors: [
            { error: 'UnauthorizedAccess', cause: 'IAM policy missing ec2:DescribeInstances', fix: 'Add ec2:Describe* to the IAM policy (safe — read-only)' }
          ]
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'EC2 CLI Lab',
        mode: 'simulated',
        initialText: 'EC2 CLI Lab. Try:\n  aws ec2 describe-instances --query "Reservations[].Instances[].InstanceId"\n  aws ec2 describe-security-groups --group-ids sg-0123456789\n  aws ec2 describe-vpcs',
        commands: {
          'aws ec2 describe-instances --query "Reservations[].Instances[].InstanceId"': {
            text: '[\n  "i-0abc123def456789",\n  "i-0def456ghi789012",\n  "i-0ghi789jkl012345"\n]',
            type: 'output'
          },
          'aws ec2 describe-security-groups --group-ids sg-0123456789': {
            text: '{\n  "SecurityGroups": [{\n    "GroupId": "sg-0123456789",\n    "GroupName": "web-server-sg",\n    "IpPermissions": [\n      {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},\n      {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "203.0.113.0/32"}]}\n    ]\n  }]\n}',
            type: 'output'
          },
          'aws ec2 describe-vpcs': {
            text: '{\n  "Vpcs": [{\n    "VpcId": "vpc-0abc123",\n    "CidrBlock": "10.0.0.0/16",\n    "IsDefault": true,\n    "State": "available"\n  }]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common EC2 Issues',
      content: {
        items: [
          { title: 'Cannot SSH to instance', error: 'Connection timed out on port 22', cause: 'Security Group doesn\'t allow inbound TCP 22 from your IP, or instance is in a private subnet without a NAT/bastion, or NACL blocking.', fix: 'Check: 1) SG has port 22 open to your IP. 2) Instance has a public IP or Elastic IP. 3) Subnet route table has a route to the Internet Gateway. 4) NACL allows port 22.' },
          { title: 'Instance stuck in "stopping" state', error: 'Instance state shows "stopping" for extended period', cause: 'Underlying hardware issue or the instance is performing a large disk flush.', fix: 'Wait 10-15 minutes. If still stuck, try force-stop: aws ec2 stop-instances --instance-ids i-xxx --force. If that fails, contact AWS Support.' },
          { title: 'EBS volume full — instance unresponsive', error: 'Cannot SSH, application errors, disk full', cause: 'Root EBS volume (/dev/xvda) ran out of space. Logs, temp files, or application data filled the disk.', fix: 'Stop instance → modify volume size (aws ec2 modify-volume) → start instance → extend filesystem (growpart + resize2fs/xfs_growfs). Add CloudWatch alarm for disk usage > 80%.' },
          { title: 'Spot Instance terminated unexpectedly', error: 'Instance terminated with reason: spot-instance-termination', cause: 'Spot price exceeded your max bid, or AWS reclaimed capacity. Spot instances can be interrupted with 2-minute warning.', fix: 'Use Spot Fleet with multiple instance types and AZs. Handle interruption via EC2 metadata (169.254.169.254/latest/meta-data/spot/instance-action). Design for fault tolerance.' }
        ]
      }
    },

    {
      id: 'quiz-ec2',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon EC2 Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'An EC2 Security Group has NO inbound rules and the default outbound rule (allow all). You add an inbound rule allowing TCP 443 from 0.0.0.0/0. Can the instance respond to HTTPS requests?',
            options: [
              { id: 'a', text: 'No — you also need an outbound rule for TCP 443' },
              { id: 'b', text: 'Yes — Security Groups are stateful, so the response is automatically allowed' },
              { id: 'c', text: 'No — 0.0.0.0/0 only allows IPv4, not IPv6' },
              { id: 'd', text: 'Yes, but only from within the VPC' }
            ],
            correctId: 'b',
            explanation: 'Security Groups are STATEFUL. If inbound traffic is allowed by a rule, the response traffic is automatically allowed regardless of outbound rules. This is the key difference from NACLs (which are stateless).',
            difficulty: 'beginner'
          },
          {
            id: 'q2',
            question: 'Your production web server runs 24/7 with predictable traffic. Dev instances run 8 hours/day on weekdays. What is the most cost-effective purchasing strategy?',
            options: [
              { id: 'a', text: 'On-Demand for everything' },
              { id: 'b', text: 'Reserved Instance (1yr) for production + On-Demand for dev' },
              { id: 'c', text: 'Spot Instances for production + Reserved for dev' },
              { id: 'd', text: 'Reserved for everything' }
            ],
            correctId: 'b',
            explanation: 'Production (24/7 steady state) = Reserved Instance for up to 72% savings. Dev (irregular usage) = On-Demand for flexibility (only pay when running). Never use Spot for production workloads that can\'t tolerate interruption.',
            difficulty: 'intermediate'
          },
          {
            id: 'q3',
            question: 'Why should you enforce IMDSv2 (HttpTokens=required) on all EC2 instances?',
            options: [
              { id: 'a', text: 'IMDSv2 is faster than IMDSv1' },
              { id: 'b', text: 'IMDSv1 is vulnerable to SSRF attacks that can steal IAM role credentials from the metadata endpoint' },
              { id: 'c', text: 'IMDSv2 provides more metadata fields' },
              { id: 'd', text: 'IMDSv1 doesn\'t support IAM roles' }
            ],
            correctId: 'b',
            explanation: 'The Capital One breach (2019) exploited IMDSv1 via SSRF. IMDSv1 uses a simple GET request to 169.254.169.254 — any code running on the instance (including SSRF-exploited web apps) can steal IAM credentials. IMDSv2 requires a session token from a PUT request first, blocking SSRF attacks.',
            difficulty: 'advanced'
          }
        ]
      }
    },

    {
      id: 'challenge-ec2',
      type: 'challenge',
      title: 'Challenge: EC2 Cost Optimizer',
      content: {
        title: 'Build an EC2 Cost Optimization Scanner',
        description: 'Write a Lambda function that scans all running EC2 instances, identifies instances with low CPU utilization (< 10% average), and generates a cost optimization report.',
        difficulty: 'intermediate',
        requirements: [
          'Use ec2.describe_instances to list all running instances',
          'For each instance, get average CPUUtilization from CloudWatch (last 7 days)',
          'Flag instances with average CPU < 10% as "underutilized"',
          'Include instance ID, type, name tag, and average CPU in the report',
          'Log the total count of underutilized instances',
          'Return the report as a JSON response'
        ],
        starterCode: `import boto3
import logging
from datetime import datetime, timedelta

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')
cw = boto3.client('cloudwatch')

def lambda_handler(event, context):
    # TODO: Get all running instances
    # TODO: For each instance, check CPU utilization via CloudWatch
    # TODO: Flag underutilized instances (avg CPU < 10%)
    # TODO: Return optimization report

    pass`,
        language: 'python',
        hints: [
          'ec2.describe_instances(Filters=[{"Name": "instance-state-name", "Values": ["running"]}])',
          'Instances are in response["Reservations"][i]["Instances"]',
          'cw.get_metric_statistics(Namespace="AWS/EC2", MetricName="CPUUtilization", ...)',
          'Period=86400 (1 day), Statistics=["Average"], StartTime=datetime.utcnow()-timedelta(days=7)',
          'Get Name tag: next((t["Value"] for t in tags if t["Key"]=="Name"), "unnamed")'
        ],
        testCases: [
          { description: 'Calls describe_instances', keywords: ['describe_instances'], expectedOutput: 'describe_instances' },
          { description: 'Filters for running instances', keywords: ['running'], expectedOutput: 'running' },
          { description: 'Gets CloudWatch CPU metrics', keywords: ['CPUUtilization', 'get_metric'], expectedOutput: 'CPUUtilization' },
          { description: 'Checks threshold (10%)', keywords: ['10'], expectedOutput: '10' },
          { description: 'Returns report JSON', keywords: ['return'], expectedOutput: 'return' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: EC2 Instance Deployment Lab', content: {"title":"EC2 Instance Deployment Lab","description":"Launch, connect, and manage EC2 instances with security groups and key pairs.","steps":[{"id":"s1","title":"Launch EC2 Instance","instruction":"EC2 → Launch Instance → Amazon Linux 2023 AMI → t3.micro → Create key pair → Configure security group (SSH port 22 from your IP only) → Launch.","expectedResult":"Instance running with public IP.","hint":"Use t3.micro for free tier eligibility."},{"id":"s2","title":"Connect via SSH","instruction":"chmod 400 key.pem && ssh -i key.pem ec2-user@<public-ip>","expectedResult":"Successfully connected to EC2 instance.","hint":"Windows: use PuTTY with .ppk key format."},{"id":"s3","title":"Install Web Server","instruction":"sudo yum install -y httpd && sudo systemctl start httpd && sudo systemctl enable httpd","expectedResult":"Apache running on port 80.","hint":"Add port 80 to security group inbound rules."},{"id":"s4","title":"Create AMI","instruction":"Select instance → Actions → Image → Create Image. Name: \"lab-webserver-ami\".","expectedResult":"AMI created and available.","hint":"AMI creation causes brief instance stop (if no-reboot is not selected)."},{"id":"s5","title":"Attach IAM Role","instruction":"Actions → Security → Modify IAM Role → Attach role with S3 read-only access.","expectedResult":"Instance can access S3 without access keys.","hint":"Never use access keys on EC2 — use IAM roles."},{"id":"s6","title":"Create EBS Snapshot","instruction":"Volumes → Select root volume → Create Snapshot.","expectedResult":"Snapshot created for backup.","hint":"Snapshots are incremental — only changed blocks are stored."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What are EC2 instance types and how to choose?","shortAnswer":"Instance types define CPU, memory, storage, and network. Families: General (T/M), Compute (C), Memory (R/X), Storage (I/D), Accelerated (P/G). Choose based on workload profile.","commonMistake":"Using general-purpose instances for memory-intensive workloads like Redis/SAP.","followUp":"What is the difference between T3 burstable and M5 general purpose?"},{"difficulty":"beginner","question":"What is the difference between EBS and instance store?","shortAnswer":"EBS: persistent network-attached storage, survives instance stop/restart. Instance store: ephemeral local storage, data lost on stop/terminate. Use EBS for databases, instance store for temp cache.","commonMistake":"Storing important data on instance store volumes.","followUp":"When would you use instance store instead of EBS?"},{"difficulty":"beginner","question":"On-Demand vs Reserved vs Spot pricing?","shortAnswer":"On-Demand: pay per second, no commitment. Reserved: 1-3 year commitment, up to 72% discount. Spot: unused capacity, up to 90% discount but can be interrupted with 2-min notice.","commonMistake":"Using On-Demand for stable production workloads instead of Reserved Instances.","followUp":"What are Savings Plans vs Reserved Instances?"},{"difficulty":"beginner","question":"What is a security group?","shortAnswer":"Virtual firewall for EC2 instances. Stateful (return traffic auto-allowed). Rules: allow only (no deny). Default: deny all inbound, allow all outbound.","commonMistake":"Opening port 22 (SSH) to 0.0.0.0/0 in production.","followUp":"Security groups vs NACLs?"},{"difficulty":"beginner","question":"What is user data?","shortAnswer":"Script that runs automatically on first boot of an EC2 instance. Used to install software, configure settings, download code. Runs as root.","commonMistake":"Putting secrets in user data — it is visible in instance metadata.","followUp":"User data vs cfn-init for bootstrapping?"},{"difficulty":"intermediate","question":"How does EC2 placement groups work?","shortAnswer":"Three strategies: Cluster (low latency, same rack), Spread (max 7 instances/AZ, separate hardware), Partition (large distributed workloads like Hadoop/Kafka).","commonMistake":"Using cluster placement across AZs — cluster is single-AZ only.","followUp":"When would you use Partition vs Spread?"},{"difficulty":"intermediate","question":"Explain EC2 hibernation.","shortAnswer":"Saves RAM contents to EBS root volume before stopping. On start, RAM is restored — much faster than cold boot. Instance maintains same ID, IP, and attached volumes.","commonMistake":"Trying to hibernate instances with more than 150 GB RAM or instances running more than 60 days.","followUp":"What are the prerequisites for EC2 hibernation?"},{"difficulty":"intermediate","question":"What is an Elastic IP?","shortAnswer":"Static public IPv4 address. Persists across stop/start. Free when attached to running instance. Charged when unattached or attached to stopped instance.","commonMistake":"Not releasing unattached Elastic IPs — they incur charges.","followUp":"Why should you prefer DNS names over Elastic IPs?"},{"difficulty":"intermediate","question":"What are EBS volume types?","shortAnswer":"gp3/gp2 (general SSD), io2/io1 (provisioned IOPS SSD), st1 (throughput HDD), sc1 (cold HDD). gp3 is default. io2 for databases needing >16K IOPS.","commonMistake":"Using gp2 for high-IOPS database workloads — IOPS are linked to volume size in gp2.","followUp":"How does gp3 differ from gp2 in IOPS provisioning?"},{"difficulty":"intermediate","question":"Explain EC2 instance metadata and IMDS.","shortAnswer":"Metadata service at 169.254.169.254 provides instance info (ID, IP, role credentials, user data). IMDSv2 requires session token (PUT request first). Always use IMDSv2 for security.","commonMistake":"Not enforcing IMDSv2 — IMDSv1 is vulnerable to SSRF attacks.","followUp":"How does IMDSv2 prevent SSRF attacks?"},{"difficulty":"advanced","question":"Design a cost-optimized EC2 architecture for a web application?","shortAnswer":"Mix of Reserved (baseline) + Spot (scaling) behind ALB. Auto Scaling Group with mixed instances policy. Graviton (ARM) instances for 20% cost savings. Right-size using Compute Optimizer.","commonMistake":"Not using Graviton instances — they provide better price/performance for most workloads.","followUp":"How do you handle Spot interruptions in a web application?"},{"difficulty":"advanced","question":"What is EC2 Nitro System?","shortAnswer":"AWS custom hardware+firmware for EC2. Offloads networking, storage, security to dedicated hardware. Enables bare-metal instances, higher performance, and enhanced security (Nitro Enclaves).","commonMistake":"Not understanding that older non-Nitro instances have lower network and EBS performance limits.","followUp":"What are Nitro Enclaves and when would you use them?"},{"difficulty":"advanced","question":"Explain EBS Multi-Attach.","shortAnswer":"io2 volumes can be attached to up to 16 Nitro instances simultaneously in the same AZ. For clustered applications that manage concurrent write operations. Requires cluster-aware filesystem.","commonMistake":"Using Multi-Attach with standard filesystems like ext4 — requires cluster-aware FS like GFS2.","followUp":"What are alternatives to Multi-Attach for shared storage?"},{"difficulty":"advanced","question":"How do EC2 Capacity Reservations work?","shortAnswer":"Reserve capacity in a specific AZ for any duration. Guarantees instance launch even during capacity shortages. On-Demand Capacity Reservations (ODCR) with no term commitment. Can combine with Reserved Instances for cost savings.","commonMistake":"Confusing Capacity Reservations with Reserved Instances — CRs guarantee capacity but don't provide discounts alone.","followUp":"How do Capacity Reservations interact with Auto Scaling?"},{"difficulty":"advanced","question":"What is EC2 Fleet?","shortAnswer":"Launch and manage fleet of On-Demand, Reserved, and Spot instances across instance types and AZs with a single API call. Defines target capacity and allocation strategy.","commonMistake":"Not diversifying instance types in Spot fleets — single type increases interruption risk.","followUp":"How does capacity-optimized allocation strategy reduce Spot interruptions?"},{"difficulty":"scenario","question":"Your EC2 instance is unreachable via SSH. Troubleshoot.","shortAnswer":"Check: security group allows port 22 from your IP, NACL allows inbound 22 and outbound ephemeral ports, instance is running (not stopped/terminated), key pair matches, public IP exists, route table has IGW route.","commonMistake":"Only checking security group without verifying NACL and route table.","followUp":"How do you access an instance if you lost the SSH key?"},{"difficulty":"scenario","question":"An EC2 instance shows \"InsufficientInstanceCapacity\" error. What to do?","shortAnswer":"Wait and retry, try different instance type, try different AZ, use On-Demand Capacity Reservation, switch to similar instance family (e.g., m5 → m5a), use EC2 Fleet with diversified types.","commonMistake":"Only retrying the same instance type in the same AZ.","followUp":"How do Capacity Reservations prevent this issue?"},{"difficulty":"scenario","question":"Design a highly available EC2 architecture for a stateful application.","shortAnswer":"Multi-AZ ASG, EBS volumes with regular snapshots, ALB health checks, shared state in ElastiCache/RDS, session stickiness if needed, EFS for shared filesystem.","commonMistake":"Relying on local EBS for state without replication — EBS is AZ-specific.","followUp":"How do you handle failover for EBS-dependent applications?"},{"difficulty":"scenario","question":"Your Spot instances keep getting interrupted. How to improve stability?","shortAnswer":"Diversify across 10+ instance types and all AZs. Use capacity-optimized allocation. Implement graceful shutdown handling (2-min warning). Use Spot placement score to find best regions.","commonMistake":"Using a single instance type for Spot — diversification is the key to reducing interruptions.","followUp":"How do you implement graceful Spot interruption handling?"},{"difficulty":"scenario","question":"Reduce EC2 costs by 40% without changing architecture.","shortAnswer":"Right-size with Compute Optimizer, convert to Graviton (ARM), purchase Reserved/Savings Plans for baseline, Spot for variable workloads, stop dev/test instances off-hours, use latest generation instances.","commonMistake":"Buying 3-year Reserved Instances without usage data — workloads may change.","followUp":"How do Compute Optimizer recommendations work?"},{"difficulty":"troubleshooting","question":"EC2 instance stuck in \"stopping\" state.","shortAnswer":"Wait up to 10-15 minutes. If still stuck, force-stop via CLI: aws ec2 stop-instances --instance-ids i-xxx --force. If force-stop fails, contact AWS Support.","commonMistake":"Immediately terminating the instance instead of waiting or force-stopping.","followUp":"What causes instances to get stuck in stopping state?"},{"difficulty":"troubleshooting","question":"EBS volume performance is degraded.","shortAnswer":"Check: volume type and provisioned IOPS, CloudWatch VolumeQueueLength (>1 = contention), burst balance for gp2 (BurstBalance metric), throughput limit, instance EBS bandwidth limit.","commonMistake":"Not checking instance-level EBS bandwidth limits — smaller instances cap EBS throughput.","followUp":"How does EBS burst balance work for gp2 volumes?"},{"difficulty":"troubleshooting","question":"EC2 instance fails status checks.","shortAnswer":"System status check failure: AWS infrastructure issue → stop and start instance (migrates to new host). Instance status check failure: OS/software issue → check console output, reboot, or recreate.","commonMistake":"Rebooting for system check failures — you need stop/start to migrate to new hardware.","followUp":"What is the difference between reboot and stop/start?"},{"difficulty":"troubleshooting","question":"Cannot attach additional EBS volume to instance.","shortAnswer":"Check: volume and instance must be in same AZ, instance device limit not exceeded, volume is not attached elsewhere (unless io2 Multi-Attach). Detach from other instance first.","commonMistake":"Trying to attach a volume from us-east-1a to an instance in us-east-1b.","followUp":"How to move an EBS volume between AZs?"},{"difficulty":"troubleshooting","question":"EC2 instance cannot reach the internet.","shortAnswer":"Check: public IP or Elastic IP assigned, route table has 0.0.0.0/0 → IGW route, IGW is attached to VPC, security group allows outbound, NACL allows outbound. Private subnet: needs NAT Gateway.","commonMistake":"Missing the IGW route in the route table — most common cause.","followUp":"How does NAT Gateway enable internet access for private instances?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4><ol><li><strong>Terminate instance:</strong> EC2 → Instances → Select → Terminate</li><li><strong>Delete AMI:</strong> EC2 → AMIs → Deregister</li><li><strong>Delete snapshots:</strong> EC2 → Snapshots → Delete</li><li><strong>Delete key pair:</strong> EC2 → Key pairs → Delete</li><li><strong>Delete security group:</strong> EC2 → Security Groups → Delete (only non-default)</li></ol>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Chapter 01: Amazon VPC', url: 'module-04.html' }, next: { title: 'Chapter 03: Amazon S3', url: 'module-02.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_03_DATA;
} else {
  window.MODULE_03_DATA = MODULE_03_DATA;
}
