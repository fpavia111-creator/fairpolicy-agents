// Lapses: replacements, reinstatement windows, stale active policies, renewed terms, the window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLapses } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Homeowners', effective_date: '2026-01-01', expiration_date: '2027-01-01', premium: '1000', status: 'Cancelled', cancel_date: '2026-10-01', cancel_reason: 'Insured request', ...o });
const run = (rows, o = {}) => checkLapses(rows, { asOf: '2026-11-18', ...o });

test('a cancellation with no other policy for the client and line is not replaced', () => {
  const r = run([pol({})]);
  assert.equal(r.rows[0].status, 'not_replaced'); assert.equal(r.premium_not_replaced, 1000);
});

test('an active policy for the same client and line is a replacement, whatever the carrier', () => {
  const r = run([pol({}), pol({ policy_number: 'P-2', carrier: 'Sample Casualty', status: 'Active', effective_date: '2026-10-01', expiration_date: '2027-10-01', cancel_date: '' })]);
  assert.equal(r.rows[0].status, 'replaced'); assert.equal(r.rows[0].replacement, 'P-2');
});

test('a non-payment cancellation inside the reinstatement days comes first', () => {
  const r = run([pol({}), pol({ policy_number: 'P-3', cancel_date: '2026-11-10', cancel_reason: 'NSF' })]);
  assert.equal(r.rows[0].policy_number, 'P-3'); assert.equal(r.rows[0].status, 'reinstatement_window');
  assert.equal(run([pol({ cancel_date: '2026-11-10', cancel_reason: 'NSF' })], { reinstateDays: 5 }).rows[0].status, 'not_replaced');
});

test('an active policy past its expiration is flagged unless its renewal term is in the file', () => {
  assert.equal(run([pol({ status: 'Active', cancel_date: '', expiration_date: '2026-11-01' })]).rows[0].status, 'expired_no_renewal_record');
  assert.equal(run([pol({ status: 'Active', cancel_date: '', expiration_date: '2026-11-01' }), pol({ status: 'Active', cancel_date: '', effective_date: '2026-11-01', expiration_date: '2027-11-01' })]).policies, 0);
});

test('policies that ended before the window or after as_of are left out', () => {
  assert.equal(run([pol({ cancel_date: '2026-06-01' }), pol({ policy_number: 'P-2', cancel_date: '2026-12-01' })]).policies, 0);
});

test('personal lines come before commercial lines in the same status', () => {
  const r = run([pol({ policy_number: 'C-1', client: 'Fictional Co', line: 'General Liability' }), pol({ policy_number: 'H-1' })]);
  assert.deepEqual(r.rows.map((x) => x.policy_number), ['H-1', 'C-1']);
});
