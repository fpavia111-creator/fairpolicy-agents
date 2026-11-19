// Return premiums: agency or direct bill, refunded, applied, uncashed, the days.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRefunds } from '../src/index.js';

const rp = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', bill_type: 'Agency', return_amount: '-100', credited_date: '2026-11-01', refunded_date: '', check_number: '', cleared_date: '', applied_to: '', ...o });
const st = (o, opt = {}) => checkRefunds([rp(o)], { asOf: '2026-11-18', ...opt }).rows[0].status;

test('not refunded is due, then overdue after the days', () => {
  assert.equal(st({}), 'refund_due');
  assert.equal(st({ credited_date: '2026-09-01' }), 'refund_overdue');
  assert.equal(st({ credited_date: '2026-09-01' }, { refundDays: 120 }), 'refund_due');
});

test('a refund check that never cleared is flagged after the clear days', () => {
  assert.equal(st({ credited_date: '2026-05-01', refunded_date: '2026-05-05', check_number: '77' }), 'check_uncashed');
  assert.equal(st({ credited_date: '2026-05-01', refunded_date: '2026-05-05', check_number: '77', cleared_date: '2026-05-20' }), 'refunded');
  assert.equal(st({ refunded_date: '2026-11-05', check_number: '77' }), 'refunded');
});

test('applied to an invoice counts as refunded; direct bill is the carrier\'s to refund', () => {
  assert.equal(st({ applied_to: 'INV-1' }), 'refunded');
  assert.equal(st({ bill_type: 'Direct' }), 'carrier_refunds');
});

test('amounts are positive whatever the sign in the file; credits after as_of are left out', () => {
  const r = checkRefunds([rp({ return_amount: '-250' }), rp({ policy_number: 'P-2', credited_date: '2026-12-01' })], { asOf: '2026-11-18' });
  assert.equal(r.returns, 1); assert.equal(r.owed_to_clients, 250);
});

test('the most overdue refund comes first', () => {
  const r = checkRefunds([rp({ policy_number: 'P-1', credited_date: '2026-10-01' }), rp({ policy_number: 'P-2', credited_date: '2026-08-01' })], { asOf: '2026-11-18' });
  assert.deepEqual(r.rows.map((x) => x.policy_number), ['P-2', 'P-1']);
});
