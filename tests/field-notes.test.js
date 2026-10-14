const test = require('node:test');
const assert = require('node:assert/strict');
const notes = require('../docs/field-notes.js');
test('checklist toggles preserve prose and other items across overlay serialization', () => {
  const original = 'Today’s exploration\n- [ ] Read chapter\nA question to return to\n- [x] Get water';
  assert.equal(notes.items(original).length, 2);
  const changed = notes.toggle(original, 1, true);
  assert.equal(changed, original.replace('- [ ] Read', '- [x] Read'));
  assert.equal(notes.toggle(changed, 1, false), original);
  assert.equal(notes.toggle(original, 2, true), original);
  const protocol = require('../docs/overlay-protocol.js');
  const study = require('../docs/state.js').defaults();
  const payload = JSON.parse(JSON.stringify(protocol.payload(study, {fieldNotes:changed, clock:false, scratchpad:false})));
  assert.equal(protocol.validPayload(payload), true);
  assert.equal(notes.items(payload.fieldNotes)[0].done, true);
  assert.equal(payload.scratchpad, null);
});
