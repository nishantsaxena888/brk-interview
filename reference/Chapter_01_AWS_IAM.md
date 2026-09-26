# Chapter 01 — AWS IAM (Identity & Access Management)

---

## Prerequisite Chapters
- None — this is the first chapter and foundational to everything in AWS.

## Used In Production Practicals
- Every practical in this course — IAM is required for all AWS operations.

---

## 1. Learning Objectives

By the end of this chapter, you will be able to:

1. **Explain** how IAM works — users, groups, roles, and policies.
2. **Create** IAM users, groups, and roles with least-privilege permissions.
3. **Write** custom IAM policies using JSON policy documents.
4. **Configure** MFA, password policies, and account security settings.
5. **Implement** cross-account access using IAM roles and STS.
6. **Design** a production IAM strategy for a multi-team organization.
7. **Troubleshoot** AccessDenied errors, policy conflicts, and permission issues.
8. **Answer** interview questions about IAM, security, and access management.

---

## 2. What is AWS IAM?

AWS Identity and Access Management (IAM) is a **free** service that controls **who** (authentication) can do **what** (authorization) in your AWS account.

### The Core Question IAM Answers
```
WHO        → is making the request? (Users, Roles, Applications)
CAN DO     → what action? (s3:PutObject, ec2:RunInstances)
ON WHAT    → which resource? (arn:aws:s3:::my-bucket/*)
UNDER WHAT → conditions? (from this IP, with MFA, during business hours)
```

### Key Characteristics
- **Free service** — no charge for IAM itself
- **Global service** — IAM is not region-specific (users/roles are global)
- **Eventually consistent** — changes propagate globally within seconds
- **Integrated with every AWS service** — IAM is the security backbone
- **Supports federation** — connect to Active Directory, SAML, OIDC providers

---

## 3. Why Do We Need It?

### Without IAM
```
Everyone uses the root account
  → No audit trail of who did what
  → No way to limit permissions
  → One compromised password = entire account compromised
  → Can't give developers access without giving them EVERYTHING
  → Compliance nightmare (PCI DSS, HIPAA, SOC 2 all require access controls)
```

### With IAM
```
Root account locked away (used only for billing/account settings)
  → Each person has their own IAM user (or federated identity)
  → Each user has ONLY the permissions they need (least privilege)
  → All API calls logged in CloudTrail (audit trail)
  → Roles for applications (no hardcoded credentials)
  → MFA required for sensitive operations
  → Compliance requirements met
```

---

## 4. Real-World Production Use Cases

### 1. Developer Access
Developers need access to deploy Lambda functions and read CloudWatch logs, but should NOT be able to modify VPCs, delete databases, or access billing.

### 2. CI/CD Pipeline
CodePipeline/CodeBuild needs permissions to pull from CodeCommit, build Docker images, push to ECR, and deploy to ECS — but nothing else.

### 3. Cross-Account Access
The production account allows the monitoring account to read CloudWatch metrics by assuming a cross-account role. No credentials shared between accounts.

### 4. Application Access
An EC2 instance running a web application needs to read from DynamoDB and write to S3. Instead of hardcoding access keys, it uses an IAM Instance Profile (role).

### 5. Third-Party Integration
A monitoring tool (Datadog, New Relic) needs read-only access to CloudWatch. You create an IAM role with an ExternalId that only the vendor knows.

---

## 5. Core Concepts

### IAM Identities

| Identity | What It Is | When to Use |
|----------|-----------|------------|
| **Root User** | Account owner with FULL access | Never for daily tasks; billing/account settings only |
| **IAM User** | Person or application with credentials | Individual developers, service accounts |
| **IAM Group** | Collection of IAM users | Organize by team/role (Developers, Admins, ReadOnly) |
| **IAM Role** | Temporary identity anyone can assume | EC2 apps, Lambda, cross-account, federation |

### Root User vs IAM User
```
Root User:
  ✗ Cannot be restricted by IAM policies
  ✗ Cannot have MFA enforced by policy (must be set manually)
  ✗ Should NEVER be used for daily operations
  
  Only use root for:
  - Changing account settings
  - Closing the account
  - Restoring IAM permissions (if locked out)
  - Enabling MFA on root (first thing to do!)
  - Creating first IAM admin user

IAM User:
  ✓ Can be restricted to specific actions and resources
  ✓ Can have MFA enforced via IAM policy
  ✓ Actions logged in CloudTrail with user identity
  ✓ Can be disabled/deleted without affecting account
  ✓ Use for all daily operations
```

### IAM Groups
```
Groups organize users and apply policies to all members:

  Admins Group          → AdministratorAccess policy
  ├── alice
  ├── bob
  
  Developers Group      → DeveloperAccess policy (custom)
  ├── charlie
  ├── diana
  
  ReadOnly Group        → ReadOnlyAccess policy
  ├── eve (auditor)
  
Rules:
  - Users can belong to multiple groups
  - Groups CANNOT be nested (no group inside a group)
  - Groups are for users only (you can't add a role to a group)
  - A user inherits policies from ALL groups they belong to
```

### IAM Roles
```
Role = temporary identity that can be "assumed"

EC2 Instance Role:
  EC2 instance → assumes WebAppRole → gets temporary credentials
  → credentials auto-rotated every 6 hours (no management needed)

Lambda Execution Role:
  Lambda function → assumes LambdaExecRole → reads DynamoDB, writes S3

Cross-Account Role:
  User in Account A → assumes MonitorRole in Account B → reads CloudWatch

Federation Role:
  Corporate AD user → SAML federation → assumes FederatedRole → uses AWS
```

### IAM Policies

IAM policies are **JSON documents** that define permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3ReadAccess",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::my-production-bucket",
                "arn:aws:s3:::my-production-bucket/*"
            ],
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": "10.0.0.0/8"
                }
            }
        }
    ]
}
```

### Policy Elements

| Element | Required? | Description | Example |
|---------|-----------|-------------|---------|
| **Version** | Yes | Policy version | `"2012-10-17"` (always use this) |
| **Statement** | Yes | Array of permission rules | `[{...}, {...}]` |
| **Sid** | No | Statement ID (human-readable label) | `"AllowS3Read"` |
| **Effect** | Yes | Allow or Deny | `"Allow"` or `"Deny"` |
| **Action** | Yes | AWS API actions | `"s3:GetObject"`, `"ec2:*"` |
| **Resource** | Yes | ARN of the resource | `"arn:aws:s3:::my-bucket/*"` |
| **Condition** | No | When the rule applies | IP address, MFA, time, tags |

### Policy Types

| Type | Attached To | Managed By | Use Case |
|------|-----------|-----------|----------|
| **AWS Managed** | Users, Groups, Roles | AWS | Standard permissions (ReadOnlyAccess) |
| **Customer Managed** | Users, Groups, Roles | You | Custom permissions for your org |
| **Inline** | Single User, Group, Role | You | One-off, tightly coupled permission |
| **Resource-Based** | AWS Resources (S3, SQS, etc.) | You | Cross-account access, public access |
| **Permission Boundary** | Users, Roles | Admin | Maximum permission limit |
| **SCP (Service Control Policy)** | AWS Accounts, OUs | Org Admin | Account-level guardrails |
| **Session Policy** | STS sessions | Caller | Further restrict assumed role |

### Policy Evaluation Logic

```
1. Evaluate all applicable policies
2. Default = IMPLICIT DENY (everything denied by default)
3. If any policy has EXPLICIT DENY → DENIED (always wins)
4. If any policy has ALLOW → ALLOWED
5. If no ALLOW found → DENIED (implicit deny)

Decision Flow:
  Start → Explicit Deny? → YES → ❌ DENIED
                          → NO  → Explicit Allow? → YES → ✅ ALLOWED
                                                   → NO  → ❌ DENIED (implicit)
                                                   
Key Rule: DENY ALWAYS WINS over ALLOW
```

### ARN (Amazon Resource Name) Format
```
arn:aws:service:region:account-id:resource-type/resource-id

Examples:
arn:aws:s3:::my-bucket                          (S3 bucket)
arn:aws:s3:::my-bucket/*                        (all objects in bucket)
arn:aws:ec2:ap-south-1:123456789012:instance/*  (all EC2 instances in region)
arn:aws:iam::123456789012:user/alice            (IAM user — no region, global)
arn:aws:lambda:ap-south-1:123456789012:function:my-func
```

---

## 6. Architecture

### IAM in a Production Architecture

```mermaid
flowchart TD
    subgraph Identity["Identity Layer"]
        User[IAM User<br>Console/CLI]
        Fed[Federated User<br>AD/SAML/OIDC]
        App[Application<br>EC2/Lambda/ECS]
    end
    
    subgraph IAM_Service["AWS IAM"]
        Auth[Authentication<br>Who are you?]
        Authz[Authorization<br>What can you do?]
        Policy[Policy Evaluation<br>JSON policies]
    end
    
    subgraph Resources["AWS Resources"]
        S3[S3]
        EC2[EC2]
        RDS[RDS]
        DDB[DynamoDB]
    end
    
    User -->|Credentials| Auth
    Fed -->|SAML Token| Auth
    App -->|Role Credentials| Auth
    Auth --> Authz
    Authz --> Policy
    Policy -->|Allow/Deny| Resources
    
    CT[CloudTrail<br>Audit Logs] -.-> IAM_Service
```

### How IAM Request Flow Works
```
1. Principal sends API request (with SigV4 signature)
2. IAM authenticates: "Is this a valid identity?"
3. IAM gathers all applicable policies:
   - Identity-based (user/role policies)
   - Resource-based (S3 bucket policy)
   - Permission boundaries
   - SCPs (if using Organizations)
   - Session policies (if using STS)
4. IAM evaluates: "Is this action ALLOWED?"
5. If allowed → API executes
6. If denied → AccessDenied error returned
7. CloudTrail logs the entire request (success or failure)
```

---

## 7. Important Components

### 1. Access Keys (Programmatic Access)
```
Access Key ID:     AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

Rules:
  - NEVER commit access keys to Git
  - NEVER embed in application code
  - Rotate every 90 days
  - Use IAM roles instead when possible
  - Maximum 2 access keys per user
```

### 2. MFA (Multi-Factor Authentication)
```
Something you KNOW (password) + Something you HAVE (MFA device)

MFA Types:
  - Virtual MFA (Google Authenticator, Authy) → free
  - Hardware MFA (YubiKey, Gemalto) → physical device
  - SMS MFA → least secure, not recommended

Enable MFA on:
  ✅ Root account (CRITICAL — do this first!)
  ✅ All IAM users with console access
  ✅ Require MFA for sensitive API operations
```

### 3. Password Policy
```bash
aws iam update-account-password-policy \
    --minimum-password-length 14 \
    --require-symbols \
    --require-numbers \
    --require-uppercase-characters \
    --require-lowercase-characters \
    --max-password-age 90 \
    --password-reuse-prevention 12 \
    --allow-users-to-change-password
```

### 4. IAM Instance Profile
```
IAM Role → wrapped in → Instance Profile → attached to → EC2 Instance

Why:
  EC2 instance gets temporary credentials automatically
  Credentials rotated automatically (no management)
  No access keys stored on the instance
  Applications use boto3.client('s3') — credentials resolved automatically
```

### 5. IAM Policy Conditions

```json
{
    "Condition": {
        "IpAddress": {"aws:SourceIp": "203.0.113.0/24"},
        "Bool": {"aws:MultiFactorAuthPresent": "true"},
        "StringEquals": {"aws:RequestedRegion": "ap-south-1"},
        "DateGreaterThan": {"aws:CurrentTime": "2026-01-01T00:00:00Z"},
        "StringLike": {"s3:prefix": ["home/${aws:username}/*"]}
    }
}
```

Common conditions:
- `aws:SourceIp` — restrict by IP address
- `aws:MultiFactorAuthPresent` — require MFA
- `aws:RequestedRegion` — restrict to specific regions
- `aws:PrincipalTag` — attribute-based access control (ABAC)
- `aws:CurrentTime` — time-based restrictions

---

## 8. How It Works

### Creating an IAM User (Complete Flow)
```
1. Admin creates IAM user "alice"
2. Admin adds "alice" to "Developers" group
3. "Developers" group has "DeveloperAccess" policy attached
4. Admin enables console access (password)
5. Admin enables MFA requirement
6. Alice logs in → https://123456789012.signin.aws.amazon.com/console
7. Alice enters password + MFA code
8. Alice can perform only actions allowed by DeveloperAccess policy
9. All actions logged in CloudTrail
```

### Assuming a Role (Complete Flow)
```
1. EC2 instance has Instance Profile → linked to "WebAppRole"
2. Application on EC2 calls boto3.client('dynamodb')
3. SDK calls EC2 metadata service → http://169.254.169.254/latest/meta-data/iam/security-credentials/WebAppRole
4. Metadata service returns temporary credentials (access key + secret + session token)
5. SDK uses these credentials to sign the DynamoDB API request
6. IAM validates the request against WebAppRole's policies
7. If allowed → DynamoDB returns data
8. Credentials expire after 6 hours → SDK automatically refreshes
```

---

## 9. AWS Console Walkthrough

### Step 1 — Secure Root Account
1. Log in as root user
2. **IAM Console** → **Account Settings** → Set strong password policy
3. **Root User** → **Security credentials** → Enable MFA (virtual)
4. **Create IAM admin user** (don't use root again)

### Step 2 — Create IAM Users and Groups
1. **IAM Console** → **User groups** → **Create group**
   - Name: `Developers`
   - Attach policy: Create custom `DeveloperAccess` policy
2. **IAM Console** → **Users** → **Create user**
   - Username: `alice`
   - Enable console access
   - Add to `Developers` group
3. Repeat for other users

### Step 3 — Create IAM Role for EC2
1. **IAM Console** → **Roles** → **Create role**
2. Trusted entity: **AWS service** → **EC2**
3. Attach policies: `AmazonDynamoDBReadOnlyAccess`, `AmazonS3ReadOnlyAccess`
4. Role name: `WebAppReadOnlyRole`
5. Attach to EC2 instance: **EC2 Console** → Instance → **Actions** → **Security** → **Modify IAM role**

---

## 10. AWS CLI Commands

### User Management
```bash
# Create user
aws iam create-user --user-name alice

# Add user to group
aws iam add-user-to-group --user-name alice --group-name Developers

# Create access keys
aws iam create-access-key --user-name alice

# List users
aws iam list-users --query 'Users[*].[UserName,CreateDate]' --output table

# Delete user (must remove all dependencies first)
aws iam remove-user-from-group --user-name alice --group-name Developers
aws iam delete-login-profile --user-name alice
aws iam delete-user --user-name alice
```

### Group Management
```bash
# Create group
aws iam create-group --group-name Developers

# Attach managed policy to group
aws iam attach-group-policy \
    --group-name Developers \
    --policy-arn arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess

# List groups
aws iam list-groups --query 'Groups[*].GroupName'
```

### Role Management
```bash
# Create role with trust policy
aws iam create-role \
    --role-name WebAppRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }'

# Attach policy to role
aws iam attach-role-policy \
    --role-name WebAppRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess

# Create instance profile and add role
aws iam create-instance-profile --instance-profile-name WebAppProfile
aws iam add-role-to-instance-profile \
    --instance-profile-name WebAppProfile \
    --role-name WebAppRole
```

### Policy Management
```bash
# Create custom policy
aws iam create-policy \
    --policy-name DeveloperS3Access \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
            "Resource": [
                "arn:aws:s3:::dev-bucket",
                "arn:aws:s3:::dev-bucket/*"
            ]
        }]
    }'

# Simulate policy (test without applying)
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/alice \
    --action-names s3:GetObject \
    --resource-arns arn:aws:s3:::prod-bucket/secret.txt
```

### Security Audit
```bash
# Generate credential report
aws iam generate-credential-report
aws iam get-credential-report --query 'Content' --output text | base64 -d

# List users without MFA
aws iam list-users --query 'Users[*].UserName' --output text | \
  xargs -I {} sh -c 'aws iam list-mfa-devices --user-name {} --query "MFADevices" --output text | grep -q . || echo "NO MFA: {}"'

# Find unused access keys (last used > 90 days)
aws iam get-credential-report --query 'Content' --output text | base64 -d | \
  awk -F, '$5 != "N/A" && $5 < "'$(date -d '-90 days' +%Y-%m-%d)'"'
```

---

## 11. Hands-On Practical

### Practical: Production IAM Setup

#### Objective
Create a secure IAM structure for a three-team organization with least-privilege access.

#### Architecture
```mermaid
flowchart TD
    subgraph Groups["IAM Groups"]
        Admins[Admins Group<br>Full Access + MFA Required]
        Devs[Developers Group<br>EC2+S3+Lambda+DynamoDB]
        RO[ReadOnly Group<br>View-only Access]
    end
    
    subgraph Users["IAM Users"]
        Alice[alice - Admin]
        Bob[bob - Developer]
        Charlie[charlie - Developer]
        Eve[eve - Auditor]
    end
    
    Alice --> Admins
    Bob --> Devs
    Charlie --> Devs
    Eve --> RO
    
    subgraph Roles["IAM Roles"]
        EC2Role[WebAppRole<br>For EC2 instances]
        LambdaRole[LambdaExecRole<br>For Lambda functions]
        CrossRole[CrossAccountRole<br>For monitoring account]
    end
```

#### Step 1 — Create Groups with Policies
```bash
# Create groups
aws iam create-group --group-name Admins
aws iam create-group --group-name Developers
aws iam create-group --group-name ReadOnly

# Attach policies
aws iam attach-group-policy --group-name Admins \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws iam attach-group-policy --group-name ReadOnly \
    --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
```

#### Step 2 — Create Custom Developer Policy
```bash
aws iam create-policy --policy-name DeveloperAccess \
    --policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "EC2LimitedAccess",
                "Effect": "Allow",
                "Action": ["ec2:Describe*", "ec2:RunInstances", "ec2:StopInstances", "ec2:StartInstances"],
                "Resource": "*",
                "Condition": {"StringEquals": {"aws:RequestedRegion": "ap-south-1"}}
            },
            {
                "Sid": "S3DevAccess",
                "Effect": "Allow",
                "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
                "Resource": ["arn:aws:s3:::dev-*", "arn:aws:s3:::dev-*/*"]
            },
            {
                "Sid": "LambdaAccess",
                "Effect": "Allow",
                "Action": ["lambda:*"],
                "Resource": "arn:aws:lambda:ap-south-1:*:function:dev-*"
            },
            {
                "Sid": "CloudWatchLogs",
                "Effect": "Allow",
                "Action": ["logs:GetLogEvents", "logs:DescribeLogGroups", "logs:DescribeLogStreams"],
                "Resource": "*"
            }
        ]
    }'

aws iam attach-group-policy --group-name Developers \
    --policy-arn arn:aws:iam::123456789012:policy/DeveloperAccess
```

#### Step 3 — Create Users
```bash
for user in alice bob charlie eve; do
    aws iam create-user --user-name $user
    aws iam create-login-profile --user-name $user --password 'TempP@ss123!' --password-reset-required
done

aws iam add-user-to-group --user-name alice --group-name Admins
aws iam add-user-to-group --user-name bob --group-name Developers
aws iam add-user-to-group --user-name charlie --group-name Developers
aws iam add-user-to-group --user-name eve --group-name ReadOnly
```

#### Validation
```bash
# Test developer permissions
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/bob \
    --action-names s3:GetObject ec2:TerminateInstances iam:CreateUser \
    --resource-arns "*" \
    --query 'EvaluationResults[*].[EvalActionName,EvalDecision]' --output table

# Expected:
# s3:GetObject         → allowed (if dev-* bucket)
# ec2:TerminateInstances → denied
# iam:CreateUser       → denied
```

---

## 12. Production Architecture

### Enterprise IAM Design

```mermaid
flowchart TD
    subgraph External["External Identities"]
        AD[Corporate Active Directory]
        SSO[IAM Identity Center SSO]
    end
    
    subgraph AWS_Org["AWS Organization"]
        subgraph MgmtAcct["Management Account"]
            SCP[Service Control Policies]
        end
        subgraph ProdAcct["Production Account"]
            ProdRoles[Production Roles<br>Deploy, Monitor, Operate]
        end
        subgraph DevAcct["Development Account"]
            DevRoles[Development Roles<br>Build, Test, Debug]
        end
    end
    
    AD --> SSO
    SSO -->|SAML Federation| ProdRoles
    SSO -->|SAML Federation| DevRoles
    SCP -.->|Guardrails| ProdAcct
    SCP -.->|Guardrails| DevAcct
```

### Production IAM Strategy
```
1. NO IAM users for humans — use IAM Identity Center (SSO) + federation
2. IAM roles for ALL applications — EC2, Lambda, ECS (no access keys)
3. Least privilege — start with zero permissions, add only what's needed
4. Permission boundaries — cap maximum permissions for delegated admin
5. SCPs — organization-wide guardrails (deny unapproved regions, require encryption)
6. Tags for ABAC — attribute-based access control (access by environment tag)
7. Credential rotation — 90-day key rotation, enforce via AWS Config
8. CloudTrail — log all API calls for audit
9. IAM Access Analyzer — identify resources shared externally
10. Regular access review — quarterly review of permissions
```

---

## 13. Security Best Practices

1. **Enable MFA on root account immediately** — this is the #1 security action
2. **Never use root for daily operations** — create an IAM admin user instead
3. **Use roles, not access keys** — for EC2, Lambda, ECS, and cross-account
4. **Least privilege principle** — grant minimum permissions needed
5. **Use groups for permissions** — don't attach policies directly to users
6. **Rotate access keys every 90 days** — automate with AWS Config
7. **Use permission boundaries** — limit maximum permissions for delegated admin
8. **Enable CloudTrail** — audit all API calls
9. **Use IAM Access Analyzer** — find resources shared with external accounts
10. **Use conditions** — restrict by IP, MFA, region, time
11. **Never hardcode credentials** — use environment variables or IAM roles
12. **Use AWS managed policies as a baseline** — customize as needed
13. **Regular access review** — remove unused users, keys, and permissions
14. **Enforce MFA for sensitive operations** — delete resources, IAM changes

---

## 14. High Availability

- IAM is a **global AWS service** — not tied to any specific region
- IAM data is replicated across multiple regions automatically
- If one region has issues, IAM continues working from other regions
- **99.99%+ availability** — IAM is one of the most available AWS services
- IAM is a dependency for ALL other AWS services

---

## 15. Scalability

- No limits on the number of API calls (soft limits exist, can be increased)
- Default limits: 5,000 IAM users per account, 300 groups, 1,000 roles
- Policies: 10 managed policies per user/group/role, 6,144 characters per inline policy
- For large organizations: use IAM Identity Center (SSO) instead of IAM users

---

## 16. Monitoring & Observability

### CloudTrail (IAM Audit)
```bash
# Find all IAM API calls in the last 24 hours
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventSource,AttributeValue=iam.amazonaws.com \
    --start-time $(date -d '-1 day' -u +%FT%TZ) \
    --query 'Events[*].{Time:EventTime,User:Username,Action:EventName}' \
    --output table
```

### IAM Access Analyzer
```bash
# Create an analyzer to find resources shared externally
aws accessanalyzer create-analyzer \
    --analyzer-name account-analyzer \
    --type ACCOUNT

# List findings (resources accessible from outside your account)
aws accessanalyzer list-findings \
    --analyzer-arn $ANALYZER_ARN \
    --query 'findings[*].{Resource:resource,Type:resourceType,Access:isPublic}'
```

### Credential Report
```bash
# Generate and download credential report
aws iam generate-credential-report
sleep 5
aws iam get-credential-report --query 'Content' --output text | base64 -d > credential-report.csv
```

### Key Metrics to Monitor
| What | How | Alert When |
|------|-----|-----------|
| Root account usage | CloudTrail: `Root` user events | Any root API call |
| Failed auth attempts | CloudTrail: `ConsoleLogin` with error | > 5 failures in 5 min |
| Access key age | Credential report | Key > 90 days old |
| Unused credentials | Credential report | Not used in 90 days |
| Policy changes | CloudTrail: `Put*Policy`, `Attach*`, `Detach*` | Any IAM policy change |

---

## 17. Cost Optimization

- **IAM is free** — no charges for users, groups, roles, or policies
- **STS calls are free** — AssumeRole, GetSessionToken, etc.
- **Cost implication**: IAM misconfigurations can lead to expensive mistakes:
  - Over-privileged user launches 100 expensive instances → $$$
  - Leaked access key used for crypto mining → $$$
  - No budget alerts + admin access = unbounded spending

---

## 18. Disaster Recovery

- IAM is globally replicated by AWS — no DR configuration needed
- **Backup IAM configuration** — export policies, users, groups, roles via CLI
- **Infrastructure as Code** — define IAM in CloudFormation/Terraform for reproducibility
- **Break-glass procedure** — document how to access the account if IAM is misconfigured
  - Keep root credentials in a secure vault (physical safe)
  - Document recovery steps

---

## 19. Troubleshooting

### Problem 1: "AccessDenied" Error

**Investigation Steps**:
```bash
# 1. Check who you are
aws sts get-caller-identity

# 2. Check what policies are attached
aws iam list-attached-user-policies --user-name alice
aws iam list-attached-group-policies --group-name Developers
aws iam list-user-policies --user-name alice  # inline policies

# 3. Simulate the action
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/alice \
    --action-names s3:PutObject \
    --resource-arns arn:aws:s3:::prod-bucket/file.txt

# 4. Check CloudTrail for the denial
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=PutObject \
    --start-time $(date -d '-1 hour' -u +%FT%TZ)

# 5. Use IAM Policy Simulator (Console)
# https://policysim.aws.amazon.com/
```

**Common Causes**:
1. Missing permissions in user/role policy
2. Explicit DENY in resource policy (S3 bucket policy, SQS policy)
3. SCP blocking the action (Organization level)
4. Permission boundary too restrictive
5. Wrong region or wrong resource ARN
6. Condition not met (MFA required, IP restricted)
7. S3: trying to access with bucket owner vs object owner conflict

### Problem 2: "MalformedPolicyDocument" Error

**Common Causes**:
```
- Invalid JSON syntax (missing comma, bracket)
- Wrong "Version" (must be "2012-10-17")
- Invalid action name (typo in action)
- Invalid ARN format
- Resource field missing for IAM actions that require it
```

### Problem 3: Cross-Account Role Assumption Fails

```bash
# Check trust policy on target role
aws iam get-role --role-name CrossAccountRole \
    --query 'Role.AssumeRolePolicyDocument'

# Trust policy must include source account:
{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::111111111111:root"},
    "Action": "sts:AssumeRole",
    "Condition": {
        "StringEquals": {"sts:ExternalId": "unique-external-id"}
    }
}
```

### Problem 4: "EntityAlreadyExists" When Creating User/Role

**Fix**: The name is already taken. IAM names are unique per account. List existing entities:
```bash
aws iam get-user --user-name alice 2>/dev/null && echo "User exists" || echo "User doesn't exist"
```

---

## 20. Common Production Problems

| # | Problem | Root Cause | Prevention |
|---|---------|------------|------------|
| 1 | AccessDenied everywhere | Explicit Deny in SCP or boundary | Test policies before applying |
| 2 | Access key leaked on GitHub | Developer committed credentials | Use git-secrets, never use keys |
| 3 | Root account compromised | No MFA on root | Enable MFA on root immediately |
| 4 | Over-privileged users | `*:*` permissions | Start with zero, add incrementally |
| 5 | Orphaned access keys | Employee left, keys still active | Regular credential report review |
| 6 | Policy too large | > 6,144 char inline policy | Use managed policies, split |
| 7 | Cross-account access fails | Missing ExternalId | Always use ExternalId for 3rd party |
| 8 | Can't delete user | Attached policies/keys/MFA | Remove all dependencies first |

---

## 21. Real-World Scenario

### Scenario: Access Key Leaked on GitHub

**Event**: A developer pushes code to a public GitHub repo. The code contains an IAM access key with `AdministratorAccess`.

**Timeline**:
```
T+0min:  Code pushed with access key
T+2min:  GitHub scanner bots detect the key
T+3min:  Attackers start using the key
T+3min:  ec2:RunInstances — 50 × p3.16xlarge ($24.48/hr each)
T+5min:  Total: 50 × $24.48 = $1,224/hour running crypto miners
T+60min: AWS Trusted Advisor alert: unusual EC2 usage
T+120min: Developer notices, starts panicking
T+122min: Key disabled, instances terminated
T+2hrs:  Cost: ~$2,400 + potential data breach
```

**Prevention**:
1. **Never use access keys** — use IAM roles for applications
2. **Use git-secrets** — pre-commit hook that blocks credential commits
3. **Enable GuardDuty** — detects anomalous API calls within minutes
4. **Set billing alerts** — catch unexpected spending immediately
5. **Rotate keys every 90 days** — limit the window of exposure
6. **AWS Secrets Manager** — store secrets securely, not in code

---

## 22. Interview Questions

### Basic Questions (10)

**Q1: What is AWS IAM?**
A: IAM is a free AWS service that manages authentication (who you are) and authorization (what you can do). It controls access to AWS services and resources using users, groups, roles, and policies.

**Q2: What is the difference between authentication and authorization?**
A: Authentication verifies identity ("prove who you are" — username/password/MFA). Authorization determines permissions ("what are you allowed to do" — IAM policies). IAM handles both.

**Q3: What is the root user? When should you use it?**
A: The root user is the account owner with unrestricted access. Use it ONLY for tasks that require root (changing account settings, enabling MFA on root, creating first admin user). Never for daily operations.

**Q4: What is an IAM policy?**
A: A JSON document that defines permissions. It specifies which actions (s3:GetObject) are allowed or denied on which resources (arn:aws:s3:::my-bucket/*) under what conditions (from specific IP).

**Q5: What is the difference between an IAM user and an IAM role?**
A: An IAM user has permanent credentials (password, access keys) and is for a specific person or application. An IAM role has temporary credentials, can be assumed by anyone authorized, and is the recommended approach for applications and cross-account access.

**Q6: What is an IAM group?**
A: A collection of IAM users that share the same permissions. Attach policies to the group, and all members inherit those permissions. Example: "Developers" group with development-related policies.

**Q7: What is the principle of least privilege?**
A: Grant only the minimum permissions needed to perform a task. Start with zero permissions and add only what's required. Regularly review and remove unused permissions.

**Q8: What is MFA?**
A: Multi-Factor Authentication — requires two forms of verification: something you know (password) and something you have (MFA device/app). Adds a critical security layer to prevent unauthorized access even if a password is compromised.

**Q9: Can IAM policies have both Allow and Deny? What wins?**
A: Yes. If a policy has both Allow and Deny for the same action, Deny ALWAYS wins. This is the explicit deny rule.

**Q10: What is an ARN?**
A: Amazon Resource Name — a unique identifier for any AWS resource. Format: `arn:aws:service:region:account-id:resource-type/resource-id`. Used in IAM policies to specify which resources a policy applies to.

### Intermediate Questions (10)

**Q11: What are the different types of IAM policies?**
A: AWS Managed (maintained by AWS), Customer Managed (created by you), Inline (embedded in a single identity), Resource-based (attached to resources like S3), Permission Boundary (maximum permission cap), SCP (Organization-level guardrails), and Session Policy (restricts STS session).

**Q12: Explain the IAM policy evaluation logic.**
A: 1) Default: everything denied. 2) Evaluate all policies (identity-based + resource-based + SCPs + boundaries). 3) If any explicit Deny → DENIED. 4) If any Allow → ALLOWED. 5) If neither → DENIED (implicit deny). Explicit Deny always overrides Allow.

**Q13: What is an Instance Profile?**
A: A container for an IAM role that's attached to an EC2 instance. The instance can then use the role's temporary credentials to call AWS APIs without access keys. SDK/CLI automatically uses these credentials via the instance metadata service.

**Q14: How does cross-account access work?**
A: Account A creates a role with a trust policy allowing Account B. Account B users/roles assume the role using STS AssumeRole. They receive temporary credentials scoped to the role's permissions. ExternalId prevents confused deputy attacks for third-party access.

**Q15: What is a permission boundary?**
A: A managed policy that sets the MAXIMUM permissions an IAM user or role can have. Even if the identity policy allows an action, the permission boundary must also allow it. Used for delegated administration — admins can create roles but can't exceed the boundary.

**Q16: What is the confused deputy problem?**
A: When a third party (deputy) uses your trust to access your resources on behalf of a malicious actor. Prevention: use ExternalId in the trust policy. The third party must provide the correct ExternalId when assuming the role.

**Q17: How do you grant temporary access to AWS resources?**
A: Use AWS STS (Security Token Service). Methods: AssumeRole (cross-account/service), GetSessionToken (MFA-enhanced session), AssumeRoleWithSAML (federated), AssumeRoleWithWebIdentity (OIDC). All return temporary credentials that expire.

**Q18: What is ABAC (Attribute-Based Access Control)?**
A: Using tags as attributes to control access. Example: a policy that allows users to access EC2 instances only if the instance's "Department" tag matches the user's "Department" tag. More scalable than RBAC for large organizations.

**Q19: What is the difference between identity-based and resource-based policies?**
A: Identity-based: attached to users/groups/roles, specifies what the identity can do. Resource-based: attached to resources (S3, SQS, Lambda), specifies who can access the resource. Resource-based policies enable cross-account access without AssumeRole.

**Q20: How do you audit IAM permissions?**
A: 1) Credential Report — lists all users and their credential status. 2) IAM Access Analyzer — finds resources shared externally. 3) Policy Simulator — test policies without applying. 4) CloudTrail — audit all API calls. 5) AWS Config rule `iam-user-unused-credentials-check`.

### Advanced Questions (10)

**Q21: Design an IAM strategy for a 200-person engineering organization.**
A: Use IAM Identity Center (SSO) with corporate IdP (Active Directory). Define permission sets for roles (Admin, Developer, ReadOnly, DBA). Use ABAC with department/team tags. SCPs enforce guardrails. No IAM users for humans. IAM roles for all applications. Permission boundaries for delegated admins. Quarterly access reviews.

**Q22: How does SigV4 work?**
A: AWS Signature Version 4 is the signing protocol for all AWS API requests. Process: 1) Create canonical request (method, URL, headers, payload hash). 2) Create string to sign (algorithm, date, credential scope, canonical hash). 3) Calculate signing key (HMAC chain: date → region → service → signing). 4) Add signature to Authorization header. The SDK handles this automatically.

**Q23: A user has AdministratorAccess but can't launch EC2. What could be wrong?**
A: 1) SCP blocking EC2 in this account/OU. 2) Permission boundary not allowing EC2. 3) Session policy restricting (if assumed role). 4) Wrong region (SCP restricting regions). 5) EC2 service quota/limit. 6) VPC/subnet issue (not IAM). Check: SCPs first, then boundaries, then session policies.

**Q24: How do you implement a break-glass procedure?**
A: Create a dedicated "BreakGlass" IAM role with AdministratorAccess. Trust policy allows only a specific group of senior engineers. Require MFA for assumption. Log all break-glass access via CloudTrail + SNS alert to entire security team. Review each use within 24 hours. Keep root credentials in a physical safe as ultimate fallback.

**Q25: Explain the difference between SCP and IAM policies.**
A: SCPs are attached to AWS accounts/OUs in Organizations. They don't grant permissions — they set guardrails (maximum permissions for the entire account). IAM policies grant permissions to specific identities. Both must allow for the action to succeed: SCP ∩ IAM policy = effective permissions.

**Q26: How do you prevent privilege escalation?**
A: 1) Don't allow `iam:*` for non-admins. 2) Deny `iam:CreateUser`, `iam:AttachUserPolicy`, `iam:PutUserPolicy`. 3) Use permission boundaries — users can create roles but only within boundary limits. 4) Deny `iam:PassRole` for powerful roles. 5) Regular access review with IAM Access Analyzer.

**Q27: Design an access model for a CI/CD pipeline.**
A: CodePipeline service role → can start builds, deployments. CodeBuild role → pull from CodeCommit, push to ECR, upload to S3. CodeDeploy role → manage EC2, update ASG, modify ALB. Each role follows least privilege. No cross-service permissions. Pipeline role can only `iam:PassRole` for build/deploy roles specifically. CloudTrail audits all pipeline actions.

**Q28: How does IAM handle eventually consistent changes?**
A: IAM changes propagate globally within seconds but are eventually consistent. Implications: a newly attached policy might not take effect immediately (rare, usually < 10 seconds). In automation, add a small delay after IAM changes before testing. Read-after-write consistency is NOT guaranteed.

**Q29: What is the IAM policy size limit? How do you handle large policies?**
A: Managed policy: 6,144 characters. Inline: 2,048 chars (user), 5,120 (role), 5,120 (group). Solutions: 1) Remove whitespace. 2) Use wildcards. 3) Split into multiple policies (up to 10 per identity). 4) Use conditions instead of listing resources. 5) Use ABAC tags.

**Q30: How do you implement emergency access revocation?**
A: 1) Immediately deactivate access keys: `aws iam update-access-key --status Inactive`. 2) Delete console password. 3) If role: update trust policy to deny all. 4) If needed, add explicit deny inline policy. 5) Invalidate sessions: add `aws:TokenIssueTime` condition in deny policy with timestamp before the compromise. 6) Check CloudTrail for all actions taken.

### Scenario-Based Questions (10)

**Q31: Your CloudTrail shows API calls from an unknown IP. What do you do?**
A: 1) Check which principal made the calls (user/role). 2) Determine if the IP is corporate or external. 3) If external: disable the access key immediately. 4) Review all actions taken from that IP. 5) If role: check which instance assumed the role. 6) Enable GuardDuty for ongoing threat detection.

**Q32: A developer says "I need admin access to do my job." How do you respond?**
A: No. Ask what specific actions they need. Create a custom policy with only those permissions. Use the Access Advisor to see which services they actually use. Start broad, then narrow based on Access Advisor data. Offer to add permissions as needed rather than starting with admin.

**Q33: A Lambda function needs to read from DynamoDB in another account. How?**
A: Create a role in the DynamoDB account with DynamoDB read permissions and a trust policy allowing the Lambda account. Lambda's execution role needs `sts:AssumeRole` for the cross-account role. In Lambda code: call STS AssumeRole, use returned credentials for DynamoDB client.

**Q34: You need to give 50 contractors temporary access for 3 months. Best approach?**
A: Use IAM Identity Center (SSO) with a contractor permission set. Create a group in the IdP for contractors. Map the group to the permission set. When the contract ends, remove them from the IdP group. No IAM users to clean up. All access centrally managed and auditable.

**Q35: An IAM policy allows `s3:*` but the user can't delete objects. Why?**
A: Check for: 1) Explicit Deny in S3 bucket policy. 2) SCP denying S3 delete actions. 3) Permission boundary not allowing S3 delete. 4) Object Lock enabled on bucket. 5) MFA Delete enabled and user not using MFA. 6) Wrong bucket (policy allows `s3:*` on a different resource ARN).

**Q36: How do you migrate from IAM users to IAM Identity Center (SSO)?**
A: 1) Set up IAM Identity Center with your IdP. 2) Create permission sets matching current IAM policies. 3) Map IdP groups to AWS accounts + permission sets. 4) Communicate migration plan to users. 5) Parallel run: both IAM users and SSO active for 2 weeks. 6) Verify SSO access works. 7) Deactivate IAM user credentials. 8) Delete IAM users after 30-day grace period.

**Q37: S3 bucket policy allows Account B, but Account B users still get AccessDenied. Why?**
A: Resource-based policies (S3 bucket policy) allow cross-account access, BUT the user in Account B also needs identity-based permissions (`s3:GetObject`) in their own account. Both the bucket policy AND the user's IAM policy must allow the action for cross-account access (except when using roles).

**Q38: You need to ensure no one can create IAM users with inline policies. How?**
A: Create an SCP or permission boundary that denies `iam:PutUserPolicy` (inline) while allowing `iam:AttachUserPolicy` (managed). This forces all policies to be managed policies, which are easier to audit and maintain.

**Q39: How do you handle an employee termination from a security perspective?**
A: 1) Disable all access keys. 2) Delete console password. 3) Deactivate MFA. 4) Remove from all groups. 5) Review recent CloudTrail activity. 6) Check for any resources the user created that need ownership transfer. 7) After 30 days: delete the IAM user. 8) If using SSO: disable in IdP (propagates immediately).

**Q40: Design IAM for a microservices architecture with 20 Lambda functions.**
A: Each Lambda function gets its own IAM execution role with least-privilege permissions specific to that function's needs. Shared policies for common actions (CloudWatch Logs). No shared roles between functions. Use resource-based policies for cross-service communication. Permission boundaries to cap maximum permissions. Tag roles with service name for audit. Automate with CloudFormation/CDK.

---

## 23. Scenario-Based Interview Questions

*(Covered in section 22 above — Q31 through Q40)*

---

## 24. Common Mistakes

1. **Using root account for daily work** — create an admin IAM user instead
2. **No MFA on root** — first thing to configure on any new account
3. **Hardcoding access keys** — use IAM roles for EC2, Lambda, ECS
4. **Granting `*:*` permissions** — never give admin access unless truly needed
5. **Attaching policies to users directly** — use groups instead
6. **Not rotating access keys** — rotate every 90 days minimum
7. **Sharing credentials** — each person gets their own identity
8. **Ignoring credential report** — review monthly for stale credentials
9. **Not using conditions** — restrict by IP, MFA, region, time
10. **Creating IAM users for applications** — use IAM roles instead

---

## 25. Production Checklist

- [ ] Root account MFA enabled (hardware key preferred)
- [ ] Root account access keys deleted
- [ ] IAM admin user created (not using root for daily ops)
- [ ] Password policy configured (14+ chars, complexity, rotation)
- [ ] IAM groups created for each team/role
- [ ] Policies attached to groups (not individual users)
- [ ] All users have MFA enabled
- [ ] IAM roles created for EC2, Lambda, ECS (no access keys)
- [ ] Cross-account roles use ExternalId for third parties
- [ ] Permission boundaries set for delegated admins
- [ ] CloudTrail enabled for all IAM API auditing
- [ ] IAM Access Analyzer enabled
- [ ] Credential report reviewed monthly
- [ ] Unused users and keys removed
- [ ] SCPs in place if using Organizations
- [ ] Break-glass procedure documented

---

## 26. Chapter Summary

IAM is the most important AWS service — every other service depends on it. Key takeaways:

1. **Lock down root** — MFA, no access keys, never use for daily work
2. **Use groups for permissions** — organize users, attach policies to groups
3. **Roles over access keys** — temporary credentials are always safer
4. **Least privilege** — start with zero, add only what's needed
5. **Deny always wins** — explicit Deny overrides any Allow
6. **Policy evaluation order** — SCPs → Permission Boundaries → Identity Policies → Resource Policies
7. **MFA everywhere** — root, console users, and sensitive API operations
8. **Audit regularly** — credential report, Access Analyzer, CloudTrail
9. **Use conditions** — restrict by IP, MFA, region, time for defense in depth
10. **IAM is free** — there's no excuse for poor access management

Everything you do in AWS passes through IAM. Master it, and you've secured the foundation of your entire cloud infrastructure.

---
---

# 🔬 Practical Lab 01 — IAM User, Group, and Policy

## Lab Overview

| Item | Detail |
|------|--------|
| **Difficulty** | Beginner |
| **Duration** | 45 minutes |
| **Cost** | Free (IAM is always free) |
| **Prerequisites** | AWS account with root access |
| **Lab Environment** | Environment 1 — Foundation |
| **AWS Region** | Global (IAM is not regional) |

## Business Scenario

> Your company has just started using AWS. The CTO asks you to set up proper access management before anyone deploys resources. You need to create three teams — **Admin**, **Developers**, and **Auditors** — each with appropriate permissions. No one should use the root account for daily work, and all users must have MFA enabled.

## Architecture

```mermaid
flowchart TD
    Root[Root Account<br>🔒 MFA Enabled<br>Never used daily] --> IAM[IAM Service]
    
    IAM --> AdminGroup[Admin Group<br>AdministratorAccess]
    IAM --> DevGroup[Developer Group<br>Custom Dev Policy]
    IAM --> AuditGroup[Auditor Group<br>ReadOnlyAccess]
    
    AdminGroup --> AdminUser[admin-user<br>MFA ✅]
    DevGroup --> DevUser[dev-user<br>MFA ✅]
    AuditGroup --> AuditUser[audit-user<br>MFA ✅]
```

## What You Will Learn

1. Create IAM users with proper configurations
2. Create IAM groups and attach managed policies
3. Write a custom IAM policy from scratch
4. Enable MFA for all users
5. Test permissions and demonstrate explicit Deny
6. Use the IAM Policy Simulator

---

### Step 1 — Secure the Root Account

#### AWS Console

1. Sign in to the **AWS Management Console** as the **root user**
2. Click your **account name** (top-right) → **Security credentials**
3. Under **Multi-factor authentication (MFA)** → Click **Assign MFA device**
4. Choose **Authenticator app**
5. Scan the QR code with Google Authenticator or Authy
6. Enter two consecutive MFA codes → Click **Add MFA**

📸 **Screenshot 01** — Root Account MFA Enabled
> **What you should see**: MFA device listed under "Multi-factor authentication" with status "Assigned"
> **Verify before proceeding**: MFA device type shows "Virtual" and ARN is displayed
> **⚠️ If you don't see this**: Ensure your authenticator app scanned the correct QR code. Try re-scanning.

🎯 **Interview Insight**: "What's the first thing you do when you get a new AWS account?"
> **What they're testing**: Security-first mindset
> **Strong answer**: "Enable MFA on root, create an admin IAM user, then never use root again. Also enable CloudTrail, set up a billing alarm, and configure account-level settings."
> **Weak answer**: "Start creating EC2 instances." (Shows no security awareness)

---

### Step 2 — Create IAM Groups

#### AWS Console

1. Navigate to **IAM Console** → **User groups** → **Create group**
2. Create the **Admin** group:
   - **Group name**: `Admins`
   - **Attach policy**: Search and select `AdministratorAccess`
   - Click **Create user group**

📸 **Screenshot 02** — Admin Group Created
> **What you should see**: Group "Admins" with 1 policy attached (AdministratorAccess)
> **Verify**: Policy name shows "AdministratorAccess" under the Permissions tab

3. Create the **Developer** group:
   - **Group name**: `Developers`
   - Do NOT attach any policy yet (we'll create a custom policy in Step 4)
   - Click **Create user group**

4. Create the **Auditor** group:
   - **Group name**: `Auditors`
   - **Attach policy**: Search and select `ReadOnlyAccess`
   - Click **Create user group**

📸 **Screenshot 03** — All Three Groups Created
> **What you should see**: IAM Groups list showing Admins (1 policy), Developers (0 policies), Auditors (1 policy)
> **Verify**: Three groups visible with correct policy counts

#### AWS CLI (Equivalent)

```bash
# Create groups
aws iam create-group --group-name Admins
aws iam create-group --group-name Developers
aws iam create-group --group-name Auditors

# Attach managed policies
aws iam attach-group-policy --group-name Admins \
    --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

aws iam attach-group-policy --group-name Auditors \
    --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
```

---

### Step 3 — Create IAM Users

#### AWS Console

1. Navigate to **IAM Console** → **Users** → **Create user**
2. Create `admin-user`:
   - **User name**: `admin-user`
   - ✅ **Provide user access to the AWS Management Console**
   - **Console password**: Custom password → `Admin@Str0ng!Pass`
   - ❌ Uncheck "User must create a new password at next sign-in" (for lab purposes)
   - Click **Next**
   - **Add user to group**: Select `Admins`
   - Click **Next** → **Create user**

📸 **Screenshot 04** — admin-user Created
> **What you should see**: User "admin-user" created successfully, showing Console sign-in URL
> **Verify**: User is a member of the "Admins" group
> **⚠️ Save**: Copy the Console sign-in URL — you'll need it to test

3. Repeat for `dev-user` → add to `Developers` group
4. Repeat for `audit-user` → add to `Auditors` group

📸 **Screenshot 05** — All Three Users Created
> **What you should see**: IAM Users list showing admin-user, dev-user, audit-user
> **Verify**: Each user shows the correct group membership

#### AWS CLI (Equivalent)

```bash
# Create users with console access
aws iam create-user --user-name admin-user
aws iam create-login-profile --user-name admin-user \
    --password "Admin@Str0ng!Pass" --no-password-reset-required

aws iam create-user --user-name dev-user
aws iam create-login-profile --user-name dev-user \
    --password "Dev@Str0ng!Pass" --no-password-reset-required

aws iam create-user --user-name audit-user
aws iam create-login-profile --user-name audit-user \
    --password "Audit@Str0ng!Pass" --no-password-reset-required

# Add to groups
aws iam add-user-to-group --user-name admin-user --group-name Admins
aws iam add-user-to-group --user-name dev-user --group-name Developers
aws iam add-user-to-group --user-name audit-user --group-name Auditors
```

🎯 **Interview Insight**: "Should you create IAM users for every employee?"
> **What they're testing**: Modern access management understanding
> **Strong answer**: "For small teams, IAM users with MFA work. For enterprise, use IAM Identity Center (SSO) with your corporate IdP (Active Directory, Okta). No IAM users for human access — only for service accounts when necessary."
> **Weak answer**: "Yes, create one IAM user per person." (Doesn't scale, no SSO)

---

### Step 4 — Create a Custom IAM Policy for Developers

#### AWS Console

1. Navigate to **IAM Console** → **Policies** → **Create policy**
2. Click **JSON** tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowEC2Management",
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*",
                "ec2:RunInstances",
                "ec2:StartInstances",
                "ec2:StopInstances",
                "ec2:TerminateInstances",
                "ec2:CreateTags"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": "ap-south-1"
                }
            }
        },
        {
            "Sid": "AllowS3ReadOnly",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket",
                "s3:ListAllMyBuckets"
            ],
            "Resource": "*"
        },
        {
            "Sid": "AllowCloudWatchRead",
            "Effect": "Allow",
            "Action": [
                "cloudwatch:GetMetricData",
                "cloudwatch:ListMetrics",
                "cloudwatch:GetDashboard",
                "logs:GetLogEvents",
                "logs:DescribeLogGroups"
            ],
            "Resource": "*"
        },
        {
            "Sid": "DenyDeleteProduction",
            "Effect": "Deny",
            "Action": [
                "ec2:TerminateInstances",
                "rds:DeleteDBInstance",
                "s3:DeleteBucket"
            ],
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:ResourceTag/Environment": "production"
                }
            }
        }
    ]
}
```

3. Click **Next**
4. **Policy name**: `DeveloperAccessPolicy`
5. **Description**: `Custom policy for developers: EC2 in Mumbai, S3 read, CloudWatch read, deny production delete`
6. Click **Create policy**

📸 **Screenshot 06** — Custom Policy Created
> **What you should see**: Policy "DeveloperAccessPolicy" with 4 statements visible in the JSON
> **Verify**: Policy ARN shown, created date visible

7. Navigate to **User groups** → **Developers** → **Permissions** → **Add permissions** → **Attach policies**
8. Search and select `DeveloperAccessPolicy` → Click **Attach policies**

📸 **Screenshot 07** — Policy Attached to Developers Group
> **What you should see**: Developers group showing "DeveloperAccessPolicy" under Permissions
> **Verify**: 1 policy attached to the group

#### AWS CLI (Equivalent)

```bash
# Create the policy (save the JSON above to developer-policy.json)
POLICY_ARN=$(aws iam create-policy \
    --policy-name DeveloperAccessPolicy \
    --policy-document file://developer-policy.json \
    --query 'Policy.Arn' --output text)

# Attach to Developers group
aws iam attach-group-policy --group-name Developers \
    --policy-arn $POLICY_ARN
```

🎯 **Interview Insight**: "Explain the Deny statement in your developer policy."
> **What they're testing**: Understanding of explicit Deny
> **Strong answer**: "The Deny statement prevents developers from deleting any resource tagged Environment=production. Explicit Deny ALWAYS overrides Allow, so even if another policy grants TerminateInstances, they still can't delete production resources. This is defense in depth."
> **Weak answer**: "It blocks developers from deleting stuff." (No explanation of why explicit Deny is powerful)

---

### Step 5 — Enable MFA for All Users

#### AWS Console

1. Sign in as **admin-user** using the Console sign-in URL
2. Click **admin-user** (top-right) → **Security credentials**
3. Under **MFA** → **Assign MFA device**
4. Choose **Authenticator app** → Complete setup
5. Repeat for dev-user and audit-user

📸 **Screenshot 08** — MFA Enabled for admin-user
> **What you should see**: MFA device assigned to admin-user
> **Verify**: Virtual MFA device listed with ARN

---

### Step 6 — Test Permissions

#### Test 1: admin-user (should have full access)
1. Sign in as `admin-user`
2. Navigate to **EC2** → Try **Launch instance** → Should succeed
3. Navigate to **S3** → Try **Create bucket** → Should succeed
4. Navigate to **IAM** → Try **Create user** → Should succeed

📸 **Screenshot 09** — admin-user Full Access
> **What you should see**: EC2 dashboard accessible, all actions allowed

#### Test 2: dev-user (restricted access)
1. Sign in as `dev-user`
2. Navigate to **EC2** → **Describe instances** → Should succeed ✅
3. Navigate to **IAM** → **Create user** → Should get **AccessDenied** ❌
4. Navigate to **RDS** → Should get **AccessDenied** ❌

📸 **Screenshot 10** — dev-user AccessDenied on IAM
> **What you should see**: Red error banner: "User: dev-user is not authorized to perform: iam:CreateUser"
> **Verify**: Error message shows the specific action that was denied

#### Test 3: audit-user (read-only)
1. Sign in as `audit-user`
2. Navigate to **EC2** → **Describe instances** → Should succeed ✅
3. Navigate to **EC2** → **Launch instance** → Should get **AccessDenied** ❌
4. Navigate to **S3** → **List buckets** → Should succeed ✅
5. Navigate to **S3** → **Create bucket** → Should get **AccessDenied** ❌

📸 **Screenshot 11** — audit-user Read-Only Verification
> **What you should see**: Can view resources but cannot create/modify/delete

---

### Step 7 — Use the IAM Policy Simulator

#### AWS Console

1. Navigate to **IAM Console** → **Policy Simulator** (left sidebar)
2. Select **dev-user** from the users list
3. Test the following:
   - **Service**: EC2, **Action**: RunInstances → ✅ Allowed
   - **Service**: IAM, **Action**: CreateUser → ❌ Denied
   - **Service**: RDS, **Action**: CreateDBInstance → ❌ Denied
   - **Service**: S3, **Action**: GetObject → ✅ Allowed
   - **Service**: S3, **Action**: DeleteBucket → ❌ Denied (by explicit Deny for production)

📸 **Screenshot 12** — Policy Simulator Results
> **What you should see**: Table showing allowed/denied for each action tested
> **Verify**: Green ✅ for allowed actions, Red ❌ for denied actions

#### AWS CLI (Equivalent)

```bash
# Simulate a policy
aws iam simulate-principal-policy \
    --policy-source-arn arn:aws:iam::123456789012:user/dev-user \
    --action-names "ec2:RunInstances" "iam:CreateUser" "s3:GetObject" \
    --query 'EvaluationResults[*].{Action:EvalActionName,Decision:EvalDecision}'
```

🎯 **Interview Insight**: "A user reports AccessDenied. How do you investigate?"
> **What they're testing**: Troubleshooting methodology
> **Strong answer**: "1) Check which policies are attached (user, group, role). 2) Look for explicit Deny in any policy. 3) Check SCPs if using Organizations. 4) Check resource-based policies. 5) Use IAM Policy Simulator to test. 6) Check CloudTrail for the specific API call and error."
> **Weak answer**: "Give them AdministratorAccess." (Violates least privilege)

---

## Validation

### Test 1 — Verify Groups and Users
```bash
aws iam list-groups --query 'Groups[*].[GroupName]' --output table
aws iam list-users --query 'Users[*].[UserName]' --output table
aws iam get-group --group-name Developers --query 'Users[*].UserName'
```
**Expected**: Three groups, three users, each in correct group

### Test 2 — Verify Policies
```bash
aws iam list-attached-group-policies --group-name Admins
aws iam list-attached-group-policies --group-name Developers
aws iam list-attached-group-policies --group-name Auditors
```
**Expected**: Admins → AdministratorAccess, Developers → DeveloperAccessPolicy, Auditors → ReadOnlyAccess

### Test 3 — Verify MFA
```bash
aws iam list-mfa-devices --user-name admin-user
```
**Expected**: MFA device ARN listed

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Can't create group | Insufficient permissions | Sign in as root or admin user |
| User can't sign in | Wrong console URL | Use the 12-digit account ID sign-in URL |
| MFA setup fails | Time sync issue on phone | Sync phone clock, try again |
| Policy Simulator shows unexpected Allow | Another policy grants access | Check all attached policies (user + group) |
| dev-user can access IAM | Extra policy attached | Verify only DeveloperAccessPolicy on Developers group |

---

## Production Considerations

- **In production**: Use IAM Identity Center (SSO) instead of IAM users for human access
- **Password policy**: Set account-level password policy (14+ chars, rotation every 90 days)
- **Access keys**: Do NOT create access keys for console users. Use roles for programmatic access
- **Credential report**: Run monthly to audit inactive users and unused keys

---

## Interview Questions From This Practical

**Q1: What is the difference between an IAM user and an IAM role?**
A: A user has long-term credentials (password, access keys) and represents a person. A role has no credentials — it's assumed by users, services, or accounts to get temporary credentials via STS. Always prefer roles over users.

**Q2: How does policy evaluation work when a user is in multiple groups?**
A: All policies from all groups are combined (union). If ANY policy has an explicit Deny, it wins regardless of Allows. Effective permissions = union of all Allows minus all explicit Denies.

**Q3: A developer says they need AdministratorAccess. How do you respond?**
A: Ask what specific actions they need. Create a custom policy with only those permissions. Use the principle of least privilege. If they need broad access temporarily, use a time-limited role with session policies.

---

## Cleanup

⚠️ **To avoid issues, clean up in this order:**

```bash
# Remove users from groups
aws iam remove-user-from-group --user-name admin-user --group-name Admins
aws iam remove-user-from-group --user-name dev-user --group-name Developers
aws iam remove-user-from-group --user-name audit-user --group-name Auditors

# Delete login profiles
aws iam delete-login-profile --user-name admin-user
aws iam delete-login-profile --user-name dev-user
aws iam delete-login-profile --user-name audit-user

# Deactivate and delete MFA
aws iam deactivate-mfa-device --user-name admin-user --serial-number arn:aws:iam::123456789012:mfa/admin-user
aws iam delete-virtual-mfa-device --serial-number arn:aws:iam::123456789012:mfa/admin-user

# Delete users
aws iam delete-user --user-name admin-user
aws iam delete-user --user-name dev-user
aws iam delete-user --user-name audit-user

# Detach policies from groups
aws iam detach-group-policy --group-name Admins --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws iam detach-group-policy --group-name Developers --policy-arn $POLICY_ARN
aws iam detach-group-policy --group-name Auditors --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Delete custom policy
aws iam delete-policy --policy-arn $POLICY_ARN

# Delete groups
aws iam delete-group --group-name Admins
aws iam delete-group --group-name Developers
aws iam delete-group --group-name Auditors
```

📸 **Screenshot 13** — Cleanup Verification
> **Verify**: IAM Console shows no users (except your admin), no extra groups, custom policy deleted

---
---

# 🔬 Practical Lab 02 — IAM Role for EC2 (Access S3 Without Access Keys)

## Lab Overview

| Item | Detail |
|------|--------|
| **Difficulty** | Beginner |
| **Duration** | 30 minutes |
| **Cost** | Free tier eligible (t2.micro) |
| **Prerequisites** | Practical 01 completed (understanding of IAM) |
| **Lab Environment** | Environment 1 — Foundation |
| **AWS Region** | ap-south-1 (Mumbai) |

## Business Scenario

> Your development team has been storing AWS access keys on EC2 instances to access S3 buckets. The security team flagged this as a critical risk — if the instance is compromised, the long-term credentials are exposed. You need to implement **IAM roles for EC2** so instances can access S3 without any stored credentials.

> **This is one of the most asked interview questions: "How should EC2 access other AWS services?"**

## Architecture

```mermaid
flowchart LR
    EC2[EC2 Instance<br>t2.micro] -->|Assume Role<br>via Instance Profile| STS[STS<br>Temp Credentials]
    STS -->|Auto-refreshed| EC2
    EC2 -->|s3:ListBucket<br>s3:GetObject| S3[S3 Bucket<br>prod-demo-bucket]
```

## What You Will Learn

1. Why IAM roles are superior to access keys for EC2
2. Create an IAM role with a trust policy for EC2
3. Attach the role to an EC2 instance (Instance Profile)
4. Access S3 from EC2 without any access keys
5. Verify temporary credentials from the instance metadata service

---

### Step 1 — Create an S3 Bucket

#### AWS Console

1. Navigate to **S3 Console** → **Create bucket**
2. Configure:
   - **Bucket name**: `prod-demo-bucket-{your-account-id}` (must be globally unique)
   - **Region**: ap-south-1
   - **Block all public access**: ✅ Enabled (keep default)
   - **Versioning**: Enabled
   - **Encryption**: SSE-S3 (default)
3. Click **Create bucket**
4. Open the bucket → **Upload** → upload a test file (any text file)

📸 **Screenshot 01** — S3 Bucket Created
> **What you should see**: Bucket listed with region ap-south-1, Block Public Access ON
> **Verify**: Bucket name, region, and public access settings are correct

#### AWS CLI

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
BUCKET_NAME="prod-demo-bucket-${ACCOUNT_ID}"

aws s3 mb s3://$BUCKET_NAME --region ap-south-1
aws s3api put-public-access-block --bucket $BUCKET_NAME \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Hello from S3 - this file was accessed via IAM Role" > testfile.txt
aws s3 cp testfile.txt s3://$BUCKET_NAME/
```

---

### Step 2 — Create an IAM Role for EC2

#### AWS Console

1. Navigate to **IAM Console** → **Roles** → **Create role**
2. **Trusted entity type**: AWS service
3. **Use case**: EC2
4. Click **Next**
5. **Attach policies**: Search and select `AmazonS3ReadOnlyAccess`
6. Also attach `AmazonSSMManagedInstanceCore` (for Session Manager access)
7. Click **Next**
8. **Role name**: `EC2-S3-ReadOnly-Role`
9. **Description**: `Allows EC2 to read S3 buckets. Also enables SSM Session Manager.`
10. Click **Create role**

📸 **Screenshot 02** — IAM Role Created
> **What you should see**: Role "EC2-S3-ReadOnly-Role" with 2 policies attached
> **Verify**: Trust relationship shows `ec2.amazonaws.com` as trusted entity

11. Click the role name → **Trust relationships** tab → Verify:

```json
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}
```

📸 **Screenshot 03** — Trust Policy
> **What you should see**: Trust policy JSON showing ec2.amazonaws.com as Principal
> **Verify**: Action is "sts:AssumeRole" and Effect is "Allow"

#### AWS CLI

```bash
# Create trust policy file
cat > ec2-trust-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}
EOF

# Create role
aws iam create-role \
    --role-name EC2-S3-ReadOnly-Role \
    --assume-role-policy-document file://ec2-trust-policy.json

# Attach policies
aws iam attach-role-policy --role-name EC2-S3-ReadOnly-Role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
aws iam attach-role-policy --role-name EC2-S3-ReadOnly-Role \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

# Create instance profile (required to attach role to EC2)
aws iam create-instance-profile --instance-profile-name EC2-S3-ReadOnly-Role
aws iam add-role-to-instance-profile \
    --instance-profile-name EC2-S3-ReadOnly-Role \
    --role-name EC2-S3-ReadOnly-Role
```

🎯 **Interview Insight**: "What is the difference between an IAM Role and an Instance Profile?"
> **What they're testing**: Deep understanding of EC2 + IAM integration
> **Strong answer**: "A role defines permissions (who can assume it and what it can do). An instance profile is a container that holds the role and is what's actually attached to the EC2 instance. The console creates both automatically when you select a role during launch, but via CLI you must create both separately."
> **Weak answer**: "They're the same thing." (They're related but distinct)

---

### Step 3 — Launch EC2 with IAM Role

#### AWS Console

1. Navigate to **EC2 Console** → **Launch instance**
2. Configure:
   - **Name**: `prod-web-01`
   - **AMI**: Amazon Linux 2023 (Free tier eligible)
   - **Instance type**: t2.micro (Free tier)
   - **Key pair**: Proceed without a key pair (we'll use SSM)
   - **Network settings** → Edit:
     - **VPC**: Default VPC (or your prod-vpc if Practical 06 is done)
     - **Auto-assign public IP**: Enable (for this lab only)
     - **Security group**: Create new → `prod-ec2-lab-sg`
       - ❌ Remove SSH (port 22) rule — we use SSM, not SSH!
       - Add HTTP (port 80) from anywhere
   - **Advanced details**:
     - **IAM instance profile**: Select `EC2-S3-ReadOnly-Role`
     - **Metadata version**: V2 only (IMDSv2) ← important for security
3. Click **Launch instance**

📸 **Screenshot 04** — Instance Launch Configuration
> **What you should see**: Launch summary showing t2.micro, Amazon Linux 2023, IAM profile "EC2-S3-ReadOnly-Role"
> **Verify**: No key pair selected, IAM profile is set, IMDSv2 selected

📸 **Screenshot 05** — Instance Running
> **What you should see**: Instance "prod-web-01" in "Running" state
> **Verify**: IAM role column shows "EC2-S3-ReadOnly-Role"

#### AWS CLI

```bash
# Get latest Amazon Linux 2023 AMI
AMI_ID=$(aws ssm get-parameters-by-path \
    --path /aws/service/ami-amazon-linux-latest \
    --query "Parameters[?contains(Name,'al2023-ami-kernel-default-x86_64')].Value" \
    --output text)

# Launch instance
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t2.micro \
    --iam-instance-profile Name=EC2-S3-ReadOnly-Role \
    --metadata-options "HttpTokens=required,HttpEndpoint=enabled" \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=prod-web-01}]' \
    --query 'Instances[0].InstanceId' --output text)

echo "Instance launched: $INSTANCE_ID"
```

---

### Step 4 — Connect via SSM and Access S3

#### AWS Console

1. Navigate to **EC2 Console** → **Instances** → Select `prod-web-01`
2. Click **Connect** → **Session Manager** tab → Click **Connect**
3. A terminal opens in your browser (no SSH, no key pair needed!)

📸 **Screenshot 06** — Session Manager Connected
> **What you should see**: Terminal prompt showing `sh-5.2$` or `bash-5.2$`
> **Verify**: Connected without SSH key pair or port 22

4. Run these commands in the Session Manager terminal:

```bash
# Verify who you are — should show the EC2 role
aws sts get-caller-identity
```

📸 **Screenshot 07** — EC2 Identity Check
> **What you should see**: ARN showing `assumed-role/EC2-S3-ReadOnly-Role/i-0xxxx`
> **Verify**: The role name "EC2-S3-ReadOnly-Role" appears in the ARN
> **⚠️ If you see root or a user ARN**: The IAM role is not properly attached

```bash
# List S3 buckets — should work (S3 read access)
aws s3 ls

# Download the test file — should work
aws s3 cp s3://prod-demo-bucket-YOUR-ACCOUNT-ID/testfile.txt .
cat testfile.txt

# Try to upload a file — should FAIL (read-only policy)
echo "test" > upload-test.txt
aws s3 cp upload-test.txt s3://prod-demo-bucket-YOUR-ACCOUNT-ID/
```

📸 **Screenshot 08** — S3 Read Success, Write Denied
> **What you should see**: `aws s3 ls` shows buckets, `cp` download succeeds, `cp` upload shows "AccessDenied"
> **Verify**: Download worked (read), upload failed (write denied = least privilege working!)

🎯 **Interview Insight**: "How does an EC2 instance get AWS credentials without access keys?"
> **What they're testing**: Core AWS security concept
> **Strong answer**: "EC2 uses an Instance Profile (IAM Role). The instance metadata service (IMDS) at 169.254.169.254 provides temporary credentials from STS. These credentials auto-rotate before expiry. No access keys are stored anywhere. Use IMDSv2 (token-required) to prevent SSRF attacks."
> **Weak answer**: "We put the access keys in environment variables." (This is exactly the anti-pattern)

---

### Step 5 — Examine the Temporary Credentials (Advanced)

In the Session Manager terminal:

```bash
# Get a token for IMDSv2
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 300")

# Get the role name
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Get the temporary credentials (will show AccessKeyId, SecretAccessKey, Token, Expiration)
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/iam/security-credentials/EC2-S3-ReadOnly-Role | python3 -m json.tool
```

📸 **Screenshot 09** — Temporary Credentials from IMDS
> **What you should see**: JSON with AccessKeyId (starts with ASIA), SecretAccessKey, Token, and Expiration timestamp
> **Verify**: AccessKeyId starts with `ASIA` (not `AKIA` — ASIA = temporary, AKIA = permanent)
> **Key observation**: Expiration shows these credentials auto-rotate (usually every 6 hours)

🎯 **Interview Insight**: "What is IMDSv2 and why is it important?"
> **What they're testing**: Security depth
> **Strong answer**: "IMDSv1 used a simple GET request — vulnerable to SSRF attacks (an attacker could trick the instance into revealing credentials). IMDSv2 requires a PUT to get a token first, then use the token in subsequent requests. Always enforce IMDSv2 via `HttpTokens=required`."
> **Weak answer**: "I'm not sure what IMDS is." (Critical gap for a DevOps role)

---

## Validation

### Test 1 — Verify Role is Attached
```bash
aws ec2 describe-instances --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn'
```
**Expected**: ARN containing `EC2-S3-ReadOnly-Role`

### Test 2 — Verify S3 Access from Instance
```bash
# From inside the instance via SSM
aws s3 ls s3://prod-demo-bucket-YOUR-ACCOUNT-ID/
```
**Expected**: Lists the testfile.txt

### Test 3 — Verify No Access Keys on Instance
```bash
# From inside the instance
cat ~/.aws/credentials  # Should not exist or be empty
env | grep AWS_ACCESS    # Should show nothing
```
**Expected**: No access keys stored anywhere

📸 **Screenshot 10** — Validation Complete
> **Verify**: Role attached, S3 accessible, no hardcoded credentials

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Session Manager won't connect | Missing AmazonSSMManagedInstanceCore policy | Attach the policy to the role |
| `aws s3 ls` returns nothing | Role doesn't have S3 permission | Verify AmazonS3ReadOnlyAccess is attached |
| `aws sts get-caller-identity` shows root | Role not attached to instance | Re-attach via EC2 console → Actions → Security → Modify IAM role |
| IMDS returns 401 | IMDSv2 required but no token | Use the PUT token request first |
| Instance in "Pending" too long | AMI or subnet issue | Terminate and relaunch |

---

## Production Considerations

- **Never store access keys on EC2** — always use IAM roles
- **Use custom policies** — AmazonS3ReadOnlyAccess is too broad; restrict to specific buckets
- **IMDSv2 only** — block IMDSv1 at the instance level AND via Organization SCP
- **No public IP** — in production, EC2 is in a private subnet with ALB in front
- **No key pairs** — use SSM Session Manager exclusively (auditable, no port 22)

---

## Interview Questions From This Practical

**Q1: Your application on EC2 needs to access S3. How do you configure it?**
A: Create an IAM role with S3 permissions and a trust policy for ec2.amazonaws.com. Attach the role to the instance via an Instance Profile. The application uses the AWS SDK, which automatically retrieves temporary credentials from the instance metadata service. No access keys needed.

**Q2: What happens if the temporary credentials expire?**
A: The AWS SDK and CLI automatically refresh credentials before they expire. The instance metadata service provides new credentials seamlessly. Applications don't need to handle credential rotation.

**Q3: An EC2 instance has an IAM role but `aws s3 ls` returns AccessDenied. Troubleshooting?**
A: 1) `aws sts get-caller-identity` — verify the correct role is assumed. 2) Check the role's policies — does it have s3:ListBucket? 3) Check if there's an S3 bucket policy denying access. 4) Check if there's a VPC endpoint policy restricting access. 5) Check if an SCP is blocking S3 in this region.

---

## Cleanup

⚠️ **Delete resources in this order:**

```bash
# Terminate EC2 instance
aws ec2 terminate-instances --instance-ids $INSTANCE_ID

# Wait for termination
aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID

# Delete S3 bucket
aws s3 rm s3://$BUCKET_NAME --recursive
aws s3 rb s3://$BUCKET_NAME

# Detach policies from role
aws iam detach-role-policy --role-name EC2-S3-ReadOnly-Role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
aws iam detach-role-policy --role-name EC2-S3-ReadOnly-Role \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

# Remove role from instance profile and delete
aws iam remove-role-from-instance-profile \
    --instance-profile-name EC2-S3-ReadOnly-Role \
    --role-name EC2-S3-ReadOnly-Role
aws iam delete-instance-profile --instance-profile-name EC2-S3-ReadOnly-Role
aws iam delete-role --role-name EC2-S3-ReadOnly-Role

# Delete security group (may need to wait for instance termination)
aws ec2 delete-security-group --group-id $SG_ID
```

📸 **Screenshot 11** — Cleanup Complete
> **Verify**: No running instances, no S3 bucket, role deleted from IAM
