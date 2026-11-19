// Policy checking: coverages, limits, deductibles, premium, dates, binders not issued.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPolicies } from '../src/index.js';

const row = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', coverage: 'Dwelling', limit: '300000', deductible: '1000', premium: '1000', effective_date: '2026-10-01', expiration_date: '2027-10-01', bound_date: '2026-09-25', ...o });
const st = (b, i, o = {}) => checkPolicies(b, i, { asOf: '2026-11-18', ...o }).rows[0];

test('the same coverages, limits, premium and dates match', () => { assert.equal(st([row({})], [row({})]).status, 'matches'); });

test('a lower limit, a higher deductible or a missing coverage is coverage reduced', () => {
  assert.equal(st([row({})], [row({ limit: '250000' })]).status, 'coverage_reduced');
  assert.equal(st([row({})], [row({ deductible: '2500' })]).status, 'coverage_reduced');
  assert.equal(st([row({}), row({ coverage: 'Liability', premium: '0' })], [row({})]).status, 'coverage_reduced');
  assert.equal(st([row({})], [row({ limit: '350000' })]).status, 'matches');
});

test('premium beyond the tolerance and different dates are flagged; the worst decides the status', () => {
  assert.equal(st([row({})], [row({ premium: '1100' })]).status, 'premium_differs');
  assert.equal(st([row({})], [row({ effective_date: '2026-10-15' })]).status, 'dates_differ');
  const r = st([row({})], [row({ limit: '1', premium: '1100' })]);
  assert.equal(r.status, 'coverage_reduced'); assert.equal(r.issues, 'coverage_reduced, premium_differs');
});

test('bound with nothing issued is flagged after the days, and waits before', () => {
  assert.equal(st([row({ bound_date: '2026-09-01' })], []).status, 'not_issued');
  assert.equal(checkPolicies([row({ bound_date: '2026-11-10' })], [], { asOf: '2026-11-18' }).policies, 0);
});

test('coverage names compare without case or punctuation', () => {
  assert.equal(st([row({ coverage: 'Personal Liability' })], [row({ coverage: 'personal-liability' })]).status, 'matches');
});
