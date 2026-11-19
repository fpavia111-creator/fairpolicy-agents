// Retention: renewals by number or by client and line, cancellations, the period, target and minimum.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRetention, dueTerms } from '../src/index.js';

const t = (o) => ({ policy_number: 'P-1', client: 'Fictional A', line: 'Homeowners', carrier: 'Example Mutual', effective_date: '2025-06-01', expiration_date: '2026-06-01', premium: '1000', producer: 'Pat', status: 'Expired', ...o });
const renewal = (o) => t({ effective_date: '2026-06-01', expiration_date: '2027-06-01', status: 'Active', ...o });
const run = (rows, o = {}) => checkRetention(rows, { asOf: '2026-11-18', minTerms: 1, ...o });

test('a later term with the same number is a renewal; none is a loss', () => {
  assert.deepEqual(dueTerms([t({}), renewal({})], { from: '2025-11-18', to: '2026-11-18' }).map((x) => x.renewed), [true]);
  assert.equal(run([t({})]).rows[0].retention_pct, 0);
});

test('a new policy for the same client and line within 45 days counts as renewed', () => {
  assert.equal(run([t({}), renewal({ policy_number: 'P-9', effective_date: '2026-06-20' })]).renewed, 1);
  assert.equal(run([t({}), renewal({ policy_number: 'P-9', effective_date: '2026-09-01' })]).renewed, 0);
});

test('a mid-term cancellation in the period is a loss with its reason', () => {
  const r = run([t({ status: 'Cancelled', cancel_date: '2026-03-01', cancel_reason: 'Price' }), renewal({})]);
  assert.equal(r.renewed, 0); assert.equal(r.lost_reasons[0].reason, 'Price');
});

test('premium retention weighs each term by its premium', () => {
  const r = run([t({ premium: '3000' }), renewal({}), t({ policy_number: 'P-2', client: 'Fictional B', premium: '1000' })]);
  assert.equal(r.retention_pct, 50); assert.equal(r.premium_retention_pct, 75);
});

test('the status follows the target and the minimum number of terms', () => {
  const rows = [t({}), renewal({}), t({ policy_number: 'P-2', client: 'Fictional B' })];
  assert.equal(run(rows, { target: 60 }).rows[0].status, 'below_target');
  assert.equal(run(rows, { target: 40 }).rows[0].status, 'at_target');
  assert.equal(run(rows, { minTerms: 5 }).rows[0].status, 'too_few');
});

test('terms that end outside the period are left out', () => {
  assert.equal(run([t({ expiration_date: '2025-06-01', effective_date: '2024-06-01' })]).due, 0);
});
