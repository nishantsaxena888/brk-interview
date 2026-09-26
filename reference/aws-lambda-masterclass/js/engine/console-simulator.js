/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — CONSOLE SIMULATOR
 * Visual AWS Console mockup with guided navigation
 * ============================================================
 */
class ConsoleSimulator {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {string}   config.service     - Service name (e.g., 'Lambda', 'IAM', 'S3')
   * @param {string}   config.title       - Simulator title
   * @param {Array}    config.steps       - Array of guided steps
   * @param {Function} config.onComplete  - Callback when all steps are done
   * @param {Object}   config.screens     - Map of screen definitions
   *
   * Step format:
   * {
   *   id: string,
   *   instruction: string,       - What the learner should do
   *   why: string,               - Why they should do it
   *   targetScreen: string,      - Which screen to show
   *   targetElement: string,     - CSS selector of clickable element
   *   expectedAction: string,    - 'click' | 'input' | 'select'
   *   expectedValue?: string,    - For input/select actions
   *   feedback: { correct: string, incorrect: string }
   * }
   *
   * Screen format:
   * {
   *   id: string,
   *   title: string,
   *   breadcrumb: string[],
   *   html: string               - HTML content for the screen body
   * }
   */
  constructor(container, config = {}) {
    this.container = container;
    this.service = config.service || 'Lambda';
    this.title = config.title || 'AWS Console Simulator';
    this.steps = config.steps || [];
    this.onComplete = config.onComplete || null;
    this.screens = config.screens || {};
    
    this.currentStep = 0;
    this.completedSteps = new Set();

    this._render();
  }

  _render() {
    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'console-sim';

    // Console navbar
    const navbar = document.createElement('div');
    navbar.className = 'console-navbar';
    navbar.innerHTML = `
      <span class="console-navbar-logo">☁️ AWS</span>
      <span class="console-navbar-service">${this._escapeHtml(this.service)}</span>
      <span style="flex: 1;"></span>
      <span style="font-size: 11px; color: var(--color-neutral-500);">🧪 Simulated Console</span>
    `;
    wrapper.appendChild(navbar);

    // Current step instruction bar
    if (this.steps.length > 0 && this.currentStep < this.steps.length) {
      const step = this.steps[this.currentStep];
      const instructionBar = document.createElement('div');
      instructionBar.style.cssText = 'padding: 12px 16px; background: var(--color-accent-50); border-bottom: 1px solid var(--color-accent-200); display: flex; align-items: flex-start; gap: 12px;';
      instructionBar.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 999px; background: var(--color-accent-500); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0;">
          ${this.currentStep + 1}
        </div>
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 600; color: var(--color-accent-700); margin-bottom: 2px;">
            ${this._escapeHtml(step.instruction)}
          </div>
          ${step.why ? `<div style="font-size: 12px; color: var(--color-accent-500);">💡 ${this._escapeHtml(step.why)}</div>` : ''}
        </div>
        <div style="font-size: 12px; color: var(--color-neutral-400);">
          Step ${this.currentStep + 1} of ${this.steps.length}
        </div>
      `;
      wrapper.appendChild(instructionBar);
    }

    // Console breadcrumb
    const step = this.steps[this.currentStep];
    const screen = step ? this.screens[step.targetScreen] : Object.values(this.screens)[0];
    
    if (screen?.breadcrumb) {
      const breadcrumb = document.createElement('div');
      breadcrumb.className = 'console-breadcrumb';
      breadcrumb.innerHTML = screen.breadcrumb.map((b, i) => 
        i < screen.breadcrumb.length - 1 
          ? `<span style="color: var(--color-accent-600); cursor: pointer;">${this._escapeHtml(b)}</span><span style="color: var(--color-neutral-300);">›</span>`
          : `<span style="color: var(--color-neutral-700); font-weight: 500;">${this._escapeHtml(b)}</span>`
      ).join('');
      wrapper.appendChild(breadcrumb);
    }

    // Console body
    const body = document.createElement('div');
    body.className = 'console-body';
    body.id = 'console-sim-body';
    
    if (screen?.html) {
      body.innerHTML = screen.html;
    } else {
      body.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">☁️</div>
          <div class="empty-state-title">Welcome to ${this._escapeHtml(this.service)}</div>
          <div class="empty-state-desc">This is a simulated AWS Console for learning purposes.</div>
        </div>
      `;
    }

    // Bind click handlers to interactive elements
    setTimeout(() => {
      this._bindInteractions(body);
    }, 100);

    wrapper.appendChild(body);

    // Feedback area
    this.feedbackArea = document.createElement('div');
    this.feedbackArea.id = 'console-feedback';
    this.feedbackArea.style.cssText = 'display: none; padding: 12px 16px; border-top: 1px solid var(--border-color);';
    wrapper.appendChild(this.feedbackArea);

    // Progress
    if (this.steps.length > 0) {
      const progressDiv = document.createElement('div');
      progressDiv.style.cssText = 'padding: 8px 16px; border-top: 1px solid var(--border-color); background: var(--color-neutral-50);';
      const pct = Math.round((this.completedSteps.size / this.steps.length) * 100);
      progressDiv.innerHTML = `
        <div class="progress-bar progress-bar-sm">
          <div class="progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      wrapper.appendChild(progressDiv);
    }

    this.container.appendChild(wrapper);
  }

  _bindInteractions(body) {
    if (this.currentStep >= this.steps.length) return;
    const step = this.steps[this.currentStep];
    if (!step) return;

    // Find and highlight target element
    const targets = body.querySelectorAll('.console-clickable');
    targets.forEach(el => {
      el.addEventListener('click', (e) => {
        const clickedId = el.dataset.actionId;
        if (clickedId === step.id) {
          this._onCorrectAction(step);
        } else {
          this._onIncorrectAction(step, el);
        }
      });

      // Highlight the correct target
      if (el.dataset.actionId === step.id) {
        el.classList.add('highlight-pulse');
      }
    });
  }

  _onCorrectAction(step) {
    this.completedSteps.add(step.id);
    this._showFeedback(step.feedback?.correct || 'Correct! Well done.', 'success');
    
    setTimeout(() => {
      this.currentStep++;
      if (this.currentStep >= this.steps.length) {
        this._showCompletion();
      } else {
        this._render();
      }
    }, 1500);
  }

  _onIncorrectAction(step, element) {
    const feedback = step.feedback?.incorrect || 'That\'s not quite right. Try again.';
    this._showFeedback(feedback, 'error');
  }

  _showFeedback(message, type) {
    const fb = this.feedbackArea || document.getElementById('console-feedback');
    if (!fb) return;
    fb.style.display = 'block';
    fb.style.background = type === 'success' ? 'var(--color-success-50)' : 'var(--color-error-50)';
    fb.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: ${type === 'success' ? 'var(--color-success-700)' : 'var(--color-error-700)'};">
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${this._escapeHtml(message)}</span>
      </div>
    `;
  }

  _showCompletion() {
    const body = document.getElementById('console-sim-body');
    if (body) {
      body.innerHTML = `
        <div class="empty-state" style="padding: 48px;">
          <div class="empty-state-icon">🎉</div>
          <div class="empty-state-title" style="color: var(--color-success-600);">Lab Complete!</div>
          <div class="empty-state-desc">You successfully navigated the ${this._escapeHtml(this.service)} console.</div>
        </div>
      `;
    }
    if (this.onComplete) this.onComplete();
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  reset() {
    this.currentStep = 0;
    this.completedSteps.clear();
    this._render();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsoleSimulator;
} else {
  window.ConsoleSimulator = ConsoleSimulator;
}
