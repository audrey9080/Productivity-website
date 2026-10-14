(() => {
  'use strict';
  const key = 'cozy-observatory.calendar.v1';
  const get = id => document.getElementById(id);
  let settings = null;
  let mode = 'MONTH';
  const status = message => { get('calendar-status').textContent = message; };
  function parseSource(value) {
    let id = value.trim();
    if (/^https?:/i.test(id)) {
      const url = new URL(id);
      if (url.protocol !== 'https:' || url.hostname !== 'calendar.google.com' || !/^\/calendar\/embed\/?$/.test(url.pathname)) throw new Error('Use a Calendar ID or an https://calendar.google.com/calendar/embed URL.');
      if (url.searchParams.getAll('src').length !== 1) throw new Error('Choose one calendar ID for this connection.');
      id = url.searchParams.get('src');
    }
    if (!id || id.length > 320 || !/^[A-Za-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[A-Za-z0-9.-]+$/.test(id)) throw new Error('Enter a valid Calendar ID from Google Calendar settings. Secret iCal URLs and embed HTML are not accepted.');
    return id;
  }
  function validateZone(zone) {
    try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return zone; }
    catch { throw new Error('Enter a valid time zone, such as America/Los_Angeles.'); }
  }
  function render() {
    get('calendar-view').hidden = !settings;
    get('calendar-disconnect').disabled = !settings;
    if (!settings) { get('calendar-frame').removeAttribute('src'); return; }
    const url = new URL('https://calendar.google.com/calendar/embed');
    Object.entries({ src: settings.id, ctz: settings.zone, mode, showTitle: '0', showPrint: '0', showCalendars: '0' }).forEach(([key, value]) => url.searchParams.set(key, value));
    get('calendar-frame').src = url.href;
    document.querySelectorAll('[data-calendar-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.calendarMode === mode)));
  }
  get('calendar-timezone').value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved) { settings = { id: parseSource(saved.id), zone: validateZone(saved.zone) }; get('calendar-source').value = settings.id; get('calendar-timezone').value = settings.zone; status('Calendar settings restored. Google will check access when the calendar loads.'); }
  } catch { status('Saved settings could not be restored. Enter your calendar again.'); }
  get('calendar-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const next = { id: parseSource(get('calendar-source').value), zone: validateZone(get('calendar-timezone').value.trim()) };
      settings = next; render();
      try { localStorage.setItem(key, JSON.stringify(next)); status('Calendar settings saved. Google will check access when the calendar loads.'); }
      catch { status('Calendar opened for this session; browser saving is unavailable.'); }
    } catch (error) { status(error.message); }
  });
  get('calendar-disconnect').addEventListener('click', () => {
    settings = null; get('calendar-source').value = ''; render();
    try { localStorage.removeItem(key); status('Calendar disconnected from this browser. Google sharing settings are unchanged.'); }
    catch { status('Calendar hidden for this session. Browser storage could not be cleared.'); }
  });
  document.querySelectorAll('[data-calendar-mode]').forEach(button => button.addEventListener('click', () => { mode = button.dataset.calendarMode; render(); }));
  const menus = [...document.querySelectorAll('.site-navigation details')];
  menus.forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) menus.forEach(other => { if (other !== menu) other.open = false; }); }));
  document.addEventListener('click', event => { if (!event.target.closest('.site-navigation')) menus.forEach(menu => { menu.open = false; }); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') menus.forEach(menu => { if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); } }); });
  render();
})();
