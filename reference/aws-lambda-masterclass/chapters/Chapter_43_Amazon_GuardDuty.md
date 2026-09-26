# Chapter 43 — Amazon GuardDuty

---

## Prerequisite Chapters
- Chapter 01 — AWS IAM (users, roles, policies)
- Chapter 04 — Amazon VPC (VPC Flow Logs, networking)
- Chapter 09 — AWS CloudTrail (API activity logs)
- Chapter 26 — AWS CloudTrail (audit logs)

## Used In Production Practicals
- Practical 04 — Audit (CloudTrail + Config)
- Practical 15 — Flagship Production Architecture (security layer)
- Practical 35 — CloudTrail Audit
- Practical 39 — Enterprise Multi-Account AWS

---

## 1. Learning Objectives

By the end of this chapter, you will be able to:

1. **Explain** what GuardDuty is, how it detects threats, and why it's essential for production.
2. **Enable** GuardDuty and configure data sources (CloudTrail, VPC Flow Logs, DNS logs).
3. **Interpret** findings by type, severity, and recommended actions.
4. **Automate** responses to security threats using EventBridge and Lambda.
5. **Configure** multi-account GuardDuty with AWS Organizations.
6. **Integrate** GuardDuty with Security Hub for centralized security management.
7. **Troubleshoot** common security findings and false positives.
8. **Answer** interview questions about threat detection and security operations.

---

## 2. What is Amazon GuardDuty?

Amazon GuardDuty is an intelligent threat detection service that continuously monitors your AWS accounts, workloads, and data for malicious activity and unauthorized behavior. It uses machine learning, anomaly detection, and integrated threat intelligence to identify threats.

### Key Characteristics
- **Agentless** — no software to install on instances
- **Continuous monitoring** — 24/7 analysis of multiple data sources
- **Machine learning** — identifies anomalous behavior patterns
- **Threat intelligence** — uses AWS and third-party threat feeds
- **One-click enable** — activate with a single API call
- **Multi-account** — centralized monitoring via Organizations

### Data Sources GuardDuty Analyzes

| Source | What It Detects |
|--------|----------------|
| **CloudTrail Management Events** | Unauthorized API calls, unusual IAM activity |
| **CloudTrail S3 Data Events** | Suspicious S3 access patterns |
| **VPC Flow Logs** | Unusual network traffic, port scanning, crypto mining |
| **DNS Query Logs** | Communication with known malicious domains |
| **EKS Audit Logs** | Kubernetes-level threats (optional) |
| **Lambda Network Activity** | Suspicious Lambda network behavior (optional) |
| **RDS Login Activity** | Anomalous database login attempts (optional) |

---

## 3. Why Do We Need It?

### Without GuardDuty
```
Threat happens → Nobody knows → Data breach discovered weeks later
  - Compromised IAM keys used for 30 days
  - EC2 instance mining cryptocurrency for 2 weeks
  - S3 bucket exfiltrated without detection
```

### With GuardDuty
```
Threat happens → GuardDuty detects within minutes → Alert sent → Auto-response triggered
  - Compromised IAM key detected → key disabled automatically
  - Crypto mining detected → instance isolated
  - Unusual S3 access detected → alert sent to security team
```

---

## 4. Real-World Production Use Cases

### 1. Compromised IAM Credentials
An employee's access key is leaked on GitHub. GuardDuty detects API calls from unusual IP addresses and geographic locations. Finding: `UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration.OutsideAWS`.

### 2. Cryptocurrency Mining
An EC2 instance is compromised and starts mining cryptocurrency. GuardDuty detects: unusual CPU patterns via CloudWatch, DNS queries to mining pools, and outbound traffic to known mining IPs. Finding: `CryptoCurrency:EC2/BitcoinTool.B!DNS`.

### 3. Data Exfiltration
An attacker downloads large amounts of data from S3. GuardDuty detects unusual S3 GetObject patterns (volume, timing, IP). Finding: `Exfiltration:S3/MaliciousIPCaller`.

### 4. Port Scanning
An EC2 instance performs port scanning on internal resources. GuardDuty detects via VPC Flow Logs. Finding: `Recon:EC2/PortProbeUnprotectedPort`.

### 5. Brute Force Attack
Multiple failed SSH login attempts detected against EC2 instances. Finding: `UnauthorizedAccess:EC2/SSHBruteForce`.

---

## 5. Core Concepts

### Finding Types

GuardDuty findings are categorized by:

| Category | Examples |
|----------|---------|
| **Reconnaissance** | Port scanning, API enumeration |
| **Instance Compromise** | Crypto mining, malware, C&C communication |
| **Account Compromise** | Unusual API calls, credential theft |
| **Bucket Compromise** | S3 data access from malicious IPs |
| **Kubernetes** | Suspicious pod activity, privilege escalation |

### Finding Severity

| Severity | Range | Action |
|----------|-------|--------|
| **Low** | 1.0-3.9 | Review and monitor |
| **Medium** | 4.0-6.9 | Investigate promptly |
| **High** | 7.0-8.9 | Immediate response required |
| **Critical** | 9.0-10.0 | Emergency — potential active breach |

### Finding Format
```json
{
    "Type": "UnauthorizedAccess:IAMUser/MaliciousIPCaller",
    "Severity": 8.0,
    "Title": "API was invoked from a known malicious IP address",
    "Description": "An API was invoked from IP 198.51.100.1...",
    "Resource": {
        "ResourceType": "AccessKey",
        "AccessKeyDetails": {
            "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
            "UserName": "admin-user"
        }
    },
    "Service": {
        "Action": {
            "ActionType": "AWS_API_CALL",
            "AwsApiCallAction": {
                "Api": "DescribeInstances",
                "ServiceName": "ec2.amazonaws.com",
                "RemoteIpDetails": {
                    "IpAddressV4": "198.51.100.1",
                    "Country": {"CountryName": "Unknown"}
                }
            }
        }
    }
}
```

---

## 6. Architecture

### GuardDuty Architecture

```mermaid
flowchart TD
    subgraph Sources["Data Sources"]
        CT[CloudTrail<br>Management + S3 Events]
        VPC[VPC Flow Logs]
        DNS[DNS Query Logs]
    end
    
    subgraph GD["Amazon GuardDuty"]
        ML[Machine Learning<br>Anomaly Detection]
        TI[Threat Intelligence<br>AWS + 3rd Party]
        Rules[Detection Rules]
    end
    
    subgraph Response["Automated Response"]
        EB[EventBridge Rule]
        Lambda[Lambda<br>Auto-Remediation]
        SNS[SNS<br>Alert Notification]
        SH[Security Hub<br>Centralized View]
    end
    
    Sources --> GD
    GD -->|Findings| EB
    EB --> Lambda
    EB --> SNS
    GD --> SH
    
    Lambda -->|Disable IAM Key| IAM[IAM]
    Lambda -->|Isolate Instance| EC2[EC2 SG]
    Lambda -->|Block IP| WAF[WAF]
```

### Multi-Account Architecture
```
Management Account (Organizations)
    ↓
GuardDuty Administrator Account (Delegated)
    ├── Member Account 1 (Production)
    ├── Member Account 2 (Staging)
    ├── Member Account 3 (Development)
    └── Member Account 4 (Shared Services)
    
All findings aggregated in Administrator Account
```

---

## 7. Important Components

### 1. Detector
The GuardDuty detector is the primary resource. One detector per region per account:
```bash
# Enable GuardDuty
aws guardduty create-detector --enable --finding-publishing-frequency FIFTEEN_MINUTES
```

### 2. Trusted IP Lists
IPs that should never generate findings (your corporate IPs, VPN endpoints):
```bash
aws guardduty create-ip-set \
    --detector-id $DETECTOR_ID \
    --name "Corporate-IPs" \
    --format TXT \
    --location s3://my-bucket/trusted-ips.txt \
    --activate
```

### 3. Threat Intel Lists
Custom threat intelligence feeds:
```bash
aws guardduty create-threat-intel-set \
    --detector-id $DETECTOR_ID \
    --name "Custom-Threats" \
    --format TXT \
    --location s3://my-bucket/threat-ips.txt \
    --activate
```

### 4. Suppression Rules
Automatically archive findings that match specific criteria (reduce noise):
```bash
aws guardduty create-filter \
    --detector-id $DETECTOR_ID \
    --name "suppress-dev-findings" \
    --action ARCHIVE \
    --finding-criteria '{
        "Criterion": {
            "resource.instanceDetails.tags.value": {
                "Equals": ["development"]
            }
        }
    }'
```

---

## 8. How It Works

### Detection Process
```
1. GuardDuty continuously ingests data sources (CloudTrail, VPC Flow Logs, DNS)
2. Machine learning models analyze behavioral baselines
3. Threat intelligence feeds checked against network activity
4. Anomaly detection identifies deviations from normal patterns
5. Finding generated with type, severity, and details
6. Finding published to GuardDuty console and EventBridge
7. EventBridge triggers automated response (Lambda, SNS)
```

### What GuardDuty Does NOT Do
- Does NOT prevent attacks (it detects and alerts)
- Does NOT modify your resources (you configure auto-remediation)
- Does NOT read your data content (only metadata and flow data)
- Does NOT require agents on instances

---

## 9. AWS Console Walkthrough

### Step 1 — Enable GuardDuty
1. Navigate to **GuardDuty Console** → **Get Started**
2. Review data sources that will be analyzed
3. Click **Enable GuardDuty**
4. Done — GuardDuty starts analyzing immediately

### Step 2 — Review Findings
1. Navigate to **GuardDuty Console** → **Findings**
2. Sort by **Severity** (High first)
3. Click on a finding to see:
   - Finding type and description
   - Affected resource (IAM user, EC2 instance, S3 bucket)
   - Action details (API call, network connection)
   - Recommended remediation

### Step 3 — Generate Sample Findings (for testing)
1. Navigate to **GuardDuty Console** → **Settings**
2. Click **Generate sample findings**
3. Review sample findings to understand the format

---

## 10. AWS CLI Commands

### Enable GuardDuty
```bash
DETECTOR_ID=$(aws guardduty create-detector \
    --enable \
    --finding-publishing-frequency FIFTEEN_MINUTES \
    --query 'DetectorId' --output text)
echo "Detector ID: $DETECTOR_ID"
```

### List Findings
```bash
aws guardduty list-findings \
    --detector-id $DETECTOR_ID \
    --finding-criteria '{
        "Criterion": {
            "severity": {"Gte": 7}
        }
    }' \
    --sort-criteria '{"AttributeName": "severity", "OrderBy": "DESC"}'
```

### Get Finding Details
```bash
aws guardduty get-findings \
    --detector-id $DETECTOR_ID \
    --finding-ids "abc123def456" \
    --query 'Findings[0].{Type:Type,Severity:Severity,Title:Title,Description:Description}'
```

### Archive a Finding (Mark as reviewed)
```bash
aws guardduty archive-findings \
    --detector-id $DETECTOR_ID \
    --finding-ids "abc123def456"
```

### Generate Sample Findings
```bash
aws guardduty create-sample-findings --detector-id $DETECTOR_ID
```

---

## 11. Hands-On Practical

### Practical: Enable GuardDuty with Automated Response

#### Objective
Enable GuardDuty and configure automated response to automatically disable compromised IAM access keys.

#### Architecture
```mermaid
flowchart LR
    GD[GuardDuty] -->|Finding| EB[EventBridge]
    EB -->|High Severity| Lambda[Lambda<br>Auto-Remediate]
    EB -->|All Findings| SNS[SNS<br>Security Team]
    Lambda -->|Disable Key| IAM[IAM]
```

#### Step 1 — Enable GuardDuty
```bash
aws guardduty create-detector --enable
```

#### Step 2 — Create Auto-Remediation Lambda
```python
# lambda_function.py
import boto3
import json

iam = boto3.client('iam')

def lambda_handler(event, context):
    detail = event['detail']
    finding_type = detail['type']
    severity = detail['severity']
    
    # Handle compromised IAM credentials
    if 'IAMUser' in finding_type and severity >= 7:
        access_key_id = detail['resource']['accessKeyDetails']['accessKeyId']
        user_name = detail['resource']['accessKeyDetails']['userName']
        
        # Disable the compromised access key
        iam.update_access_key(
            UserName=user_name,
            AccessKeyId=access_key_id,
            Status='Inactive'
        )
        
        print(f"DISABLED access key {access_key_id} for user {user_name}")
        return {'action': 'key_disabled', 'user': user_name}
    
    return {'action': 'no_action', 'finding_type': finding_type}
```

#### Step 3 — Create EventBridge Rule
```bash
aws events put-rule \
    --name "guardduty-high-severity" \
    --event-pattern '{
        "source": ["aws.guardduty"],
        "detail-type": ["GuardDuty Finding"],
        "detail": {
            "severity": [{"numeric": [">=", 7]}]
        }
    }'

aws events put-targets \
    --rule "guardduty-high-severity" \
    --targets '[
        {"Id": "auto-remediate", "Arn": "'$LAMBDA_ARN'"},
        {"Id": "notify-security", "Arn": "'$SNS_ARN'"}
    ]'
```

#### Step 4 — Test with Sample Findings
```bash
aws guardduty create-sample-findings --detector-id $DETECTOR_ID
```

#### Validation
- Check GuardDuty console for sample findings
- Check Lambda CloudWatch Logs for remediation actions
- Check SNS for email notifications

---

## 12. Production Architecture

### Enterprise Security Monitoring

```mermaid
flowchart TD
    subgraph Accounts["AWS Accounts"]
        Prod[Production]
        Stage[Staging]
        Dev[Development]
    end
    
    subgraph Security["Security Account (GuardDuty Admin)"]
        GD[GuardDuty<br>Aggregated Findings]
        SH[Security Hub]
        Dashboard[Security Dashboard]
    end
    
    subgraph Response["Incident Response"]
        EB[EventBridge]
        Lambda_Remediate[Lambda<br>Auto-Remediate]
        Lambda_Ticket[Lambda<br>Create Ticket]
        SNS_PD[SNS → PagerDuty]
    end
    
    Accounts -->|Findings| GD
    GD --> SH
    GD --> EB
    SH --> Dashboard
    EB -->|Critical| Lambda_Remediate
    EB -->|High| Lambda_Ticket
    EB -->|All| SNS_PD
```

---

## 13. Security Best Practices

1. **Enable in every region** — attackers may use regions you don't actively use
2. **Enable all data sources** — CloudTrail, VPC Flow Logs, DNS, S3 data events
3. **Use Organizations integration** — centralized management and visibility
4. **Configure trusted IP lists** — reduce false positives from known IPs
5. **Don't ignore findings** — review all findings, even low severity
6. **Automate responses** — use EventBridge + Lambda for critical findings
7. **Regular review** — weekly review of medium findings, daily for high/critical
8. **Suppression rules** — suppress known false positives, not inconvenient truths
9. **Export findings** — send to S3 for long-term retention and compliance
10. **Integrate with Security Hub** — unified security posture view

---

## 14. High Availability

- GuardDuty is a **fully managed, regional service**
- No infrastructure to manage — AWS handles availability
- Enable in **every region** for comprehensive coverage
- Findings are stored within the region
- Multi-account setup via Organizations provides centralized monitoring

---

## 15. Scalability

- GuardDuty scales automatically with your AWS environment
- No limits on the number of accounts, instances, or data sources
- Processing capacity scales with the volume of events
- No performance impact on your applications

---

## 16. Monitoring & Observability

### CloudWatch Metrics
```bash
# GuardDuty doesn't publish CloudWatch metrics directly
# Monitor via EventBridge finding volume

# Count findings per day via EventBridge → CloudWatch custom metric
```

### Finding Export to S3
```bash
aws guardduty create-publishing-destination \
    --detector-id $DETECTOR_ID \
    --destination-type S3 \
    --destination-properties '{
        "DestinationArn": "arn:aws:s3:::my-guardduty-findings"
    }'
```

---

## 17. Cost Optimization

| Data Source | Pricing |
|------------|---------|
| CloudTrail Management Events | Per million events |
| VPC Flow Logs | Per GB analyzed |
| DNS Query Logs | Per million queries |
| S3 Data Events | Per million events |

### Cost Tips
1. **Start with core sources** — CloudTrail + VPC Flow Logs + DNS (free tier first)
2. **30-day free trial** — evaluate before committing
3. **Suppression rules** — reduce noise but don't impact security
4. **Monitor costs** — check GuardDuty usage statistics in console
5. **Regional optimization** — higher cost in regions with more resources (expected)

---

## 18. Disaster Recovery

- GuardDuty findings are regional — enable in DR region
- Multi-region enablement ensures DR region is already monitored
- No backup/restore needed — GuardDuty is stateless
- Finding history retained for 90 days (export to S3 for longer)

---

## 19. Troubleshooting

### Problem 1: Too Many False Positives
**Fix**: Create trusted IP lists for corporate/VPN IPs. Create suppression rules for known safe patterns. Review and tune gradually.

### Problem 2: No Findings Generated
**Check**: 1) Detector is enabled. 2) Data sources are configured. 3) There may genuinely be no threats (generate sample findings to verify).

### Problem 3: Finding for Known Safe Activity
**Fix**: Add the IP to trusted IP list. Create a suppression rule for the specific finding type. Do NOT disable GuardDuty.

---

## 20. Common Production Problems

| # | Problem | Root Cause | Prevention |
|---|---------|------------|------------|
| 1 | False positives from CI/CD | Automated tools trigger anomaly detection | Add CI/CD IPs to trusted list |
| 2 | Findings ignored | Alert fatigue | Automate response for critical, review weekly |
| 3 | Not enabled in all regions | Partial coverage | Enable in all regions via Organizations |
| 4 | No response plan | Findings detected but no action | Create runbooks for each finding type |
| 5 | Cost surprise | Large VPC Flow Log volume | Monitor usage statistics |

---

## 21. Real-World Scenario

### Scenario: Compromised Access Key Detection

**Event**: A developer accidentally commits an IAM access key to a public GitHub repository.

**GuardDuty Detection** (within 15 minutes):
1. Finding: `UnauthorizedAccess:IAMUser/MaliciousIPCaller` (Severity 8)
2. An API call `DescribeInstances` was made from IP 203.0.113.50 (Tor exit node)
3. The access key `AKIAEXAMPLE123` belonging to user `dev-user` was used

**Automated Response**:
1. EventBridge triggers Lambda
2. Lambda disables the access key
3. Lambda creates a Jira ticket for security team
4. SNS sends alert to PagerDuty

**Manual Investigation**:
1. Review all API calls made with the compromised key (CloudTrail)
2. Check if any resources were created/modified
3. Rotate all credentials for the affected user
4. Review and revoke any unauthorized changes

---

## 22. Interview Questions

### Basic Questions (10)

**Q1: What is Amazon GuardDuty?**
A: GuardDuty is a managed threat detection service that continuously monitors AWS accounts using CloudTrail, VPC Flow Logs, and DNS logs to detect malicious activity and unauthorized behavior using ML and threat intelligence.

**Q2: What data sources does GuardDuty analyze?**
A: CloudTrail Management Events, CloudTrail S3 Data Events, VPC Flow Logs, DNS Query Logs, and optionally EKS Audit Logs, Lambda Network Activity, and RDS Login Activity.

**Q3: Does GuardDuty require agents on EC2 instances?**
A: No. GuardDuty is agentless. It analyzes data sources at the AWS account level without any software on instances.

**Q4: What is a GuardDuty finding?**
A: A finding is a security alert generated when GuardDuty detects suspicious activity. It includes the finding type, severity (1-10), affected resource, action details, and recommended remediation.

**Q5: What are the severity levels?**
A: Low (1-3.9), Medium (4-6.9), High (7-8.9), Critical (9-10). High and Critical require immediate investigation and response.

**Q6: How do you automate responses to GuardDuty findings?**
A: Use EventBridge rules to match findings by severity or type, then trigger Lambda functions for auto-remediation (disable keys, isolate instances, block IPs) and SNS for notifications.

**Q7: Can GuardDuty detect crypto mining?**
A: Yes. GuardDuty detects cryptocurrency mining by identifying DNS queries to mining pools, network traffic to known mining endpoints, and unusual compute patterns.

**Q8: How long are findings retained?**
A: 90 days in the GuardDuty console. Export to S3 for longer retention.

**Q9: Is GuardDuty a regional service?**
A: Yes. Enable it in every region for complete coverage. Findings are stored and managed per region.

**Q10: How much does GuardDuty cost?**
A: Based on data volume analyzed: per million CloudTrail events, per GB of VPC Flow Logs, per million DNS queries. 30-day free trial available.

### Intermediate Questions (10)

**Q11: How do you reduce false positives?**
A: Create trusted IP lists for known safe IPs (corporate, VPN). Create suppression rules for specific finding types from known safe sources. Review and tune regularly.

**Q12: How does GuardDuty work in a multi-account setup?**
A: Delegate a GuardDuty administrator account via Organizations. The admin account sees aggregated findings from all member accounts. Can configure, enable, and manage GuardDuty across all accounts centrally.

**Q13: What's the difference between GuardDuty and AWS Config?**
A: GuardDuty detects threats and malicious activity (behavioral analysis). Config evaluates resource configurations against compliance rules. They're complementary — Config for compliance, GuardDuty for threats.

**Q14: How does GuardDuty detect compromised instances?**
A: Analyzes VPC Flow Logs for communication with known C&C servers, crypto mining pools, unusual outbound traffic patterns. Analyzes DNS logs for queries to malicious domains.

**Q15: What is a suppression rule?**
A: A filter that automatically archives findings matching specific criteria. Used to reduce noise from known safe patterns without disabling detection entirely.

**Q16: How does GuardDuty integrate with Security Hub?**
A: GuardDuty automatically sends findings to Security Hub. Security Hub aggregates findings from GuardDuty, Inspector, Config, and third-party tools into a unified view.

**Q17: Can GuardDuty detect insider threats?**
A: Yes. It detects unusual IAM API patterns, data access from unusual locations, and privilege escalation attempts that may indicate insider threats.

**Q18: What happens if I disable GuardDuty?**
A: All findings are deleted after 90 days. Detection stops. You must re-enable and it re-learns baselines. Never disable in production — use suppression rules instead.

**Q19: How quickly does GuardDuty detect threats?**
A: Typically within minutes for high-severity threats. Finding publishing frequency can be set to 15 minutes, 1 hour, or 6 hours.

**Q20: What is a trusted IP list?**
A: A list of IP addresses that GuardDuty should never generate findings for. Used for corporate IPs, VPN endpoints, and known safe third-party IPs.

### Advanced Questions (10)

**Q21: Design a security monitoring architecture for a 50-account enterprise.**
A: Enable GuardDuty in all regions across all accounts via Organizations. Delegate admin to a dedicated security account. Aggregate findings in Security Hub. EventBridge forwards critical findings to PagerDuty. Lambda auto-remediates high-severity findings (disable keys, isolate instances). Export all findings to S3 in log-archive account for compliance retention.

**Q22: A GuardDuty finding shows SSH brute force on an EC2 instance. Incident response plan?**
A: 1) Immediately: check if any logins succeeded (CloudTrail, VPC Flow Logs). 2) If compromised: isolate instance (restrict SG to deny all traffic). 3) Create forensic snapshot of EBS. 4) Replace the instance from known-good AMI. 5) Investigate: source IP, timeline, any lateral movement. 6) Prevention: use SSM Session Manager instead of SSH, disable password auth.

**Q23: How do you detect data exfiltration from S3?**
A: Enable S3 Data Events in GuardDuty. It detects: unusual GetObject patterns, access from malicious IPs, access from unusual geographic locations, Tor exit node access, anonymous access. Finding: `Exfiltration:S3/MaliciousIPCaller` or `Discovery:S3/MaliciousIPCaller.Custom`.

**Q24: Your GuardDuty is generating 500 findings/day. Most are false positives. How do you manage?**
A: 1) Categorize findings by type and source. 2) Create trusted IP lists for known safe IPs. 3) Create suppression rules for verified false positive patterns. 4) Automate triage: Lambda categorizes and routes findings. 5) Review suppression rules monthly. 6) Focus human review on high/critical severity only.

**Q25: How would you implement automated incident response for a compromised EC2 instance?**
A: EventBridge rule matches `Backdoor:EC2/*` or `CryptoCurrency:EC2/*`. Lambda function: 1) Creates EBS snapshot for forensics. 2) Changes security group to "isolated" (no ingress/egress). 3) Creates SNS notification. 4) Creates Jira ticket. 5) Tags instance as "COMPROMISED". Instance is isolated but preserved for investigation.

**Q26: GuardDuty detects API calls from an unusual country. But it's your developer on vacation. How do you handle?**
A: Don't suppress by country (too broad). Instead: 1) Verify with the developer. 2) If legitimate, add their temporary IP to trusted list (with expiry). 3) Consider using VPN requirement for production API access. 4) Implement conditional IAM policies requiring VPN for sensitive actions.

**Q27: How do you correlate GuardDuty findings with CloudTrail logs?**
A: GuardDuty findings include the IAM principal and API action. Use the access key ID, timestamp, and source IP to query CloudTrail: `aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=AKIAEXAMPLE`. This shows all actions taken by the compromised credential.

**Q28: What is the difference between GuardDuty and Amazon Inspector?**
A: GuardDuty monitors account activity and network traffic for threats (runtime detection). Inspector scans EC2 instances and container images for software vulnerabilities (CVEs). Both feed into Security Hub. They're complementary: Inspector for vulnerabilities, GuardDuty for threats.

**Q29: Design a GuardDuty alerting strategy with different response times.**
A: Critical (9-10): Auto-remediate + page on-call (< 5 min response). High (7-8.9): Auto-remediate + create urgent ticket (< 30 min response). Medium (4-6.9): Create ticket for next business day review. Low (1-3.9): Aggregate weekly report. False positives: suppress and review monthly.

**Q30: How do you test your GuardDuty detection and response pipeline?**
A: 1) Generate sample findings: `aws guardduty create-sample-findings`. 2) Verify EventBridge rules trigger. 3) Verify Lambda executes correctly. 4) Verify SNS notifications received. 5) Run tabletop exercises with security team. 6) Use AWS GuardDuty Tester tool to generate realistic test findings.

### Scenario-Based Questions (10)

**Q31: GuardDuty alerts: "UnauthorizedAccess:IAMUser/ConsoleLogin" from a country your company doesn't operate in. What do you do?**
A: Immediately disable the IAM user's console access and access keys. Check CloudTrail for all actions taken during the session. Reset the user's password and MFA. Investigate if any resources were created or modified. Determine how credentials were compromised (phishing, key leak).

**Q32: You see a finding "Recon:EC2/PortProbeUnprotectedPort" for a development instance. Is this critical?**
A: Medium severity. Check if the port should be open. If the instance has unnecessary ports exposed (22, 3389) to 0.0.0.0/0, close them. If it's expected traffic (public web server on port 80), it may be a false positive. Still review security group rules and restrict access.

**Q33: GuardDuty detects DNS queries to a crypto mining domain from an EC2 instance. Your incident response?**
A: 1) Isolate instance immediately (change SG to deny all). 2) Check if it's part of an ASG (it'll be replaced). 3) Create EBS snapshot for forensics. 4) Investigate: how was the instance compromised? Check for recent deployments, SSH access, user data. 5) Patch the vulnerability. 6) Replace the instance.

**Q34: Multiple accounts show the same finding type simultaneously. What does this indicate?**
A: Likely a coordinated attack or a shared vulnerability. Check if all accounts use the same IAM configuration. Check for shared credentials or roles. This could be a supply chain attack (compromised shared resource). Escalate to security incident response immediately.

**Q35: GuardDuty is enabled but you've received zero findings in 30 days. Is that normal?**
A: Possibly normal if your environment is small and well-secured. Verify: 1) Detector is active and enabled. 2) Data sources are configured. 3) Generate sample findings to test the pipeline. 4) Check suppression rules aren't overly broad. 5) Verify CloudTrail and VPC Flow Logs are active.

**Q36: Your CEO asks: "Are we secure?" How do you use GuardDuty data to answer?**
A: 1) Show finding trends over time (decreasing = improving). 2) Show average time to detection and response. 3) Show finding severity distribution. 4) Show coverage (all accounts, all regions). 5) Reference Security Hub compliance score. 6) Important: "Secure" is relative — share the posture, not a binary answer.

**Q37: GuardDuty costs $2,000/month. CFO wants to reduce it. What do you recommend?**
A: 1) Check which data source contributes most cost (usually VPC Flow Logs). 2) Verify all regions need GuardDuty (they do for security). 3) Optimize VPC Flow Log volume (review if chatty services create excessive logs). 4) Do NOT reduce GuardDuty coverage — the cost of a breach far exceeds $2,000/month. 5) Present cost-benefit analysis to CFO.

**Q38: An EC2 instance is communicating with a known Command & Control server. Immediate actions?**
A: 1) Isolate the instance (deny all SG rules). 2) Do NOT terminate (preserve evidence). 3) Snapshot EBS volumes. 4) Check for lateral movement (other instances communicating with same IP). 5) Investigate compromise vector. 6) Engage incident response team. 7) After investigation, terminate and replace.

**Q39: How do you handle a finding that's not in your remediation runbook?**
A: 1) Don't ignore it. 2) Read the GuardDuty documentation for the specific finding type. 3) Assess severity and potential impact. 4) Investigate the affected resource. 5) Create a remediation runbook for this finding type. 6) Add to your detection and response procedures for future.

**Q40: Your security team wants real-time notifications for any finding. Is this a good idea?**
A: No — alert fatigue will cause them to ignore all alerts. Tier the notifications: Critical → PagerDuty/call (immediate). High → Slack alert + ticket (30 min response). Medium → Daily digest email. Low → Weekly report. Focus human attention on the highest severity findings.

---

## 23. Scenario-Based Interview Questions

*(Covered in section 22 above — Q31 through Q40)*

---

## 24. Common Mistakes

1. **Only enabling in one region** — attackers use regions you don't monitor
2. **Ignoring low-severity findings** — they may indicate reconnaissance before an attack
3. **Suppressing too aggressively** — suppressing valid findings reduces security
4. **No automated response** — detection without response is just logging
5. **Not using trusted IP lists** — causes excessive false positives from known safe IPs
6. **Disabling GuardDuty** — never disable, use suppression rules instead
7. **No incident response plan** — knowing about a threat but not knowing what to do
8. **Not exporting findings** — findings only retained 90 days in console
9. **Single-account setup** — use Organizations for multi-account visibility
10. **No regular review** — findings pile up and real threats get buried

---

## 25. Production Checklist

- [ ] GuardDuty enabled in all regions
- [ ] All data sources configured (CloudTrail, VPC Flow Logs, DNS)
- [ ] Multi-account setup via Organizations
- [ ] Trusted IP list configured (corporate, VPN IPs)
- [ ] EventBridge rules for high/critical severity findings
- [ ] Lambda auto-remediation for critical findings (disable keys, isolate instances)
- [ ] SNS notifications configured (PagerDuty/Slack integration)
- [ ] Findings exported to S3 for long-term retention
- [ ] Security Hub integration enabled
- [ ] Suppression rules for known false positives
- [ ] Incident response runbooks for top 10 finding types
- [ ] Weekly finding review scheduled
- [ ] Sample findings tested end-to-end
- [ ] Finding publishing frequency set to 15 minutes

---

## 26. Chapter Summary

Amazon GuardDuty is essential for production security — it detects threats you would never find manually. Key takeaways:

1. **Enable everywhere** — all accounts, all regions, all data sources
2. **Agentless** — no software to install, just enable the service
3. **ML + threat intelligence** — detects anomalies and known threat patterns
4. **Automate responses** — EventBridge + Lambda for critical findings
5. **Trusted IP lists** — reduce false positives from known safe sources
6. **Don't suppress real findings** — only suppress verified false positives
7. **Multi-account via Organizations** — centralized security monitoring
8. **Feeds into Security Hub** — unified security posture view
9. **Detection without response is useless** — build runbooks and automation
10. **Cost of GuardDuty << cost of a breach** — never compromise on threat detection

GuardDuty transforms your security from "we'll find out about breaches in the news" to "we detect and respond to threats in minutes."

---
---

# 🔬 Practical Lab 48 — GuardDuty Threat Detection

## Lab Overview
| Item | Detail |
|------|--------|
| **Difficulty** | Beginner |
| **Duration** | 15 minutes |
| **Cost** | 30-day free trial |
| **Prerequisites** | AWS account |
| **Lab Environment** | Environment 11 — Security Ops |

### Step 1 — Enable GuardDuty
1. **GuardDuty** → **Get Started** → **Enable GuardDuty**

📸 **Screenshot 01** — GuardDuty Enabled
> **Verify**: Dashboard shows "GuardDuty is enabled"

### Step 2 — Generate Sample Findings
1. **Settings** → **Generate sample findings**

📸 **Screenshot 02** — Sample Findings Generated
> **What you should see**: Findings like "UnauthorizedAccess:EC2/RDPBruteForce", severity levels

### Step 3 — Investigate a Finding
1. Click a HIGH severity finding → Review details

📸 **Screenshot 03** — Finding Details
> **What you should see**: Actor info, resource info, action details, recommendation

🎯 **Interview Insight**: "What does GuardDuty analyze?"
> **Strong answer**: "VPC Flow Logs, DNS logs, CloudTrail events, and S3 data events. Uses ML and threat intelligence to detect: unauthorized access, crypto mining, compromised instances, data exfiltration, privilege escalation. No agents to install — fully managed."
