const { test } = require('node:test');
const assert = require('node:assert/strict');
const protocol = require('../docs/overlay-protocol.js');
const study = require('../docs/state.js');

test('only chosen fields reach the stream, with scratchpad off by default', () => {
  const state = study.defaults(); state.notes = 'PRIVATE'; state.tasks = [{ id: '1', text: 'PRIVATE TASK', done: false }];
  const data = protocol.payload(state, { clock: true, fieldNotes: 'Public note', scratchpad: false }, 10);
  assert.equal(data.scratchpad, null); assert.equal(data.fieldNotes, 'Public note'); assert.equal('tasks' in data, false); assert.equal(JSON.stringify(data).includes('PRIVATE'), false);
  assert.equal(protocol.payload(state, { clock: false, scratchpad: true }).scratchpad, 'PRIVATE');
  assert.equal(protocol.payload(state, { clock: false }).timer, null);
});
test('overlay URLs preserve GitHub project paths and keep pairing keys in the fragment', () => {
  const channel = protocol.newChannel(); assert.equal(protocol.validChannel(channel), true);
  const url = new URL(protocol.overlayUrl('https://audrey9080.github.io/Productivity-website/', channel, 'clock'));
  assert.equal(url.pathname, '/Productivity-website/overlay.html'); assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('key'), channel.secret);
  assert.equal(protocol.validChannel({ id: 'public', secret: 'guess' }), false);
});
test('mutual authentication rejects the wrong key, replay, and reflected host proofs', async () => {
  const key = protocol.randomSecret(), viewerNonce = protocol.randomSecret(), hostNonce = protocol.randomSecret();
  const message = protocol.hostMessage(viewerNonce, hostNonce), proof = await protocol.sign(key, message);
  assert.equal(await protocol.verify(key, message, proof), true);
  assert.equal(await protocol.verify(protocol.randomSecret(), message, proof), false);
  assert.equal(await protocol.verify(key, protocol.hostMessage(protocol.randomSecret(), hostNonce), proof), false);
  assert.equal(await protocol.verify(key, protocol.viewerMessage(viewerNonce, hostNonce), proof), false);
});
test('payload validation rejects malformed data and signatures ignore ticking deadlines', () => {
  const state = study.defaults(); study.act(state, 'timer.toggle', {}, 100000);
  const first = protocol.payload(state, { clock: true }, 100000);
  study.advance(state, 110000); const second = protocol.payload(state, { clock: true }, 110000);
  assert.equal(protocol.validPayload(first), true); assert.equal(protocol.signature(first), protocol.signature(second));
  second.timer.running = false; assert.notEqual(protocol.signature(first), protocol.signature(second));
  assert.equal(protocol.validPayload({ ...first, fieldNotes: 7 }), false);
  assert.equal(protocol.validPayload({ ...first, timer: { ...first.timer, endsAt: Infinity } }), false);
});
