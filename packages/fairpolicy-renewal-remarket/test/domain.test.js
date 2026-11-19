// Renewals: the window, urgent days, review and remarket words, premium increases, client-level activities.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRenewals } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Home', expiration_date: '2027-01-15', premium: '1000', renewal_premium: '', status: 'Active', csr: 'Casey', ...o });
const act = (o) => ({ policy_number: 'P-1', client: 'Fictional A', date: '2026-11-01', type: 'Note', description: 'Renewal review done', ...o });
const run = (p, a, o = {}) => checkRenewals(p, a, { asOf: '2026-11-18', ...o });

test('a review activity marks the renewal reviewed; none leaves it for review, urgent when close', () => {
  assert.equal(run([pol({})], [act({})]).rows[0].status, 'reviewed');
  assert.equal(run([pol({})], []).rows[0].status, 'no_review');
  assert.equal(run([pol({ expiration_date: '2026-12-10' })], []).rows[0].status, 'urgent_no_review');
});

test('a premium increase at or above the threshold needs a remarket, not just a review', () => {
  assert.equal(run([pol({ renewal_premium: '1100' })], [act({})]).rows[0].status, 'increase_not_remarketed');
  assert.equal(run([pol({ renewal_premium: '1100' })], [act({ description: 'Quotes requested' })]).rows[0].status, 'reviewed');
  assert.equal(run([pol({ renewal_premium: '1090' })], [act({})]).rows[0].status, 'reviewed');
});

test('only the window counts; expired, cancelled and non-renewed policies are left out', () => {
  const r = run([pol({ expiration_date: '2027-06-01' }), pol({ policy_number: 'P-2', status: 'Cancelled' }), pol({ policy_number: 'P-3', status: 'Non-Renewed' }), pol({ policy_number: 'P-4', expiration_date: '2026-11-01' })], []);
  assert.equal(r.expiring, 0);
});

test('an activity on the client with no policy named counts for that client\'s policies', () => {
  assert.equal(run([pol({})], [act({ policy_number: '' })]).rows[0].status, 'reviewed');
  assert.equal(run([pol({})], [act({ policy_number: '', client: 'Someone Else' })]).rows[0].status, 'no_review');
});

test('activities older than the lookback or after as_of do not count', () => {
  assert.equal(run([pol({})], [act({ date: '2026-01-01' })]).rows[0].status, 'no_review');
  assert.equal(run([pol({})], [act({ date: '2026-12-01' })]).rows[0].status, 'no_review');
});

test('the agency\'s own review words can replace the defaults', () => {
  assert.equal(run([pol({})], [act({ description: 'RNWL-CHK' })], { reviewWords: ['rnwl chk'] }).rows[0].status, 'reviewed');
});
