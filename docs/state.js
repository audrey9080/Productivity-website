/* Shared, testable browser state. No network service is required. */
(function (root) {
  'use strict';
  const KEY = 'cozy-observatory.study.v1';
  const rooms = ['observatory', 'reading', 'stargazing'];
  const minutes = (value, fallback) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 240 ? Number(value) : fallback;
  const clamp = (value, min, max, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  function defaults() {
    return { version: 1, room: 'observatory', notes: '', tasks: [], timer: { mode: 'focus', focusMinutes: 25, breakMinutes: 5, remainingSeconds: 1500, running: false, endsAt: null, sessions: 0 } };
  }
  function normalize(value) {
    const state = defaults();
    if (!value || typeof value !== 'object' || value.version !== 1) return state;
    state.room = rooms.includes(value.room) ? value.room : state.room;
    state.notes = typeof value.notes === 'string' ? value.notes.slice(0, 20000) : '';
    const ids = new Set();
    if (Array.isArray(value.tasks)) state.tasks = value.tasks.filter(task => {
      if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) || typeof task.text !== 'string' || !task.text.trim()) return false;
      ids.add(task.id); return true;
    }).map(task => ({ id: task.id, text: task.text.slice(0, 200), done: task.done === true }));
    const timer = value.timer || {};
    state.timer.mode = timer.mode === 'break' ? 'break' : 'focus';
    state.timer.focusMinutes = minutes(timer.focusMinutes, 25);
    state.timer.breakMinutes = minutes(timer.breakMinutes, 5);
    const duration = (state.timer.mode === 'focus' ? state.timer.focusMinutes : state.timer.breakMinutes) * 60;
    state.timer.remainingSeconds = Math.ceil(clamp(timer.remainingSeconds, 0, duration, duration));
    state.timer.sessions = Math.floor(clamp(timer.sessions, 0, Number.MAX_SAFE_INTEGER, 0));
    if (timer.running === true && typeof timer.endsAt === 'number' && Number.isFinite(timer.endsAt) && timer.endsAt > 0) {
      state.timer.running = true; state.timer.endsAt = timer.endsAt;
    }
    return state;
  }
  function parse(serialized) { try { return normalize(JSON.parse(serialized)); } catch { return defaults(); } }
  function total(timer) { return (timer.mode === 'focus' ? timer.focusMinutes : timer.breakMinutes) * 60; }
  function advance(state, now = Date.now()) {
    const timer = state.timer;
    if (!timer.running) return false;
    timer.remainingSeconds = Math.min(total(timer), Math.max(0, Math.ceil((timer.endsAt - now) / 1000)));
    if (timer.remainingSeconds > 0) return false;
    if (timer.mode === 'focus') timer.sessions += 1;
    timer.mode = timer.mode === 'focus' ? 'break' : 'focus';
    timer.remainingSeconds = total(timer); timer.running = false; timer.endsAt = null;
    return true;
  }
  function act(state, action, payload = {}, now = Date.now()) {
    advance(state, now);
    const timer = state.timer;
    if (action === 'timer.toggle') {
      if (timer.running) { timer.running = false; timer.endsAt = null; }
      else { timer.running = true; timer.endsAt = now + timer.remainingSeconds * 1000; }
    } else if (action === 'timer.reset') {
      timer.running = false; timer.endsAt = null; timer.remainingSeconds = total(timer);
    } else if (action === 'timer.mode' && ['focus', 'break'].includes(payload.mode)) {
      if (timer.mode !== payload.mode) { timer.mode = payload.mode; timer.running = false; timer.endsAt = null; timer.remainingSeconds = total(timer); }
    } else if (action === 'timer.settings') {
      timer.focusMinutes = minutes(payload.focusMinutes, timer.focusMinutes);
      timer.breakMinutes = minutes(payload.breakMinutes, timer.breakMinutes);
      timer.running = false; timer.endsAt = null; timer.remainingSeconds = total(timer);
    } else if (action === 'task.add') {
      const text = String(payload.text || '').trim().slice(0, 200);
      if (text) state.tasks.push({ id: root.crypto.randomUUID(), text, done: false });
    } else if (action === 'task.toggle') {
      const task = state.tasks.find(item => item.id === payload.id); if (task) task.done = !task.done;
    } else if (action === 'task.remove') {
      state.tasks = state.tasks.filter(item => item.id !== payload.id);
    } else if (action === 'notes') {
      state.notes = String(payload.text || '').slice(0, 20000);
    } else if (action === 'room' && rooms.includes(payload.room)) {
      state.room = payload.room;
    }
    return state;
  }
  const api = { KEY, defaults, normalize, parse, total, advance, act };
  root.CozyStudy = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
