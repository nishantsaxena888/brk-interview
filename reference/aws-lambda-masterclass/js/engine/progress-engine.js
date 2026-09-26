/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — PROGRESS ENGINE
 * Tracks course/module/lesson/section completion in localStorage
 * ============================================================
 * 
 * 100% REUSABLE — accepts course registry data via constructor.
 * Zero hardcoded module/lesson names.
 */
class ProgressEngine {
  /**
   * @param {Object} config
   * @param {string} config.storageKey - localStorage key prefix
   * @param {Array}  config.modules    - Array of { id, title, lessons: [{ id, title, sections: [] }] }
   */
  constructor(config = {}) {
    this.storageKey = config.storageKey || 'aws-masterclass-progress';
    this.modules = config.modules || [];
    this.data = this._load();
    this._listeners = [];
  }

  // --- PERSISTENCE ---
  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : this._createFresh();
    } catch {
      return this._createFresh();
    }
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this._notify();
    } catch (e) {
      console.warn('ProgressEngine: localStorage write failed', e);
    }
  }

  _createFresh() {
    return {
      version: 1,
      startedAt: new Date().toISOString(),
      modules: {},
      quizScores: {},
      challengeScores: {},
      commandsExecuted: 0,
      labsCompleted: 0,
      achievements: [],
      masteryLevel: 'beginner'
    };
  }

  // --- MODULE PROGRESS ---
  markSectionComplete(moduleId, lessonId, sectionId) {
    this._ensureModule(moduleId);
    this._ensureLesson(moduleId, lessonId);
    const sections = this.data.modules[moduleId].lessons[lessonId].sections;
    if (!sections.includes(sectionId)) {
      sections.push(sectionId);
    }
    this._updateLessonCompletion(moduleId, lessonId);
    this._updateModuleCompletion(moduleId);
    this._checkMastery();
    this._save();
  }

  markLessonComplete(moduleId, lessonId) {
    this._ensureModule(moduleId);
    this._ensureLesson(moduleId, lessonId);
    this.data.modules[moduleId].lessons[lessonId].complete = true;
    this.data.modules[moduleId].lessons[lessonId].completedAt = new Date().toISOString();
    this._updateModuleCompletion(moduleId);
    this._checkMastery();
    this._save();
  }

  markModuleComplete(moduleId) {
    this._ensureModule(moduleId);
    this.data.modules[moduleId].complete = true;
    this.data.modules[moduleId].completedAt = new Date().toISOString();
    this._checkMastery();
    this._save();
  }

  // --- QUIZ SCORES ---
  recordQuizScore(moduleId, quizId, score, total) {
    const key = `${moduleId}:${quizId}`;
    this.data.quizScores[key] = {
      score,
      total,
      percentage: Math.round((score / total) * 100),
      timestamp: new Date().toISOString()
    };
    this._save();
  }

  getQuizScore(moduleId, quizId) {
    return this.data.quizScores[`${moduleId}:${quizId}`] || null;
  }

  // --- CHALLENGE SCORES ---
  recordChallengeScore(moduleId, challengeId, score, maxScore) {
    const key = `${moduleId}:${challengeId}`;
    this.data.challengeScores[key] = {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      timestamp: new Date().toISOString()
    };
    this._save();
  }

  // --- COMMANDS ---
  incrementCommandsExecuted() {
    this.data.commandsExecuted++;
    this._save();
  }

  incrementLabsCompleted() {
    this.data.labsCompleted++;
    this._save();
  }

  // --- ACHIEVEMENTS ---
  grantAchievement(achievementId) {
    if (!this.data.achievements.includes(achievementId)) {
      this.data.achievements.push(achievementId);
      this._save();
      return true; // new achievement
    }
    return false;
  }

  hasAchievement(achievementId) {
    return this.data.achievements.includes(achievementId);
  }

  // --- GETTERS ---
  getModuleProgress(moduleId) {
    const mod = this.data.modules[moduleId];
    if (!mod) return 0;
    const moduleDef = this.modules.find(m => m.id === moduleId);
    if (!moduleDef || !moduleDef.lessons || moduleDef.lessons.length === 0) return 0;
    const completed = Object.values(mod.lessons).filter(l => l.complete).length;
    return Math.round((completed / moduleDef.lessons.length) * 100);
  }

  getOverallProgress() {
    if (this.modules.length === 0) return 0;
    const total = this.modules.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0);
    if (total === 0) return 0;
    let completed = 0;
    this.modules.forEach(mod => {
      if (this.data.modules[mod.id]) {
        completed += Object.values(this.data.modules[mod.id].lessons).filter(l => l.complete).length;
      }
    });
    return Math.round((completed / total) * 100);
  }

  isLessonComplete(moduleId, lessonId) {
    return this.data.modules[moduleId]?.lessons?.[lessonId]?.complete || false;
  }

  isModuleComplete(moduleId) {
    return this.data.modules[moduleId]?.complete || false;
  }

  isSectionComplete(moduleId, lessonId, sectionId) {
    return this.data.modules[moduleId]?.lessons?.[lessonId]?.sections?.includes(sectionId) || false;
  }

  getMasteryLevel() {
    return this.data.masteryLevel;
  }

  getStats() {
    return {
      overallProgress: this.getOverallProgress(),
      commandsExecuted: this.data.commandsExecuted,
      labsCompleted: this.data.labsCompleted,
      achievementCount: this.data.achievements.length,
      quizzesTaken: Object.keys(this.data.quizScores).length,
      challengesSolved: Object.keys(this.data.challengeScores).length,
      masteryLevel: this.data.masteryLevel
    };
  }

  // --- LISTENERS ---
  onChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(l => l !== callback);
    };
  }

  _notify() {
    const stats = this.getStats();
    this._listeners.forEach(cb => cb(stats));
  }

  // --- RESET ---
  reset() {
    this.data = this._createFresh();
    this._save();
  }

  // --- INTERNAL ---
  _ensureModule(moduleId) {
    if (!this.data.modules[moduleId]) {
      this.data.modules[moduleId] = { lessons: {}, complete: false };
    }
  }

  _ensureLesson(moduleId, lessonId) {
    if (!this.data.modules[moduleId].lessons[lessonId]) {
      this.data.modules[moduleId].lessons[lessonId] = {
        sections: [],
        complete: false
      };
    }
  }

  _updateLessonCompletion(moduleId, lessonId) {
    const moduleDef = this.modules.find(m => m.id === moduleId);
    if (!moduleDef) return;
    const lessonDef = moduleDef.lessons?.find(l => l.id === lessonId);
    if (!lessonDef || !lessonDef.sections) return;
    const completed = this.data.modules[moduleId].lessons[lessonId].sections;
    if (lessonDef.sections.every(s => completed.includes(s.id || s))) {
      this.data.modules[moduleId].lessons[lessonId].complete = true;
      this.data.modules[moduleId].lessons[lessonId].completedAt = new Date().toISOString();
    }
  }

  _updateModuleCompletion(moduleId) {
    const moduleDef = this.modules.find(m => m.id === moduleId);
    if (!moduleDef || !moduleDef.lessons) return;
    const allComplete = moduleDef.lessons.every(l =>
      this.data.modules[moduleId]?.lessons?.[l.id]?.complete
    );
    if (allComplete) {
      this.data.modules[moduleId].complete = true;
      this.data.modules[moduleId].completedAt = new Date().toISOString();
    }
  }

  _checkMastery() {
    const progress = this.getOverallProgress();
    if (progress >= 90) this.data.masteryLevel = 'production-ready';
    else if (progress >= 70) this.data.masteryLevel = 'advanced';
    else if (progress >= 40) this.data.masteryLevel = 'intermediate';
    else this.data.masteryLevel = 'beginner';
  }
}

// Export for module or global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressEngine;
} else {
  window.ProgressEngine = ProgressEngine;
}
