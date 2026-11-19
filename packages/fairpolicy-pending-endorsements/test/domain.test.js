// Pending endorsements: not sent, not confirmed, confirmed and not billed, direct bill, dates after as_of.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkEndorsements } from '../src/index.js';

const ch = (o) => ({ request_id: 'E-1', policy_number: 'P-1', client: 'Fictional A', change: 'Add vehicle', requested_date: '2026-11-10', submitted_date: '', confirmed_date: '', premium_change: '', bill_type: 'Agency', invoiced: '', ...o });
const st = (o, opt = {}) => checkEndorsements([ch(o)], { asOf: '2026-11-18', ...opt }).rows[0].status;

test('asked and not sent after the days is not submitted; within them it is waiting', () => {
  assert.equal(st({}), 'not_submitted');
  assert.equal(st({ requested_date: '2026-11-17' }), 'waiting');
});

test('sent and not confirmed after the days is unconfirmed', () => {
  assert.equal(st({ submitted_date: '2026-10-20' }), 'unconfirmed');
  assert.equal(st({ submitted_date: '2026-11-10' }), 'waiting');
  assert.equal(st({ submitted_date: '2026-10-20' }, { confirmDays: 60 }), 'waiting');
});

test('confirmed with a premium change on agency bill needs an invoice or credit', () => {
  assert.equal(st({ submitted_date: '2026-11-01', confirmed_date: '2026-11-05', premium_change: '150' }), 'premium_change_not_billed');
  assert.equal(st({ submitted_date: '2026-11-01', confirmed_date: '2026-11-05', premium_change: '-150' }), 'premium_change_not_billed');
  assert.equal(st({ submitted_date: '2026-11-01', confirmed_date: '2026-11-05', premium_change: '150', invoiced: 'INV-9' }), 'done');
  assert.equal(st({ submitted_date: '2026-11-01', confirmed_date: '2026-11-05', premium_change: '150', invoiced: 'No' }), 'premium_change_not_billed');
});

test('direct bill and no premium change are done once confirmed', () => {
  assert.equal(st({ submitted_date: '2026-11-01', confirmed_date: '2026-11-05', premium_change: '150', bill_type: 'Direct' }), 'done');
  assert.equal(st({ submitted_date: '2026-11-01', confirmed_date: '2026-11-05', premium_change: '0' }), 'done');
});

test('dates after as_of are not counted yet', () => {
  assert.equal(st({ submitted_date: '2026-11-25' }), 'not_submitted');
});
