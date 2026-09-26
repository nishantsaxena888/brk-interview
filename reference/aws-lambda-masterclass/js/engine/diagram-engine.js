/**
 * ============================================================
 * AWS PRODUCTION MASTERCLASS — DIAGRAM ENGINE
 * Interactive SVG architecture diagrams
 * ============================================================
 */
class DiagramEngine {
  /**
   * @param {HTMLElement} container
   * @param {Object} config
   * @param {Array}   config.nodes     - [{ id, label, icon, x, y, type, description, eventPayload? }]
   * @param {Array}   config.edges     - [{ from, to, label, animated? }]
   * @param {string}  config.title     - Diagram title
   * @param {number}  config.width     - SVG width (default 800)
   * @param {number}  config.height    - SVG height (default 400)
   * @param {Function} config.onNodeClick - Callback(node) when a node is clicked
   */
  constructor(container, config = {}) {
    this.container = container;
    this.nodes = config.nodes || [];
    this.edges = config.edges || [];
    this.title = config.title || '';
    this.width = config.width || 800;
    this.height = config.height || 400;
    this.onNodeClick = config.onNodeClick || null;
    this.selectedNode = null;

    this._render();
  }

  _render() {
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; margin-bottom: 24px; background: var(--color-neutral-0);';

    // Title bar
    if (this.title) {
      const titleBar = document.createElement('div');
      titleBar.style.cssText = 'padding: 12px 20px; background: var(--color-neutral-50); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 8px;';
      titleBar.innerHTML = `
        <span style="font-size: 18px;">📐</span>
        <span style="font-weight: 600; font-size: 14px; color: var(--color-neutral-700);">${this._escapeHtml(this.title)}</span>
        <span style="font-size: 12px; color: var(--color-neutral-400); margin-left: auto;">Click components to inspect</span>
      `;
      wrapper.appendChild(titleBar);
    }

    // SVG diagram area
    const svgContainer = document.createElement('div');
    svgContainer.style.cssText = 'position: relative; overflow-x: auto; padding: 20px;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.width);
    svg.setAttribute('height', this.height);
    svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    svg.style.cssText = 'display: block; margin: 0 auto;';

    // Defs for arrow markers and gradients
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
      </marker>
      <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
      </marker>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
      </filter>
    `;
    svg.appendChild(defs);

    // Draw edges
    this.edges.forEach(edge => {
      const fromNode = this.nodes.find(n => n.id === edge.from);
      const toNode = this.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const x1 = fromNode.x + 60;
      const y1 = fromNode.y + 30;
      const x2 = toNode.x + 60;
      const y2 = toNode.y + 30;

      // Edge line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#cbd5e1');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrowhead)');
      if (edge.animated) {
        line.setAttribute('stroke-dasharray', '8 4');
        line.style.animation = 'flowArrow 1s linear infinite';
      }
      svg.appendChild(line);

      // Edge label
      if (edge.label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 8;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#94a3b8');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.textContent = edge.label;
        svg.appendChild(text);
      }
    });

    // Draw nodes
    this.nodes.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.cursor = 'pointer';
      g.setAttribute('data-node-id', node.id);

      // Node colors by type
      const typeColors = {
        'trigger': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
        'compute': { bg: '#fed7aa', border: '#f97316', text: '#9a3412' },
        'storage': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
        'event': { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
        'output': { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
        'client': { bg: '#f1f5f9', border: '#64748b', text: '#334155' },
        'monitoring': { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
        'security': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }
      };
      const colors = typeColors[node.type] || typeColors['client'];

      // Rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x);
      rect.setAttribute('y', node.y);
      rect.setAttribute('width', 120);
      rect.setAttribute('height', 60);
      rect.setAttribute('rx', 10);
      rect.setAttribute('fill', colors.bg);
      rect.setAttribute('stroke', colors.border);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('filter', 'url(#shadow)');
      g.appendChild(rect);

      // Icon
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      icon.setAttribute('x', node.x + 60);
      icon.setAttribute('y', node.y + 22);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('font-size', '18');
      icon.textContent = node.icon || '☁️';
      g.appendChild(icon);

      // Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', node.x + 60);
      label.setAttribute('y', node.y + 44);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', colors.text);
      label.setAttribute('font-size', '11');
      label.setAttribute('font-weight', '600');
      label.setAttribute('font-family', 'Inter, sans-serif');
      label.textContent = node.label;
      g.appendChild(label);

      // Click handler
      g.addEventListener('click', () => this._onNodeClicked(node));

      // Hover effect
      g.addEventListener('mouseenter', () => {
        rect.setAttribute('stroke-width', '3');
        rect.setAttribute('stroke', '#f97316');
      });
      g.addEventListener('mouseleave', () => {
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('stroke', colors.border);
      });

      svg.appendChild(g);
    });

    svgContainer.appendChild(svg);
    wrapper.appendChild(svgContainer);

    // Detail panel (for node click inspection)
    this.detailPanel = document.createElement('div');
    this.detailPanel.id = 'diagram-detail-panel';
    this.detailPanel.style.cssText = 'display: none; padding: 16px 20px; border-top: 1px solid var(--border-color); background: var(--color-neutral-50);';
    wrapper.appendChild(this.detailPanel);

    this.container.appendChild(wrapper);
  }

  _onNodeClicked(node) {
    this.selectedNode = node;
    const panel = this.detailPanel;
    panel.style.display = 'block';

    let html = `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 24px;">${node.icon || '☁️'}</span>
        <div>
          <div style="font-weight: 700; color: var(--color-neutral-900);">${this._escapeHtml(node.label)}</div>
          <div style="font-size: 12px; color: var(--color-neutral-400); text-transform: uppercase;">${this._escapeHtml(node.type || '')}</div>
        </div>
      </div>
    `;

    if (node.description) {
      html += `<div style="font-size: 14px; line-height: 1.7; color: var(--color-neutral-700); margin-bottom: 12px;">${this._escapeHtml(node.description)}</div>`;
    }

    if (node.eventPayload) {
      html += `
        <div style="font-size: 12px; font-weight: 600; color: var(--color-accent-600); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">Event Payload</div>
        <pre style="padding: 12px; background: var(--surface-code); color: #a9b1d6; border-radius: 8px; font-size: 12px; max-height: 200px; overflow-y: auto; margin: 0;">${this._escapeHtml(typeof node.eventPayload === 'string' ? node.eventPayload : JSON.stringify(node.eventPayload, null, 2))}</pre>
      `;
    }

    panel.innerHTML = html;

    if (this.onNodeClick) {
      this.onNodeClick(node);
    }
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
  module.exports = DiagramEngine;
} else {
  window.DiagramEngine = DiagramEngine;
}
