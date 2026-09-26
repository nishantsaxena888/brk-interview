/**
 * ============================================================
 * LAB POPUP — Rich-text lab notes for every module
 * ============================================================
 * Saves to labs/ directory on disk via lab-server API.
 * Files are git-trackable HTML fragments.
 */
(function () {
  'use strict';

  // ── Inject CSS ──────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .lab-trigger-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; font-size: 13px; font-weight: 600;
      color: #fff; background: linear-gradient(135deg, #8b5cf6, #6366f1);
      border: none; border-radius: 8px; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(99,102,241,0.3); margin-left: 12px;
    }
    .lab-trigger-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.45); background: linear-gradient(135deg, #7c3aed, #4f46e5); }
    .lab-trigger-btn .lab-icon { font-size: 15px; }
    .lab-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s ease;
    }
    .lab-overlay.open { opacity: 1; visibility: visible; }
    .lab-modal {
      width: 88vw; max-width: 1600px; max-height: 90vh;
      background: #fff; border-radius: 16px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.25);
      display: flex; flex-direction: column;
      transform: translateY(20px) scale(0.97);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1); overflow: hidden;
    }
    .lab-overlay.open .lab-modal { transform: translateY(0) scale(1); }
    .lab-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px; border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    }
    .lab-header-left { display: flex; align-items: center; gap: 10px; }
    .lab-header-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 10px; font-size: 18px; }
    .lab-header-title { font-size: 16px; font-weight: 700; color: #1e293b; }
    .lab-header-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
    .lab-close-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: #f1f5f9; border-radius: 8px; font-size: 18px; color: #64748b; cursor: pointer; transition: all 0.15s; }
    .lab-close-btn:hover { background: #e2e8f0; color: #1e293b; }
    .lab-toolbar { display: flex; align-items: center; gap: 4px; padding: 10px 24px; border-bottom: 1px solid #f1f5f9; background: #fafbfc; flex-wrap: wrap; }
    .lab-toolbar-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1px solid transparent; background: transparent; border-radius: 6px; font-size: 14px; color: #475569; cursor: pointer; transition: all 0.15s; font-weight: 600; }
    .lab-toolbar-btn:hover { background: #e2e8f0; color: #1e293b; }
    .lab-toolbar-sep { width: 1px; height: 20px; background: #e2e8f0; margin: 0 4px; }
    .lab-editor-wrap { flex: 1; overflow-y: auto; padding: 24px 48px; }
    /* Practical Lab Content Section (read-only) */
    .lab-content-section { border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; padding-bottom: 16px; }
    .lab-content-toggle { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 12px 16px; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-radius: 10px; border: 1px solid #bbf7d0; margin-bottom: 16px; user-select: none; }
    .lab-content-toggle:hover { background: linear-gradient(135deg, #dcfce7, #d1fae5); }
    .lab-content-toggle-title { font-size: 14px; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 8px; }
    .lab-content-toggle-arrow { font-size: 12px; color: #166534; transition: transform 0.2s; }
    .lab-content-toggle-arrow.collapsed { transform: rotate(-90deg); }
    .lab-content-body { font-family: 'Inter', -apple-system, sans-serif; font-size: 15px; line-height: 1.7; color: #334155; }
    /* Accordion styles */
    .lab-accordion-item { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 10px; overflow: hidden; transition: box-shadow 0.2s; }
    .lab-accordion-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .lab-accordion-item.open { border-color: #bbf7d0; box-shadow: 0 2px 12px rgba(16,185,129,0.1); }
    .lab-accordion-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; cursor: pointer; user-select: none; background: #f8fafc; transition: background 0.15s; }
    .lab-accordion-header:hover { background: #f0fdf4; }
    .lab-accordion-item.open .lab-accordion-header { background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border-bottom: 1px solid #e2e8f0; }
    .lab-accordion-title { font-size: 15px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    .lab-accordion-arrow { font-size: 11px; color: #64748b; transition: transform 0.25s ease; }
    .lab-accordion-item.open .lab-accordion-arrow { transform: rotate(90deg); color: #166534; }
    .lab-accordion-content { display: none; padding: 20px 24px; }
    .lab-accordion-item.open .lab-accordion-content { display: block; }
    .lab-content-body h2 { font-size: 1.3em; font-weight: 700; color: #0f172a; margin: 1em 0 0.4em; }
    .lab-content-body h3 { font-size: 1.1em; font-weight: 700; color: #0f172a; margin: 0.8em 0 0.3em; }
    .lab-content-body p { margin: 0 0 0.8em; }
    .lab-content-body ul, .lab-content-body ol { margin: 0 0 0.8em; padding-left: 2em; }
    .lab-content-body blockquote { margin: 0 0 0.8em; padding: 0.5em 1em; color: #64748b; border-left: 0.25em solid #cbd5e1; background: #f8fafc; }
    .lab-content-body code { padding: 0.2em 0.4em; font-size: 85%; background: #f1f5f9; border-radius: 4px; font-family: 'Consolas', monospace; color: #ef4444; }
    .lab-content-body pre { margin: 0 0 1em; padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background: #1e293b; border-radius: 6px; color: #e2e8f0; font-family: 'Consolas', monospace; }
    .lab-content-body pre code { background: transparent; color: inherit; padding: 0; font-size: 100%; }
    .lab-content-body table { border-spacing: 0; border-collapse: collapse; margin: 0 0 1em; width: 100%; }
    .lab-content-body table th, .lab-content-body table td { padding: 6px 13px; border: 1px solid #e2e8f0; }
    .lab-content-body table tr { background: #fff; border-top: 1px solid #cbd5e1; }
    .lab-content-body table tr:nth-child(2n) { background: #f8fafc; }
    .lab-content-body .mermaid { background: #f8fafc; border-radius: 8px; padding: 24px 16px; margin: 1em 0; text-align: center; overflow-x: auto; }
    .lab-content-body .mermaid svg { max-width: 100%; height: auto; }
    .lab-content-empty { padding: 16px; text-align: center; color: #94a3b8; font-style: italic; font-size: 14px; }
    .lab-notes-separator { display: flex; align-items: center; gap: 12px; margin: 8px 0 16px; color: #64748b; font-size: 13px; font-weight: 600; }
    .lab-notes-separator::before, .lab-notes-separator::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
    @media (max-width: 1024px) {
      .lab-modal { width: 92vw; }
      .lab-editor-wrap { padding: 20px 32px; }
    }
    @media (max-width: 640px) {
      .lab-modal { width: 96vw; max-width: none; border-radius: 10px; }
      .lab-editor-wrap { padding: 16px; }
    }
    .lab-editor {
      min-height: 280px; outline: none; font-size: 15px; line-height: 1.7;
      color: #1e293b; font-family: 'Inter', -apple-system, sans-serif;
    }
    .lab-editor:empty::before { content: attr(data-placeholder); color: #94a3b8; font-style: italic; pointer-events: none; }
    .lab-editor h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 16px 0 8px; }
    .lab-editor h3 { font-size: 17px; font-weight: 700; color: #0f172a; margin: 16px 0 8px; }
    .lab-editor p { margin: 0 0 12px; }
    .lab-editor ul, .lab-editor ol { margin: 0 0 12px; padding-left: 24px; }
    .lab-editor li { margin-bottom: 4px; }
    .lab-editor code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 13px; color: #6366f1; }
    .lab-editor pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: 'Consolas', monospace; font-size: 13px; line-height: 1.5; margin: 8px 0 16px; overflow-x: auto; }
    .lab-editor pre code { background: none; color: inherit; padding: 0; }
    .lab-editor blockquote { border-left: 3px solid #6366f1; padding-left: 16px; margin: 8px 0 16px; color: #475569; font-style: italic; }
    .lab-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; border-top: 1px solid #e5e7eb; background: #f8fafc; }
    .lab-save-status { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
    .lab-save-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; }
    .lab-save-dot.unsaved { background: #f59e0b; }
    .lab-save-dot.saving { background: #3b82f6; animation: lab-pulse 0.8s infinite; }
    @keyframes lab-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .lab-footer-actions { display: flex; gap: 8px; }
    .lab-btn { padding: 8px 16px; font-size: 13px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; transition: all 0.15s; }
    .lab-btn-secondary { background: #f1f5f9; color: #475569; }
    .lab-btn-secondary:hover { background: #e2e8f0; }
    .lab-btn-primary { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,0.3); }
    .lab-btn-primary:hover { box-shadow: 0 4px 16px rgba(99,102,241,0.4); transform: translateY(-1px); }
  `;
  document.head.appendChild(style);

  // ── Chapter-to-Markdown mapping (shared with details-popup) ──
  const MD_MAP = {
    "module-01": "Chapter_01_AWS_IAM.md",
    "module-02": "Chapter_02_Amazon_S3.md",
    "module-03": "Chapter_03_Amazon_EC2.md",
    "module-04": "Chapter_04_Amazon_VPC.md",
    "module-05": "Chapter_05_Amazon_CloudWatch.md",
    "module-06": "Chapter_06_Amazon_RDS.md",
    "module-07": "Chapter_07_Amazon_Route_53.md",
    "module-08": "Chapter_08_AWS_Lambda.md",
    "module-09": "Chapter_09_Amazon_API_Gateway.md",
    "module-10": "Chapter_10_Amazon_DynamoDB.md",
    "module-11": "Chapter_11_Amazon_Cognito.md",
    "module-12": "Chapter_12_Amazon_SQS.md",
    "module-13": "Chapter_13_Amazon_SNS.md",
    "module-14": "Chapter_14_Amazon_EventBridge.md",
    "module-15": "Chapter_15_Amazon_ECR.md",
    "module-16": "Chapter_16_Amazon_ECS.md",
    "module-17": "Chapter_17_AWS_Fargate.md",
    "module-18": "Chapter_18_Elastic_Load_Balancing.md",
    "module-19": "Chapter_19_AWS_CodeBuild.md",
    "module-20": "Chapter_20_AWS_CodePipeline.md",
    "module-21": "Chapter_21_AWS_CloudFormation.md",
    "module-22": "Chapter_22_AWS_KMS.md",
    "module-23": "Chapter_23_AWS_STS.md",
    "module-24": "Chapter_24_AWS_Secrets_Manager.md",
    "module-25": "Chapter_25_AWS_Systems_Manager.md",
    "module-26": "Chapter_26_AWS_CloudTrail.md",
    "module-27": "Chapter_27_AWS_Config.md",
    "module-28": "Chapter_28_AWS_Backup.md",
    "module-29": "Chapter_29_Amazon_CloudFront.md",
    "module-30": "Chapter_30_AWS_WAF_and_AWS_Shield.md",
    "module-31": "Chapter_31_AWS_Organizations_and_Control_Tower.md",
    "module-32": "Chapter_32_AWS_PrivateLink.md",
    "module-33": "Chapter_33_Amazon_ElastiCache.md",
    "module-34": "Chapter_34_Amazon_OpenSearch_Service.md",
    "module-35": "Chapter_35_AWS_Step_Functions.md",
    "module-36": "Chapter_36_AWS_IAM_Identity_Center.md",
    "module-37": "Chapter_37_Amazon_Bedrock_and_GenAI.md",
    "module-38": "Chapter_38_AWS_Certificate_Manager_ACM.md",
    "module-39": "Chapter_39_Amazon_EC2_Auto_Scaling.md",
    "module-40": "Chapter_40_Amazon_EFS.md",
    "module-41": "Chapter_41_AWS_X_Ray.md",
    "module-42": "Chapter_42_AWS_CodeDeploy.md",
    "module-43": "Chapter_43_Amazon_GuardDuty.md",
    "module-44": "Chapter_44_Amazon_Inspector.md",
    "module-45": "Chapter_45_AWS_Security_Hub.md",
    "module-46": "Chapter_46_AWS_Resource_Access_Manager.md",
    "module-47": "Chapter_47_AWS_Cost_Explorer_and_Budgets.md"
  };

  // ── Load external libraries ─────────────────────────────
  function loadMarked() {
    return new Promise((resolve, reject) => {
      if (window.marked) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadMermaid() {
    return new Promise((resolve, reject) => {
      if (window.mermaid) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      s.onload = () => { window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' }); resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── Fetch chapter markdown ──────────────────────────────
  async function fetchChapterMarkdown(moduleId) {
    const fileName = MD_MAP[moduleId];
    if (!fileName) return null;
    try {
      const res = await fetch('../chapters/' + fileName);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    }
  }

  // ── Extract practical lab sections from markdown ────────
  function extractPracticalLabs(md) {
    if (!md) return '';
    const lines = md.split('\n');
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^#\s+.*Practical\s+Lab\s/i.test(lines[i].trim())) {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) return '';
    return lines.slice(startIdx).join('\n');
  }

  // ── Render mermaid diagrams inside a container ──────────
  async function renderMermaidInContainer(container) {
    const codeBlocks = container.querySelectorAll('pre code.language-mermaid');
    if (codeBlocks.length === 0) return;
    try {
      await loadMermaid();
    } catch (e) { return; }
    codeBlocks.forEach(codeEl => {
      const src = codeEl.textContent;
      const pre = codeEl.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = src;
      pre.replaceWith(div);
    });
    try {
      await window.mermaid.run({ nodes: container.querySelectorAll('.mermaid') });
    } catch (e) {
      console.warn('Mermaid rendering error in lab popup:', e);
    }
  }

  // ── Wrap rendered lab HTML into accordion items ─────────
  function wrapLabsInAccordion(container) {
    const children = Array.from(container.childNodes);
    const h1Elements = Array.from(container.querySelectorAll('h1'));
    if (h1Elements.length === 0) return;

    // Group elements: each H1 starts a new accordion item
    const groups = [];
    let currentGroup = null;
    children.forEach(node => {
      if (node.nodeType === 1 && node.tagName === 'H1') {
        currentGroup = { title: node.textContent.trim(), content: [] };
        groups.push(currentGroup);
      } else if (currentGroup) {
        currentGroup.content.push(node);
      }
      // Elements before the first H1 are discarded (typically HRs/blanks)
    });

    // Clear container and build accordion
    container.innerHTML = '';
    groups.forEach((group, idx) => {
      const item = document.createElement('div');
      item.className = 'lab-accordion-item';
      item.dataset.index = idx;

      const header = document.createElement('div');
      header.className = 'lab-accordion-header';
      header.innerHTML = `<span class="lab-accordion-title">🔬 ${group.title.replace(/^🔬\s*/, '')}</span><span class="lab-accordion-arrow">▶</span>`;

      const content = document.createElement('div');
      content.className = 'lab-accordion-content';
      group.content.forEach(node => content.appendChild(node));

      item.appendChild(header);
      item.appendChild(content);
      container.appendChild(item);

      // Click handler — single-open accordion
      header.addEventListener('click', async () => {
        const isOpen = item.classList.contains('open');
        // Close all
        container.querySelectorAll('.lab-accordion-item.open').forEach(el => el.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
          // Lazy-render mermaid diagrams on first expand
          if (!content.dataset.mermaidDone) {
            content.dataset.mermaidDone = '1';
            await renderMermaidInContainer(content);
          }
        }
      });
    });
  }

  // ── Helpers ─────────────────────────────────────────────
  function getModuleId() {
    return (window.app && window.app.currentModule) || 'unknown';
  }
  function getModuleTitle() {
    const el = document.querySelector('.topbar-title');
    return el ? el.textContent.trim() : getModuleId();
  }

  // ── API calls (saves to labs/ on disk) ─────────────────
  async function loadNotes(moduleId) {
    try {
      const res = await fetch('/api/lab/' + moduleId);
      const data = await res.json();
      return data.content || '';
    } catch (e) {
      // Fallback to localStorage if server not running
      return localStorage.getItem('lab-notes-' + moduleId) || '';
    }
  }

  async function saveNotes(moduleId, content) {
    try {
      await fetch('/api/lab/' + moduleId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return true;
    } catch (e) {
      // Fallback to localStorage
      localStorage.setItem('lab-notes-' + moduleId, content);
      return false;
    }
  }

  // ── Build DOM ───────────────────────────────────────────
  function buildPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'lab-overlay';
    overlay.id = 'lab-overlay';
    overlay.innerHTML = `
      <div class="lab-modal">
        <div class="lab-header">
          <div class="lab-header-left">
            <div class="lab-header-icon">🧪</div>
            <div>
              <div class="lab-header-title">Lab Notes</div>
              <div class="lab-header-subtitle" id="lab-subtitle">Loading…</div>
            </div>
          </div>
          <button class="lab-close-btn" id="lab-close" title="Close">&times;</button>
        </div>
        <div class="lab-toolbar">
          <button class="lab-toolbar-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
          <button class="lab-toolbar-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
          <button class="lab-toolbar-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
          <div class="lab-toolbar-sep"></div>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="H2" title="Heading 2">H2</button>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="H3" title="Heading 3">H3</button>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="P" title="Paragraph">¶</button>
          <div class="lab-toolbar-sep"></div>
          <button class="lab-toolbar-btn" data-cmd="insertUnorderedList" title="Bullet List">•≡</button>
          <button class="lab-toolbar-btn" data-cmd="insertOrderedList" title="Numbered List">1.</button>
          <div class="lab-toolbar-sep"></div>
          <button class="lab-toolbar-btn" data-cmd="formatBlock" data-val="BLOCKQUOTE" title="Quote">❝</button>
          <button class="lab-toolbar-btn" id="lab-code-btn" title="Code Block">&lt;/&gt;</button>
          <button class="lab-toolbar-btn" id="lab-link-btn" title="Insert Link">🔗</button>
          <button class="lab-toolbar-btn" data-cmd="insertHorizontalRule" title="Divider">―</button>
          <button class="lab-toolbar-btn" data-cmd="removeFormat" title="Clear Format">🚫</button>
        </div>
        <div class="lab-editor-wrap">
          <div class="lab-content-section" id="lab-content-section">
            <div class="lab-content-toggle" id="lab-content-toggle">
              <span class="lab-content-toggle-title">🔬 Practical Lab Instructions</span>
              <span class="lab-content-toggle-arrow" id="lab-content-arrow">▼</span>
            </div>
            <div class="lab-content-body" id="lab-content-body"></div>
          </div>
          <div class="lab-notes-separator">✏️ Your Personal Notes</div>
          <div class="lab-editor" id="lab-editor" contenteditable="true"
               data-placeholder="Write your lab notes here… (auto-saved to labs/ folder on disk)"></div>
        </div>
        <div class="lab-footer">
          <div class="lab-save-status">
            <span class="lab-save-dot" id="lab-save-dot"></span>
            <span id="lab-save-text">Saved to disk</span>
          </div>
          <div class="lab-footer-actions">
            <button class="lab-btn lab-btn-secondary" id="lab-clear">Clear</button>
            <button class="lab-btn lab-btn-primary" id="lab-save">Save & Close</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function buildTriggerButton() {
    const btn = document.createElement('button');
    btn.className = 'lab-trigger-btn';
    btn.id = 'lab-trigger';
    btn.innerHTML = '<span class="lab-icon">🧪</span> Lab Notes';
    const actions = document.querySelector('.topbar-actions');
    if (actions) actions.insertBefore(btn, actions.firstChild);
    else { btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9998;'; document.body.appendChild(btn); }
    return btn;
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    const overlay = buildPopup();
    const trigger = buildTriggerButton();
    const editor  = document.getElementById('lab-editor');
    const closeBtn  = document.getElementById('lab-close');
    const saveBtn   = document.getElementById('lab-save');
    const clearBtn  = document.getElementById('lab-clear');
    const subtitle  = document.getElementById('lab-subtitle');
    const saveDot   = document.getElementById('lab-save-dot');
    const saveText  = document.getElementById('lab-save-text');

    let dirty = false;
    let autoSaveTimer = null;

    const labContentBody = document.getElementById('lab-content-body');
    const labContentSection = document.getElementById('lab-content-section');
    const labContentToggle = document.getElementById('lab-content-toggle');
    const labContentArrow = document.getElementById('lab-content-arrow');
    let labContentVisible = true;

    // Toggle collapse/expand for practical lab content
    labContentToggle.addEventListener('click', () => {
      labContentVisible = !labContentVisible;
      labContentBody.style.display = labContentVisible ? '' : 'none';
      labContentArrow.classList.toggle('collapsed', !labContentVisible);
    });

    async function open() {
      subtitle.textContent = getModuleTitle();
      saveDot.className = 'lab-save-dot saving';
      saveText.textContent = 'Loading…';
      overlay.classList.add('open');

      // Load practical lab content for this chapter
      const moduleId = getModuleId();
      labContentBody.innerHTML = '<em>Loading lab content…</em>';
      labContentSection.style.display = '';
      try {
        await loadMarked();
        const mdContent = await fetchChapterMarkdown(moduleId);
        const labMd = extractPracticalLabs(mdContent);
        if (labMd) {
          labContentBody.innerHTML = window.marked.parse(labMd);
          wrapLabsInAccordion(labContentBody);
        } else {
          labContentBody.innerHTML = '<div class="lab-content-empty">No practical lab content found for this chapter.</div>';
        }
      } catch (e) {
        labContentBody.innerHTML = '<div class="lab-content-empty">Failed to load lab content.</div>';
      }

      // Load user notes
      const content = await loadNotes(moduleId);
      editor.innerHTML = content;
      dirty = false;
      saveDot.className = 'lab-save-dot';
      saveText.textContent = 'Saved to disk';
      setTimeout(() => editor.focus(), 200);
    }

    async function save() {
      const content = editor.innerHTML.trim();
      saveDot.className = 'lab-save-dot saving';
      saveText.textContent = 'Saving…';

      const savedToDisk = await saveNotes(getModuleId(), (content && content !== '<br>') ? content : '');
      dirty = false;
      saveDot.className = 'lab-save-dot';
      saveText.textContent = savedToDisk ? 'Saved to labs/ folder ✓' : 'Saved (localStorage fallback)';
      updateBadge();
    }

    async function close() {
      await save();
      overlay.classList.remove('open');
    }

    function markDirty() {
      if (!dirty) {
        dirty = true;
        saveDot.className = 'lab-save-dot unsaved';
        saveText.textContent = 'Unsaved changes';
      }
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => save(), 3000);
    }

    function updateBadge() {
      const has = editor.innerHTML.trim() && editor.innerHTML.trim() !== '<br>';
      trigger.innerHTML = has
        ? '<span class="lab-icon">🧪</span> Lab Notes <span style="background:#22c55e;color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:2px;">●</span>'
        : '<span class="lab-icon">🧪</span> Lab Notes';
    }

    // Events
    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    saveBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
    editor.addEventListener('input', markDirty);

    clearBtn.addEventListener('click', async () => {
      if (confirm('Clear all lab notes for this chapter?')) {
        editor.innerHTML = '';
        await saveNotes(getModuleId(), '');
        dirty = false;
        saveDot.className = 'lab-save-dot';
        saveText.textContent = 'Cleared';
        updateBadge();
      }
    });

    // Toolbar
    overlay.querySelectorAll('.lab-toolbar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
        editor.focus(); markDirty();
      });
    });
    document.getElementById('lab-code-btn').addEventListener('click', e => { e.preventDefault(); document.execCommand('formatBlock', false, 'PRE'); editor.focus(); markDirty(); });
    document.getElementById('lab-link-btn').addEventListener('click', e => { e.preventDefault(); const u = prompt('Enter URL:'); if (u) { document.execCommand('createLink', false, u); markDirty(); } editor.focus(); });

    // Keyboard shortcuts
    editor.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); document.execCommand('bold'); markDirty(); break;
          case 'i': e.preventDefault(); document.execCommand('italic'); markDirty(); break;
          case 'u': e.preventDefault(); document.execCommand('underline'); markDirty(); break;
          case 's': e.preventDefault(); save(); break;
        }
      }
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); markDirty(); }
    });

    // Check if notes exist on load (for badge)
    loadNotes(getModuleId()).then(content => {
      if (content) {
        trigger.innerHTML = '<span class="lab-icon">🧪</span> Lab Notes <span style="background:#22c55e;color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:2px;">●</span>';
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
