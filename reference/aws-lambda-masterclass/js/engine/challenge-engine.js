/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — CHALLENGE ENGINE
 * Hands-on coding/configuration challenges with evaluation
 * ============================================================
 */
class ChallengeEngine {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {string}   config.title          - Challenge title
   * @param {string}   config.description    - Challenge description
   * @param {string}   config.difficulty     - beginner | intermediate | advanced | expert
   * @param {Array}    config.requirements   - Array of requirement strings
   * @param {string}   config.starterCode    - Initial code template
   * @param {string}   config.language       - Programming language
   * @param {Array}    config.hints          - Progressive hints
   * @param {Array}    config.testCases      - [{ input, expectedOutput, description }]
   * @param {string}   config.architectureRef - Architecture reference text
   * @param {Array}    config.availableCommands - Available CLI commands
   * @param {Array}    config.docRefs        - Documentation references [{ title, url }]
   * @param {Function} config.validator      - Custom validator(code) -> { pass, message, score }
   * @param {Function} config.onComplete     - Callback(score, maxScore)
   */
  constructor(container, config = {}) {
    this.container = container;
    this.title = config.title || 'Challenge';
    this.description = config.description || '';
    this.difficulty = config.difficulty || 'intermediate';
    this.requirements = config.requirements || [];
    this.starterCode = config.starterCode || '';
    this.language = config.language || 'python';
    this.hints = config.hints || [];
    this.testCases = config.testCases || [];
    this.architectureRef = config.architectureRef || '';
    this.availableCommands = config.availableCommands || [];
    this.docRefs = config.docRefs || [];
    this.validator = config.validator || null;
    this.onComplete = config.onComplete || null;
    
    this.revealedHints = 0;
    this.attempts = 0;
    this.solved = false;

    this._render();
  }

  _render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border: 2px solid var(--color-warning-300); border-radius: 16px; overflow: hidden; margin-bottom: 32px; background: var(--color-neutral-0);';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'padding: 24px; background: linear-gradient(135deg, var(--color-warning-50), var(--color-primary-50)); border-bottom: 1px solid var(--color-warning-200);';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 24px;">🏆</span>
        <span class="badge difficulty-${this.difficulty}">${this.difficulty}</span>
        ${this.solved ? '<span class="badge badge-success">✓ SOLVED</span>' : ''}
      </div>
      <h3 style="margin-bottom: 8px; color: var(--color-neutral-900);">${this._escapeHtml(this.title)}</h3>
      <p style="font-size: 14px; color: var(--color-neutral-600); margin-bottom: 0; line-height: 1.6;">${this._escapeHtml(this.description)}</p>
    `;
    wrapper.appendChild(header);

    // Requirements
    if (this.requirements.length > 0) {
      const reqSection = document.createElement('div');
      reqSection.style.cssText = 'padding: 16px 24px; border-bottom: 1px solid var(--border-color);';
      reqSection.innerHTML = `
        <div style="font-size: 13px; font-weight: 600; color: var(--color-neutral-600); margin-bottom: 8px;">📋 Requirements</div>
        <ol style="padding-left: 20px; margin: 0;">
          ${this.requirements.map(r => `<li style="font-size: 14px; color: var(--color-neutral-700); margin-bottom: 4px;">${this._escapeHtml(r)}</li>`).join('')}
        </ol>
      `;
      wrapper.appendChild(reqSection);
    }

    // Architecture reference
    if (this.architectureRef) {
      const archSection = document.createElement('div');
      archSection.style.cssText = 'padding: 16px 24px; border-bottom: 1px solid var(--border-color); background: var(--color-neutral-50);';
      archSection.innerHTML = `
        <div style="font-size: 13px; font-weight: 600; color: var(--color-neutral-600); margin-bottom: 8px;">📐 Architecture Reference</div>
        <pre style="margin: 0; padding: 12px; background: var(--color-neutral-0); border: 1px solid var(--border-color); border-radius: 8px; font-size: 13px; color: var(--color-neutral-700); font-family: var(--font-mono);">${this._escapeHtml(this.architectureRef)}</pre>
      `;
      wrapper.appendChild(archSection);
    }

    // Code editor area
    const editorSection = document.createElement('div');
    editorSection.style.cssText = 'padding: 0; border-bottom: 1px solid var(--border-color);';
    
    const editorHeader = document.createElement('div');
    editorHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #161b22; border-bottom: 1px solid rgba(255,255,255,0.06);';
    editorHeader.innerHTML = `
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-neutral-400);">${this._escapeHtml(this.language)}</span>
      <span style="font-size: 11px; color: var(--color-neutral-500);">Your Solution</span>
    `;
    editorSection.appendChild(editorHeader);

    this.codeArea = document.createElement('textarea');
    this.codeArea.style.cssText = `
      width: 100%;
      min-height: 250px;
      padding: 16px;
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
    `;
    this.codeArea.spellcheck = false;
    this.codeArea.value = this.starterCode;
    this.codeArea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = this.codeArea.selectionStart;
        const end = this.codeArea.selectionEnd;
        this.codeArea.value = this.codeArea.value.substring(0, s) + '  ' + this.codeArea.value.substring(end);
        this.codeArea.selectionStart = this.codeArea.selectionEnd = s + 2;
      }
    });
    editorSection.appendChild(this.codeArea);
    wrapper.appendChild(editorSection);

    // Action buttons
    const actionsSection = document.createElement('div');
    actionsSection.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; background: var(--color-neutral-50); border-bottom: 1px solid var(--border-color);';

    const leftActions = document.createElement('div');
    leftActions.className = 'flex gap-2';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn btn-sm btn-primary';
    submitBtn.textContent = '🧪 Submit & Test';
    submitBtn.addEventListener('click', () => this._evaluate());
    leftActions.appendChild(submitBtn);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-sm btn-secondary';
    resetBtn.textContent = '🔄 Reset';
    resetBtn.addEventListener('click', () => {
      this.codeArea.value = this.starterCode;
    });
    leftActions.appendChild(resetBtn);

    actionsSection.appendChild(leftActions);

    // Hint button
    const hintBtn = document.createElement('button');
    hintBtn.className = 'btn btn-sm btn-ghost';
    hintBtn.textContent = `💡 Hint (${this.revealedHints}/${this.hints.length})`;
    hintBtn.addEventListener('click', () => this._revealHint());
    actionsSection.appendChild(hintBtn);
    this.hintBtn = hintBtn;

    wrapper.appendChild(actionsSection);

    // Hints area
    this.hintsArea = document.createElement('div');
    this.hintsArea.style.cssText = 'display: none; padding: 12px 24px; border-bottom: 1px solid var(--border-color); background: var(--color-warning-50);';
    wrapper.appendChild(this.hintsArea);

    // Test results area
    this.resultsArea = document.createElement('div');
    this.resultsArea.style.cssText = 'display: none; padding: 16px 24px;';
    wrapper.appendChild(this.resultsArea);

    // Documentation references
    if (this.docRefs.length > 0) {
      const docsSection = document.createElement('div');
      docsSection.style.cssText = 'padding: 12px 24px; border-top: 1px solid var(--border-color); background: var(--color-neutral-50);';
      docsSection.innerHTML = `
        <div style="font-size: 12px; font-weight: 600; color: var(--color-neutral-500); margin-bottom: 6px;">📖 References</div>
        ${this.docRefs.map(d => `<a href="${d.url || '#'}" target="_blank" style="font-size: 13px; margin-right: 16px;">${this._escapeHtml(d.title)}</a>`).join('')}
      `;
      wrapper.appendChild(docsSection);
    }

    this.container.appendChild(wrapper);
  }

  _revealHint() {
    if (this.revealedHints >= this.hints.length) return;
    
    this.revealedHints++;
    this.hintBtn.textContent = `💡 Hint (${this.revealedHints}/${this.hints.length})`;
    
    this.hintsArea.style.display = 'block';
    this.hintsArea.innerHTML = this.hints.slice(0, this.revealedHints).map((h, i) => `
      <div style="margin-bottom: 8px; font-size: 14px; color: var(--color-warning-600);">
        <strong>Hint ${i + 1}:</strong> ${this._escapeHtml(h)}
      </div>
    `).join('');
  }

  _evaluate() {
    this.attempts++;
    const code = this.codeArea.value;
    this.resultsArea.style.display = 'block';

    // Run test cases
    let passed = 0;
    const results = [];

    if (this.testCases.length > 0) {
      this.testCases.forEach((tc, idx) => {
        // Simple string-based validation
        const containsExpected = code.includes(tc.expectedOutput) || 
          (tc.keywords && tc.keywords.every(kw => code.includes(kw)));
        
        if (containsExpected) passed++;
        results.push({
          ...tc,
          index: idx + 1,
          passed: containsExpected
        });
      });
    }

    // Custom validator
    let customResult = null;
    if (this.validator) {
      customResult = this.validator(code);
      if (customResult.pass) passed = this.testCases.length;
    }

    const total = this.testCases.length || 1;
    const allPassed = customResult ? customResult.pass : (passed === total);
    const score = customResult?.score || (allPassed ? 100 : Math.round((passed / total) * 100));

    this.resultsArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 32px;">${allPassed ? '🎉' : '🔧'}</span>
        <div>
          <div style="font-size: 18px; font-weight: 700; color: ${allPassed ? 'var(--color-success-600)' : 'var(--color-error-600)'};">
            ${allPassed ? 'All Tests Passed!' : `${passed}/${total} Tests Passed`}
          </div>
          <div style="font-size: 13px; color: var(--color-neutral-500);">Attempt #${this.attempts}</div>
        </div>
      </div>
      ${results.map(r => `
        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 4px; border-radius: 8px; background: ${r.passed ? 'var(--color-success-50)' : 'var(--color-error-50)'};">
          <span>${r.passed ? '✅' : '❌'}</span>
          <span style="font-size: 13px; color: ${r.passed ? 'var(--color-success-700)' : 'var(--color-error-700)'};">
            Test ${r.index}: ${this._escapeHtml(r.description || '')}
          </span>
        </div>
      `).join('')}
      ${customResult?.message ? `
        <div style="margin-top: 12px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px; font-size: 14px; color: var(--color-neutral-700); line-height: 1.6;">
          ${this._escapeHtml(customResult.message)}
        </div>
      ` : ''}
    `;

    if (allPassed && !this.solved) {
      this.solved = true;
      if (this.onComplete) {
        this.onComplete(score, 100);
      }
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  getCode() {
    return this.codeArea.value;
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChallengeEngine;
} else {
  window.ChallengeEngine = ChallengeEngine;
}
