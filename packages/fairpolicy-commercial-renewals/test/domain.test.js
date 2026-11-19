// Commercial renewal timelines: milestones counted back from expiration, done, overdue, due soon, the schedule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTimelines } from '../src/index.js';

const pol = (o) => ({ policy_number: 'C-1', client: 'Fictional Co', carrier: 'Sample Casualty', line: 'General Liability', expiration_date: '2027-01-31', status: 'Active', ...o });
const done = (m, d = '2026-10-01', o = {}) => ({ policy_number: 'C-1', milestone: m, completed_date: d, ...o });
const sched = [{ name: 'loss_runs', label: 'Loss runs', days_before: 90 }, { name: 'quotes', label: 'Quotes', days_before: 30 }];
const run = (p, d, o = {}) => checkTimelines(p, d, { asOf: '2026-11-18', milestones: sched, ...o });

test('a milestone past its due date and not done is overdue', () => {
  const r = run([pol({})], []);
  assert.equal(r.rows[0].status, 'overdue'); assert.equal(r.rows[0].overdue, 'loss_runs');
});

test('done milestones clear; the next one decides on track or due this week', () => {
  assert.equal(run([pol({})], [done('Loss Runs')]).rows[0].status, 'on_track');
  assert.equal(run([pol({ expiration_date: '2026-12-21' })], [done('loss_runs')]).rows[0].status, 'due_this_week');
  assert.equal(run([pol({})], [done('loss_runs'), done('quotes')]).rows[0].status, 'complete');
});

test('a milestone recorded after as_of does not count yet', () => {
  assert.equal(run([pol({})], [done('loss_runs', '2026-12-01')]).rows[0].status, 'overdue');
});

test('personal lines, renewals beyond the window and cancelled policies are left out', () => {
  const r = run([pol({ line: 'Homeowners' }), pol({ policy_number: 'C-2', expiration_date: '2027-08-01' }), pol({ policy_number: 'C-3', status: 'Cancelled' })], []);
  assert.equal(r.renewals, 0);
});

test('the soonest expiration comes first within a status', () => {
  const r = run([pol({ policy_number: 'C-1', expiration_date: '2027-01-31' }), pol({ policy_number: 'C-2', expiration_date: '2027-01-10' })], []);
  assert.deepEqual(r.rows.map((x) => x.policy_number), ['C-2', 'C-1']);
});

test('the default schedule has six milestones from 120 days to 7', () => {
  const r = checkTimelines([pol({ expiration_date: '2027-03-18' })], [], { asOf: '2026-11-18' });
  assert.equal(r.rows[0].of, 6); assert.equal(r.rows[0].overdue, '');
});
