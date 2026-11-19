// Commission statement check: rates by carrier, line and new/renewal; term suffixes; duplicates; cancellations; the inquiry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkStatement, expectedRate, inquiryText } from '../src/index.js';

const schedule = { tolerance: 1, rates: [
  { carrier: 'Example Mutual', line: 'Personal Auto', kind: 'new', rate: 15 },
  { carrier: 'Example Mutual', line: 'Personal Auto', kind: 'renewal', rate: 12 },
  { carrier: 'Example Mutual', rate: 10 },
  { carrier: 'Sample Casualty', line: 'Workers Compensation', rate: 9 },
] };
const pol = (o) => ({ policy_number: 'PA-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Personal Auto', premium: '1000', business_type: 'New', ...o });
const st = (o) => ({ policy_number: 'PA-1', carrier: 'Example Mutual', transaction_type: 'NEW', premium: '1000', commission: '150', ...o });

test('the most specific schedule rate wins: line and new/renewal before carrier only', () => {
  assert.equal(expectedRate(schedule, 'Example Mutual', 'pauto', 'new').rate, 15);
  assert.equal(expectedRate(schedule, 'Example Mutual Insurance Co', 'pauto', 'renewal').rate, 12);
  assert.equal(expectedRate(schedule, 'Example Mutual', 'home', 'new').rate, 10);
  assert.equal(expectedRate(schedule, 'Unknown Carrier', 'home', 'new'), null);
});

test('paid at the right rate is ok; short beyond the tolerance is underpaid with the gap', () => {
  const r = checkStatement([st({}), st({ policy_number: 'PA-2', commission: '120' })], [pol({}), pol({ policy_number: 'PA-2' })], schedule);
  assert.deepEqual(r.rows.map((x) => [x.policy_number, x.status, x.difference]), [['PA-2', 'underpaid', -30], ['PA-1', 'ok', 0]]);
  assert.equal(r.short_total, 30);
  const within = checkStatement([st({ commission: '149.40' })], [pol({})], schedule);
  assert.equal(within.rows[0].status, 'ok', 'within the tolerance');
});

test('endorsements use the policy\'s new or renewal rate, cancellations return commission at the same rate', () => {
  const r = checkStatement([st({ transaction_type: 'PCH', premium: '200', commission: '30' }), st({ transaction_type: 'CANC', premium: '-500', commission: '-75' })], [pol({})], schedule);
  assert.deepEqual(r.rows.map((x) => [x.transaction_type, x.expected, x.status]).sort(), [['cancellation', -75, 'ok'], ['endorsement', 30, 'ok']]);
  const ren = checkStatement([st({ transaction_type: 'END', premium: '200', commission: '24' })], [pol({ business_type: 'Renewal' })], schedule);
  assert.equal(ren.rows[0].expected, 24);
});

test('a statement number with or without the term suffix finds the policy', () => {
  const r = checkStatement([st({ policy_number: 'PA 1-02' })], [pol({ policy_number: 'PA-1' })], schedule);
  assert.equal(r.rows[0].status, 'ok');
});

test('the same line twice is flagged on both copies, whatever the order', () => {
  const r = checkStatement([st({}), st({}), st({ policy_number: 'PA-9' })], [pol({}), pol({ policy_number: 'PA-9' })], schedule);
  assert.deepEqual(r.rows.filter((x) => x.status === 'possible_duplicate').length, 2);
});

test('no policy, no rate and no premium are each named, never guessed', () => {
  const r = checkStatement([st({ policy_number: 'X-1' }), st({ policy_number: 'WC-1', carrier: 'Other Carrier', transaction_type: 'NEW' }), st({ policy_number: 'WC-2', carrier: 'Sample Casualty', transaction_type: 'AUDIT', premium: '' })],
    [pol({ policy_number: 'WC-1', carrier: 'Other Carrier', line: 'Workers Comp' }), pol({ policy_number: 'WC-2', carrier: 'Sample Casualty', line: 'Workers Comp' })], schedule);
  assert.deepEqual(r.rows.map((x) => x.status).sort(), ['no_policy', 'no_rate', 'not_checked']);
});

test('a rate booked on the policy is used when the schedule has none, and says so', () => {
  const r = checkStatement([st({ carrier: 'Booked Carrier', commission: '80' })], [pol({ carrier: 'Booked Carrier', commission_rate: '8' })], schedule);
  assert.equal(r.rows[0].status, 'ok'); assert.equal(r.rows[0].expected_rate, 8);
});

test('the inquiry lists each short line and the total, with open markers for what a person must confirm', () => {
  const r = checkStatement([st({ commission: '100' })], [pol({})], schedule);
  const d = inquiryText(r.rows, {});
  assert.equal(d.total, 50);
  assert.match(d.text, /\| PA-1 \|/); assert.match(d.text, /\[TO CONFIRM carrier accounting contact\]/); assert.match(d.text, /\[CHECK the agreed rates/);
});
