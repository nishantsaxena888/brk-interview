/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — QUIZ ENGINE
 * Interactive quiz system supporting multiple question types
 * ============================================================
 * 
 * 100% REUSABLE — all questions, answers, explanations, and
 * scoring logic passed via configuration.
 */
class QuizEngine {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {Array}    config.questions    - Array of question objects
   * @param {string}   config.title        - Quiz title
   * @param {string}   config.type         - 'quick-check' | 'knowledge-check' | 'interview' | 'scenario' | 'debugging'
   * @param {Function} config.onComplete   - Callback(score, total) when quiz is submitted
   * @param {boolean}  config.showImmediate - Show correct/incorrect immediately (default true)
   * @param {boolean}  config.shuffleOptions - Shuffle answer options
   *
   * Question format:
   * {
   *   id: string,
   *   type: 'multiple-choice' | 'scenario' | 'debugging' | 'interview',
   *   question: string,
   *   options: [{ id: string, text: string }],
   *   correctId: string,
   *   explanation: string,
   *   difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert',
   *   interviewAnswer?: { short: string, deep: string, productionExample: string, commonMistake: string, followUp: string }
   * }
   */
  constructor(container, config = {}) {
    this.container = container;
    this.questions = config.questions || [];
    this.title = config.title || 'Knowledge Check';
    this.type = config.type || 'knowledge-check';
    this.onComplete = config.onComplete || null;
    this.showImmediate = config.showImmediate !== false;
    this.shuffleOptions = config.shuffleOptions || false;
    
    this.currentIndex = 0;
    this.answers = {};
    this.submitted = false;

    if (this.questions.length > 0) {
      this._render();
    }
  }

  _render() {
    this.container.innerHTML = '';

    if (this.questions.length === 0) {
      this.container.innerHTML = '<div class="text-muted text-sm">No questions available.</div>';
      return;
    }

    // Quiz wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'quiz-card';

    // Header
    const header = document.createElement('div');
    header.className = 'quiz-header';
    
    const iconMap = {
      'knowledge-check': '🧠',
      'quick-check': '⚡',
      'interview': '🎤',
      'scenario': '📋',
      'debugging': '🔍'
    };

    header.innerHTML = `
      <div class="quiz-icon">${iconMap[this.type] || '🧠'}</div>
      <div>
        <div class="quiz-type">${this._escapeHtml(this.type.replace('-', ' '))}</div>
        <div class="quiz-question" style="font-size: var(--text-lg);">${this._escapeHtml(this.title)}</div>
        <div style="font-size: var(--text-xs); color: var(--color-neutral-400); margin-top: 4px;">
          Question ${this.currentIndex + 1} of ${this.questions.length}
        </div>
      </div>
    `;
    wrapper.appendChild(header);

    // Progress bar for multi-question quizzes
    if (this.questions.length > 1) {
      const progressWrapper = document.createElement('div');
      progressWrapper.style.marginBottom = '20px';
      progressWrapper.innerHTML = `
        <div class="progress-bar progress-bar-sm">
          <div class="progress-bar-fill" style="width: ${((this.currentIndex) / this.questions.length) * 100}%"></div>
        </div>
      `;
      wrapper.appendChild(progressWrapper);
    }

    // Current question
    const q = this.questions[this.currentIndex];
    this._renderQuestion(wrapper, q);

    this.container.appendChild(wrapper);
  }

  _renderQuestion(wrapper, q) {
    // Question text
    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';
    questionDiv.style.cssText = 'margin-bottom: 16px; font-size: 15px; line-height: 1.6;';
    questionDiv.textContent = q.question;
    wrapper.appendChild(questionDiv);

    // Difficulty badge
    if (q.difficulty) {
      const badge = document.createElement('span');
      badge.className = `badge difficulty-${q.difficulty}`;
      badge.style.marginBottom = '16px';
      badge.style.display = 'inline-flex';
      badge.textContent = q.difficulty;
      wrapper.appendChild(badge);
    }

    // Options
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'quiz-options';
    
    const options = this.shuffleOptions ? this._shuffle([...q.options]) : q.options;
    const letters = 'ABCDEFGHIJ';

    options.forEach((opt, idx) => {
      const optBtn = document.createElement('div');
      optBtn.className = 'quiz-option';
      optBtn.dataset.optionId = opt.id;

      // Check if already answered
      if (this.answers[q.id] === opt.id) {
        optBtn.classList.add('selected');
      }

      optBtn.innerHTML = `
        <span class="quiz-option-letter">${letters[idx]}</span>
        <span>${this._escapeHtml(opt.text)}</span>
      `;

      optBtn.addEventListener('click', () => {
        if (this.submitted) return;
        this._selectOption(q, opt.id, optionsDiv);
      });

      optionsDiv.appendChild(optBtn);
    });
    wrapper.appendChild(optionsDiv);

    // Explanation (hidden initially)
    const explanation = document.createElement('div');
    explanation.className = 'quiz-explanation';
    explanation.id = `quiz-explanation-${q.id}`;
    explanation.innerHTML = `<strong>Explanation:</strong> ${this._escapeHtml(q.explanation || '')}`;
    wrapper.appendChild(explanation);

    // Interview answer details (for interview type)
    if (q.interviewAnswer) {
      const interviewPanel = document.createElement('div');
      interviewPanel.id = `quiz-interview-${q.id}`;
      interviewPanel.style.display = 'none';
      interviewPanel.innerHTML = this._renderInterviewAnswer(q.interviewAnswer);
      wrapper.appendChild(interviewPanel);
    }

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 16px;';

    if (this.showImmediate) {
      const checkBtn = document.createElement('button');
      checkBtn.className = 'btn btn-sm btn-accent';
      checkBtn.textContent = 'Check Answer';
      checkBtn.addEventListener('click', () => this._checkAnswer(q, optionsDiv));
      actionsDiv.appendChild(checkBtn);
    }

    if (this.questions.length > 1) {
      const navDiv = document.createElement('div');
      navDiv.className = 'flex gap-2';
      
      if (this.currentIndex > 0) {
        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-sm btn-secondary';
        prevBtn.textContent = '← Previous';
        prevBtn.addEventListener('click', () => this._goTo(this.currentIndex - 1));
        navDiv.appendChild(prevBtn);
      }

      if (this.currentIndex < this.questions.length - 1) {
        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-sm btn-primary';
        nextBtn.textContent = 'Next →';
        nextBtn.addEventListener('click', () => this._goTo(this.currentIndex + 1));
        navDiv.appendChild(nextBtn);
      } else {
        const finishBtn = document.createElement('button');
        finishBtn.className = 'btn btn-sm btn-success';
        finishBtn.textContent = '✓ Finish Quiz';
        finishBtn.addEventListener('click', () => this._finish());
        navDiv.appendChild(finishBtn);
      }
      
      actionsDiv.appendChild(navDiv);
    }

    wrapper.appendChild(actionsDiv);

    // Result area
    this.resultArea = document.createElement('div');
    this.resultArea.id = `quiz-result-${q.id}`;
    this.resultArea.style.marginTop = '12px';
    wrapper.appendChild(this.resultArea);
  }

  _selectOption(q, optionId, optionsDiv) {
    this.answers[q.id] = optionId;
    
    // Update visual selection
    optionsDiv.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.optionId === optionId) {
        opt.classList.add('selected');
      }
    });
  }

  _checkAnswer(q, optionsDiv) {
    const selectedId = this.answers[q.id];
    if (!selectedId) return;

    const isCorrect = selectedId === q.correctId;

    // Highlight correct/incorrect
    optionsDiv.querySelectorAll('.quiz-option').forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.optionId === q.correctId) {
        opt.classList.add('correct');
      } else if (opt.dataset.optionId === selectedId && !isCorrect) {
        opt.classList.add('incorrect');
      }
      // Disable clicking
      opt.style.pointerEvents = 'none';
    });

    // Show result
    const resultArea = document.getElementById(`quiz-result-${q.id}`);
    if (resultArea) {
      resultArea.innerHTML = `
        <div class="quiz-result ${isCorrect ? 'quiz-result-correct' : 'quiz-result-incorrect'}">
          ${isCorrect ? '✅ Correct!' : '❌ Incorrect'}
        </div>
      `;
    }

    // Show explanation
    const explanation = document.getElementById(`quiz-explanation-${q.id}`);
    if (explanation) {
      explanation.classList.add('visible');
    }

    // Show interview answer if available
    const interviewPanel = document.getElementById(`quiz-interview-${q.id}`);
    if (interviewPanel) {
      interviewPanel.style.display = 'block';
    }
  }

  _renderInterviewAnswer(answer) {
    let html = '<div style="margin-top: 16px; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;">';
    
    const sections = [
      { label: '📝 Short Interview Answer', content: answer.short, bg: 'var(--color-accent-50)' },
      { label: '🔬 Deep Technical Answer', content: answer.deep, bg: 'var(--color-neutral-50)' },
      { label: '🏭 Production Example', content: answer.productionExample, bg: 'var(--color-success-50)' },
      { label: '⚠️ Common Mistake', content: answer.commonMistake, bg: 'var(--color-warning-50)' },
      { label: '🔄 Follow-up Question', content: answer.followUp, bg: 'var(--color-info-50)' }
    ];

    sections.forEach(s => {
      if (s.content) {
        html += `
          <div style="padding: 12px 16px; background: ${s.bg}; border-bottom: 1px solid var(--border-color);">
            <div style="font-size: 12px; font-weight: 600; color: var(--color-neutral-600); margin-bottom: 4px;">${s.label}</div>
            <div style="font-size: 14px; line-height: 1.6; color: var(--color-neutral-700);">${this._escapeHtml(s.content)}</div>
          </div>
        `;
      }
    });

    html += '</div>';
    return html;
  }

  _goTo(index) {
    this.currentIndex = index;
    this._render();
  }

  _finish() {
    let correct = 0;
    this.questions.forEach(q => {
      if (this.answers[q.id] === q.correctId) correct++;
    });

    this.submitted = true;
    const total = this.questions.length;
    const percentage = Math.round((correct / total) * 100);

    // Show results summary
    this.container.innerHTML = '';
    const summary = document.createElement('div');
    summary.className = 'quiz-card';
    summary.innerHTML = `
      <div class="quiz-header">
        <div class="quiz-icon">${percentage >= 80 ? '🏆' : percentage >= 60 ? '📊' : '📚'}</div>
        <div>
          <div class="quiz-type">Quiz Results</div>
          <div class="quiz-question" style="font-size: var(--text-xl);">${this._escapeHtml(this.title)}</div>
        </div>
      </div>
      <div style="text-align: center; padding: 24px 0;">
        <div style="font-size: 48px; font-weight: 900; color: ${percentage >= 80 ? 'var(--color-success-500)' : percentage >= 60 ? 'var(--color-warning-500)' : 'var(--color-error-500)'};">
          ${percentage}%
        </div>
        <div style="font-size: 14px; color: var(--color-neutral-500); margin-top: 4px;">
          ${correct} of ${total} correct
        </div>
        <div style="margin-top: 12px;">
          <div class="progress-bar" style="max-width: 300px; margin: 0 auto;">
            <div class="progress-bar-fill" style="width: ${percentage}%; background: ${percentage >= 80 ? 'var(--color-success-500)' : percentage >= 60 ? 'var(--color-warning-500)' : 'var(--color-error-500)'};"></div>
          </div>
        </div>
      </div>
      <div style="text-align: center;">
        <button class="btn btn-sm btn-secondary" id="quiz-retry-btn">🔄 Retry</button>
        <button class="btn btn-sm btn-primary" id="quiz-review-btn" style="margin-left: 8px;">📋 Review Answers</button>
      </div>
    `;
    this.container.appendChild(summary);

    document.getElementById('quiz-retry-btn')?.addEventListener('click', () => this._retry());
    document.getElementById('quiz-review-btn')?.addEventListener('click', () => this._reviewAll());

    if (this.onComplete) {
      this.onComplete(correct, total);
    }
  }

  _retry() {
    this.answers = {};
    this.submitted = false;
    this.currentIndex = 0;
    this._render();
  }

  _reviewAll() {
    this.container.innerHTML = '';
    this.questions.forEach((q, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'quiz-card';
      wrapper.style.marginBottom = '16px';
      
      const isCorrect = this.answers[q.id] === q.correctId;
      
      wrapper.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <span style="font-size: 18px;">${isCorrect ? '✅' : '❌'}</span>
          <span style="font-weight: 600;">Q${idx + 1}: ${this._escapeHtml(q.question)}</span>
        </div>
        <div style="font-size: 14px; color: var(--color-neutral-600); margin-bottom: 8px;">
          Your answer: <strong>${this._escapeHtml(q.options.find(o => o.id === this.answers[q.id])?.text || 'No answer')}</strong>
        </div>
        ${!isCorrect ? `<div style="font-size: 14px; color: var(--color-success-700); margin-bottom: 8px;">
          Correct answer: <strong>${this._escapeHtml(q.options.find(o => o.id === q.correctId)?.text || '')}</strong>
        </div>` : ''}
        <div class="quiz-explanation visible">${this._escapeHtml(q.explanation || '')}</div>
      `;
      this.container.appendChild(wrapper);
    });

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-sm btn-secondary';
    backBtn.textContent = '← Back to Results';
    backBtn.addEventListener('click', () => this._finish());
    this.container.appendChild(backBtn);
  }

  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- PUBLIC API ---
  getScore() {
    let correct = 0;
    this.questions.forEach(q => {
      if (this.answers[q.id] === q.correctId) correct++;
    });
    return { correct, total: this.questions.length };
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuizEngine;
} else {
  window.QuizEngine = QuizEngine;
}
