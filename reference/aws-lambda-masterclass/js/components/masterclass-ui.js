/**
 * ==============================================================================
 * MASTERCLASS UI — UNIFIED REUSABLE COMPONENT LIBRARY
 * ==============================================================================
 * 
 * Strict 1000% Component Reusability Compliance:
 * 1. Zero Hardcoding: All data, titles, questions, code passed via options
 * 2. Decoupled Callbacks: Accepts execution callbacks and API endpoints
 * 3. Domain Neutral: Works for AWS, Python, Docker, or any technical subject
 * 4. Universal Compatibility: Standalone Vanilla JS & Web Component support
 */

(function(root) {
  'use strict';

  const MasterclassUI = {
    version: '1.0.0',

    /**
     * Helper to resolve target element (ID string or DOM element)
     */
    _resolveTarget(target) {
      if (typeof target === 'string') {
        const el = document.getElementById(target) || document.querySelector(target);
        if (!el) {
          throw new Error(`[MasterclassUI] Element '${target}' not found in document.`);
        }
        return el;
      }
      return target;
    },

    /**
     * Terminal Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - title {string}
     *   - prompt {string}
     *   - mode {'simulated'|'real'}
     *   - commands {Object} Map of command pattern to responses
     *   - onCommand {Function} Callback (command, terminal)
     *   - initialText {string}
     */
    Terminal(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof TerminalEngine === 'undefined') {
        console.error('[MasterclassUI] TerminalEngine not loaded.');
        return null;
      }
      return new TerminalEngine(container, {
        title: options.title || 'Terminal Console',
        prompt: options.prompt || '$ ',
        mode: options.mode || 'simulated',
        commands: options.commands || {},
        onCommand: options.onCommand || null,
        showActions: options.showActions !== false,
        initialText: options.initialText || ''
      });
    },

    /**
     * Code Editor Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - title {string}
     *   - language {string} (python, javascript, bash, json)
     *   - code {string}
     *   - onRun {Function}
     *   - onReset {Function}
     */
    CodeEditor(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof CodeEditorEngine === 'undefined') {
        console.error('[MasterclassUI] CodeEditorEngine not loaded.');
        return null;
      }
      return new CodeEditorEngine(container, {
        title: options.title || 'Code Workspace',
        language: options.language || 'python',
        code: options.code || '',
        readOnly: options.readOnly || false,
        onRun: options.onRun || null,
        onReset: options.onReset || null
      });
    },

    /**
     * Quiz Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - title {string}
     *   - questions {Array} Array of question objects:
     *       [{ id, question, options: [], correctIndex, explanation }]
     *   - onSubmit {Function} (results, score)
     *   - onQuestionAnswer {Function} (questionId, selectedIndex, isCorrect)
     */
    Quiz(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof QuizEngine === 'undefined') {
        console.error('[MasterclassUI] QuizEngine not loaded.');
        return null;
      }
      return new QuizEngine(container, {
        title: options.title || 'Knowledge Assessment',
        questions: options.questions || [],
        onSubmit: options.onSubmit || null,
        onQuestionAnswer: options.onQuestionAnswer || null
      });
    },

    /**
     * Architecture Diagram Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - title {string}
     *   - nodes {Array}
     *   - connections {Array}
     *   - interactive {boolean}
     */
    Diagram(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof DiagramEngine === 'undefined') {
        console.error('[MasterclassUI] DiagramEngine not loaded.');
        return null;
      }
      return new DiagramEngine(container, {
        title: options.title || 'System Architecture Flow',
        nodes: options.nodes || [],
        connections: options.connections || [],
        interactive: options.interactive !== false
      });
    },

    /**
     * Step-by-Step Lab Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - title {string}
     *   - steps {Array} Array of step objects
     *   - onStepComplete {Function} (stepIndex)
     *   - onLabComplete {Function} ()
     */
    Lab(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof LabEngine === 'undefined') {
        console.error('[MasterclassUI] LabEngine not loaded.');
        return null;
      }
      return new LabEngine(container, {
        title: options.title || 'Hands-On Lab Scenario',
        steps: options.steps || [],
        onStepComplete: options.onStepComplete || null,
        onLabComplete: options.onLabComplete || null
      });
    },

    /**
     * Console Simulator Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - serviceName {string}
     *   - tabs {Array}
     *   - actions {Array}
     */
    ConsoleSimulator(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof ConsoleSimulator === 'undefined') {
        console.error('[MasterclassUI] ConsoleSimulator not loaded.');
        return null;
      }
      return new ConsoleSimulator(container, {
        serviceName: options.serviceName || 'Cloud Management Console',
        tabs: options.tabs || [],
        actions: options.actions || []
      });
    },

    /**
     * Command Block Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     *   - command {string}
     *   - title {string}
     *   - description {string}
     */
    CommandBlock(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof CommandBlock === 'undefined') {
        console.error('[MasterclassUI] CommandBlock not loaded.');
        return null;
      }
      return new CommandBlock(container, {
        command: options.command || '',
        title: options.title || '',
        description: options.description || ''
      });
    },

    /**
     * Challenge Component
     * @param {string|HTMLElement} target
     * @param {Object} options
     */
    Challenge(target, options = {}) {
      const container = this._resolveTarget(target);
      if (typeof ChallengeEngine === 'undefined') {
        console.error('[MasterclassUI] ChallengeEngine not loaded.');
        return null;
      }
      return new ChallengeEngine(container, options);
    }
  };

  // Expose to window / global
  root.MasterclassUI = MasterclassUI;

})(typeof window !== 'undefined' ? window : this);
