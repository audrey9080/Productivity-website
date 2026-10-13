/* Read-only overlay capabilities and a mutual challenge handshake. No account or paid backend. */
(function (root) {
  'use strict';
  const hexPattern = /^[a-f0-9]{64}$/;
  function randomSecret() {
    return Array.from(root.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function newChannel() { return { id: `cozy-${randomSecret().slice(0, 32)}`, secret: randomSecret() }; }
  function validChannel(channel) { return !!channel && /^cozy-[a-f0-9]{32}$/.test(channel.id) && hexPattern.test(channel.secret); }
  async function hmacKey(secret) {
    if (!hexPattern.test(secret)) throw new Error('Invalid capability');
    return root.crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  }
  async function sign(secret, message) {
    const signature = await root.crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(message));
    return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  async function verify(secret, message, proof) {
    if (!hexPattern.test(proof || '')) return false;
    const bytes = new Uint8Array(proof.match(/../g).map(byte => parseInt(byte, 16)));
    return root.crypto.subtle.verify('HMAC', await hmacKey(secret), bytes, new TextEncoder().encode(message));
  }
  function hostMessage(viewerNonce, hostNonce) { return `cozy-overlay-v1|host|${viewerNonce}|${hostNonce}`; }
  function viewerMessage(viewerNonce, hostNonce) { return `cozy-overlay-v1|viewer|${viewerNonce}|${hostNonce}`; }
  function payload(study, preferences, now = Date.now()) {
    return {
      version: 1, sentAt: now, room: study.room,
      timer: preferences.clock ? { ...study.timer } : null,
      fieldNotes: String(preferences.fieldNotes || '').slice(0, 2000),
      scratchpad: preferences.scratchpad ? String(study.notes || '').slice(0, 2000) : null
    };
  }
  function validPayload(value) {
    return value && value.version === 1 && Number.isFinite(value.sentAt) && ['observatory', 'reading', 'stargazing'].includes(value.room)
      && typeof value.fieldNotes === 'string' && value.fieldNotes.length <= 2000
      && (value.scratchpad === null || typeof value.scratchpad === 'string' && value.scratchpad.length <= 2000)
      && (value.timer === null || value.timer && ['focus', 'break'].includes(value.timer.mode)
        && [value.timer.focusMinutes, value.timer.breakMinutes].every(n => Number.isInteger(n) && n >= 1 && n <= 240)
        && Number.isInteger(value.timer.remainingSeconds) && value.timer.remainingSeconds >= 0 && value.timer.remainingSeconds <= 14400
        && Number.isInteger(value.timer.sessions) && value.timer.sessions >= 0 && typeof value.timer.running === 'boolean'
        && (!value.timer.running || Number.isFinite(value.timer.endsAt)));
  }
  function signature(data) {
    const stable = structuredClone(data); delete stable.sentAt;
    if (stable.timer?.running) stable.timer.remainingSeconds = 0;
    return JSON.stringify(stable);
  }
  function overlayUrl(base, channel, widget) {
    if (!validChannel(channel)) throw new Error('Invalid channel');
    const url = new URL('overlay.html', base);
    url.hash = new URLSearchParams({ channel: channel.id, key: channel.secret, widget }).toString();
    return url.href;
  }
  const api = { randomSecret, newChannel, validChannel, sign, verify, hostMessage, viewerMessage, payload, validPayload, signature, overlayUrl, validNonce: nonce => hexPattern.test(nonce || '') };
  root.CozyOverlayProtocol = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
