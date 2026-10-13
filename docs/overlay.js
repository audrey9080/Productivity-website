(() => {
  'use strict';
  const protocol = window.CozyOverlayProtocol;
  const model = window.CozyStudy;
  const get = id => document.getElementById(id);
  const params = new URLSearchParams(location.hash.slice(1));
  const channel = { id: params.get('channel'), secret: params.get('key') };
  const widget = ['clock', 'field-notes', 'scratchpad', 'all'].includes(params.get('widget')) ? params.get('widget') : 'all';
  let peer;
  let connection;
  let authenticated = false;
  let stopped = false;
  let latest;
  let receivedAt = 0;
  let reconnect;
  let handshakeTimeout;
  function status(message) { get('overlay-status').textContent = message; get('overlay-status').hidden = !message; }
  function blank() { ['overlay-clock', 'overlay-field-notes', 'overlay-scratchpad'].forEach(id => { get(id).hidden = true; }); }
  function schedule() {
    clearTimeout(reconnect); if (!stopped) reconnect = setTimeout(connect, 3500);
  }
  function connect() {
    if (stopped || !peer || peer.destroyed || peer.disconnected || connection?.open) return;
    authenticated = false;
    const viewerNonce = protocol.randomSecret();
    connection = peer.connect(channel.id, { reliable: true, serialization: 'json' });
    const current = connection;
    let stage = 'challenge';
    let queue = Promise.resolve();
    handshakeTimeout = setTimeout(() => { if (!authenticated) current.close(); }, 12000);
    current.on('open', () => current.send({ type: 'hello', nonce: viewerNonce }));
    current.on('data', value => {
      queue = queue.then(async () => {
        if (current !== connection || !value || typeof value !== 'object') return;
        if (stage === 'challenge' && value.type === 'challenge' && protocol.validNonce(value.nonce)) {
          if (!await protocol.verify(channel.secret, protocol.hostMessage(viewerNonce, value.nonce), value.proof)) { current.close(); status('This link could not verify the website. Copy a fresh link from your website.'); return; }
          stage = 'state'; const proof = await protocol.sign(channel.secret, protocol.viewerMessage(viewerNonce, value.nonce));
          if (current.open) current.send({ type: 'proof', proof });
        } else if (stage === 'state' && value.type === 'state' && protocol.validPayload(value.data)) {
          authenticated = true; clearTimeout(handshakeTimeout); latest = value.data; receivedAt = Date.now(); status(''); render();
        } else if (authenticated && value.type === 'stopped') {
          latest = null; blank(); status('Overlay stopped on the website.');
        } else { current.close(); }
      }).catch(() => current.close());
    });
    const cleanup = () => {
      if (current !== connection) return;
      clearTimeout(handshakeTimeout); connection = null; authenticated = false; latest = null; blank(); status('Waiting for your website…'); schedule();
    };
    current.on('close', cleanup); current.on('error', cleanup);
  }
  function render() {
    if (!latest || Date.now() - receivedAt > 20000) { blank(); if (latest) status('Connection paused. Reconnecting to your website…'); return; }
    document.body.dataset.room = latest.room;
    const showClock = !!latest.timer && (widget === 'clock' || widget === 'all');
    get('overlay-clock').hidden = !showClock;
    if (showClock) {
      const state = model.defaults(); state.timer = { ...latest.timer }; model.advance(state); const timer = state.timer;
      get('overlay-time').textContent = `${String(Math.floor(timer.remainingSeconds / 60)).padStart(2, '0')}:${String(timer.remainingSeconds % 60).padStart(2, '0')}`;
      get('overlay-mode').textContent = timer.mode === 'focus' ? 'A MOMENT OF FOCUS' : 'A LITTLE ROOM TO REST';
      get('overlay-caption').textContent = timer.running ? (timer.mode === 'focus' ? 'one thing at a time' : 'a little room to breathe') : 'ready when you are';
      get('overlay-ring').style.setProperty('--progress', `${100 * (1 - timer.remainingSeconds / model.total(timer))}%`);
      get('overlay-sessions').textContent = `${timer.sessions} focus session${timer.sessions === 1 ? '' : 's'} completed`;
    }
    get('overlay-field-notes').hidden = !(widget === 'field-notes' || widget === 'all');
    get('overlay-room').textContent = { observatory: 'The Observatory', reading: 'The Reading Room', stargazing: 'Stargazing' }[latest.room];
    get('overlay-field-text').textContent = latest.fieldNotes || 'A quiet desk. A sky full of possibilities.';
    get('overlay-scratchpad').hidden = latest.scratchpad === null || !(widget === 'scratchpad' || widget === 'all');
    get('overlay-scratch-text').textContent = latest.scratchpad || 'An idea, a question, something to come back to…';
  }
  if (!protocol.validChannel(channel)) { status('Copy an overlay URL from the Twitch connection panel on your website.'); return; }
  if (typeof Peer !== 'function') { status('The free live connection did not load. Refresh this browser source.'); return; }
  peer = new Peer({ debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
  peer.on('open', connect);
  peer.on('disconnected', () => { blank(); status('Reconnecting…'); if (!peer.destroyed) setTimeout(() => { if (peer.disconnected) peer.reconnect(); }, 3000); });
  peer.on('error', () => { latest = null; blank(); status('Waiting for your website…'); if (connection) connection.close(); connection = null; schedule(); });
  setInterval(render, 500);
  window.addEventListener('beforeunload', () => { stopped = true; clearTimeout(reconnect); clearTimeout(handshakeTimeout); peer.destroy(); });
})();
