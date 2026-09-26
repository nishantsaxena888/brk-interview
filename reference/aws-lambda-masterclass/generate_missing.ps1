# Generate all 10 missing HTML module shells + JS data files

$modules = @(
    @{num=38; name="AWS Certificate Manager (ACM)"; shortName="acm"; icon="🔐"; sdk="boto3.client('acm')"; refs=@("Cert Types","DV, OV, EV","Auto-Renewal","ACM is free","Region","us-east-1 for CloudFront")},
    @{num=39; name="Amazon EC2 Auto Scaling"; shortName="autoscaling"; icon="📈"; sdk="boto3.client('autoscaling')"; refs=@("Launch Template","AMI + instance config","Scaling Policies","Target, Step, Simple","Cooldown","300s default")},
    @{num=40; name="Amazon EFS"; shortName="efs"; icon="📁"; sdk="boto3.client('efs')"; refs=@("Performance","General / Max I/O","Storage Classes","Standard, IA, Archive","Mount Target","One per AZ")},
    @{num=41; name="AWS X-Ray"; shortName="xray"; icon="🔍"; sdk="boto3.client('xray')"; refs=@("Segments","Service-level trace","Subsegments","Downstream calls","Sampling","1 req/s + 5%")},
    @{num=42; name="AWS CodeDeploy"; shortName="codedeploy"; icon="🚀"; sdk="boto3.client('codedeploy')"; refs=@("Deployment Types","In-Place, Blue/Green","AppSpec","Hooks + lifecycle","Rollback","Auto on failure")},
    @{num=43; name="Amazon GuardDuty"; shortName="guardduty"; icon="🛡️"; sdk="boto3.client('guardduty')"; refs=@("Data Sources","VPC Flow, DNS, CloudTrail","Finding Types","Recon, Backdoor, Trojan","Severity","Low, Medium, High")},
    @{num=44; name="Amazon Inspector"; shortName="inspector"; icon="🔎"; sdk="boto3.client('inspector2')"; refs=@("Scan Types","EC2, ECR, Lambda","CVE Database","NVD + vendor feeds","Integration","ECR scan-on-push")},
    @{num=45; name="AWS Security Hub"; shortName="securityhub"; icon="🏛️"; sdk="boto3.client('securityhub')"; refs=@("Standards","FSBP, CIS, PCI-DSS","Findings","ASFF format","Integrations","GuardDuty, Inspector, Config")},
    @{num=46; name="AWS Resource Access Manager"; shortName="ram"; icon="🤝"; sdk="boto3.client('ram')"; refs=@("Shareable","Subnets, TGW, Route53","Principals","Accounts, OUs, Org","No Copy","Resources stay in owner account")},
    @{num=47; name="AWS Cost Explorer and Budgets"; shortName="cost"; icon="💰"; sdk="boto3.client('ce')"; refs=@("Cost Explorer","Usage analysis","Budgets","Alert thresholds","Savings Plans","Committed usage discounts")}
)

foreach ($m in $modules) {
    $num = "{0:D2}" -f $m.num
    
    # Build quick reference HTML
    $refHtml = ""
    for ($i = 0; $i -lt $m.refs.Count; $i += 2) {
        $label = $m.refs[$i]
        $value = $m.refs[$i+1]
        $mb = if ($i -lt $m.refs.Count - 2) { 'margin-bottom:8px;' } else { '' }
        $refHtml += "        <div style=`"$mb`"><strong style=`"color:var(--color-neutral-700);`">$label</strong><br>$value</div>`n"
    }

    # Create HTML
    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Chapter $($m.num): $($m.name)">
  <title>Chapter $($m.num): $($m.name) — AWS Production Masterclass</title>
  <link rel="stylesheet" href="../css/design-system.css">
  <link rel="stylesheet" href="../css/components.css">
  <link rel="stylesheet" href="../css/layout.css">
  <link rel="stylesheet" href="../css/animations.css">
</head>
<body>
  <header class="topbar">
    <div class="topbar-brand">
      <button class="topbar-menu-btn" id="sidebar-toggle" aria-label="Toggle navigation">☰</button>
      <a href="../index.html" class="topbar-logo" style="text-decoration:none;">🚀 Production Masterclass</a>
      <div class="topbar-divider"></div>
      <span class="topbar-title">Chapter $($m.num): $($m.name)</span>
    </div>
    <div class="topbar-actions">
      <div class="topbar-progress">
        <span id="topbar-progress-text">0%</span>
        <div class="topbar-progress-bar">
          <div class="topbar-progress-fill" id="topbar-progress-fill" style="width:0%;"></div>
        </div>
      </div>
    </div>
  </header>
  <div class="app">
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-section-title">Modules</div>
        <ul class="sidebar-nav" id="sidebar-nav"></ul>
      </div>
      <div class="sidebar-footer">
        <a href="../index.html" class="btn btn-sm btn-ghost" style="width:100%;text-decoration:none;color:var(--color-neutral-400);">← Back to Course</a>
      </div>
    </nav>
    <main class="main-content"><div class="lesson-container" id="lesson-content"></div></main>
    <aside class="context-panel" id="context-panel">
      <div class="context-panel-title">On This Page</div>
      <ul class="toc-list" id="toc-list"></ul>
      <hr style="border:none;border-top:1px solid var(--border-color);margin:16px 0;">
      <div class="context-panel-title">Quick Reference</div>
      <div style="font-size:12px;color:var(--color-neutral-500);line-height:1.6;">
$refHtml        <div><strong style="color:var(--color-neutral-700);">SDK Client</strong><br>$($m.sdk)</div>
      </div>
    </aside>
  </div>
  <script src="../js/engine/progress-engine.js"></script>
  <script src="../js/engine/terminal-engine.js"></script>
  <script src="../js/engine/code-editor-engine.js"></script>
  <script src="../js/engine/quiz-engine.js"></script>
  <script src="../js/engine/challenge-engine.js"></script>
  <script src="../js/engine/console-simulator.js"></script>
  <script src="../js/engine/diagram-engine.js"></script>
  <script src="../js/engine/lab-engine.js"></script>
  <script src="../js/engine/command-block.js"></script>
  <script src="../js/engine/lesson-engine.js"></script>
  <script src="../js/data/courses.js"></script>
  <script src="../js/data/module-$num-$($m.shortName).js"></script>
  <script src="../js/engine/lab-popup.js"></script>
  <script src="../js/app.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      app.currentModule = 'module-$num';
      app.initModule(MODULE_$($num)_DATA);
    });
  </script>
</body>
</html>
"@

    $htmlPath = "modules\module-$num.html"
    [System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.Encoding]::UTF8)
    Write-Host "✅ HTML: $htmlPath"
}

Write-Host "`nAll 10 HTML shells created."
