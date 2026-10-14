/* The public study page uses only each visitor's browser storage. */
(() => {
  'use strict';
  const model = window.CozyStudy;
  const get = id => document.getElementById(id);
  let state = model.defaults();
  let storageAvailable = true;
  let filter = 'all';
  let taskSignature = '';
  let settingsDirty = false;
  let toastTimeout;
  const roomInfo = {
    observatory: ['The Observatory', 'A quiet desk. A sky full of possibilities.', 'observatory.view'],
    reading: ['The Reading Room', 'A warm window. One more page to explore.', 'reading-room.view'],
    stargazing: ['Stargazing', 'A little stillness beneath the stars.', 'stargazing.view']
  };
  function announce(message) {
    const element = get('announcement'); element.textContent = message; element.classList.add('visible');
    clearTimeout(toastTimeout); toastTimeout = setTimeout(() => element.classList.remove('visible'), 5000);
  }
  function readSaved() {
    if (!storageAvailable) return;
    try { const saved = localStorage.getItem(model.KEY); if (saved) state = model.parse(saved); }
    catch { storageAvailable = false; }
  }
  function save() {
    try {
      localStorage.setItem(model.KEY, JSON.stringify(state)); storageAvailable = true;
      get('notes-status').textContent = 'Saved as you write, in this browser.';
    } catch {
      if (storageAvailable) announce('Browser saving is unavailable. Keep this tab open to keep your work.');
      storageAvailable = false; get('notes-status').textContent = 'Saving unavailable — copy your notes before closing this tab.';
    }
  }
  function commit(action, payload = {}) {
    readSaved(); model.act(state, action, payload); save(); render();
  }
  function renderTasks(force = false) {
    const signature = JSON.stringify([state.tasks, filter]);
    if (!force && signature === taskSignature) return;
    taskSignature = signature;
    const list = get('task-list'); list.replaceChildren();
    const visible = state.tasks.filter(task => filter === 'all' || (filter === 'done' ? task.done : !task.done));
    visible.forEach(task => {
      const row = document.createElement('li'); row.className = `task-row${task.done ? ' done' : ''}`;
      const label = document.createElement('label');
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.done;
      checkbox.addEventListener('change', () => commit('task.toggle', { id: task.id }));
      const text = document.createElement('span'); text.textContent = task.text;
      label.append(checkbox, text);
      const actions = document.createElement('span'); actions.className = 'task-row-actions';
      const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = '✎'; edit.setAttribute('aria-label', `Edit task: ${task.text}`);
      edit.addEventListener('click', () => {
        const input = document.createElement('input'); input.className = 'task-edit'; input.value = task.text; input.maxLength = 200; input.setAttribute('aria-label', 'Edit task');
        const finish = saveEdit => {
          if (!input.isConnected) return;
          const value = input.value.trim();
          if (saveEdit && value) commit('task.rename', { id: task.id, text: value });
          else renderTasks(true);
        };
        label.replaceWith(input); actions.hidden = true; input.focus(); input.select();
        input.addEventListener('blur', () => finish(true), { once: true });
        input.addEventListener('keydown', event => {
          if (event.key === 'Enter') { event.preventDefault(); input.blur(); }
          if (event.key === 'Escape') { event.preventDefault(); finish(false); }
        });
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Delete task: ${task.text}`);
      remove.addEventListener('click', () => commit('task.remove', { id: task.id }));
      actions.append(edit, remove); row.append(label, actions); list.append(row);
    });
    const completed = state.tasks.filter(task => task.done).length;
    get('task-count').textContent = `${completed} / ${state.tasks.length}`;
    get('clear-completed').disabled = completed === 0;
    const empty = get('task-empty'); empty.hidden = visible.length > 0;
    if (state.tasks.length) empty.textContent = filter === 'done' ? 'Completed quests will appear here.' : 'No quests in this view. Take a breath.';
    else { empty.replaceChildren(document.createTextNode('An open page, a fresh start.'), document.createElement('br')); const hint = document.createElement('span'); hint.textContent = 'Add a little quest above.'; empty.append(hint); }
  }
  function render() {
    const timer = state.timer;
    const remaining = timer.remainingSeconds;
    get('timer-display').textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
    get('timer-caption').textContent = timer.running ? (timer.mode === 'focus' ? 'one thing at a time' : 'a little room to breathe') : 'ready when you are';
    get('timer-toggle').textContent = timer.running ? 'Ⅱ Pause' : timer.mode === 'focus' ? '▶ Start focusing' : '▶ Start resting';
    get('timer-ring').style.setProperty('--progress', `${100 * (1 - remaining / model.total(timer))}%`);
    get('session-count').textContent = `${timer.sessions} focus session${timer.sessions === 1 ? '' : 's'} completed`;
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === timer.mode)));
    if (!settingsDirty) { get('focus-minutes').value = timer.focusMinutes; get('break-minutes').value = timer.breakMinutes; }
    document.body.dataset.room = state.room;
    const [title, description, file] = roomInfo[state.room];
    get('room-title').textContent = title; get('room-description').textContent = description; get('room-file').textContent = file;
    document.querySelector('.landscape').setAttribute('aria-label', state.room === 'reading' ? 'A pastel pixel-art reading-room window overlooking warm mountains and a golden sun.' : state.room === 'stargazing' ? 'A pixel-art observatory window overlooking purple mountains beneath a starry night and crescent moon.' : 'A pastel pixel-art observatory window overlooking lavender mountains, stars, and a crescent moon.');
    document.querySelectorAll('[data-room-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.roomChoice === state.room)));
    if (document.activeElement !== get('notes')) get('notes').value = state.notes;
    get('notes-count').textContent = `${state.notes.length.toLocaleString()} / 20,000`;
    renderTasks();
    get('local-clock').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.dispatchEvent(new CustomEvent('cozy-study-change'));
  }
  get('timer-toggle').addEventListener('click', () => commit('timer.toggle'));
  get('timer-reset').addEventListener('click', () => commit('timer.reset'));
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => commit('timer.mode', { mode: button.dataset.mode })));
  get('timer-settings').addEventListener('submit', event => {
    event.preventDefault(); settingsDirty = false; commit('timer.settings', { focusMinutes: get('focus-minutes').value, breakMinutes: get('break-minutes').value }); announce('Your timer is set. Begin whenever you like.');
  });
  get('timer-settings').addEventListener('input', () => { settingsDirty = true; });
  get('task-form').addEventListener('submit', event => {
    event.preventDefault(); const input = get('task-input');
    if (input.value.trim()) { commit('task.add', { text: input.value }); input.value = ''; input.focus(); }
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    filter = button.dataset.filter; document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); renderTasks();
  }));
  get('clear-completed').addEventListener('click', () => {
    const count = state.tasks.filter(task => task.done).length;
    if (!count) return;
    commit('task.clearCompleted'); announce(`${count} completed quest${count === 1 ? '' : 's'} cleared.`);
  });
  get('notes').addEventListener('input', () => commit('notes', { text: get('notes').value }));
  document.querySelectorAll('[data-room-choice]').forEach(button => button.addEventListener('click', () => commit('room', { room: button.dataset.roomChoice })));
  get('focus-view').addEventListener('click', () => {
    const quiet = document.body.classList.toggle('quiet-view'); get('focus-view').setAttribute('aria-pressed', String(quiet)); get('focus-view').textContent = quiet ? 'Show workspace ↙' : 'Quiet view ↗';
  });
  document.addEventListener('keydown', event => {
    const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (event.altKey && event.code === 'Space' && !typing) { event.preventDefault(); commit('timer.toggle'); }
    if (event.altKey && event.key.toLowerCase() === 'n' && !typing) { event.preventDefault(); get('task-input').focus(); }
    if (event.altKey && event.key.toLowerCase() === 'q' && !typing) { event.preventDefault(); get('focus-view').click(); }
  });
  window.addEventListener('storage', event => {
    if (event.key !== model.KEY && event.key !== null) return;
    state = event.newValue ? model.parse(event.newValue) : model.defaults(); tick();
  });
  function tick() {
    if (state.timer.running && state.timer.endsAt <= Date.now()) readSaved();
    if (model.advance(state)) { save(); announce(state.timer.mode === 'break' ? 'Focus complete. Your rest timer is ready when you are.' : 'Rest complete. Your focus timer is ready when you are.'); }
    render();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { readSaved(); tick(); } });
  window.CozyStudySnapshot = () => structuredClone(state);
  readSaved(); tick();
  if (!storageAvailable) { get('notes-status').textContent = 'Saving unavailable — copy your notes before closing this tab.'; announce('Browser saving is unavailable. Keep this tab open to keep your work.'); }
  setInterval(tick, 500);
})();
