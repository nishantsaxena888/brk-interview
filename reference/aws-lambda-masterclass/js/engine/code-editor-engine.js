/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — CODE EDITOR ENGINE
 * Syntax-highlighted code editor with language tabs
 * ============================================================
 * 
 * 100% REUSABLE — language definitions, code samples, and
 * explanations are all passed via configuration.
 */
class CodeEditorEngine {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {Array}    config.languages   - [{ id, label, code, explanations? }]
   * @param {string}   config.defaultLang - Default language tab id
   * @param {boolean}  config.editable    - Allow editing (default true)
   * @param {boolean}  config.showLineNumbers - Show line numbers (default true)
   * @param {Function} config.onRun       - Callback(code, language) when Run is clicked
   * @param {string}   config.title       - Editor title
   * @param {string}   config.expectedOutput - Expected output text to display after run
   */
  constructor(container, config = {}) {
    this.container = container;
    this.languages = config.languages || [];
    this.defaultLang = config.defaultLang || (this.languages[0]?.id || 'python');
    this.editable = config.editable !== false;
    this.showLineNumbers = config.showLineNumbers !== false;
    this.onRun = config.onRun || null;
    this.title = config.title || 'Code Editor';
    this.expectedOutput = config.expectedOutput || '';
    this.activeLang = this.defaultLang;
    
    this._render();
  }

  _render() {
    this.container.innerHTML = '';
    this.container.classList.add('code-block');

    // Header with language tabs + actions
    const header = document.createElement('div');
    header.className = 'code-block-header';
    
    // Language tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'flex gap-2';
    tabsContainer.style.overflowX = 'auto';
    
    this.languages.forEach(lang => {
      const tab = document.createElement('button');
      tab.className = `btn btn-xs ${lang.id === this.activeLang ? 'btn-primary' : 'btn-ghost'}`;
      tab.style.color = lang.id === this.activeLang ? '' : 'var(--color-neutral-400)';
      tab.textContent = lang.label;
      tab.dataset.lang = lang.id;
      tab.addEventListener('click', () => this._switchLang(lang.id));
      tabsContainer.appendChild(tab);
    });
    header.appendChild(tabsContainer);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'code-block-actions';
    
    const copyBtn = this._createActionBtn('📋 Copy', () => this._copy());
    actions.appendChild(copyBtn);

    if (this.onRun) {
      const runBtn = this._createActionBtn('▶️ Run', () => this._run());
      runBtn.classList.add('btn-success');
      runBtn.style.color = '#fff';
      actions.appendChild(runBtn);
    }

    const explainBtn = this._createActionBtn('💡 Explain', () => this._toggleExplanations());
    actions.appendChild(explainBtn);

    header.appendChild(actions);
    this.container.appendChild(header);

    // Editor area
    this.editorArea = document.createElement('div');
    this.editorArea.style.position = 'relative';
    
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'code-editor-textarea';
    this.textarea.spellcheck = false;
    this.textarea.readOnly = !this.editable;
    this.textarea.style.cssText = `
      width: 100%;
      min-height: 200px;
      padding: 16px 16px 16px ${this.showLineNumbers ? '56px' : '16px'};
      background: #0d1117;
      color: #e6edf3;
      border: none;
      font-family: var(--font-mono);
      font-size: 14px;
      line-height: 1.75;
      resize: vertical;
      tab-size: 2;
      outline: none;
      white-space: pre;
      overflow-x: auto;
    `;
    
    // Set initial code
    const activeLangData = this.languages.find(l => l.id === this.activeLang);
    this.textarea.value = activeLangData?.code || '';
    this._adjustHeight();

    // Line numbers
    if (this.showLineNumbers) {
      this.lineNumbers = document.createElement('div');
      this.lineNumbers.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 44px;
        padding: 16px 8px;
        background: rgba(0,0,0,0.25);
        color: #484f58;
        font-family: var(--font-mono);
        font-size: 14px;
        line-height: 1.75;
        text-align: right;
        user-select: none;
        pointer-events: none;
        overflow: hidden;
      `;
      this.editorArea.appendChild(this.lineNumbers);
      this._updateLineNumbers();
    }
    
    this.textarea.addEventListener('input', () => {
      this._updateLineNumbers();
      this._adjustHeight();
    });
    this.textarea.addEventListener('scroll', () => {
      if (this.lineNumbers) {
        this.lineNumbers.scrollTop = this.textarea.scrollTop;
      }
    });
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        this.textarea.value = this.textarea.value.substring(0, start) + '  ' + this.textarea.value.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
      }
    });

    this.editorArea.appendChild(this.textarea);
    this.container.appendChild(this.editorArea);

    // Explanation panel (hidden by default)
    this.explanationPanel = document.createElement('div');
    this.explanationPanel.className = 'code-explanation-panel';
    this.explanationPanel.style.cssText = `
      display: none;
      padding: 16px;
      background: #161b22;
      border-top: 1px solid rgba(255,255,255,0.08);
      max-height: 300px;
      overflow-y: auto;
    `;
    this.container.appendChild(this.explanationPanel);

    // Output panel (hidden by default)
    this.outputPanel = document.createElement('div');
    this.outputPanel.style.cssText = `
      display: none;
      padding: 16px;
      background: #0d1117;
      border-top: 2px solid var(--color-success-500);
    `;
    this.container.appendChild(this.outputPanel);
  }

  _createActionBtn(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-xs btn-ghost';
    btn.style.color = 'var(--color-neutral-400)';
    btn.style.fontSize = '12px';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  _switchLang(langId) {
    this.activeLang = langId;
    const langData = this.languages.find(l => l.id === langId);
    if (langData) {
      this.textarea.value = langData.code || '';
      this._updateLineNumbers();
      this._adjustHeight();
    }
    // Update tab styles
    this.container.querySelectorAll('.code-block-header .btn').forEach(btn => {
      if (btn.dataset.lang) {
        if (btn.dataset.lang === langId) {
          btn.className = 'btn btn-xs btn-primary';
          btn.style.color = '';
        } else {
          btn.className = 'btn btn-xs btn-ghost';
          btn.style.color = 'var(--color-neutral-400)';
        }
      }
    });
    // Hide explanation
    this.explanationPanel.style.display = 'none';
  }

  _updateLineNumbers() {
    if (!this.lineNumbers) return;
    const lines = this.textarea.value.split('\n').length;
    this.lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => 
      `<div style="height: 24.5px; display: flex; align-items: center; justify-content: flex-end;">${i + 1}</div>`
    ).join('');
  }

  _adjustHeight() {
    this.textarea.style.height = 'auto';
    const lineCount = this.textarea.value.split('\n').length;
    const minHeight = Math.max(200, lineCount * 24.5 + 32);
    this.textarea.style.height = Math.min(minHeight, 600) + 'px';
  }

  _copy() {
    navigator.clipboard.writeText(this.textarea.value).then(() => {
      const copyBtn = this.container.querySelector('.code-block-actions .btn');
      if (copyBtn) {
        const original = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyBtn.textContent = original; }, 2000);
      }
    });
  }

  _run() {
    const code = this.textarea.value;
    const lang = this.activeLang;
    
    this.outputPanel.style.display = 'block';
    this.outputPanel.innerHTML = `
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-success-400); margin-bottom: 8px; font-weight: 600;">
        ▶ Output
      </div>
      <pre style="margin: 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; color: #a9b1d6; font-size: 13px;">Running...</pre>
    `;

    // Simulate execution with slight delay
    setTimeout(() => {
      let output = '';
      if (this.onRun) {
        output = this.onRun(code, lang);
      }
      if (!output && this.expectedOutput) {
        output = this.expectedOutput;
      }
      if (!output) {
        output = '(No output)';
      }

      this.outputPanel.innerHTML = `
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-success-400); margin-bottom: 8px; font-weight: 600;">
          ▶ Output
        </div>
        <pre style="margin: 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; color: #9ece6a; font-size: 13px;">${this._escapeHtml(typeof output === 'string' ? output : JSON.stringify(output, null, 2))}</pre>
      `;
    }, 800);
  }

  _toggleExplanations() {
    const panel = this.explanationPanel;
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
      return;
    }

    const langData = this.languages.find(l => l.id === this.activeLang);
    if (!langData?.explanations || langData.explanations.length === 0) {
      panel.innerHTML = `<div style="color: #7aa2f7; font-size: 13px; padding: 8px;">No line explanations available for this code.</div>`;
      panel.style.display = 'block';
      return;
    }

    panel.innerHTML = `
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #7aa2f7; margin-bottom: 12px; font-weight: 600;">
        💡 Line-by-Line Explanation
      </div>
      ${langData.explanations.map(exp => `
        <div style="display: flex; gap: 12px; margin-bottom: 8px; font-size: 13px; line-height: 1.6;">
          <span style="color: #bb9af7; font-weight: 600; font-family: var(--font-mono); min-width: 50px; flex-shrink: 0;">L${exp.line}</span>
          <span style="color: #a9b1d6;">${this._escapeHtml(exp.text)}</span>
        </div>
      `).join('')}
    `;
    panel.style.display = 'block';
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- PUBLIC API ---

  getCode() {
    return this.textarea.value;
  }

  setCode(code) {
    this.textarea.value = code;
    this._updateLineNumbers();
    this._adjustHeight();
  }

  getActiveLanguage() {
    return this.activeLang;
  }

  showOutput(text, type = 'success') {
    const color = type === 'error' ? '#f7768e' : '#9ece6a';
    this.outputPanel.style.display = 'block';
    this.outputPanel.innerHTML = `
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: ${color}; margin-bottom: 8px; font-weight: 600;">
        ${type === 'error' ? '✗ Error' : '▶ Output'}
      </div>
      <pre style="margin: 0; padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; color: ${color}; font-size: 13px;">${this._escapeHtml(text)}</pre>
    `;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeEditorEngine;
} else {
  window.CodeEditorEngine = CodeEditorEngine;
}
