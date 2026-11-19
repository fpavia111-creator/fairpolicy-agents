// Chargebacks: pro rata and short rate, flat cancels, overcharges, pending reserves, producer reversals, stray chargebacks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkChargebacks, disputeText } from '../src/index.js';

const pol = (o) => ({ policy_number: 'PA-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Personal Auto', status: 'Cancelled', effective_date: '2026-01-01', expiration_date: '2027-01-01', cancel_date: '2026-07-02', premium: '1200', commission_rate: '10', producer: 'Pat', ...o });
const cb = (o) => ({ policy_number: 'PA-1', transaction_type: 'CAN', commission: '-60.16', ...o });
const run = (p, s, pp = null, o = {}) => checkChargebacks(p, s, pp, { asOf: '2026-11-18', ...o });

test('a chargeback equal to the rate on the pro-rata unearned premium is ok', () => {
  const r = run([pol({})], [cb({})]);
  assert.equal(r.rows[0].unearned, 601.64); assert.equal(r.rows[0].expected, 60.16); assert.equal(r.rows[0].status, 'charged_ok');
});

test('taking back more than that is overcharged, with the difference', () => {
  const r = run([pol({})], [cb({ commission: '-120' })]);
  assert.equal(r.rows[0].status, 'overcharged'); assert.equal(r.rows[0].difference, 59.84); assert.equal(r.overcharged_by, 59.84);
});

test('no chargeback yet is pending, and its expected amount is the reserve', () => {
  const r = run([pol({})], []);
  assert.equal(r.rows[0].status, 'pending_chargeback'); assert.equal(r.reserve_for_pending, 60.16);
});

test('a flat cancel takes back the whole commission; short rate leaves less unearned', () => {
  assert.equal(run([pol({ effective_date: '2026-07-01', cancel_date: '2026-07-01' })], [cb({ commission: '-120' })]).rows[0].expected, 120);
  assert.equal(run([pol({})], [], null, { method: 'short_rate' }).rows[0].unearned, 541.48);
});

test('a producer share paid and never reversed is flagged only when the producer file is given', () => {
  const pp = [{ policy_number: 'PA-1', producer: 'Pat', amount: '30' }];
  assert.equal(run([pol({})], [cb({})], pp).rows[0].status, 'producer_not_reversed');
  assert.equal(run([pol({})], [cb({})], [...pp, { policy_number: 'PA-1', amount: '-30' }]).rows[0].status, 'charged_ok');
  assert.equal(run([pol({})], [cb({})]).rows[0].producer_reversed, null);
});

test('a chargeback for a policy that is active or unknown in the agency system is listed once', () => {
  const r = run([pol({ status: 'Active', cancel_date: '' })], [cb({}), cb({ commission: '-5' }), cb({ policy_number: 'ZZ-9' })]);
  assert.deepEqual(r.rows.map((x) => [x.policy_number, x.status, x.taken]).sort(), [['PA-1', 'chargeback_without_cancel', 65.16], ['ZZ-9', 'chargeback_without_cancel', 60.16]]);
});

test('cancellations outside the window are left out; the recalculation request totals the differences', () => {
  assert.equal(run([pol({ cancel_date: '2026-01-15' })], []).cancellations, 0);
  const r = run([pol({})], [cb({ commission: '-120' })]);
  const d = disputeText(r.rows, {}); assert.equal(d.total, 59.84); assert.match(d.text, /\[CHECK whether the carrier used short-rate/);
});
