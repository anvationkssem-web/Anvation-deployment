import test from 'node:test';
import assert from 'node:assert/strict';

import { getHackathonTimerState, formatCountdown } from '../src/utils/hackathonTimer';

const startAt = new Date('2026-10-08T09:30:00+05:30').getTime();

test('timer counts down to the official start time before the event begins', () => {
  const beforeStart = getHackathonTimerState(startAt, new Date('2026-10-08T09:00:00+05:30').getTime());
  const atStart = getHackathonTimerState(startAt, startAt);

  assert.equal(beforeStart.status, 'before_start');
  assert.equal(beforeStart.timeRemainingMs, 30 * 60 * 1000);
  assert.equal(formatCountdown(beforeStart.timeRemainingMs), '00:30:00');

  assert.equal(atStart.status, 'round_1');
  assert.equal(atStart.timeRemainingMs, 4 * 60 * 60 * 1000);
  assert.equal(formatCountdown(atStart.timeRemainingMs), '04:00:00');
});

test('timer stays in round 1 and decreases correctly before the midpoint', () => {
  const state = getHackathonTimerState(startAt, new Date('2026-10-08T10:30:00+05:30').getTime());
  assert.equal(state.status, 'round_1');
  assert.equal(state.roundLabel, 'ROUND 1');
  assert.equal(state.timeRemainingMs, 3 * 60 * 60 * 1000);
  assert.equal(formatCountdown(state.timeRemainingMs), '03:00:00');
});

test('timer reaches round 2 exactly at 1:30 PM and keeps the full 24 hour total', () => {
  const round1End = getHackathonTimerState(startAt, new Date('2026-10-08T13:29:00+05:30').getTime());
  const round2Start = getHackathonTimerState(startAt, new Date('2026-10-08T13:30:00+05:30').getTime());

  assert.equal(round1End.status, 'round_1');
  assert.equal(round1End.timeRemainingMs, 60 * 1000);
  assert.equal(formatCountdown(round1End.timeRemainingMs), '00:01:00');

  assert.equal(round2Start.status, 'round_2');
  assert.equal(round2Start.roundLabel, 'ROUND 2');
  assert.equal(round2Start.timeRemainingMs, 20 * 60 * 60 * 1000);
  assert.equal(formatCountdown(round2Start.timeRemainingMs), '20:00:00');
  assert.equal(round2Start.totalDurationMs, 24 * 60 * 60 * 1000);
});

test('timer completes after 24 hours and never drops below zero', () => {
  const beforeComplete = getHackathonTimerState(startAt, new Date('2026-10-09T09:29:59+05:30').getTime());
  const completed = getHackathonTimerState(startAt, new Date('2026-10-09T09:30:00+05:30').getTime());
  const zeroed = getHackathonTimerState(startAt, new Date('2026-10-09T09:30:01+05:30').getTime());

  assert.equal(beforeComplete.status, 'round_2');
  assert.equal(formatCountdown(beforeComplete.timeRemainingMs), '00:00:01');

  assert.equal(completed.status, 'completed');
  assert.equal(completed.roundLabel, 'HACKATHON COMPLETED');
  assert.equal(formatCountdown(completed.timeRemainingMs), '00:00:00');
  assert.equal(zeroed.timeRemainingMs, 0);
});
