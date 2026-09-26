/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — APP CONTROLLER
 * Main application initialization and coordination
 * ============================================================
 */

class App {
  constructor() {
    this.progress = null;
    this.currentModule = null;
  }

  /**
   * Initialize the landing page
   */
  initLanding() {
    // Initialize progress engine
    this.progress = new ProgressEngine({
      storageKey: 'aws-masterclass-progress',
      modules: COURSE_REGISTRY.modules
    });

    this._renderLandingStats();
    this._renderModuleCards();
    this._renderAchievements();
    this._setupTopbarProgress();

    // Listen for progress changes
    this.progress.onChange(() => {
      this._renderLandingStats();
      this._setupTopbarProgress();
    });
  }

  /**
   * Initialize a module lesson page
   */
  initModule(moduleData) {
    // Initialize progress engine
    this.progress = new ProgressEngine({
      storageKey: 'aws-masterclass-progress',
      modules: COURSE_REGISTRY.modules
    });

    this._setupTopbarProgress();
    this._renderSidebar();

    // Render lesson
    const lessonContainer = document.getElementById('lesson-content');
    if (lessonContainer && moduleData) {
      new LessonEngine(lessonContainer, moduleData, {}, this.progress);

      // Render table of contents in context panel
      this._renderTableOfContents(moduleData);
    }

    // Setup sidebar toggle
    this._setupSidebarToggle();

    // Listen for progress changes
    this.progress.onChange(() => {
      this._setupTopbarProgress();
      this._renderSidebar();
    });
  }

  // --- LANDING PAGE ---

  _renderLandingStats() {
    const stats = this.progress.getStats();
    const container = document.getElementById('dashboard-stats');
    if (!container) return;

    container.innerHTML = `
      <div class="stat-card hover-float">
        <div class="stat-card-icon" style="background: var(--color-primary-50); color: var(--color-primary-500);">📊</div>
        <div>
          <div class="stat-card-value">${stats.overallProgress}%</div>
          <div class="stat-card-label">Overall Progress</div>
        </div>
      </div>
      <div class="stat-card hover-float">
        <div class="stat-card-icon" style="background: var(--color-success-50); color: var(--color-success-500);">⌨️</div>
        <div>
          <div class="stat-card-value">${stats.commandsExecuted}</div>
          <div class="stat-card-label">Commands Executed</div>
        </div>
      </div>
      <div class="stat-card hover-float">
        <div class="stat-card-icon" style="background: var(--color-accent-50); color: var(--color-accent-500);">🧠</div>
        <div>
          <div class="stat-card-value">${stats.quizzesTaken}</div>
          <div class="stat-card-label">Quizzes Taken</div>
        </div>
      </div>
      <div class="stat-card hover-float">
        <div class="stat-card-icon" style="background: var(--color-warning-50); color: var(--color-warning-500);">🔬</div>
        <div>
          <div class="stat-card-value">${stats.labsCompleted}</div>
          <div class="stat-card-label">Labs Completed</div>
        </div>
      </div>
      <div class="stat-card hover-float">
        <div class="stat-card-icon" style="background: #fdf2f8; color: #ec4899;">🏆</div>
        <div>
          <div class="stat-card-value">${stats.challengesSolved}</div>
          <div class="stat-card-label">Challenges Solved</div>
        </div>
      </div>
      <div class="stat-card hover-float">
        <div class="stat-card-icon" style="background: #f5f3ff; color: #8b5cf6;">🎖️</div>
        <div>
          <div class="stat-card-value">${stats.achievementCount}</div>
          <div class="stat-card-label">Achievements</div>
        </div>
      </div>
    `;
  }

  _renderModuleCards() {
    const container = document.getElementById('module-grid');
    if (!container) return;

    container.innerHTML = COURSE_REGISTRY.modules.map(mod => {
      const progress = this.progress.getModuleProgress(mod.id);
      const isComplete = this.progress.isModuleComplete(mod.id);
      
      return `
        <a href="${mod.href}" class="card module-card hover-float" style="text-decoration: none;">
          <div class="card-body" style="padding: 24px;">
            <div class="module-number">${mod.number}</div>
            <div class="module-icon" style="background: ${mod.colorBg}; color: ${mod.color};">
              ${mod.icon}
            </div>
            <div class="module-title">${mod.title}</div>
            <div class="module-desc">${mod.productionStory || mod.description}</div>
            <div style="margin-top: 12px;">
              <div class="progress-label">
                <span class="progress-label-title" style="font-size: 12px;">${isComplete ? '✅ Complete' : 'Progress'}</span>
                <span class="progress-label-value" style="font-size: 12px;">${progress}%</span>
              </div>
              <div class="progress-bar progress-bar-sm">
                <div class="progress-bar-fill" style="width: ${progress}%;"></div>
              </div>
            </div>
            <div class="module-meta" style="margin-top: 12px;">
              <span class="badge difficulty-${mod.difficulty}">${mod.difficulty}</span>
              <span>⏱ ${mod.duration}</span>
              <span>📝 ${mod.lessons.length} lessons</span>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }

  _renderAchievements() {
    const container = document.getElementById('achievements-grid');
    if (!container) return;

    container.innerHTML = COURSE_REGISTRY.achievements.map(ach => {
      const earned = this.progress.hasAchievement(ach.id);
      return `
        <div class="achievement ${earned ? 'achievement-earned' : 'achievement-locked'}">
          <div class="achievement-icon">${ach.icon}</div>
          <div class="achievement-info">
            <div class="achievement-title">${ach.title}</div>
            <div class="achievement-desc">${ach.description}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- MODULE PAGE ---

  _renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    nav.innerHTML = COURSE_REGISTRY.modules.map(mod => {
      const progress = this.progress.getModuleProgress(mod.id);
      const isComplete = this.progress.isModuleComplete(mod.id);
      const isActive = this.currentModule === mod.id;

      return `
        <li class="sidebar-nav-item">
          <a href="${isActive ? '#' : '../' + mod.href}" class="sidebar-nav-link ${isActive ? 'active' : ''}">
            <span class="nav-icon">${mod.icon}</span>
            <span class="nav-label">${mod.title}</span>
            ${isComplete ? '<span class="nav-badge nav-badge-complete">✓</span>' : 
              progress > 0 ? `<span class="nav-badge nav-badge-progress">${progress}%</span>` : ''}
          </a>
        </li>
      `;
    }).join('');
  }

  _renderTableOfContents(moduleData) {
    const container = document.getElementById('toc-list');
    if (!container || !moduleData.sections) return;

    container.innerHTML = moduleData.sections
      .filter(s => s.title)
      .map(s => `
        <li class="toc-item">
          <a class="toc-link" href="#section-${s.id}" onclick="document.getElementById('section-${s.id}')?.scrollIntoView({ behavior: 'smooth' }); return false;">
            ${s.title}
          </a>
        </li>
      `).join('');

    // Scroll spy
    this._setupScrollSpy(moduleData.sections.filter(s => s.title));
  }

  _setupScrollSpy(sections) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section-id') || entry.target.id?.replace('section-', '');
          document.querySelectorAll('.toc-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#section-${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, { threshold: 0.2, rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(s => {
      const el = document.getElementById(`section-${s.id}`);
      if (el) observer.observe(el);
    });
  }

  // --- TOPBAR ---

  _setupTopbarProgress() {
    const fill = document.getElementById('topbar-progress-fill');
    const text = document.getElementById('topbar-progress-text');
    if (!fill || !text) return;

    const progress = this.progress.getOverallProgress();
    fill.style.width = `${progress}%`;
    text.textContent = `${progress}%`;
  }

  // --- SIDEBAR TOGGLE ---

  _setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && 
          !sidebar.contains(e.target) && 
          !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
}

// Global instance
window.app = new App();
