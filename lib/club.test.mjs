import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  upcomingSessions,
  validateQuestion,
  isOpenSession,
  calendarEvent,
} from './club.mjs';

test('keeps Tuesday session until 8pm IST, then advances to Thursday', () => {
  assert.equal(
    upcomingSessions(new Date('2026-10-13T14:29:00Z'))[0],
    '2026-10-13',
  );
  assert.equal(
    upcomingSessions(new Date('2026-10-13T14:30:00Z'))[0],
    '2026-10-15',
  );
});
test('schedule rolls over months and remains Tuesdays and Thursdays', () => {
  const dates = upcomingSessions(new Date('2026-12-31T16:00:00Z'));
  assert.equal(dates[0], '2027-01-05');
  assert.ok(
    dates.every((d) => [2, 4].includes(new Date(d + 'T00:00:00Z').getUTCDay())),
  );
});
test('canonicalizes problem links and rejects spoofed or non-HTTPS links', () => {
  const q = validateQuestion({
    url: 'https://leetcode.com/problems/clone-graph/description/?x=1',
    title: 'Clone Graph',
    prep: 'Know BFS',
    practice: '',
    difficulty: 'Medium',
    topic: 'Graphs',
  });
  assert.equal(q.url, 'https://leetcode.com/problems/clone-graph/');
  for (const url of [
    'javascript:alert(1)',
    'https://leetcode.com.evil.test/problems/a',
    'http://leetcode.com/problems/a',
    'https://leetcode.com@evil.test/problems/a',
    'https://leetcode.com/contest/x',
  ]) {
    assert.throws(() =>
      validateQuestion({
        url,
        title: 'A',
        prep: '',
        difficulty: 'Medium',
        topic: 'Graphs',
      }),
    );
  }
});
test('accepts optional practice but rejects oversized preparation notes', () => {
  assert.equal(
    validateQuestion({
      url: 'https://leetcode.com/problems/clone-graph/',
      title: 'Clone Graph',
      prep: '',
      practice: '',
      difficulty: 'Medium',
      topic: 'Graphs',
    }).practice,
    '',
  );
  assert.throws(() =>
    validateQuestion({
      url: 'https://leetcode.com/problems/clone-graph/',
      title: 'Clone Graph',
      prep: 'a'.repeat(2001),
      difficulty: 'Medium',
      topic: 'Graphs',
    }),
  );
});
test('only allows future scheduled sessions within the visible planning window', () => {
  const now = new Date('2026-10-13T00:00:00Z');
  assert.equal(isOpenSession('2026-10-15', now), true);
  for (const d of ['2026-10-12', '2026-10-14', '2029-01-02', '2026-02-31'])
    assert.equal(isOpenSession(d, now), false);
});
test('calendar event converts 6–8 PM IST to 12:30–14:30 UTC', () => {
  const ics = calendarEvent('2026-10-13');
  assert.match(ics, /DTSTART:20261013T123000Z/);
  assert.match(ics, /DTEND:20261013T143000Z/);
  assert.match(ics, /TRIGGER:-PT30M/);
});
