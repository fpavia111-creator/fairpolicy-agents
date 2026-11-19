// Missing commissions: the wait, the window, term suffixes, endorsements only, agency bill and flat cancels.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMissing, requestText } from '../src/index.js';

const pol = (o) => ({ policy_number: 'PA-100', client: 'Fictional A', carrier: 'Example Mutual', line: 'Personal Auto', effective_date: '2026-08-01', premium: '1000', commission_rate: '15', bill_type: 'Direct', status: 'Active', ...o });
const st = (o) => ({ policy_number: 'PA-100', transaction_type: 'NEW', commission: '150', ...o });
const run = (p, s, o = {}) => findMissing(p, s, { asOf: '2026-11-18', ...o });

test('a policy with a new or renewal line is received; with none after the wait it is missing with the expected commission', () => {
  const r = run([pol({}), pol({ policy_number: 'PA-200' })], [st({})]);
  assert.deepEqual(r.rows.map((x) => [x.policy_number, x.status, x.expected]), [['PA-200', 'missing', 150], ['PA-100', 'received', 150]]);
  assert.equal(r.expected_missing, 150);
});

test('inside the wait it is not yet due; the wait is a setting', () => {
  const p = [pol({ effective_date: '2026-11-01' })];
  assert.equal(run(p, []).rows[0].status, 'not_yet_due');
  assert.equal(run(p, [], { graceDays: 5 }).rows[0].status, 'missing');
});

test('only endorsement lines on the statements is partial, not received', () => {
  assert.equal(run([pol({})], [st({ transaction_type: 'PCH', commission: '9' })]).rows[0].status, 'partial');
});

test('agency bill and flat cancellations are set aside; a later cancellation is still checked', () => {
  const r = run([pol({ bill_type: 'Agency' }), pol({ policy_number: 'PA-300', status: 'Cancelled', cancel_date: '2026-08-01' }), pol({ policy_number: 'PA-400', status: 'Cancelled', cancel_date: '2026-10-01' })], []);
  assert.deepEqual(r.rows.map((x) => x.status).sort(), ['agency_bill', 'cancelled_flat', 'missing']);
});

test('effective dates outside the window or after as_of are counted, not listed', () => {
  const r = run([pol({ effective_date: '2025-01-01' }), pol({ policy_number: 'PA-9', effective_date: '2026-12-01' })], []);
  assert.equal(r.policies, 0); assert.equal(r.outside_window, 2);
});

test('a statement number with a term suffix counts for the policy', () => {
  assert.equal(run([pol({})], [st({ policy_number: 'PA 100-01' })]).rows[0].status, 'received');
});

test('the request lists each policy, marks a missing premium for a person, and totals what is known', () => {
  const r = run([pol({}), pol({ policy_number: 'PA-200', premium: '' })], []);
  const d = requestText(r.rows, { from: 'Pat Example' });
  assert.equal(d.total, 150); assert.match(d.text, /\[CHECK premium\]/); assert.match(d.text, /\[TO CONFIRM carrier commission contact\]/);
});
