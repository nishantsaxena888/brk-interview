/**
 * Lab Server — static files + save API for lab notes
 * Replaces http-server: serves the masterclass AND persists lab notes to disk.
 *
 * Usage:  node lab-server.cjs
 * Browse: http://localhost:8081
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = 8081;
const ROOT = __dirname;
const LABS = path.join(ROOT, 'labs');

// Ensure labs/ exists
if (!fs.existsSync(LABS)) fs.mkdirSync(LABS);

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function serve(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsed.pathname);

  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: GET /api/lab/:moduleId ──
  const getMatch = pathname.match(/^\/api\/lab\/(module-\d+)$/);
  if (getMatch && req.method === 'GET') {
    const file = path.join(LABS, getMatch[1] + '-lab.html');
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ content: '' }));
    }
    return;
  }

  // ── API: POST /api/lab/:moduleId ──
  const postMatch = pathname.match(/^\/api\/lab\/(module-\d+)$/);
  if (postMatch && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { content } = JSON.parse(body);
        const file = path.join(LABS, postMatch[1] + '-lab.html');
        if (content && content.trim() && content.trim() !== '<br>') {
          fs.writeFileSync(file, content, 'utf8');
          console.log(`  ✅ Saved ${postMatch[1]}-lab.html`);
        } else if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`  🗑️ Cleared ${postMatch[1]}-lab.html`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── Static files ──
  let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  serve(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\n  🚀 Lab Server running at http://localhost:${PORT}\n`);
  console.log(`  Static files: ${ROOT}`);
  console.log(`  Lab notes:    ${LABS}\n`);
});
