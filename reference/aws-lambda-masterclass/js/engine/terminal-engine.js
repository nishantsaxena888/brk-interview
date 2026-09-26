/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — TERMINAL ENGINE
 * Simulated CLI terminal with command registry
 * ============================================================
 * 
 * 100% REUSABLE — commands, prompts, and behaviors are all
 * injected via configuration. Zero hardcoded AWS commands.
 */
class TerminalEngine {
  /**
   * @param {HTMLElement} container - DOM element to render terminal into
   * @param {Object} config
   * @param {string}   config.title       - Terminal window title
   * @param {string}   config.prompt      - Prompt string (default: '$ ')
   * @param {string}   config.mode        - 'simulated' | 'real' (visual badge)
   * @param {Object}   config.commands    - Map of command patterns to responses
   * @param {Function} config.onCommand   - Callback when command is executed
   * @param {boolean}  config.showActions - Show action buttons below terminal
   * @param {string}   config.initialText - Text to show initially
   */
  constructor(container, config = {}) {
    this.container = container;
    this.title = config.title || 'Terminal';
    this.prompt = config.prompt || '$ ';
    this.mode = config.mode || 'simulated';
    this.commands = config.commands || {};
    this.onCommand = config.onCommand || null;
    this.showActions = config.showActions !== false;
    this.initialText = config.initialText || '';
    this.history = [];
    this.historyIndex = -1;
    this._outputLines = [];
    
    this._render();
    if (this.initialText) {
      this._addOutput(this.initialText, 'info');
    }
  }

  _render() {
    this.container.innerHTML = '';
    this.container.classList.add('terminal');

    // Header
    const header = document.createElement('div');
    header.className = 'terminal-header';
    header.innerHTML = `
      <span class="terminal-dot terminal-dot-red"></span>
      <span class="terminal-dot terminal-dot-yellow"></span>
      <span class="terminal-dot terminal-dot-green"></span>
      <span class="terminal-title">${this._escapeHtml(this.title)}</span>
      <span class="terminal-badge ${this.mode === 'real' ? 'terminal-badge-real' : 'terminal-badge-sim'}">
        ${this.mode === 'real' ? '☁️ REAL AWS' : '🧪 SIMULATED'}
      </span>
    `;
    this.container.appendChild(header);

    // Body
    this.body = document.createElement('div');
    this.body.className = 'terminal-body';
    this.container.appendChild(this.body);

    // Input line
    this.inputLine = document.createElement('div');
    this.inputLine.className = 'terminal-input-line';
    this.inputLine.innerHTML = `
      <span class="terminal-prompt"></span>
    `;
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'terminal-input';
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('spellcheck', 'false');
    this.input.placeholder = 'Type a command...';
    this.inputLine.appendChild(this.input);
    this.body.appendChild(this.inputLine);

    // Event listeners
    this.input.addEventListener('keydown', (e) => this._handleKeydown(e));

    // Actions bar
    if (this.showActions) {
      const actions = document.createElement('div');
      actions.className = 'terminal-actions';
      
      const clearBtn = this._createBtn('🗑️ Clear', () => this.clear());
      const resetBtn = this._createBtn('🔄 Reset', () => this.reset());
      actions.appendChild(clearBtn);
      actions.appendChild(resetBtn);
      this.container.appendChild(actions);
    }

    // Click to focus
    this.body.addEventListener('click', () => this.input.focus());
  }

  _createBtn(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-xs btn-ghost';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  _handleKeydown(e) {
    if (e.key === 'Enter') {
      const cmd = this.input.value.trim();
      if (cmd) {
        this._executeCommand(cmd);
        this.history.push(cmd);
        this.historyIndex = this.history.length;
      }
      this.input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.input.value = this.history[this.historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.input.value = this.history[this.historyIndex];
      } else {
        this.historyIndex = this.history.length;
        this.input.value = '';
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.clear();
    }
  }

  _executeCommand(cmd) {
    // Show the command in output
    this._addOutput(`$ ${cmd}`, 'command');

    // Find matching response
    let response = null;
    let matched = false;

    for (const [pattern, handler] of Object.entries(this.commands)) {
      // Support regex patterns (prefixed with /)
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        const regex = new RegExp(pattern.slice(1, -1));
        if (regex.test(cmd)) {
          response = typeof handler === 'function' ? handler(cmd) : handler;
          matched = true;
          break;
        }
      }
      // Support exact match
      else if (cmd === pattern || cmd.startsWith(pattern + ' ')) {
        response = typeof handler === 'function' ? handler(cmd) : handler;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Check for common commands
      if (cmd === 'clear') {
        this.clear();
        return;
      } else if (cmd === 'help') {
        this._showHelp();
        return;
      } else {
        response = {
          text: `bash: ${cmd.split(' ')[0]}: command not found\n\nAvailable commands in this lab: type 'help' for a list.`,
          type: 'error'
        };
      }
    }

    // Render response
    if (response) {
      if (typeof response === 'string') {
        this._addOutput(response, 'output');
      } else if (response.text) {
        this._addOutput(response.text, response.type || 'output');
      }
      if (response.explanation) {
        this._addOutput(`\n💡 ${response.explanation}`, 'info');
      }
    }

    // Callback
    if (this.onCommand) {
      this.onCommand(cmd, response, matched);
    }

    this._scrollToBottom();
  }

  _addOutput(text, type = 'output') {
    const line = document.createElement('div');
    
    if (type === 'command') {
      line.className = 'terminal-prompt';
      line.textContent = text.replace(/^\$ /, '');
    } else if (type === 'error') {
      line.className = 'terminal-error';
      line.textContent = text;
    } else if (type === 'success') {
      line.className = 'terminal-success';
      line.textContent = text;
    } else if (type === 'info') {
      line.className = 'terminal-output';
      line.style.color = '#7aa2f7';
      line.textContent = text;
    } else {
      line.className = 'terminal-output';
      line.textContent = text;
    }

    this._outputLines.push(line);
    // Insert before input line
    this.body.insertBefore(line, this.inputLine);
  }

  _showHelp() {
    const cmds = Object.keys(this.commands)
      .filter(k => !k.startsWith('/'))
      .map(k => `  ${k}`)
      .join('\n');
    this._addOutput(`Available commands:\n${cmds}\n\nSpecial:\n  clear    - Clear terminal\n  help     - Show this help`, 'info');
  }

  _scrollToBottom() {
    this.body.scrollTop = this.body.scrollHeight;
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- PUBLIC API ---

  /**
   * Execute a command programmatically (with typing animation)
   */
  async typeAndExecute(cmd, delay = 50) {
    this.input.value = '';
    for (let i = 0; i < cmd.length; i++) {
      this.input.value += cmd[i];
      await new Promise(r => setTimeout(r, delay));
    }
    await new Promise(r => setTimeout(r, 300));
    this._executeCommand(cmd);
    this.input.value = '';
  }

  /**
   * Add a raw output line
   */
  print(text, type = 'output') {
    this._addOutput(text, type);
    this._scrollToBottom();
  }

  /**
   * Clear terminal output
   */
  clear() {
    this._outputLines.forEach(l => l.remove());
    this._outputLines = [];
  }

  /**
   * Reset terminal (clear + re-show initial text)
   */
  reset() {
    this.clear();
    this.history = [];
    this.historyIndex = -1;
    if (this.initialText) {
      this._addOutput(this.initialText, 'info');
    }
  }

  /**
   * Update command registry
   */
  setCommands(commands) {
    this.commands = commands;
  }

  /**
   * Focus the input
   */
  focus() {
    this.input.focus();
  }

  /**
   * Destroy the terminal
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TerminalEngine;
} else {
  window.TerminalEngine = TerminalEngine;
}
