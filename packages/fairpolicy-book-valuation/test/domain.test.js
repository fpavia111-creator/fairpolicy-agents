// Book summary: commission from booked amounts or rates, concentration flags, missing data, the optional range.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeBook } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', line: 'Homeowners', carrier: 'Example Mutual', premium: '1000', commission: '150', status: 'Active', ...o });
const fig = (r, m) => r.rows.find((x) => x.metric === m);

test('commission is the booked amount, or premium times the booked rate', () => {
  const r = summarizeBook([pol({}), pol({ policy_number: 'P-2', commission: '', commission_rate: '10' })]);
  assert.equal(r.revenue, 250);
});

test('one carrier over the limit is a figure to watch', () => {
  const r = summarizeBook([pol({}), pol({ policy_number: 'P-2', client: 'Fictional B', carrier: 'Sample Casualty', commission: '50' })]);
  assert.equal(fig(r, 'top_carrier_share_pct').status, 'watch'); assert.equal(fig(r, 'top_carrier_share_pct').value, 75);
  assert.equal(fig(summarizeBook([pol({})], { top_carrier_limit_pct: 100 }), 'top_carrier_share_pct').status, 'ok');
});

test('policies with no commission and no rate are counted as missing data, not as zero revenue silently', () => {
  const r = summarizeBook([pol({}), pol({ policy_number: 'P-2', commission: '', commission_rate: '' })]);
  assert.equal(fig(r, 'missing_commission_pct').value, 50); assert.equal(fig(r, 'missing_commission_pct').status, 'watch');
});

test('cancelled and expired policies are not in force', () => {
  assert.equal(summarizeBook([pol({}), pol({ policy_number: 'P-2', status: 'Expired' })]).policies, 1);
});

test('the range appears only with both multiples, and says it is not an appraisal', () => {
  assert.equal(summarizeBook([pol({})], { revenue_multiple_low: 1 }).rows.some((x) => x.metric.startsWith('indicative')), false);
  const r = summarizeBook([pol({})], { revenue_multiple_low: 1, revenue_multiple_high: 2 });
  assert.equal(fig(r, 'indicative_value_high').value, 300); assert.match(fig(r, 'indicative_value_high').detail, /Not an appraisal/);
});

test('accounts group by client and the mix splits personal and commercial', () => {
  const r = summarizeBook([pol({}), pol({ policy_number: 'P-2', line: 'Personal Auto' }), pol({ policy_number: 'P-3', client: 'Fictional Co', line: 'BOP', commission: '300' })]);
  assert.equal(r.accounts, 2); assert.equal(fig(r, 'personal_lines_share_pct').value, 50);
});
