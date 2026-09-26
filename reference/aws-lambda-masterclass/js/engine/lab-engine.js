/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — LAB ENGINE
 * State-machine-based lab with step validation
 * ============================================================
 */
class LabEngine {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {string}   config.title         - Lab title
   * @param {string}   config.description   - Lab description
   * @param {string}   config.difficulty     - beginner | intermediate | advanced
   * @param {string}   config.duration       - Estimated duration
   * @param {Array}    config.prerequisites  - Array of prerequisite strings
   * @param {Array}    config.steps          - Array of step objects
   * @param {Array}    config.resources      - Array of { name, status } resource state items
   * @param {Function} config.onComplete     - Callback when all steps are done
   *
   * Step format:
   * {
   *   id: string,
   *   title: string,
   *   description: string,
   *   type: 'instruction' | 'command' | 'code' | 'console' | 'verify',
   *   content: string | Object, // depends on type
   *   validation: { type: 'click' | 'auto', message: string },
   *   hints: string[],
   *   cleanup: string
   * }
   */
  constructor(container, config = {}) {
    this.container = container;
    this.title = config.title || 'Hands-on Lab';
    this.description = config.description || '';
    this.difficulty = config.difficulty || 'beginner';
    this.duration = config.duration || '15 min';
    this.prerequisites = config.prerequisites || [];
    this.steps = config.steps || [];
    this.resources = config.resources || [];
    this.onComplete = config.onComplete || null;
    
    this.currentStep = 0;
    this.completedSteps = new Set();
    this.resourceStatus = {};
    this.resources.forEach(r => {
      this.resourceStatus[r.name] = r.status || 'pending';
    });

    this._render();
  }

  _render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border: 2px solid var(--color-primary-200); border-radius: 16px; overflow: hidden; margin-bottom: 32px;';

    // Lab header
    const header = document.createElement('div');
    header.style.cssText = 'padding: 24px; background: linear-gradient(135deg, var(--color-primary-50), var(--color-neutral-50)); border-bottom: 1px solid var(--color-primary-200);';
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 24px;">🔬</span>
        <span class="badge difficulty-${this.difficulty}">${this.difficulty}</span>
        <span class="badge badge-neutral">⏱ ${this._escapeHtml(this.duration)}</span>
      </div>
      <h3 style="margin-bottom: 8px; color: var(--color-neutral-900);">${this._escapeHtml(this.title)}</h3>
      <p style="font-size: 14px; color: var(--color-neutral-600); margin-bottom: 0; line-height: 1.6;">${this._escapeHtml(this.description)}</p>
    `;
    wrapper.appendChild(header);

    // Prerequisites
    if (this.prerequisites.length > 0) {
      const prereqs = document.createElement('div');
      prereqs.style.cssText = 'padding: 12px 24px; background: var(--color-info-50); border-bottom: 1px solid var(--color-info-200); font-size: 13px;';
      prereqs.innerHTML = `
        <strong style="color: var(--color-info-600);">📋 Prerequisites:</strong>
        <span style="color: var(--color-info-600);">${this.prerequisites.map(p => this._escapeHtml(p)).join(' • ')}</span>
      `;
      wrapper.appendChild(prereqs);
    }

    // Resource tracker
    if (this.resources.length > 0) {
      const resourceTracker = document.createElement('div');
      resourceTracker.id = 'lab-resources';
      resourceTracker.style.cssText = 'padding: 16px 24px; border-bottom: 1px solid var(--border-color); background: var(--color-neutral-50);';
      resourceTracker.innerHTML = `
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-neutral-500); margin-bottom: 8px;">Resource State</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${this.resources.map(r => `
            <span id="resource-${this._slugify(r.name)}" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
              background: ${this.resourceStatus[r.name] === 'complete' ? 'var(--color-success-100)' : 'var(--color-neutral-100)'};
              color: ${this.resourceStatus[r.name] === 'complete' ? 'var(--color-success-700)' : 'var(--color-neutral-500)'};">
              ${this.resourceStatus[r.name] === 'complete' ? '✓' : '○'} ${this._escapeHtml(r.name)}
            </span>
          `).join('')}
        </div>
      `;
      wrapper.appendChild(resourceTracker);
    }

    // Progress bar
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = 'padding: 12px 24px; border-bottom: 1px solid var(--border-color);';
    const pct = this.steps.length > 0 ? Math.round((this.completedSteps.size / this.steps.length) * 100) : 0;
    progressDiv.innerHTML = `
      <div class="progress-label">
        <span class="progress-label-title">Lab Progress</span>
        <span class="progress-label-value">${pct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${pct}%;"></div>
      </div>
    `;
    wrapper.appendChild(progressDiv);

    // Steps
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'steps';
    stepsContainer.style.cssText = 'padding: 24px;';

    this.steps.forEach((step, idx) => {
      const isComplete = this.completedSteps.has(step.id);
      const isCurrent = idx === this.currentStep;
      const isLocked = idx > this.currentStep && !isComplete;

      const stepEl = document.createElement('div');
      stepEl.className = 'step-item';
      stepEl.id = `lab-step-${step.id}`;
      if (isCurrent) stepEl.style.background = 'var(--color-primary-50)';

      // Indicator
      const indicator = document.createElement('div');
      indicator.className = 'step-indicator';
      indicator.innerHTML = `
        <div class="step-circle ${isComplete ? 'step-circle-complete' : isCurrent ? 'step-circle-active' : 'step-circle-pending'}">
          ${isComplete ? '✓' : idx + 1}
        </div>
        ${idx < this.steps.length - 1 ? `<div class="step-line ${isComplete ? 'step-line-complete' : ''}"></div>` : ''}
      `;
      stepEl.appendChild(indicator);

      // Content
      const content = document.createElement('div');
      content.className = 'step-content';
      content.innerHTML = `
        <div class="step-title" style="${isLocked ? 'opacity: 0.5;' : ''}">${this._escapeHtml(step.title)}</div>
        <p class="step-desc" style="${isLocked ? 'opacity: 0.5;' : ''}">${this._escapeHtml(step.description || '')}</p>
      `;

      // Show step content if current
      if (isCurrent && !isComplete) {
        const stepBody = document.createElement('div');
        stepBody.style.cssText = 'margin-top: 12px; padding: 16px; background: var(--color-neutral-0); border: 1px solid var(--border-color); border-radius: 12px;';
        
        if (step.content) {
          const contentHtml = document.createElement('div');
          contentHtml.style.cssText = 'font-size: 14px; line-height: 1.7; color: var(--color-neutral-700); margin-bottom: 12px;';
          contentHtml.innerHTML = typeof step.content === 'string' ? this._escapeHtml(step.content) : '';
          stepBody.appendChild(contentHtml);
        }

        // Hints
        if (step.hints && step.hints.length > 0) {
          const hintsDiv = document.createElement('div');
          hintsDiv.style.cssText = 'margin-bottom: 12px;';
          const hintBtn = document.createElement('button');
          hintBtn.className = 'btn btn-xs btn-ghost';
          hintBtn.textContent = '💡 Show Hint';
          let hintIdx = 0;
          const hintContent = document.createElement('div');
          hintContent.style.cssText = 'display: none; margin-top: 8px; padding: 8px 12px; background: var(--color-warning-50); border-radius: 8px; font-size: 13px; color: var(--color-warning-600);';
          
          hintBtn.addEventListener('click', () => {
            if (hintIdx < step.hints.length) {
              hintContent.style.display = 'block';
              hintContent.textContent = `Hint ${hintIdx + 1}: ${step.hints[hintIdx]}`;
              hintIdx++;
              if (hintIdx >= step.hints.length) hintBtn.textContent = '(No more hints)';
            }
          });
          
          hintsDiv.appendChild(hintBtn);
          hintsDiv.appendChild(hintContent);
          stepBody.appendChild(hintsDiv);
        }

        // Complete button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-sm btn-success';
        completeBtn.textContent = step.validation?.message || '✓ Mark Complete';
        completeBtn.addEventListener('click', () => this.completeStep(step.id));
        stepBody.appendChild(completeBtn);

        content.appendChild(stepBody);
      }

      stepEl.appendChild(content);
      stepsContainer.appendChild(stepEl);
    });

    wrapper.appendChild(stepsContainer);

    // Cleanup section
    const cleanupSteps = this.steps.filter(s => s.cleanup);
    if (cleanupSteps.length > 0) {
      const cleanup = document.createElement('div');
      cleanup.style.cssText = 'padding: 16px 24px; border-top: 1px solid var(--border-color); background: var(--color-error-50);';
      cleanup.innerHTML = `
        <div style="font-weight: 600; color: var(--color-error-600); margin-bottom: 8px;">🧹 Cleanup</div>
        ${cleanupSteps.map(s => `<div style="font-size: 13px; color: var(--color-error-600); margin-bottom: 4px;">• ${this._escapeHtml(s.cleanup)}</div>`).join('')}
      `;
      wrapper.appendChild(cleanup);
    }

    this.container.appendChild(wrapper);
  }

  // --- PUBLIC API ---
  completeStep(stepId) {
    this.completedSteps.add(stepId);
    
    // Advance to next incomplete step
    const nextIdx = this.steps.findIndex((s, i) => i > this.currentStep && !this.completedSteps.has(s.id));
    if (nextIdx >= 0) {
      this.currentStep = nextIdx;
    } else {
      this.currentStep = this.steps.length; // all done
    }

    // Check if all steps complete
    if (this.completedSteps.size === this.steps.length) {
      if (this.onComplete) this.onComplete();
    }

    this._render();
  }

  updateResource(name, status) {
    this.resourceStatus[name] = status;
    const el = document.getElementById(`resource-${this._slugify(name)}`);
    if (el) {
      el.style.background = status === 'complete' ? 'var(--color-success-100)' : 'var(--color-neutral-100)';
      el.style.color = status === 'complete' ? 'var(--color-success-700)' : 'var(--color-neutral-500)';
      el.innerHTML = `${status === 'complete' ? '✓' : '○'} ${this._escapeHtml(name)}`;
    }
  }

  reset() {
    this.currentStep = 0;
    this.completedSteps.clear();
    this.resources.forEach(r => { this.resourceStatus[r.name] = 'pending'; });
    this._render();
  }

  _slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
  module.exports = LabEngine;
} else {
  window.LabEngine = LabEngine;
}
