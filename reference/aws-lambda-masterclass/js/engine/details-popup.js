/**
 * ============================================================
 * DETAILS POPUP — Renders the raw chapter Markdown
 * ============================================================
 */
(function () {
  'use strict';

  const MD_MAP = {
    "module-15": "Chapter_15_Amazon_ECR.md",
    "module-04": "Chapter_04_Amazon_VPC.md",
    "module-24": "Chapter_24_AWS_Secrets_Manager.md",
    "module-44": "Chapter_44_Amazon_Inspector.md",
    "module-13": "Chapter_13_Amazon_SNS.md",
    "module-35": "Chapter_35_AWS_Step_Functions.md",
    "module-26": "Chapter_26_AWS_CloudTrail.md",
    "module-37": "Chapter_37_Amazon_Bedrock_and_GenAI.md",
    "module-11": "Chapter_11_Amazon_Cognito.md",
    "module-39": "Chapter_39_Amazon_EC2_Auto_Scaling.md",
    "module-36": "Chapter_36_AWS_IAM_Identity_Center.md",
    "module-22": "Chapter_22_AWS_KMS.md",
    "module-09": "Chapter_09_Amazon_API_Gateway.md",
    "module-31": "Chapter_31_AWS_Organizations_and_Control_Tower.md",
    "module-16": "Chapter_16_Amazon_ECS.md",
    "module-46": "Chapter_46_AWS_Resource_Access_Manager.md",
    "module-19": "Chapter_19_AWS_CodeBuild.md",
    "module-28": "Chapter_28_AWS_Backup.md",
    "module-14": "Chapter_14_Amazon_EventBridge.md",
    "module-25": "Chapter_25_AWS_Systems_Manager.md",
    "module-10": "Chapter_10_Amazon_DynamoDB.md",
    "module-17": "Chapter_17_AWS_Fargate.md",
    "module-12": "Chapter_12_Amazon_SQS.md",
    "module-01": "Chapter_01_AWS_IAM.md",
    "module-40": "Chapter_40_Amazon_EFS.md",
    "module-27": "Chapter_27_AWS_Config.md",
    "module-30": "Chapter_30_AWS_WAF_and_AWS_Shield.md",
    "module-34": "Chapter_34_Amazon_OpenSearch_Service.md",
    "module-21": "Chapter_21_AWS_CloudFormation.md",
    "module-07": "Chapter_07_Amazon_Route_53.md",
    "module-33": "Chapter_33_Amazon_ElastiCache.md",
    "module-05": "Chapter_05_Amazon_CloudWatch.md",
    "module-43": "Chapter_43_Amazon_GuardDuty.md",
    "module-23": "Chapter_23_AWS_STS.md",
    "module-32": "Chapter_32_AWS_PrivateLink.md",
    "module-08": "Chapter_08_AWS_Lambda.md",
    "module-41": "Chapter_41_AWS_X_Ray.md",
    "module-18": "Chapter_18_Elastic_Load_Balancing.md",
    "module-29": "Chapter_29_Amazon_CloudFront.md",
    "module-02": "Chapter_02_Amazon_S3.md",
    "module-38": "Chapter_38_AWS_Certificate_Manager_ACM.md",
    "module-47": "Chapter_47_AWS_Cost_Explorer_and_Budgets.md",
    "module-20": "Chapter_20_AWS_CodePipeline.md",
    "module-45": "Chapter_45_AWS_Security_Hub.md",
    "module-42": "Chapter_42_AWS_CodeDeploy.md",
    "module-03": "Chapter_03_Amazon_EC2.md",
    "module-06": "Chapter_06_Amazon_RDS.md"
  };

  const style = document.createElement('style');
  style.textContent = `
    .details-trigger-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; font-size: 13px; font-weight: 600;
      color: #fff; background: linear-gradient(135deg, #10b981, #059669);
      border: none; border-radius: 8px; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); margin-left: 12px;
    }
    .details-trigger-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(16, 185, 129, 0.45); background: linear-gradient(135deg, #059669, #047857); }
    .details-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s ease;
    }
    .details-overlay.open { opacity: 1; visibility: visible; }
    .details-modal {
      width: 88vw; max-width: 1600px; max-height: 90vh;
      background: #fff; border-radius: 16px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
      display: flex; flex-direction: column;
      transform: translateY(20px) scale(0.97);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden;
    }
    .details-overlay.open .details-modal { transform: translateY(0) scale(1); }
    .details-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px; border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    }
    .details-header-left { display: flex; align-items: center; gap: 10px; }
    .details-header-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; font-size: 18px; color: #fff;}
    .details-header-title { font-size: 16px; font-weight: 700; color: #1e293b; }
    .details-header-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
    .details-close-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: #f1f5f9; border-radius: 8px; font-size: 18px; color: #64748b; cursor: pointer; transition: all 0.15s; }
    .details-close-btn:hover { background: #e2e8f0; color: #1e293b; }
    .details-content-wrap { flex: 1; overflow-y: auto; padding: 40px 64px; }
    
    /* Markdown Rendering Styles */
    .md-rendered { font-family: 'Inter', -apple-system, sans-serif; font-size: 16px; line-height: 1.75; color: #334155; max-width: 100%; }
    .md-rendered h1, .md-rendered h2, .md-rendered h3, .md-rendered h4 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; }
    .md-rendered h1 { font-size: 2em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
    .md-rendered h2 { font-size: 1.5em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
    .md-rendered h3 { font-size: 1.25em; }
    .md-rendered p { margin-top: 0; margin-bottom: 1em; }
    .md-rendered a { color: #2563eb; text-decoration: none; }
    .md-rendered a:hover { text-decoration: underline; }
    .md-rendered ul, .md-rendered ol { margin-top: 0; margin-bottom: 1em; padding-left: 2em; }
    .md-rendered blockquote { margin: 0 0 1em; padding: 0.5em 1em; color: #64748b; border-left: 0.25em solid #cbd5e1; background: #f8fafc; }
    .md-rendered code { padding: 0.2em 0.4em; margin: 0; font-size: 85%; background-color: #f1f5f9; border-radius: 6px; font-family: 'Consolas', monospace; color: #ef4444; }
    .md-rendered pre { margin-top: 0; margin-bottom: 1em; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #1e293b; border-radius: 6px; color: #e2e8f0; font-family: 'Consolas', monospace; }
    .md-rendered pre code { display: inline; max-width: auto; padding: 0; margin: 0; overflow: visible; line-height: inherit; word-wrap: normal; background-color: transparent; border: 0; color: inherit; font-size: 100%; }
    .md-rendered table { border-spacing: 0; border-collapse: collapse; margin-top: 0; margin-bottom: 1em; width: 100%; }
    .md-rendered table th, .md-rendered table td { padding: 6px 13px; border: 1px solid #e2e8f0; }
    .md-rendered table tr { background-color: #fff; border-top: 1px solid #cbd5e1; }
    .md-rendered table tr:nth-child(2n) { background-color: #f8fafc; }
    .md-rendered img { max-width: 100%; box-sizing: content-box; background-color: #fff; }

    /* Mermaid Diagram Styles */
    .md-rendered .mermaid { background: #f8fafc; border-radius: 8px; padding: 24px 16px; margin: 1em 0; text-align: center; overflow-x: auto; }
    .md-rendered .mermaid svg { max-width: 100%; height: auto; }

    /* Responsive: Tablet */
    @media (max-width: 1024px) {
      .details-modal { width: 92vw; }
      .details-content-wrap { padding: 32px 40px; }
    }
    /* Responsive: Mobile */
    @media (max-width: 640px) {
      .details-modal { width: 96vw; max-width: none; border-radius: 10px; }
      .details-content-wrap { padding: 24px 20px; }
      .details-header { padding: 16px 18px 12px; }
      .md-rendered { font-size: 15px; line-height: 1.65; }
      .details-trigger-btn { padding: 5px 10px; font-size: 12px; }
    }
  `;
  document.head.appendChild(style);

  // Load Marked.js for markdown parsing
  function loadMarked() {
    return new Promise((resolve, reject) => {
      if (window.marked) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load Mermaid.js for diagram rendering
  function loadMermaid() {
    return new Promise((resolve, reject) => {
      if (window.mermaid) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => {
        window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Render mermaid diagrams inside a container
  async function renderMermaidDiagrams(container) {
    // Find all <pre><code class="language-mermaid"> blocks produced by marked
    const codeBlocks = container.querySelectorAll('pre code.language-mermaid');
    if (codeBlocks.length === 0) return;

    try {
      await loadMermaid();
    } catch (e) {
      console.warn('Failed to load Mermaid library:', e);
      return;
    }

    // Convert each code block into a mermaid div
    codeBlocks.forEach((codeEl, i) => {
      const mermaidSource = codeEl.textContent;
      const preEl = codeEl.parentElement;
      const mermaidDiv = document.createElement('div');
      mermaidDiv.className = 'mermaid';
      mermaidDiv.textContent = mermaidSource;
      preEl.replaceWith(mermaidDiv);
    });

    // Run mermaid rendering on the new divs
    try {
      await window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') });
    } catch (e) {
      console.warn('Mermaid rendering error:', e);
    }
  }

  // Strip practical lab sections from chapter markdown
  // Labs start with H1 headings like "# 🔬 Practical Lab NN — ..."
  function stripPracticalLabs(md) {
    const lines = md.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/^#\s+.*Practical\s+Lab\s/i.test(lines[i].trim())) {
        // Also remove preceding blank lines and horizontal rules
        let cutPoint = i;
        while (cutPoint > 0 && /^(\s*|---+\s*)$/.test(lines[cutPoint - 1].trim())) {
          cutPoint--;
        }
        return lines.slice(0, cutPoint).join('\n');
      }
    }
    return md; // No labs found, return as-is
  }

  function getModuleId() {
    return (window.app && window.app.currentModule) || 'unknown';
  }

  function getModuleTitle() {
    const el = document.querySelector('.topbar-title');
    return el ? el.textContent.trim() : getModuleId();
  }

  function buildPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'details-overlay';
    overlay.id = 'details-overlay';
    overlay.innerHTML = `
      <div class="details-modal">
        <div class="details-header">
          <div class="details-header-left">
            <div class="details-header-icon">📄</div>
            <div>
              <div class="details-header-title">Chapter Details</div>
              <div class="details-header-subtitle" id="details-subtitle">Loading...</div>
            </div>
          </div>
          <button class="details-close-btn" id="details-close" title="Close">&times;</button>
        </div>
        <div class="details-content-wrap">
          <div class="md-rendered" id="details-editor"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function buildTriggerButton() {
    const btn = document.createElement('button');
    btn.className = 'details-trigger-btn'; // Modified to look like Lab Notes but distinct color
    btn.id = 'details-trigger';
    btn.innerHTML = '<span class="lab-icon">📄</span> Detailed Chapter';
    
    // Attempt to add it next to the Lab Notes button
    const actions = document.querySelector('.topbar-actions');
    if (actions) {
        actions.insertBefore(btn, actions.firstChild);
    } else {
        btn.style.cssText = 'position:fixed;bottom:24px;right:140px;z-index:9998;'; 
        document.body.appendChild(btn); 
    }
    return btn;
  }

  async function fetchMarkdown(moduleId) {
    const fileName = MD_MAP[moduleId];
    if (!fileName) return "Error: Could not find markdown file mapping for this chapter.";
    try {
      // Fetch from the chapters folder we copied into the web root
      const res = await fetch("../chapters/" + fileName);
      if (!res.ok) {
         return "Error: Markdown file " + fileName + " not found. Ensure it was copied to the chapters/ folder.";
      }
      return await res.text();
    } catch (e) {
      return "Error: " + e.message;
    }
  }

  function init() {
    const overlay = buildPopup();
    const trigger = buildTriggerButton();
    const contentBox  = document.getElementById('details-editor');
    const closeBtn  = document.getElementById('details-close');
    const subtitle  = document.getElementById('details-subtitle');

    async function open() {
      subtitle.textContent = getModuleTitle();
      contentBox.innerHTML = "<em>Loading content...</em>";
      overlay.classList.add('open');
      
      try {
          await loadMarked();
          const mdContent = await fetchMarkdown(getModuleId());
          // Strip practical lab sections — they start with "# 🔬 Practical Lab"
          const chapterOnly = stripPracticalLabs(mdContent);
          contentBox.innerHTML = window.marked.parse(chapterOnly);
          // Render mermaid diagrams after content is mounted
          await renderMermaidDiagrams(contentBox);
      } catch(e) {
          contentBox.innerHTML = "<div style='color:red'>Failed to load or parse Markdown.</div>";
      }
    }

    function close() {
      overlay.classList.remove('open');
    }

    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
