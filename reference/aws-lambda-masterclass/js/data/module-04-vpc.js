/**
 * ============================================================
 * MODULE 04 — Amazon VPC
 * Networking, subnets, route tables, NAT, NACLs, peering
 * ============================================================
 */
const MODULE_04_DATA = {
  id: 'vpc-fundamentals',
  moduleId: 'module-04',
  title: 'Amazon VPC — Virtual Private Cloud',
  description: 'Build production-grade network architectures. Covers VPCs, public/private subnets, Internet Gateways, NAT Gateways, Route Tables, NACLs vs Security Groups, VPC Peering, and PrivateLink.',
  difficulty: 'intermediate',
  duration: '90 min',
  prerequisites: ['Module 01: AWS IAM', 'Module 03: Amazon EC2', 'Basic networking (IP, CIDR, TCP/UDP)'],
  objectives: [
    'Design a multi-tier VPC with public and private subnets across AZs',
    'Configure Route Tables for internet access (IGW) and private access (NAT)',
    'Differentiate NACLs (stateless) from Security Groups (stateful)',
    'Implement VPC Endpoints to access AWS services without internet',
    'Set up VPC Peering and Transit Gateway for multi-VPC connectivity',
    'Troubleshoot connectivity issues using VPC Flow Logs and Reachability Analyzer'
  ],

  sections: [
    {
      id: 'why-vpc',
      type: 'why',
      title: 'Why VPC?',
      content: {
        html: `
          <div class="alert alert-info">
            <span class="alert-icon">🏗️</span>
            <div class="alert-content">
              <div class="alert-title">Your Private Data Center in the Cloud</div>
              <div class="alert-text">VPC is a logically isolated network within AWS where you control IP ranges, subnets, route tables, and gateways. Every AWS resource that needs a network (EC2, RDS, Lambda, ELB) lives inside a VPC. You cannot skip VPC — it's the foundation of all cloud networking.</div>
            </div>
          </div>
          <h4>Network Tiers</h4>
          <table>
            <thead><tr><th>Tier</th><th>Subnet Type</th><th>Internet Access</th><th>Resources</th></tr></thead>
            <tbody>
              <tr><td><strong>Public Tier</strong></td><td>Public subnet (route to IGW)</td><td>Full inbound + outbound</td><td>ALB, NAT Gateway, Bastion hosts</td></tr>
              <tr><td><strong>Application Tier</strong></td><td>Private subnet (route to NAT)</td><td>Outbound only (via NAT)</td><td>EC2 app servers, Lambda in VPC, ECS tasks</td></tr>
              <tr><td><strong>Data Tier</strong></td><td>Private subnet (no internet)</td><td>None</td><td>RDS, ElastiCache, DynamoDB VPC Endpoint</td></tr>
            </tbody>
          </table>
          <div class="alert alert-warning">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <div class="alert-title">CIDR Blocks Cannot Be Changed After Creation</div>
              <div class="alert-text">Plan your VPC CIDR carefully. Use /16 for production VPCs (65,536 IPs). Avoid overlapping CIDRs if you plan to peer VPCs or connect to on-premises. Secondary CIDRs can be added but the primary cannot change.</div>
            </div>
          </div>
        `
      }
    },

    {
      id: 'architecture',
      type: 'architecture',
      title: 'Multi-Tier VPC Architecture',
      content: {
        title: '3-Tier VPC: Public → App → Data',
        width: 750,
        height: 320,
        nodes: [
          { id: 'internet', label: 'Internet', icon: '🌍', x: 10, y: 140, type: 'client', description: 'Public internet traffic.' },
          { id: 'igw', label: 'Internet Gateway', icon: '🚪', x: 140, y: 140, type: 'trigger', description: 'Attaches to VPC. Provides a target in route tables for internet-routable traffic. One per VPC. Horizontally scaled, redundant, and HA.' },
          { id: 'alb', label: 'ALB (Public Subnet)', icon: '⚖️', x: 280, y: 60, type: 'trigger', description: 'Application Load Balancer in public subnets. Receives internet traffic on port 443, distributes to app tier in private subnets.' },
          { id: 'nat', label: 'NAT Gateway', icon: '🔒', x: 280, y: 220, type: 'security', description: 'Allows instances in private subnets to reach the internet (for updates, API calls) while blocking inbound connections. Deployed in public subnet. ~$32/month + data processing.' },
          { id: 'app', label: 'App Server (Private)', icon: '🖥️', x: 450, y: 60, type: 'compute', description: 'EC2/ECS in private subnet. No public IP. Receives traffic only from ALB. Outbound internet via NAT Gateway.' },
          { id: 'lambda', label: 'Lambda (Private)', icon: '⚡', x: 450, y: 160, type: 'compute', description: 'Lambda in VPC needs NAT Gateway for internet or VPC Endpoints for AWS services. Without either, Lambda cannot call AWS APIs.' },
          { id: 'rds', label: 'RDS (Data Tier)', icon: '🗄️', x: 620, y: 60, type: 'storage', description: 'RDS in private subnet with no internet route. Only accessible from app tier via Security Group rules.' },
          { id: 'vpce', label: 'VPC Endpoint', icon: '🔗', x: 620, y: 200, type: 'security', description: 'Interface or Gateway endpoint. Allows private access to AWS services (S3, DynamoDB, SQS) without internet. Traffic stays on AWS backbone.' }
        ],
        edges: [
          { from: 'internet', to: 'igw', label: 'HTTPS', animated: true },
          { from: 'igw', to: 'alb', label: 'Route Table', animated: true },
          { from: 'alb', to: 'app', label: 'Forward', animated: true },
          { from: 'app', to: 'rds', label: 'SQL', animated: true },
          { from: 'app', to: 'nat', label: 'Outbound' },
          { from: 'nat', to: 'igw', label: 'NAT' },
          { from: 'lambda', to: 'vpce', label: 'Private', animated: true }
        ]
      }
    },

    {
      id: 'concepts',
      type: 'concept',
      title: 'Core Concepts',
      content: {
        html: `
          <h4>1. Subnets & CIDR</h4>
          <p>Each subnet maps to ONE Availability Zone. AWS reserves 5 IPs per subnet (first 4 + last 1).</p>
          <pre style="background:var(--surface-code);padding:12px;border-radius:8px;font-size:13px;color:var(--color-code-string);">VPC:     10.0.0.0/16     (65,536 IPs)
├─ Public:  10.0.1.0/24  (251 usable)  AZ-a
├─ Public:  10.0.2.0/24  (251 usable)  AZ-b
├─ Private: 10.0.10.0/24 (251 usable)  AZ-a
├─ Private: 10.0.20.0/24 (251 usable)  AZ-b
├─ Data:    10.0.100.0/24 (251 usable) AZ-a
└─ Data:    10.0.200.0/24 (251 usable) AZ-b</pre>

          <h4>2. Route Tables</h4>
          <table>
            <thead><tr><th>Destination</th><th>Target</th><th>Meaning</th></tr></thead>
            <tbody>
              <tr><td>10.0.0.0/16</td><td>local</td><td>Traffic within VPC stays internal (always present)</td></tr>
              <tr><td>0.0.0.0/0</td><td>igw-xxx</td><td>All other traffic → Internet Gateway (public subnet)</td></tr>
              <tr><td>0.0.0.0/0</td><td>nat-xxx</td><td>All other traffic → NAT Gateway (private subnet)</td></tr>
            </tbody>
          </table>

          <h4>3. NACL vs Security Group</h4>
          <table>
            <thead><tr><th>Feature</th><th>Security Group</th><th>NACL</th></tr></thead>
            <tbody>
              <tr><td>Level</td><td>Instance (ENI)</td><td>Subnet</td></tr>
              <tr><td>State</td><td><strong>Stateful</strong> (return traffic auto-allowed)</td><td><strong>Stateless</strong> (must allow return traffic explicitly)</td></tr>
              <tr><td>Rules</td><td>Allow only</td><td>Allow AND Deny</td></tr>
              <tr><td>Evaluation</td><td>All rules evaluated together</td><td>Rules evaluated in order (lowest number first)</td></tr>
              <tr><td>Default</td><td>Deny all inbound, Allow all outbound</td><td>Allow all inbound and outbound</td></tr>
            </tbody>
          </table>

          <h4>4. VPC Endpoints</h4>
          <ul>
            <li><strong>Gateway Endpoint</strong> (free): S3 and DynamoDB only. Route table entry. No DNS changes needed.</li>
            <li><strong>Interface Endpoint</strong> (paid): All other AWS services. Creates an ENI in your subnet with a private IP. Uses PrivateLink.</li>
          </ul>

          <h4>5. VPC Peering</h4>
          <p>1:1 connection between two VPCs (same or cross-account/cross-region). CIDRs must NOT overlap. Not transitive: if A↔B and B↔C, A cannot reach C via B — must create A↔C peering separately.</p>
        `
      }
    },

    {
      id: 'lambda-code',
      type: 'code',
      title: 'VPC Management with Boto3',
      content: {
        title: 'Create a Production VPC',
        languages: [
          {
            id: 'python-vpc',
            label: 'VPC Builder',
            code: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.resource('ec2')
ec2_client = boto3.client('ec2')

def create_production_vpc():
    """Create a 3-tier VPC with public and private subnets."""

    # 1. Create VPC
    vpc = ec2.create_vpc(CidrBlock='10.0.0.0/16')
    vpc.wait_until_available()
    vpc.create_tags(Tags=[{'Key': 'Name', 'Value': 'prod-vpc'}])
    logger.info("VPC created: %s", vpc.id)

    # 2. Enable DNS hostnames (required for VPC endpoints)
    ec2_client.modify_vpc_attribute(
        VpcId=vpc.id,
        EnableDnsHostnames={'Value': True}
    )

    # 3. Create Internet Gateway
    igw = ec2.create_internet_gateway()
    igw.attach_to_vpc(VpcId=vpc.id)
    igw.create_tags(Tags=[{'Key': 'Name', 'Value': 'prod-igw'}])

    # 4. Create subnets
    public_subnet_a = vpc.create_subnet(
        CidrBlock='10.0.1.0/24',
        AvailabilityZone='us-east-1a',
        TagSpecifications=[{
            'ResourceType': 'subnet',
            'Tags': [{'Key': 'Name', 'Value': 'public-a'}]
        }]
    )
    private_subnet_a = vpc.create_subnet(
        CidrBlock='10.0.10.0/24',
        AvailabilityZone='us-east-1a',
        TagSpecifications=[{
            'ResourceType': 'subnet',
            'Tags': [{'Key': 'Name', 'Value': 'private-app-a'}]
        }]
    )

    # 5. Public route table → IGW
    public_rt = vpc.create_route_table()
    public_rt.create_route(DestinationCidrBlock='0.0.0.0/0', GatewayId=igw.id)
    public_rt.associate_with_subnet(SubnetId=public_subnet_a.id)
    public_rt.create_tags(Tags=[{'Key': 'Name', 'Value': 'public-rt'}])

    # 6. NAT Gateway (in public subnet, for private subnet outbound)
    eip = ec2_client.allocate_address(Domain='vpc')
    nat = ec2_client.create_nat_gateway(
        SubnetId=public_subnet_a.id,
        AllocationId=eip['AllocationId'],
        TagSpecifications=[{
            'ResourceType': 'natgateway',
            'Tags': [{'Key': 'Name', 'Value': 'prod-nat'}]
        }]
    )
    nat_id = nat['NatGateway']['NatGatewayId']
    logger.info("NAT Gateway: %s (wait for 'available' state)", nat_id)

    # 7. Private route table → NAT
    # NOTE: Must wait for NAT to be 'available' before adding route
    # In production, use a waiter or CloudFormation/CDK
    private_rt = vpc.create_route_table()
    # private_rt.create_route(DestinationCidrBlock='0.0.0.0/0', NatGatewayId=nat_id)
    private_rt.associate_with_subnet(SubnetId=private_subnet_a.id)
    private_rt.create_tags(Tags=[{'Key': 'Name', 'Value': 'private-rt'}])

    return {
        'vpcId': vpc.id,
        'publicSubnet': public_subnet_a.id,
        'privateSubnet': private_subnet_a.id,
        'igwId': igw.id,
        'natId': nat_id
    }`,
            explanations: [
              { line: '19-22', text: 'EnableDnsHostnames is required for VPC endpoints and for EC2 instances to get public DNS names.' },
              { line: '50', text: 'Public route: 0.0.0.0/0 → IGW means "all non-VPC traffic goes to the internet." The local route (10.0.0.0/16 → local) is always present.' },
              { line: '54-62', text: 'NAT Gateway must be in a PUBLIC subnet with an Elastic IP. Private subnets route through it for outbound internet. ~$32/month fixed cost.' },
              { line: '68', text: 'Private route: 0.0.0.0/0 → NAT Gateway allows outbound internet (software updates, API calls) but blocks inbound connections.' }
            ]
          }
        ],
        defaultLang: 'python-vpc',
        expectedOutput: '{\n  "vpcId": "vpc-0abc123",\n  "publicSubnet": "subnet-pub-a",\n  "privateSubnet": "subnet-priv-a",\n  "igwId": "igw-0abc123",\n  "natId": "nat-0abc123"\n}'
      }
    },

    {
      id: 'cli-commands',
      type: 'command',
      title: 'VPC CLI Commands',
      content: [
        {
          command: 'aws ec2 describe-vpcs --query "Vpcs[].[VpcId,CidrBlock,Tags[?Key==\'Name\'].Value|[0],IsDefault]" --output table',
          category: 'aws-cli',
          expectedOutput: '---------------------------------------------\n|  vpc-0abc123  | 10.0.0.0/16 | prod-vpc | False |\n|  vpc-default  | 172.31.0.0/16 | default | True  |\n---------------------------------------------',
          explanation: 'Lists all VPCs with CIDR, Name tag, and whether it\'s the default VPC. Every account has a default VPC per region — don\'t use it for production.',
          interviewQ: 'Why should you avoid using the default VPC for production workloads?'
        },
        {
          command: 'aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-0abc123" --query "RouteTables[].{Name:Tags[?Key==\'Name\'].Value|[0],Routes:Routes[].{Dest:DestinationCidrBlock,Target:GatewayId||NatGatewayId}}"',
          category: 'aws-cli',
          expectedOutput: '[\n  {\n    "Name": "public-rt",\n    "Routes": [\n      {"Dest": "10.0.0.0/16", "Target": "local"},\n      {"Dest": "0.0.0.0/0", "Target": "igw-0abc123"}\n    ]\n  },\n  {\n    "Name": "private-rt",\n    "Routes": [\n      {"Dest": "10.0.0.0/16", "Target": "local"},\n      {"Dest": "0.0.0.0/0", "Target": "nat-0abc123"}\n    ]\n  }\n]',
          explanation: 'Shows route tables for a VPC. Public subnets route 0.0.0.0/0 to IGW. Private subnets route to NAT. The "local" route keeps intra-VPC traffic internal.'
        }
      ]
    },

    {
      id: 'terminal-lab',
      type: 'terminal',
      title: 'Interactive Terminal',
      content: {
        title: 'VPC CLI Lab',
        mode: 'simulated',
        initialText: 'VPC CLI Lab. Try:\n  aws ec2 describe-vpcs\n  aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-0abc123"\n  aws ec2 describe-nat-gateways\n  aws ec2 describe-internet-gateways',
        commands: {
          'aws ec2 describe-vpcs': {
            text: '{\n  "Vpcs": [\n    {"VpcId": "vpc-0abc123", "CidrBlock": "10.0.0.0/16", "State": "available", "IsDefault": false, "Tags": [{"Key":"Name","Value":"prod-vpc"}]},\n    {"VpcId": "vpc-default", "CidrBlock": "172.31.0.0/16", "State": "available", "IsDefault": true}\n  ]\n}',
            type: 'output'
          },
          'aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-0abc123"': {
            text: '{\n  "Subnets": [\n    {"SubnetId": "subnet-pub-a", "CidrBlock": "10.0.1.0/24", "AvailabilityZone": "us-east-1a", "MapPublicIpOnLaunch": true, "Tags": [{"Key":"Name","Value":"public-a"}]},\n    {"SubnetId": "subnet-priv-a", "CidrBlock": "10.0.10.0/24", "AvailabilityZone": "us-east-1a", "MapPublicIpOnLaunch": false, "Tags": [{"Key":"Name","Value":"private-app-a"}]}\n  ]\n}',
            type: 'output'
          },
          'aws ec2 describe-nat-gateways': {
            text: '{\n  "NatGateways": [{\n    "NatGatewayId": "nat-0abc123",\n    "SubnetId": "subnet-pub-a",\n    "State": "available",\n    "NatGatewayAddresses": [{"PublicIp": "54.123.45.67", "AllocationId": "eipalloc-0abc"}]\n  }]\n}',
            type: 'output'
          }
        }
      }
    },

    {
      id: 'troubleshooting',
      type: 'troubleshooting',
      title: 'Common VPC Issues',
      content: {
        items: [
          { title: 'Lambda in VPC cannot call AWS APIs', error: 'Lambda timeout when calling DynamoDB, S3, or SQS from a VPC-connected function', cause: 'Lambda in a private subnet has no internet route. Without a NAT Gateway or VPC Endpoint, Lambda cannot reach AWS service endpoints.', fix: 'Option A: Add NAT Gateway in public subnet + route 0.0.0.0/0 → NAT in private subnet route table. Option B (recommended): Create VPC Endpoints for the specific services (free for S3/DynamoDB Gateway endpoints).' },
          { title: 'EC2 cannot reach the internet despite public IP', error: 'Instance has public IP but cannot ping 8.8.8.8 or install packages', cause: 'Subnet route table missing 0.0.0.0/0 → IGW route. Or NACL blocking outbound traffic. Or Security Group blocking outbound.', fix: 'Check: 1) Route table has 0.0.0.0/0 → igw-xxx. 2) NACL allows outbound on required ports (HTTP 80, HTTPS 443) AND allows return traffic (ephemeral ports 1024-65535). 3) Security Group outbound allows the traffic.' },
          { title: 'VPC Peering connection not working', error: 'Instances in peered VPCs cannot communicate', cause: 'Route table entries not added in BOTH VPCs. VPC Peering is not transitive and requires manual route configuration.', fix: 'In VPC-A route table: add 10.1.0.0/16 → pcx-xxx. In VPC-B route table: add 10.0.0.0/16 → pcx-xxx. Also verify Security Groups allow traffic from the peered VPC CIDR.' },
          { title: 'NAT Gateway charges unexpectedly high', error: 'NAT Gateway data processing costs exceeding budget', cause: 'NAT Gateway charges $0.045/GB processed. High-volume traffic (S3 downloads, API calls) through NAT is expensive.', fix: 'Use S3 Gateway VPC Endpoint (free) instead of routing S3 traffic through NAT. Use Interface Endpoints for other high-volume services. Analyze VPC Flow Logs to identify top talkers.' }
        ]
      }
    },

    {
      id: 'quiz-vpc',
      type: 'quiz',
      title: 'Knowledge Check',
      content: {
        title: 'Amazon VPC Quiz',
        type: 'knowledge-check',
        questions: [
          {
            id: 'q1',
            question: 'A Lambda function in a private subnet needs to write to DynamoDB. There is no NAT Gateway and no VPC Endpoints. What happens?',
            options: [
              { id: 'a', text: 'Lambda writes to DynamoDB successfully because DynamoDB is a managed service' },
              { id: 'b', text: 'Lambda times out — it cannot reach the DynamoDB endpoint without internet or a VPC Endpoint' },
              { id: 'c', text: 'Lambda automatically creates a temporary network path to DynamoDB' },
              { id: 'd', text: 'Lambda fails with an IAM permission error' }
            ],
            correctId: 'b',
            explanation: 'DynamoDB is accessed via public HTTPS endpoints. Lambda in a VPC private subnet with no internet route (NAT) and no VPC Endpoint cannot reach ANY AWS service. The most cost-effective fix is a DynamoDB Gateway VPC Endpoint (free).',
            difficulty: 'intermediate'
          },
          {
            id: 'q2',
            question: 'What is the key difference between a NACL and a Security Group?',
            options: [
              { id: 'a', text: 'NACLs are stateful; Security Groups are stateless' },
              { id: 'b', text: 'NACLs operate at subnet level and are stateless; Security Groups operate at instance level and are stateful' },
              { id: 'c', text: 'NACLs support only Allow rules; Security Groups support Allow and Deny' },
              { id: 'd', text: 'NACLs are free; Security Groups cost money' }
            ],
            correctId: 'b',
            explanation: 'NACLs = subnet level, stateless (must explicitly allow return traffic), support Allow AND Deny, evaluated in order. Security Groups = instance level, stateful (return traffic auto-allowed), support Allow only, all rules evaluated together.',
            difficulty: 'beginner'
          },
          {
            id: 'q3',
            question: 'You have VPC-A peered with VPC-B, and VPC-B peered with VPC-C. Can instances in VPC-A communicate with VPC-C?',
            options: [
              { id: 'a', text: 'Yes — peering is transitive through VPC-B' },
              { id: 'b', text: 'No — VPC Peering is NOT transitive. You must create a separate A↔C peering connection.' },
              { id: 'c', text: 'Yes, but only if all three VPCs are in the same region' },
              { id: 'd', text: 'Yes, if VPC-B forwards the traffic (acts as a router)' }
            ],
            correctId: 'b',
            explanation: 'VPC Peering is NOT transitive. A↔B and B↔C does NOT allow A↔C. For full-mesh connectivity, use AWS Transit Gateway instead — it acts as a hub that all VPCs connect to.',
            difficulty: 'intermediate'
          }
        ]
      }
    },

    {
      id: 'challenge-vpc',
      type: 'challenge',
      title: 'Challenge: VPC Connectivity Debugger',
      content: {
        title: 'Debug VPC Connectivity',
        description: 'Write a diagnostic function that checks VPC connectivity for a given subnet: verifies route table entries, NAT Gateway status, Internet Gateway attachment, and VPC Endpoint availability.',
        difficulty: 'advanced',
        requirements: [
          'Accept subnet_id as input',
          'Describe the subnet to get VPC ID and route table',
          'Check if 0.0.0.0/0 route exists and what it targets (IGW or NAT)',
          'Verify the NAT Gateway (if any) is in "available" state',
          'Check for S3 and DynamoDB Gateway VPC Endpoints',
          'Return a diagnostic report dict'
        ],
        starterCode: `import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ec2 = boto3.client('ec2')

def diagnose_connectivity(subnet_id):
    """
    Diagnose VPC connectivity for a subnet.
    Returns a report with route table, NAT, IGW, and VPC Endpoint status.
    """
    report = {'subnet_id': subnet_id, 'issues': []}

    # TODO: Describe subnet to get VPC ID
    # TODO: Get route table associated with subnet
    # TODO: Check for 0.0.0.0/0 route (IGW or NAT)
    # TODO: Verify NAT Gateway state if applicable
    # TODO: Check for VPC Endpoints (S3, DynamoDB)
    # TODO: Return diagnostic report

    return report`,
        language: 'python',
        hints: [
          'ec2.describe_subnets(SubnetIds=[subnet_id]) → Subnets[0]["VpcId"]',
          'ec2.describe_route_tables(Filters=[{"Name":"association.subnet-id","Values":[subnet_id]}])',
          'Check Routes for DestinationCidrBlock == "0.0.0.0/0" and GatewayId or NatGatewayId',
          'ec2.describe_nat_gateways(Filter=[{"Name":"state","Values":["available"]}])',
          'ec2.describe_vpc_endpoints(Filters=[{"Name":"vpc-id","Values":[vpc_id]}])'
        ],
        testCases: [
          { description: 'Describes subnet', keywords: ['describe_subnets'], expectedOutput: 'describe_subnets' },
          { description: 'Checks route table', keywords: ['describe_route_tables'], expectedOutput: 'route_tables' },
          { description: 'Checks for default route', keywords: ['0.0.0.0/0'], expectedOutput: '0.0.0.0/0' },
          { description: 'Returns report dict', keywords: ['return', 'report'], expectedOutput: 'report' }
        ]
      }
    },
    { id: 'lab', type: 'lab', title: 'Practical Lab: VPC Network Architecture Lab', content: {"title":"VPC Network Architecture Lab","description":"Build a production VPC with public/private subnets, NAT Gateway, and VPC peering.","steps":[{"id":"s1","title":"Create VPC","instruction":"VPC → Create VPC → CIDR: 10.0.0.0/16 → Enable DNS hostnames → Create.","expectedResult":"VPC created with /16 CIDR block.","hint":"Plan CIDR carefully — cannot be changed after creation."},{"id":"s2","title":"Create Subnets","instruction":"Create 4 subnets: 2 public (10.0.1.0/24, 10.0.2.0/24) and 2 private (10.0.3.0/24, 10.0.4.0/24) across 2 AZs.","expectedResult":"4 subnets across 2 AZs.","hint":"Use different AZs for high availability."},{"id":"s3","title":"Create Internet Gateway","instruction":"Create IGW and attach to VPC. Update public subnet route table: 0.0.0.0/0 → IGW.","expectedResult":"Public subnets can reach internet.","hint":"Enable auto-assign public IP on public subnets."},{"id":"s4","title":"Create NAT Gateway","instruction":"Create NAT Gateway in public subnet with Elastic IP. Update private subnet route table: 0.0.0.0/0 → NAT GW.","expectedResult":"Private instances can access internet (outbound only).","hint":"NAT Gateway costs $0.045/hr + data processing."},{"id":"s5","title":"Configure NACLs","instruction":"Create custom NACL for private subnets. Allow inbound from VPC CIDR only. Allow outbound to 0.0.0.0/0 on ports 443, 80.","expectedResult":"Private subnets have network-level access control.","hint":"NACLs are stateless — you must allow return traffic (ephemeral ports 1024-65535)."},{"id":"s6","title":"Test Connectivity","instruction":"Launch EC2 in public subnet (SSH in). Launch EC2 in private subnet. From public instance, SSH to private instance. From private instance, curl google.com.","expectedResult":"Public: internet access. Private: outbound internet via NAT only.","hint":"Use the public instance as a bastion/jump box."}]} },

    { id: 'interview', type: 'interview', title: 'Interview Preparation', content: { questions: [{"difficulty":"beginner","question":"What is a VPC?","shortAnswer":"Virtual Private Cloud — logically isolated network in AWS. You define IP range (CIDR), create subnets, configure route tables, and control access with security groups and NACLs.","commonMistake":"Not planning CIDR blocks for future VPC peering — overlapping CIDRs cannot be peered.","followUp":"What is the maximum CIDR block size for a VPC?"},{"difficulty":"beginner","question":"Public subnet vs private subnet?","shortAnswer":"Public: route table has route to Internet Gateway. Private: no direct internet route (uses NAT for outbound). It is the route table that makes it public/private, not the subnet itself.","commonMistake":"Thinking subnets are inherently public or private — it depends on the route table.","followUp":"Can a single subnet have both public and private instances?"},{"difficulty":"beginner","question":"Security Groups vs NACLs?","shortAnswer":"SG: instance-level, stateful, allow-only rules. NACL: subnet-level, stateless, allow AND deny rules. SGs are the primary firewall, NACLs are the secondary defense layer.","commonMistake":"Forgetting NACLs are stateless — must explicitly allow return traffic on ephemeral ports.","followUp":"In what order are SGs and NACLs evaluated?"},{"difficulty":"beginner","question":"What is a NAT Gateway?","shortAnswer":"Managed service allowing private subnet instances to access internet (outbound) while preventing inbound connections. Created in a public subnet with an Elastic IP.","commonMistake":"Putting NAT Gateway in a private subnet — it must be in a public subnet with IGW route.","followUp":"NAT Gateway vs NAT Instance?"},{"difficulty":"beginner","question":"What is an Internet Gateway?","shortAnswer":"Horizontally scaled, redundant gateway allowing VPC resources to communicate with the internet. One IGW per VPC. Must be attached to VPC and referenced in route table.","commonMistake":"Creating IGW but forgetting to add 0.0.0.0/0 route in the route table.","followUp":"Does an IGW perform NAT?"},{"difficulty":"intermediate","question":"What is VPC peering?","shortAnswer":"Private network connection between two VPCs using AWS backbone. Non-transitive — if A peers with B and B peers with C, A cannot reach C through B.","commonMistake":"Assuming VPC peering is transitive. Each pair needs its own peering connection.","followUp":"When would you use Transit Gateway instead of VPC peering?"},{"difficulty":"intermediate","question":"What are VPC endpoints?","shortAnswer":"Private connections to AWS services without using internet. Gateway endpoints (S3, DynamoDB — free). Interface endpoints (most other services — uses PrivateLink, has cost).","commonMistake":"Forgetting to update route table for Gateway endpoints and security group for Interface endpoints.","followUp":"What is the difference between Gateway and Interface endpoints?"},{"difficulty":"intermediate","question":"What is VPC Flow Logs?","shortAnswer":"Captures IP traffic information for network interfaces in VPC. Publish to CloudWatch Logs, S3, or Kinesis. Used for monitoring, troubleshooting, and security analysis.","commonMistake":"Not enabling Flow Logs and having no visibility into network traffic during security incidents.","followUp":"What traffic is NOT captured by Flow Logs?"},{"difficulty":"intermediate","question":"Explain Transit Gateway.","shortAnswer":"Hub-and-spoke network transit hub connecting VPCs, VPNs, and Direct Connect. Simplifies network topology from N*(N-1)/2 peering connections to N connections.","commonMistake":"Using VPC peering for 10+ VPCs instead of Transit Gateway — peering becomes unmanageable at scale.","followUp":"How does Transit Gateway route table work?"},{"difficulty":"intermediate","question":"What is AWS Direct Connect?","shortAnswer":"Dedicated private network connection from on-premises to AWS. 1/10/100 Gbps. Lower latency and more consistent than VPN. Uses BGP for routing.","commonMistake":"Not setting up VPN as backup for Direct Connect — DX is not redundant by default.","followUp":"How do you achieve high availability with Direct Connect?"},{"difficulty":"advanced","question":"Design a multi-account VPC architecture for an enterprise.","shortAnswer":"Hub-and-spoke with Transit Gateway. Shared services VPC (DNS, monitoring). Network Firewall for inspection. RAM to share TGW across accounts. Centralized egress through firewall VPC.","commonMistake":"Creating a full mesh of VPC peering connections — does not scale.","followUp":"How do you implement centralized internet egress?"},{"difficulty":"advanced","question":"How does PrivateLink work?","shortAnswer":"Expose services privately across VPCs without VPC peering. Service provider creates NLB + VPC Endpoint Service. Consumer creates Interface VPC Endpoint. Traffic stays on AWS network.","commonMistake":"Confusing PrivateLink with VPC peering — PrivateLink is unidirectional and service-specific.","followUp":"When would you use PrivateLink vs VPC peering?"},{"difficulty":"advanced","question":"What is AWS Network Firewall?","shortAnswer":"Managed stateful firewall for VPC. Supports IDS/IPS, domain filtering, protocol detection. Deployed in firewall subnet. Routes traffic through firewall endpoints.","commonMistake":"Deploying Network Firewall without updating route tables — traffic must be routed through firewall endpoints.","followUp":"Network Firewall vs Security Groups vs NACLs vs WAF?"},{"difficulty":"advanced","question":"Explain IPv6 in VPC.","shortAnswer":"VPCs support dual-stack (IPv4 + IPv6). IPv6 CIDRs are public by default (no NAT needed). Use egress-only IGW for outbound IPv6 from private subnets. Security groups and NACLs apply to both.","commonMistake":"Assuming IPv6 addresses in VPC are private — they are globally unique and publicly routable.","followUp":"What is an Egress-Only Internet Gateway?"},{"difficulty":"advanced","question":"How do you implement network segmentation?","shortAnswer":"Subnets for tier separation (web, app, DB), NACLs for subnet isolation, security groups for instance firewall, VPC peering/TGW for VPC communication, Network Firewall for inspection.","commonMistake":"Relying only on security groups without NACLs — defense in depth requires both.","followUp":"How do you enforce network segmentation in a multi-account setup?"},{"difficulty":"scenario","question":"Design a VPC for a 3-tier web application with DR.","shortAnswer":"Primary region: VPC with public (ALB), private (app), data (RDS) subnets across 3 AZs. DR region: standby VPC with RDS read replica, S3 CRR, Route 53 failover. VPC peering between regions.","commonMistake":"Not separating database subnets from application subnets with dedicated NACLs.","followUp":"How do you automate DR failover?"},{"difficulty":"scenario","question":"Private subnet instances cannot reach the internet. Troubleshoot.","shortAnswer":"Check: NAT Gateway exists in public subnet, NAT GW route table has IGW route, private subnet route table has 0.0.0.0/0 → NAT GW, NAT GW security (no SG needed), NAT GW state is \"available\".","commonMistake":"Checking private subnet route table but not verifying the NAT Gateway's own subnet has IGW access.","followUp":"How do you troubleshoot NAT Gateway connectivity issues?"},{"difficulty":"scenario","question":"VPC peering established but instances cannot communicate. Fix it.","shortAnswer":"Check: route tables on BOTH sides updated with peer VPC CIDR → pcx-xxx, security groups allow traffic from peer VPC CIDR, NACLs allow traffic, DNS resolution enabled for peering.","commonMistake":"Updating route table on only one side. Both VPCs must have routes to each other.","followUp":"How do you enable DNS resolution across VPC peering?"},{"difficulty":"scenario","question":"Migrate from VPC peering to Transit Gateway for 15 VPCs.","shortAnswer":"Create TGW, attach VPCs one at a time, update route tables to point to TGW, test connectivity, then remove peering connections. Do it incrementally, not all at once.","commonMistake":"Removing peering connections before TGW routes are fully tested — causes downtime.","followUp":"How do TGW route tables enable network segmentation?"},{"difficulty":"scenario","question":"Design network connectivity for hybrid cloud with on-premises data center.","shortAnswer":"Primary: Direct Connect for consistent low-latency connectivity. Backup: Site-to-Site VPN over internet. Transit Gateway to connect multiple VPCs. Private VIF for VPC access, Public VIF for public AWS services.","commonMistake":"Using only VPN without Direct Connect for latency-sensitive workloads like database replication.","followUp":"How do you implement failover from Direct Connect to VPN?"},{"difficulty":"troubleshooting","question":"Security group rule changes not taking effect.","shortAnswer":"SG changes are immediate. Check: correct SG attached to instance, rule direction (inbound vs outbound), protocol and port match, source/destination CIDR correct, instance running latest SG version (no restart needed).","commonMistake":"Adding inbound rule on port 80 but the application listens on port 8080.","followUp":"How do you audit security group rules across all instances?"},{"difficulty":"troubleshooting","question":"VPC endpoint not working — requests still going over internet.","shortAnswer":"Check: endpoint route in route table (Gateway), DNS resolution (Interface), security group on interface endpoint, endpoint policy allows the action, correct service name used.","commonMistake":"For Gateway endpoints: not adding the prefix list route to the route table. For Interface: not using the endpoint DNS name.","followUp":"How do you verify traffic is going through the VPC endpoint?"},{"difficulty":"troubleshooting","question":"Instances in same VPC but different subnets cannot communicate.","shortAnswer":"Check: NACLs on both subnets (inbound AND outbound rules including ephemeral ports), security groups allow traffic from other subnet CIDR, route tables have local route for VPC CIDR.","commonMistake":"Forgetting NACL outbound rules or ephemeral port range (1024-65535) for return traffic.","followUp":"What is the default NACL behavior?"},{"difficulty":"troubleshooting","question":"NAT Gateway data processing charges are very high.","shortAnswer":"Check: VPC Flow Logs for traffic patterns, move traffic to VPC endpoints (S3/DynamoDB gateway endpoints are free), use S3 gateway endpoint instead of routing S3 traffic through NAT.","commonMistake":"Routing S3/DynamoDB traffic through NAT Gateway instead of free Gateway VPC endpoints.","followUp":"How do you identify top NAT Gateway traffic sources?"},{"difficulty":"troubleshooting","question":"Direct Connect link is up but traffic is not flowing.","shortAnswer":"Check: BGP session state (verify routes being advertised), virtual interface (VIF) state, route table has routes via VGW/DXGW, security groups/NACLs allow traffic, correct VLAN tag.","commonMistake":"Not checking BGP route propagation — DX link can be up but BGP may not be advertising routes.","followUp":"How do you monitor Direct Connect BGP sessions?"}] } },

    { id: 'cleanup', type: 'cleanup', title: 'Lab Cleanup', content: { html: `<h4>Remove Lab Resources</h4><ol><li><strong>Terminate instances:</strong> Delete all EC2 instances in the VPC</li><li><strong>Delete NAT Gateway:</strong> VPC → NAT Gateways → Delete (wait for deletion)</li><li><strong>Release Elastic IP:</strong> VPC → Elastic IPs → Release</li><li><strong>Delete subnets:</strong> VPC → Subnets → Delete all 4</li><li><strong>Detach and delete IGW:</strong> VPC → Internet Gateways → Detach → Delete</li><li><strong>Delete VPC:</strong> VPC → Your VPCs → Delete</li></ol><div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content"><div class="alert-title">Delete in Order</div><div class="alert-text">Delete instances first, then NAT GW, then subnets, then IGW, then VPC. Dependencies must be removed first.</div></div></div>` } },



    { id: 'next', type: 'next', title: '', content: { prev: { title: 'Course Home', url: '../index.html' }, next: { title: 'Chapter 02: Amazon EC2', url: 'module-03.html' } } }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MODULE_04_DATA;
} else {
  window.MODULE_04_DATA = MODULE_04_DATA;
}
