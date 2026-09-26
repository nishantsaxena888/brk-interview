/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — LESSON ENGINE
 * Renders a complete lesson from structured data
 * ============================================================
 * 
 * Orchestrates all other engines (terminal, code editor, quiz,
 * challenge, lab, diagram, command block, console simulator)
 * to render a unified interactive lesson page.
 */
class LessonEngine {
  /**
   * @param {HTMLElement} container - Lesson content area
   * @param {Object} lessonData     - Structured lesson object
   * @param {Object} engines        - References to engine classes
   * @param {Object} progress       - ProgressEngine instance
   *
   * lessonData format:
   * {
   *   id, moduleId, title, difficulty, duration, objectives[],
   *   prerequisites[], sections: [{
   *     id, type, title, icon, content (varies by type)
   *   }]
   * }
   *
   * Section types:
   * - 'text': { html }
   * - 'why': { html }
   * - 'architecture': { diagram config }
   * - 'concept': { html }
   * - 'lab': { lab config }
   * - 'console': { console config }
   * - 'terminal': { terminal config }
   * - 'code': { code editor config }
   * - 'command': { command block config }
   * - 'expected-output': { html }
   * - 'what-happened': { html }
   * - 'troubleshooting': { items[] }
   * - 'quiz': { quiz config }
   * - 'challenge': { challenge config }
   * - 'cleanup': { html }
   * - 'next': { nextLesson config }
   */
  constructor(container, lessonData, engines = {}, progress = null) {
    this.container = container;
    this.lesson = lessonData;
    this.engines = engines;
    this.progress = progress;
    this.sectionElements = {};
    this.activeEngines = [];

    this._render();
    this._setupIntersectionObserver();
  }

  _render() {
    this.container.innerHTML = '';
    
    // Lesson header
    this._renderHeader();
    
    // Render each section
    if (this.lesson.sections) {
      this.lesson.sections.forEach(section => {
        this._renderSection(section);
      });
    }
  }

  _renderHeader() {
    const header = document.createElement('div');
    header.className = 'lesson-header';

    // Breadcrumbs
    header.innerHTML = `
      <div class="breadcrumbs">
        <a href="../index.html">Course</a>
        <span class="separator">›</span>
        <span class="current">${this._escapeHtml(this.lesson.title)}</span>
      </div>
      <div class="lesson-header-meta">
        <span class="badge difficulty-${this.lesson.difficulty || 'beginner'}">${this.lesson.difficulty || 'Beginner'}</span>
        <span class="badge badge-neutral">⏱ ${this._escapeHtml(this.lesson.duration || '30 min')}</span>
        ${this.lesson.prerequisites?.length ? `<span class="badge badge-accent">Requires: ${this.lesson.prerequisites.join(', ')}</span>` : ''}
      </div>
      <h1>${this._escapeHtml(this.lesson.title)}</h1>
      ${this.lesson.description ? `<p class="lesson-header-desc">${this._escapeHtml(this.lesson.description)}</p>` : ''}
    `;

    // Learning objectives
    if (this.lesson.objectives?.length) {
      const objectives = document.createElement('div');
      objectives.className = 'lesson-objectives';
      objectives.innerHTML = `
        <h4>🎯 Learning Objectives</h4>
        <ul>
          ${this.lesson.objectives.map(obj => `<li>${this._escapeHtml(obj)}</li>`).join('')}
        </ul>
      `;
      header.appendChild(objectives);
    }

    this.container.appendChild(header);
  }

  _renderSection(section) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'lesson-section reveal';
    sectionEl.id = `section-${section.id}`;
    sectionEl.setAttribute('data-section-id', section.id);

    // Section header
    if (section.title) {
      const iconMap = {
        'why': '💡', 'architecture': '📐', 'concept': '📖',
        'lab': '🔬', 'console': '🖥️', 'terminal': '💻',
        'code': '👨‍💻', 'command': '⌨️', 'expected-output': '📤',
        'what-happened': '🔍', 'troubleshooting': '🔧', 'quiz': '🧠',
        'challenge': '🏆', 'cleanup': '🧹', 'next': '➡️', 'text': '📝',
        'interview': '🎙️'
      };
      const icon = section.icon || iconMap[section.type] || '📌';

      const headerEl = document.createElement('div');
      headerEl.className = 'lesson-section-header';
      headerEl.innerHTML = `
        <div class="lesson-section-icon" style="background: var(--color-neutral-100);">${icon}</div>
        <h2>${this._escapeHtml(section.title)}</h2>
      `;
      sectionEl.appendChild(headerEl);
    }

    // Section body - render based on type
    const bodyEl = document.createElement('div');
    bodyEl.className = 'lesson-section-body';
    
    switch (section.type) {
      case 'text':
      case 'why':
      case 'concept':
      case 'expected-output':
      case 'what-happened':
      case 'cleanup':
        this._renderTextSection(bodyEl, section);
        break;
      case 'architecture':
        this._renderArchitectureSection(bodyEl, section);
        break;
      case 'lab':
        this._renderLabSection(bodyEl, section);
        break;
      case 'console':
        this._renderConsoleSection(bodyEl, section);
        break;
      case 'terminal':
        this._renderTerminalSection(bodyEl, section);
        break;
      case 'code':
        this._renderCodeSection(bodyEl, section);
        break;
      case 'command':
        this._renderCommandSection(bodyEl, section);
        break;
      case 'troubleshooting':
        this._renderTroubleshootingSection(bodyEl, section);
        break;
      case 'quiz':
        this._renderQuizSection(bodyEl, section);
        break;
      case 'challenge':
        this._renderChallengeSection(bodyEl, section);
        break;
      case 'interview':
        this._renderInterviewSection(bodyEl, section);
        break;
      case 'next':
        this._renderNextSection(bodyEl, section);
        break;
      default:
        this._renderTextSection(bodyEl, section);
    }

    sectionEl.appendChild(bodyEl);

    // Section completion marker
    const completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-xs btn-ghost';
    completeBtn.style.cssText = 'margin-top: 16px; color: var(--color-neutral-400);';
    const isComplete = this.progress?.isSectionComplete(this.lesson.moduleId, this.lesson.id, section.id);
    completeBtn.textContent = isComplete ? '✅ Section Complete' : '☐ Mark as Read';
    if (isComplete) {
      completeBtn.style.color = 'var(--color-success-500)';
    }
    completeBtn.addEventListener('click', () => {
      if (this.progress) {
        this.progress.markSectionComplete(this.lesson.moduleId, this.lesson.id, section.id);
        completeBtn.textContent = '✅ Section Complete';
        completeBtn.style.color = 'var(--color-success-500)';
      }
    });
    sectionEl.appendChild(completeBtn);

    this.sectionElements[section.id] = sectionEl;
    this.container.appendChild(sectionEl);
  }

  // --- SECTION RENDERERS ---

  _renderTextSection(el, section) {
    const div = document.createElement('div');
    div.style.cssText = 'font-size: 15px; line-height: 1.8; color: var(--color-neutral-700);';
    div.innerHTML = section.content?.html || section.content || '';
    el.appendChild(div);
  }

  _renderArchitectureSection(el, section) {
    const diagramContainer = document.createElement('div');
    const diagram = new DiagramEngine(diagramContainer, section.content || {});
    this.activeEngines.push(diagram);
    el.appendChild(diagramContainer);
  }

  _renderLabSection(el, section) {
    const labContainer = document.createElement('div');
    const lab = new LabEngine(labContainer, {
      ...section.content,
      onComplete: () => {
        if (this.progress) {
          this.progress.incrementLabsCompleted();
          this.progress.markSectionComplete(this.lesson.moduleId, this.lesson.id, section.id);
        }
      }
    });
    this.activeEngines.push(lab);
    el.appendChild(labContainer);
  }

  _renderConsoleSection(el, section) {
    const consoleContainer = document.createElement('div');
    const sim = new ConsoleSimulator(consoleContainer, section.content || {});
    this.activeEngines.push(sim);
    el.appendChild(consoleContainer);
  }

  _renderTerminalSection(el, section) {
    const termContainer = document.createElement('div');
    const term = new TerminalEngine(termContainer, {
      ...section.content,
      onCommand: (cmd, resp, matched) => {
        if (this.progress && matched) {
          this.progress.incrementCommandsExecuted();
        }
      }
    });
    this.activeEngines.push(term);
    el.appendChild(termContainer);
  }

  _renderCodeSection(el, section) {
    const codeContainer = document.createElement('div');
    const editor = new CodeEditorEngine(codeContainer, section.content || {});
    this.activeEngines.push(editor);
    el.appendChild(codeContainer);
  }

  _renderCommandSection(el, section) {
    if (Array.isArray(section.content)) {
      section.content.forEach(cmd => {
        const cmdContainer = document.createElement('div');
        const block = new CommandBlock(cmdContainer, cmd);
        this.activeEngines.push(block);
        el.appendChild(cmdContainer);
      });
    } else {
      const cmdContainer = document.createElement('div');
      const block = new CommandBlock(cmdContainer, section.content || {});
      this.activeEngines.push(block);
      el.appendChild(cmdContainer);
    }
  }

  _renderTroubleshootingSection(el, section) {
    const items = section.content?.items || section.content || [];
    items.forEach(item => {
      const accordion = document.createElement('div');
      accordion.className = 'accordion-item';
      accordion.innerHTML = `
        <button class="accordion-header">
          <span>⚠️ ${this._escapeHtml(item.error || item.title || '')}</span>
          <span class="chevron">▼</span>
        </button>
        <div class="accordion-body">
          <div class="accordion-body-inner">
            ${item.cause ? `<p><strong>Cause:</strong> ${this._escapeHtml(item.cause)}</p>` : ''}
            ${item.fix ? `<p><strong>Fix:</strong> ${this._escapeHtml(item.fix)}</p>` : ''}
            ${item.prevention ? `<p><strong>Prevention:</strong> ${this._escapeHtml(item.prevention)}</p>` : ''}
          </div>
        </div>
      `;
      accordion.querySelector('.accordion-header').addEventListener('click', () => {
        accordion.classList.toggle('open');
      });
      el.appendChild(accordion);
    });
  }

  _renderQuizSection(el, section) {
    const quizContainer = document.createElement('div');
    const quiz = new QuizEngine(quizContainer, {
      ...section.content,
      onComplete: (score, total) => {
        if (this.progress) {
          this.progress.recordQuizScore(this.lesson.moduleId, section.id, score, total);
          this.progress.markSectionComplete(this.lesson.moduleId, this.lesson.id, section.id);
        }
      }
    });
    this.activeEngines.push(quiz);
    el.appendChild(quizContainer);
  }

  _renderChallengeSection(el, section) {
    const challengeContainer = document.createElement('div');
    const challenge = new ChallengeEngine(challengeContainer, {
      ...section.content,
      onComplete: (score, maxScore) => {
        if (this.progress) {
          this.progress.recordChallengeScore(this.lesson.moduleId, section.id, score, maxScore);
          this.progress.markSectionComplete(this.lesson.moduleId, this.lesson.id, section.id);
        }
      }
    });
    this.activeEngines.push(challenge);
    el.appendChild(challengeContainer);
  }

  _renderInterviewSection(el, section) {
    const questions = section.content?.questions || section.content || [];
    const diffColors = { beginner: 'var(--color-success-500)', intermediate: 'var(--color-warning-500)', advanced: 'var(--color-error-500, #ef4444)', scenario: 'var(--color-primary-500)', troubleshooting: 'var(--color-accent-500, #8b5cf6)' };
    const diffBg = { beginner: 'var(--color-success-50)', intermediate: 'var(--color-warning-50)', advanced: '#fef2f2', scenario: 'var(--color-primary-50)', troubleshooting: '#f5f3ff' };

    // Group by difficulty
    const groups = {};
    questions.forEach(q => {
      const d = (q.difficulty || 'beginner').toLowerCase();
      if (!groups[d]) groups[d] = [];
      groups[d].push(q);
    });

    const order = ['beginner', 'intermediate', 'advanced', 'scenario', 'troubleshooting'];
    const labels = { beginner: '🌱 Beginner', intermediate: '📈 Intermediate', advanced: '🚀 Advanced', scenario: '🎯 Scenario-Based', troubleshooting: '🔧 Troubleshooting' };

    order.forEach(level => {
      const items = groups[level];
      if (!items || items.length === 0) return;

      const groupDiv = document.createElement('div');
      groupDiv.style.cssText = 'margin-bottom: 24px;';
      groupDiv.innerHTML = `<h4 style="margin-bottom: 12px; color: ${diffColors[level] || 'var(--color-neutral-700)'};">${labels[level] || level}</h4>`;

      items.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'accordion-item';
        card.style.cssText = 'margin-bottom: 8px; border-left: 3px solid ' + (diffColors[level] || '#6366f1') + ';';
        card.innerHTML = `
          <button class="accordion-header" style="padding: 12px 16px;">
            <span style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background: ${diffBg[level] || '#eef2ff'}; color: ${diffColors[level] || '#6366f1'}; font-weight: 600;">${level.charAt(0).toUpperCase() + level.slice(1)}</span>
              <span>Q${idx + 1}: ${this._escapeHtml(q.question)}</span>
            </span>
            <span class="chevron">▼</span>
          </button>
          <div class="accordion-body">
            <div class="accordion-body-inner" style="padding: 16px;">
              ${q.shortAnswer ? `<div style="margin-bottom: 12px;"><strong style="color: var(--color-success-600, #16a34a);">Short Answer:</strong><br>${this._escapeHtml(q.shortAnswer)}</div>` : ''}
              ${q.deepExplanation ? `<div style="margin-bottom: 12px; padding: 12px; background: var(--color-neutral-50, #f9fafb); border-radius: 8px;"><strong>Deep Explanation:</strong><br>${this._escapeHtml(q.deepExplanation)}</div>` : ''}
              ${q.example ? `<div style="margin-bottom: 12px;"><strong>📌 Real-world Example:</strong><br>${this._escapeHtml(q.example)}</div>` : ''}
              ${q.commonMistake ? `<div style="margin-bottom: 12px; padding: 8px 12px; background: #fef2f2; border-radius: 6px; border-left: 3px solid #ef4444;"><strong>⚠️ Common Mistake:</strong> ${this._escapeHtml(q.commonMistake)}</div>` : ''}
              ${q.followUp ? `<div style="margin-top: 8px; padding: 8px 12px; background: var(--color-primary-50, #eef2ff); border-radius: 6px;"><strong>➔ Follow-up:</strong> ${this._escapeHtml(q.followUp)}</div>` : ''}
            </div>
          </div>
        `;
        card.querySelector('.accordion-header').addEventListener('click', () => {
          card.classList.toggle('open');
        });
        groupDiv.appendChild(card);
      });

      el.appendChild(groupDiv);
    });
  }

  _renderNextSection(el, section) {
    const nav = document.createElement('div');
    nav.className = 'lesson-nav';
    
    if (section.content?.prev) {
      nav.innerHTML += `
        <a class="lesson-nav-btn prev" href="${section.content.prev.url || '#'}">
          <span class="lesson-nav-btn-label">← Previous Lesson</span>
          <span class="lesson-nav-btn-title">${this._escapeHtml(section.content.prev.title || '')}</span>
        </a>
      `;
    }
    if (section.content?.next) {
      nav.innerHTML += `
        <a class="lesson-nav-btn next" href="${section.content.next.url || '#'}">
          <span class="lesson-nav-btn-label">Next Lesson →</span>
          <span class="lesson-nav-btn-title">${this._escapeHtml(section.content.next.title || '')}</span>
        </a>
      `;
    }
    el.appendChild(nav);
  }

  // --- INTERSECTION OBSERVER ---
  _setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // --- TABLE OF CONTENTS ---
  getTableOfContents() {
    return (this.lesson.sections || [])
      .filter(s => s.title)
      .map(s => ({
        id: s.id,
        title: s.title,
        type: s.type
      }));
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    this.activeEngines.forEach(e => e.destroy && e.destroy());
    this.activeEngines = [];
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LessonEngine;
} else {
  window.LessonEngine = LessonEngine;
}
