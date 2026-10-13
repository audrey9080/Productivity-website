const { test } = require('node:test');
const assert = require('node:assert/strict');
const study = require('../docs/state.js');

test('a running timer resumes from its deadline after reopening', () => {
  const state = study.defaults(); study.act(state, 'timer.toggle', {}, 100000);
  const reopened = study.parse(JSON.stringify(state)); study.advance(reopened, 165000);
  assert.equal(reopened.timer.remainingSeconds, 1435);
  study.act(reopened, 'timer.toggle', {}, 170000);
  assert.equal(reopened.timer.remainingSeconds, 1430); assert.equal(reopened.timer.running, false);
  study.act(reopened, 'timer.toggle', {}, 200000);
  assert.equal(reopened.timer.endsAt, 1630000);
});
test('expired focus counts once and offers a paused rest timer', () => {
  const state = study.defaults(); study.act(state, 'timer.toggle', {}, 100000);
  assert.equal(study.advance(state, 2000000), true);
  assert.equal(state.timer.mode, 'break'); assert.equal(state.timer.remainingSeconds, 300);
  assert.equal(state.timer.sessions, 1); assert.equal(state.timer.running, false);
  assert.equal(study.advance(state, 3000000), false); assert.equal(state.timer.sessions, 1);
});
test('rest completion does not count as a focus session', () => {
  const state = study.defaults(); study.act(state, 'timer.mode', { mode: 'break' });
  study.act(state, 'timer.toggle', {}, 100000); study.advance(state, 500000);
  assert.equal(state.timer.mode, 'focus'); assert.equal(state.timer.sessions, 0);
});
test('reset and duration changes stop a running timer', () => {
  const state = study.defaults(); study.act(state, 'timer.toggle', {}, 100000);
  study.act(state, 'timer.settings', { focusMinutes: 45, breakMinutes: 10 }, 105000);
  assert.equal(state.timer.remainingSeconds, 2700); assert.equal(state.timer.endsAt, null);
  study.act(state, 'timer.toggle', {}, 110000); study.act(state, 'timer.reset', {}, 120000);
  assert.equal(state.timer.remainingSeconds, 2700); assert.equal(state.timer.running, false);
  study.act(state, 'timer.settings', { focusMinutes: -2, breakMinutes: Infinity });
  assert.equal(state.timer.focusMinutes, 45); assert.equal(state.timer.breakMinutes, 10);
});
test('tasks, notes, and room preference survive serialization', () => {
  const state = study.defaults(); study.act(state, 'task.add', { text: 'Read chapter 2' });
  const id = state.tasks[0].id; study.act(state, 'task.toggle', { id });
  study.act(state, 'notes', { text: '<script>plain text</script>' }); study.act(state, 'room', { room: 'reading' });
  const reopened = study.parse(JSON.stringify(state));
  assert.equal(reopened.tasks[0].done, true); assert.equal(reopened.notes, '<script>plain text</script>'); assert.equal(reopened.room, 'reading');
  study.act(reopened, 'task.remove', { id }); assert.equal(reopened.tasks.length, 0);
});
test('malformed saved state safely falls back and invalid entries are normalized', () => {
  assert.deepEqual(study.parse('not json'), study.defaults()); assert.deepEqual(study.parse('null'), study.defaults());
  const state = study.normalize({ version: 1, tasks: [null, { id: 'a', text: 'Read' }, { id: 'a', text: 'Duplicate' }], timer: { focusMinutes: 0, remainingSeconds: -10, running: true, endsAt: 'bad' }, room: 'missing' });
  assert.equal(state.tasks.length, 1); assert.equal(state.timer.focusMinutes, 25); assert.equal(state.timer.remainingSeconds, 0); assert.equal(state.timer.running, false); assert.equal(state.room, 'observatory');
});
