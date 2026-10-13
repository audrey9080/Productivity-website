const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'state.json');
const PORT = Number(process.env.COZY_OBSERVATORY_PORT || 17777);

const defaults = {
  timer: { mode: 'focus', focusMinutes: 25, breakMinutes: 5, remainingSeconds: 1500, running: false, endsAt: null, sessions: 0 },
  personalTasks: [], communityTasks: [], communityCompleted: 0,
  visibility: { timer: true, personal: true, community: true }
};

fs.mkdirSync(DATA_DIR, { recursive: true });
let state;
try { state = { ...defaults, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; }
catch { state = structuredClone(defaults); persist(); }

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function currentState() {
  if (state.timer.running && state.timer.endsAt) {
    state.timer.remainingSeconds = Math.max(0, Math.ceil((state.timer.endsAt - Date.now()) / 1000));
    if (state.timer.remainingSeconds === 0) {
      if (state.timer.mode === 'focus') state.timer.sessions += 1;
      state.timer.mode = state.timer.mode === 'focus' ? 'break' : 'focus';
      state.timer.remainingSeconds = (state.timer.mode === 'focus' ? state.timer.focusMinutes : state.timer.breakMinutes) * 60;
      state.timer.running = false;
      state.timer.endsAt = null;
      persist();
    }
  }
  return state;
}

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1e6) reject(new Error('Body too large')); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch (e) { reject(e); } });
  });
}

function safeStatic(urlPath, res) {
  const relative = urlPath === '/' ? 'dashboard.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(PUBLIC, relative);
  if (!file.startsWith(path.resolve(PUBLIC))) return json(res, 403, { error: 'Forbidden' });
  fs.readFile(file, (err, data) => {
    if (err) return json(res, 404, { error: 'Not found' });
    const ext = path.extname(file);
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/state' && req.method === 'GET') return json(res, 200, currentState());
  if (url.pathname === '/api/action' && req.method === 'POST') {
    try {
      const { action, payload = {} } = await readBody(req);
      const t = state.timer;
      if (action === 'timer.start') { t.running = true; t.endsAt = Date.now() + t.remainingSeconds * 1000; }
      else if (action === 'timer.pause') { currentState(); t.running = false; t.endsAt = null; }
      else if (action === 'timer.reset') { t.running = false; t.endsAt = null; t.remainingSeconds = (t.mode === 'focus' ? t.focusMinutes : t.breakMinutes) * 60; }
      else if (action === 'timer.settings') { t.focusMinutes = Math.max(1, Number(payload.focusMinutes)||25); t.breakMinutes = Math.max(1, Number(payload.breakMinutes)||5); t.running = false; t.endsAt = null; t.remainingSeconds = (t.mode === 'focus' ? t.focusMinutes : t.breakMinutes) * 60; }
      else if (action === 'task.add') { const list = payload.list === 'community' ? state.communityTasks : state.personalTasks; list.push({ id: Date.now().toString(36), text: String(payload.text||'').trim(), username: String(payload.username||'').trim(), done: false, approved: payload.list !== 'community' }); }
      else if (action === 'task.toggle') { const list = payload.list === 'community' ? state.communityTasks : state.personalTasks; const item = list.find(x => x.id === payload.id); if (item) { const was = item.done; item.done = !item.done; if (payload.list === 'community' && !was && item.done) state.communityCompleted += 1; } }
      else if (action === 'task.remove') { const key = payload.list === 'community' ? 'communityTasks' : 'personalTasks'; state[key] = state[key].filter(x => x.id !== payload.id); }
      else if (action === 'task.approve') { const item = state.communityTasks.find(x => x.id === payload.id); if (item) item.approved = true; }
      else if (action === 'visibility') state.visibility[payload.widget] = Boolean(payload.visible);
      persist(); return json(res, 200, currentState());
    } catch (e) { return json(res, 400, { error: e.message }); }
  }
  safeStatic(url.pathname, res);
});

server.listen(PORT, '127.0.0.1', () => console.log(`Cozy Observatory: http://127.0.0.1:${PORT}`));
