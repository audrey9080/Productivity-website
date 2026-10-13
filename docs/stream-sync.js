/* The study website is the only writer; overlay viewers can only receive selected fields. */
(() => {
  'use strict';
  const protocol = window.CozyOverlayProtocol;
  const storageKey = 'cozy-observatory.overlay.v1';
  const get = id => document.getElementById(id);
  const peers = new Map();
  let channel;
  let preferences = { clock: true, scratchpad: false, fieldNotes: '' };
  let peer;
  let live = false;
  let lastSignature = '';
  let lastSend = 0;
  let retry;
  let storageAvailable = true;
  let wanted = false;
  let resumeOnOpen = true;
  let takingLock = false;
  let releaseLock;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (protocol.validChannel(saved?.channel)) channel = saved.channel;
    resumeOnOpen = saved?.enabled !== false;
    if (saved?.preferences) preferences = { clock: saved.preferences.clock !== false, scratchpad: saved.preferences.scratchpad === true, fieldNotes: String(saved.preferences.fieldNotes || '').slice(0, 2000) };
  } catch { /* A new channel can still be used for this open tab. */ }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({ channel, preferences, enabled: wanted })); }
    catch { storageAvailable = false; status('Browser saving is unavailable. Keep this tab open; links cannot be restored after closing.'); }
  }
  function status(message) { get('stream-status').textContent = message; }
  function payload() { return protocol.payload(window.CozyStudySnapshot(), preferences); }
  function updateLinks() {
    get('stream-links').hidden = !channel;
    if (!channel) return;
    ['clock', 'field-notes', 'scratchpad'].forEach(widget => { get(`${widget}-preview`).href = protocol.overlayUrl(location.href, channel, widget); });
  }
  function connectionStatus() {
    if (!live) return;
    const count = [...peers.values()].filter(item => item.authenticated).length;
    status(count ? `Connected · ${count} overlay view${count === 1 ? '' : 's'} receiving live updates.` : 'Ready. Open an overlay link in Streamlabs or OBS to connect.');
  }
  function send(force = false) {
    if (!live) return;
    const data = payload(); const signature = protocol.signature(data);
    if (!force && signature === lastSignature && Date.now() - lastSend < 5000) return;
    lastSignature = signature; lastSend = Date.now();
    peers.forEach(item => { if (item.authenticated && item.connection.open) item.connection.send({ type: 'state', data }); });
  }
  function accept(connection) {
    if (peers.size >= 12) { connection.close(); return; }
    const item = { connection, authenticated: false, stage: 'hello', viewerNonce: '', hostNonce: '' };
    peers.set(connection.connectionId, item);
    const expiry = setTimeout(() => { if (!item.authenticated) connection.close(); }, 10000);
    let queue = Promise.resolve();
    connection.on('data', value => {
      queue = queue.then(async () => {
        if (!value || typeof value !== 'object') { connection.close(); return; }
        if (item.stage === 'hello' && value.type === 'hello' && protocol.validNonce(value.nonce)) {
          item.stage = 'proof'; item.viewerNonce = value.nonce; item.hostNonce = protocol.randomSecret();
          const proof = await protocol.sign(channel.secret, protocol.hostMessage(item.viewerNonce, item.hostNonce));
          if (connection.open) connection.send({ type: 'challenge', nonce: item.hostNonce, proof });
        } else if (item.stage === 'proof' && value.type === 'proof' && await protocol.verify(channel.secret, protocol.viewerMessage(item.viewerNonce, item.hostNonce), value.proof)) {
          item.stage = 'ready'; item.authenticated = true; clearTimeout(expiry);
          connection.send({ type: 'state', data: payload() }); connectionStatus();
        } else { connection.close(); }
      }).catch(() => connection.close());
    });
    const cleanup = () => { clearTimeout(expiry); peers.delete(connection.connectionId); connectionStatus(); };
    connection.on('close', cleanup); connection.on('error', cleanup);
  }
  function start() {
    if (typeof Peer !== 'function') { status('The free connection service did not load. Refresh this page to try again.'); return; }
    if (live && peer && !peer.destroyed) return;
    wanted = true;
    if (!channel) channel = protocol.newChannel();
    persist(); updateLinks(); get('stream-connect').textContent = 'Stop overlay';
    if (!navigator.locks) { connectPeer(); return; }
    if (takingLock || releaseLock) return;
    takingLock = true;
    navigator.locks.request(`cozy-overlay-controller-${channel.id}`, { ifAvailable: true }, async lock => {
      takingLock = false;
      if (!wanted) return;
      if (!lock) {
        status('Connected through another website tab. Changes here update the stream too.');
        clearTimeout(retry); retry = setTimeout(() => { if (wanted) start(); }, 3000); return;
      }
      await new Promise(resolve => { releaseLock = resolve; connectPeer(); });
    }).catch(() => { takingLock = false; status('Could not open the overlay connection. Stop and reconnect to try again.'); });
  }
  function connectPeer() {
    if (!wanted) { releaseLock?.(); releaseLock = null; return; }
    live = true; lastSignature = ''; get('stream-connect').textContent = 'Stop overlay';
    status('Connecting your website to the overlay…');
    peer = new Peer(channel.id, { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
    peer.on('open', connectionStatus); peer.on('connection', accept);
    peer.on('disconnected', () => {
      if (!live) return; status('Connection interrupted. Reconnecting…');
      clearTimeout(retry); retry = setTimeout(() => { if (live && peer && !peer.destroyed && peer.disconnected) peer.reconnect(); }, 3000);
    });
    peer.on('error', error => {
      if (error.type === 'unavailable-id') {
        live = false; peer.destroy(); peer = null; releaseLock?.(); releaseLock = null;
        status('Connected through another website tab. Changes here update the stream too.');
        clearTimeout(retry); retry = setTimeout(() => { if (wanted) start(); }, 3000);
      } else if (error.type !== 'peer-unavailable') status('The free connection is unavailable right now. Stop and reconnect to try again.');
    });
  }
  function stop(publish = true) {
    // Clear the viewer immediately before closing the authenticated data channels.
    peers.forEach(item => { if (item.authenticated && item.connection.open) item.connection.send({ type: 'stopped' }); });
    wanted = false; live = false; clearTimeout(retry); if (publish) persist();
    get('stream-connect').textContent = 'Connect overlay'; status('Overlay stopped. Reconnect here to resume.');
    const oldPeer = peer; peer = null; peers.clear(); get('stream-connect').disabled = true;
    setTimeout(() => { oldPeer?.destroy(); releaseLock?.(); releaseLock = null; get('stream-connect').disabled = false; }, 300);
  }
  get('stream-connect').addEventListener('click', () => wanted ? stop() : start());
  get('stream-clock').checked = preferences.clock;
  get('stream-scratchpad').checked = preferences.scratchpad;
  get('stream-field-notes').value = preferences.fieldNotes;
  ['stream-clock', 'stream-scratchpad', 'stream-field-notes'].forEach(id => get(id).addEventListener('input', () => {
    preferences.clock = get('stream-clock').checked; preferences.scratchpad = get('stream-scratchpad').checked; preferences.fieldNotes = get('stream-field-notes').value;
    persist(); send(true);
  }));
  document.addEventListener('cozy-study-change', () => send());
  window.addEventListener('storage', event => {
    if (event.key !== storageKey || !event.newValue) return;
    try {
      const saved = JSON.parse(event.newValue);
      if (!protocol.validChannel(saved.channel) || saved.channel.id !== channel?.id) return;
      preferences = { clock: saved.preferences?.clock !== false, scratchpad: saved.preferences?.scratchpad === true, fieldNotes: String(saved.preferences?.fieldNotes || '').slice(0, 2000) };
      get('stream-clock').checked = preferences.clock; get('stream-scratchpad').checked = preferences.scratchpad;
      if (document.activeElement !== get('stream-field-notes')) get('stream-field-notes').value = preferences.fieldNotes;
      if (saved.enabled === false && wanted) stop(false);
      else if (saved.enabled !== false && !wanted) start();
      send(true);
    } catch { /* Ignore malformed state from an unrelated tab. */ }
  });
  document.querySelectorAll('[data-copy-widget]').forEach(button => button.addEventListener('click', async () => {
    if (!channel) return;
    const url = protocol.overlayUrl(location.href, channel, button.dataset.copyWidget);
    try { await navigator.clipboard.writeText(url); button.textContent = 'Copied!'; setTimeout(() => { button.textContent = 'Copy overlay URL'; }, 1800); }
    catch { status('Clipboard is unavailable. Right-click the matching Preview link and copy its link address.'); }
  }));
  updateLinks();
  if (!storageAvailable) status('Browser saving is unavailable. Keep this tab open during the stream.');
  // A saved pairing resumes when the website is reopened. A deliberate Stop lasts until Connect is pressed.
  if (channel && resumeOnOpen) start();
  window.addEventListener('beforeunload', () => { clearTimeout(retry); peer?.destroy(); releaseLock?.(); });
})();
