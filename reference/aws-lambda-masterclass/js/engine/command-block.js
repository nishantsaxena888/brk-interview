/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — COMMAND BLOCK ENGINE
 * Reusable command blocks with COPY/RUN/EXPLAIN/TRY IT/RESET
 * ============================================================
 */
class CommandBlock {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {string}   config.command        - The command string
   * @param {string}   config.category       - 'aws-cli' | 'sam-cli' | 'cdk' | 'docker' | 'curl' | 'python' | 'node' | 'git' | 'linux'
   * @param {string}   config.expectedOutput - Expected output text
   * @param {string}   config.explanation    - What this command does
   * @param {Array}    config.commonErrors   - Array of { error, cause, fix }
   * @param {string}   config.interviewQ     - Related interview question
   * @param {Function} config.onRun          - Callback when RUN is clicked
   * @param {Function} config.onTryIt        - Callback for TRY IT (opens terminal etc.)
   */
  constructor(container, config = {}) {
    this.container = container;
    this.command = config.command || '';
    this.category = config.category || 'aws-cli';
    this.expectedOutput = config.expectedOutput || '';
    this.explanation = config.explanation || '';
    this.commonErrors = config.commonErrors || [];
    this.interviewQ = config.interviewQ || '';
    this.onRun = config.onRun || null;
    this.onTryIt = config.onTryIt || null;

    this._render();
  }

  _render() {
    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom: 24px; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;';

    // Category label + command
    const cmdHeader = document.createElement('div');
    cmdHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #161b22; border-bottom: 1px solid rgba(255,255,255,0.06);';
    
    const categoryBadge = document.createElement('span');
    categoryBadge.style.cssText = 'font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 999px;';
    
    const catColors = {
      'aws-cli': { bg: '#ff990033', color: '#f59e0b' },
      'sam-cli': { bg: '#10b98133', color: '#10b981' },
      'cdk': { bg: '#8b5cf633', color: '#8b5cf6' },
      'docker': { bg: '#3b82f633', color: '#3b82f6' },
      'curl': { bg: '#6366f133', color: '#6366f1' },
      'python': { bg: '#fbbf2433', color: '#fbbf24' },
      'node': { bg: '#22c55e33', color: '#22c55e' },
      'git': { bg: '#f4722b33', color: '#f4722b' },
      'linux': { bg: '#94a3b833', color: '#94a3b8' }
    };
    const cc = catColors[this.category] || catColors['linux'];
    categoryBadge.style.background = cc.bg;
    categoryBadge.style.color = cc.color;
    categoryBadge.textContent = this.category;
    cmdHeader.appendChild(categoryBadge);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'flex gap-2';
    
    const copyBtn = this._btn('📋 Copy', () => this._copy());
    actions.appendChild(copyBtn);

    if (this.onRun) {
      const runBtn = this._btn('▶ Run', () => this._runCmd());
      runBtn.style.background = 'var(--color-success-500)';
      runBtn.style.color = '#fff';
      actions.appendChild(runBtn);
    }

    const explainBtn = this._btn('💡 Explain', () => this._toggleSection('explain'));
    actions.appendChild(explainBtn);

    if (this.onTryIt) {
      const tryBtn = this._btn('🧪 Try It', () => this.onTryIt(this.command));
      actions.appendChild(tryBtn);
    }

    cmdHeader.appendChild(actions);
    wrapper.appendChild(cmdHeader);

    // Command display
    const cmdDisplay = document.createElement('pre');
    cmdDisplay.style.cssText = 'margin: 0; padding: 16px; background: #0d1117; color: #9ece6a; font-size: 14px; line-height: 1.6; border-radius: 0;';
    cmdDisplay.textContent = `$ ${this.command}`;
    wrapper.appendChild(cmdDisplay);

    // Expected output (collapsible)
    if (this.expectedOutput) {
      const outputSection = this._collapsible('expected-output', '📤 Expected Output', `
        <pre style="margin: 0; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; color: #a9b1d6; font-size: 13px; white-space: pre-wrap;">${this._escapeHtml(this.expectedOutput)}</pre>
      `);
      wrapper.appendChild(outputSection);
    }

    // Explanation (collapsible)
    if (this.explanation) {
      const explainSection = this._collapsible('explain', '💡 What This Command Does', `
        <div style="font-size: 14px; line-height: 1.7; color: var(--color-neutral-700);">${this._escapeHtml(this.explanation)}</div>
      `);
      wrapper.appendChild(explainSection);
    }

    // Common errors (collapsible)
    if (this.commonErrors.length > 0) {
      const errorsHtml = this.commonErrors.map(err => `
        <div style="margin-bottom: 12px; padding: 12px; background: var(--color-error-50); border-radius: 8px; border-left: 3px solid var(--color-error-400);">
          <div style="font-weight: 600; color: var(--color-error-600); font-size: 13px; font-family: var(--font-mono);">${this._escapeHtml(err.error)}</div>
          <div style="font-size: 13px; color: var(--color-neutral-600); margin-top: 4px;"><strong>Cause:</strong> ${this._escapeHtml(err.cause)}</div>
          <div style="font-size: 13px; color: var(--color-success-700); margin-top: 4px;"><strong>Fix:</strong> ${this._escapeHtml(err.fix)}</div>
        </div>
      `).join('');
      const errSection = this._collapsible('errors', '⚠️ Common Errors', errorsHtml);
      wrapper.appendChild(errSection);
    }

    // Interview question (collapsible)
    if (this.interviewQ) {
      const iqSection = this._collapsible('interview', '🎤 Interview Question', `
        <div style="font-size: 14px; line-height: 1.7; color: var(--color-neutral-700); font-style: italic;">"${this._escapeHtml(this.interviewQ)}"</div>
      `);
      wrapper.appendChild(iqSection);
    }

    // Run output area
    this.runOutput = document.createElement('div');
    this.runOutput.style.display = 'none';
    wrapper.appendChild(this.runOutput);

    this.container.appendChild(wrapper);
  }

  _btn(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-xs btn-ghost';
    btn.style.cssText = 'color: var(--color-neutral-400); font-size: 11px;';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  _collapsible(id, title, content) {
    const section = document.createElement('div');
    section.dataset.sectionId = id;
    section.style.cssText = 'border-top: 1px solid var(--border-color);';
    
    const header = document.createElement('button');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 16px; background: var(--color-neutral-50); border: none; cursor: pointer; font-family: var(--font-sans); font-size: 13px; font-weight: 600; color: var(--color-neutral-700); text-align: left;';
    header.innerHTML = `${title} <span style="transition: transform 0.2s;">▼</span>`;
    
    const body = document.createElement('div');
    body.style.cssText = 'display: none; padding: 12px 16px;';
    body.innerHTML = content;

    header.addEventListener('click', () => {
      const isOpen = body.style.display === 'block';
      body.style.display = isOpen ? 'none' : 'block';
      header.querySelector('span').style.transform = isOpen ? '' : 'rotate(180deg)';
    });

    section.appendChild(header);
    section.appendChild(body);
    return section;
  }

  _toggleSection(id) {
    const section = this.container.querySelector(`[data-section-id="${id}"]`);
    if (section) {
      const body = section.querySelector('div:last-child');
      const isOpen = body.style.display === 'block';
      body.style.display = isOpen ? 'none' : 'block';
    }
  }

  _copy() {
    navigator.clipboard.writeText(this.command).then(() => {
      // Brief visual feedback
    });
  }

  _runCmd() {
    this.runOutput.style.display = 'block';
    this.runOutput.innerHTML = `
      <div style="padding: 12px 16px; background: #0d1117; border-top: 2px solid var(--color-success-500);">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-success-400); margin-bottom: 8px; font-weight: 600;">▶ Executing...</div>
        <pre style="margin: 0; color: #a9b1d6; font-size: 13px;">$ ${this._escapeHtml(this.command)}</pre>
      </div>
    `;

    setTimeout(() => {
      let output = '';
      if (this.onRun) {
        output = this.onRun(this.command);
      }
      if (!output) output = this.expectedOutput || '(Command executed successfully)';

      this.runOutput.innerHTML = `
        <div style="padding: 12px 16px; background: #0d1117; border-top: 2px solid var(--color-success-500);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-success-400); margin-bottom: 8px; font-weight: 600;">▶ Output</div>
          <pre style="margin: 0; color: #9ece6a; font-size: 13px; white-space: pre-wrap;">${this._escapeHtml(output)}</pre>
        </div>
      `;
    }, 600);
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CommandBlock;
} else {
  window.CommandBlock = CommandBlock;
}
