// Producer splits: new and renewal percents, shared policies, house accounts, wrong producers, chargebacks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSplits } from '../src/index.js';

const settings = { producers: [{ name: 'Pat', new_pct: 40, renewal_pct: 20 }, { name: 'Lee', new_pct: 50, renewal_pct: 25 }], shared: [] };
const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Auto', producer: 'Pat', business_type: 'New', ...o });
const rec = (o) => ({ policy_number: 'P-1', transaction_type: 'NEW', commission: '100', ...o });
const pay = (o) => ({ policy_number: 'P-1', producer: 'Pat', amount: '40', ...o });

test('new and renewal commission are split at their own percent', () => {
  const r = checkSplits([rec({}), rec({ policy_number: 'P-2', transaction_type: 'RWL' })], [pol({}), pol({ policy_number: 'P-2', business_type: 'Renewal' })], [pay({}), pay({ policy_number: 'P-2', amount: '20' })], settings);
  assert.deepEqual(r.rows.map((x) => [x.policy_number, x.expected, x.status]), [['P-1', 40, 'ok'], ['P-2', 20, 'ok']]);
});

test('short beyond the tolerance is underpaid; nothing paid is not_paid; too much is overpaid', () => {
  assert.equal(checkSplits([rec({})], [pol({})], [pay({ amount: '30' })], settings).rows[0].status, 'underpaid');
  assert.equal(checkSplits([rec({})], [pol({})], [], settings).rows[0].status, 'not_paid');
  assert.equal(checkSplits([rec({})], [pol({})], [pay({ amount: '45' })], settings).rows[0].status, 'overpaid');
  assert.equal(checkSplits([rec({})], [pol({})], [pay({ amount: '40.50' })], settings).rows[0].status, 'ok');
});

test('a shared policy gives each producer their share of the commission', () => {
  const s = { ...settings, shared: [{ policy_number: 'P-1', producers: [{ name: 'Pat', share: 0.5 }, { name: 'Lee', share: 0.5 }] }] };
  const r = checkSplits([rec({})], [pol({})], [pay({ amount: '20' }), pay({ producer: 'Lee', amount: '25' })], s);
  assert.deepEqual(r.rows.map((x) => [x.producer, x.expected, x.status]), [['Lee', 25, 'ok'], ['Pat', 20, 'ok']]);
});

test('a house account has no split; paying someone on it is the wrong producer', () => {
  const r = checkSplits([rec({})], [pol({ producer: 'House' })], [pay({})], settings);
  assert.equal(r.house_lines, 1); assert.equal(r.rows[0].status, 'wrong_producer');
});

test('paid on a policy with no commission received, and a producer not in the schedule, are each named', () => {
  const r = checkSplits([rec({ policy_number: 'P-2' })], [pol({}), pol({ policy_number: 'P-2', producer: 'Unknown Person' })], [pay({})], settings);
  assert.deepEqual(r.rows.map((x) => x.status).sort(), ['no_commission_received', 'no_split_rate']);
});

test('a chargeback reverses the split, and producer names compare without case or extra spaces', () => {
  const r = checkSplits([rec({ transaction_type: 'XLC', commission: '-100' })], [pol({ business_type: 'Renewal' })], [pay({ producer: ' pat ', amount: '-20' })], settings);
  assert.equal(r.rows[0].expected, -20); assert.equal(r.rows[0].status, 'ok');
});

test('totals by producer put the biggest shortfall first', () => {
  const r = checkSplits([rec({}), rec({ policy_number: 'P-2' })], [pol({}), pol({ policy_number: 'P-2', producer: 'Lee' })], [pay({ amount: '35' })], settings);
  assert.equal(r.by_producer[0].producer, 'Lee'); assert.equal(r.by_producer[0].difference, -50);
});
