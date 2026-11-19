// Open claims: carrier claim number, quiet days, renewal soon, long open, closed claims.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkClaims } from '../src/index.js';

const cl = (o) => ({ agency_claim_id: 'A-1', claim_number: 'C-1', client: 'Fictional A', policy_number: 'P-1', carrier: 'Example Mutual', reported_date: '2026-11-01', status: 'Open', last_activity_date: '2026-11-15', paid: '100', reserve: '900', policy_expiration: '2027-06-01', ...o });
const st = (o, opt = {}) => checkClaims([cl(o)], { asOf: '2026-11-18', ...opt }).rows[0].status;

test('no carrier claim number after the report days is not reported', () => {
  assert.equal(st({ claim_number: '' }), 'not_reported');
  assert.equal(st({ claim_number: '', reported_date: '2026-11-17', last_activity_date: '' }), 'active');
});

test('no activity for longer than the quiet days is no update', () => {
  assert.equal(st({ reported_date: '2026-09-01', last_activity_date: '2026-10-01' }), 'no_update');
  assert.equal(st({ reported_date: '2026-09-01', last_activity_date: '2026-10-01' }, { quietDays: 60 }), 'active');
});

test('a policy renewing soon and a claim open a long time are flagged in that order', () => {
  assert.equal(st({ policy_expiration: '2026-12-15' }), 'renewal_soon');
  assert.equal(st({ reported_date: '2026-01-01' }), 'open_long');
  assert.equal(st({ reported_date: '2026-01-01', policy_expiration: '2026-12-15' }), 'renewal_soon');
});

test('closed, settled and denied claims are counted, not listed', () => {
  const r = checkClaims([cl({ status: 'Closed' }), cl({ agency_claim_id: 'A-2', status: 'Denied' }), cl({ agency_claim_id: 'A-3' })], { asOf: '2026-11-18' });
  assert.equal(r.open, 1); assert.equal(r.closed, 2);
});

test('incurred is paid plus reserve; claims reported after as_of are left out', () => {
  const r = checkClaims([cl({}), cl({ agency_claim_id: 'A-2', reported_date: '2026-12-01' })], { asOf: '2026-11-18' });
  assert.equal(r.open, 1); assert.equal(r.rows[0].incurred, 1000);
});
