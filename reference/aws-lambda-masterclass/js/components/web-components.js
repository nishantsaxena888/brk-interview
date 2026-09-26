/**
 * ==============================================================================
 * MASTERCLASS UI — HTML5 STANDARD WEB COMPONENTS (<ui-*>)
 * ==============================================================================
 * 
 * Provides drop-in custom HTML elements for any web framework (React, Vue, Plain HTML):
 * - <ui-terminal>
 * - <ui-code-editor>
 * - <ui-quiz>
 * - <ui-diagram>
 * - <ui-lab>
 * - <ui-command>
 */

(function() {
  'use strict';

  if (typeof customElements === 'undefined') return;

  function safeParseJson(str, fallback = {}) {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  }

  // ============================================================================
  // <ui-terminal>
  // ============================================================================
  class UiTerminalElement extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Terminal';
      const prompt = this.getAttribute('prompt') || '$ ';
      const mode = this.getAttribute('mode') || 'simulated';
      const initialText = this.getAttribute('initial-text') || '';
      
      // Look for nested script configuration
      const scriptTag = this.querySelector('script[type="application/json"]');
      const commands = scriptTag ? safeParseJson(scriptTag.textContent, {}) : {};

      const wrapper = document.createElement('div');
      wrapper.className = 'ui-terminal-wrapper';
      this.appendChild(wrapper);

      if (window.MasterclassUI) {
        this.engine = MasterclassUI.Terminal(wrapper, {
          title,
          prompt,
          mode,
          initialText,
          commands
        });
      }
    }
  }

  // ============================================================================
  // <ui-code-editor>
  // ============================================================================
  class UiCodeEditorElement extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Code Editor';
      const language = this.getAttribute('language') || 'python';
      let code = this.getAttribute('code') || '';
      
      // Or read inner text/script
      const scriptTag = this.querySelector('script[type="text/plain"]') || this.querySelector('code');
      if (scriptTag) {
        code = scriptTag.textContent.trim();
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'ui-code-editor-wrapper';
      this.appendChild(wrapper);

      if (window.MasterclassUI) {
        this.engine = MasterclassUI.CodeEditor(wrapper, {
          title,
          language,
          code
        });
      }
    }
  }

  // ============================================================================
  // <ui-quiz>
  // ============================================================================
  class UiQuizElement extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Assessment';
      const scriptTag = this.querySelector('script[type="application/json"]');
      const questions = scriptTag ? safeParseJson(scriptTag.textContent, []) : [];

      const wrapper = document.createElement('div');
      wrapper.className = 'ui-quiz-wrapper';
      this.appendChild(wrapper);

      if (window.MasterclassUI) {
        this.engine = MasterclassUI.Quiz(wrapper, {
          title,
          questions
        });
      }
    }
  }

  // ============================================================================
  // <ui-command>
  // ============================================================================
  class UiCommandElement extends HTMLElement {
    connectedCallback() {
      const title = this.getAttribute('title') || 'Execute Command';
      const command = this.getAttribute('command') || '';
      const description = this.getAttribute('description') || '';

      const wrapper = document.createElement('div');
      wrapper.className = 'ui-command-wrapper';
      this.appendChild(wrapper);

      if (window.MasterclassUI) {
        this.engine = MasterclassUI.CommandBlock(wrapper, {
          title,
          command,
          description
        });
      }
    }
  }

  // Register Custom Elements
  if (!customElements.get('ui-terminal')) {
    customElements.define('ui-terminal', UiTerminalElement);
  }
  if (!customElements.get('ui-code-editor')) {
    customElements.define('ui-code-editor', UiCodeEditorElement);
  }
  if (!customElements.get('ui-quiz')) {
    customElements.define('ui-quiz', UiQuizElement);
  }
  if (!customElements.get('ui-command')) {
    customElements.define('ui-command', UiCommandElement);
  }

})();
