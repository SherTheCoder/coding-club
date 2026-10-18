import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRefreshGate,
  notifySafely,
  buildLibrary,
  emptyClubData,
} from './client-state.mjs';
test('a slow earlier response cannot replace a newer refresh', () => {
  const gate = createRefreshGate();
  const old = gate.begin();
  const newer = gate.begin();
  assert.equal(gate.isCurrent(newer), true);
  assert.equal(gate.isCurrent(old), false);
});
test('unsupported browser notifications never interrupt data refresh', () => {
  assert.equal(
    notifySafely(
      () => {
        throw new TypeError('Illegal constructor');
      },
      'Update',
      'Prep',
      () => {},
    ),
    false,
  );
});
test('practice history retains a custom problem after its teaching spot is released', () => {
  const practiced = {
    url: 'https://leetcode.com/problems/graph-valid-tree/',
    title: 'Graph Valid Tree',
    topic: 'Graphs',
    difficulty: 'Medium',
    prep: 'Review trees',
  };
  assert.deepEqual(buildLibrary([], [], [practiced]), [practiced]);
});
test('latest session metadata wins without duplicating the practice problem', () => {
  const p = { url: 'x', title: 'Original' };
  const latest = { ...p, title: 'Updated' };
  assert.deepEqual(buildLibrary([p], [latest], [p]), [latest]);
});
test('authentication reset removes inbox, identity, teaching claims and personal practice', () => {
  const reset = emptyClubData(['2026-10-13']);
  assert.equal(reset.signedIn, false);
  assert.equal(reset.profile, null);
  for (const field of ['inbox', 'claims', 'practiced', 'solved', 'roster'])
    assert.deepEqual(reset[field], []);
});
