// Direct and agency bill: double billing, coded agency but paid direct, coded direct but invoiced, missing bill type.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkBilling } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Auto', bill_type: 'Direct', status: 'Active', ...o });
const st = (o) => ({ policy_number: 'P-1', transaction_type: 'NEW', commission: '10', ...o });
const inv = (o) => ({ policy_number: 'P-1', amount: '500', ...o });

test('a direct-bill policy on the statement and an agency-bill policy invoiced are both ok', () => {
  const r = checkBilling([pol({}), pol({ policy_number: 'P-2', bill_type: 'Agency' })], [st({})], [inv({ policy_number: 'P-2' })]);
  assert.deepEqual(r.rows.map((x) => x.status), ['ok', 'ok']); assert.equal(r.mismatches, 0);
});

test('on the statement and invoiced is double billed, whatever the coding', () => {
  for (const bill of ['Direct', 'Agency', '']) assert.equal(checkBilling([pol({ bill_type: bill })], [st({})], [inv({})]).rows[0].status, 'double_billed');
});

test('coded agency but on the direct statement; coded direct but invoiced', () => {
  assert.equal(checkBilling([pol({ bill_type: 'AB' })], [st({})], []).rows[0].status, 'coded_agency_paid_direct');
  const r = checkBilling([pol({ bill_type: 'DB' })], [], [inv({ amount: '250' })]);
  assert.equal(r.rows[0].status, 'coded_direct_invoiced'); assert.equal(r.invoiced_at_risk, 250);
});

test('no bill type is named; cancelled and expired policies are left out', () => {
  const r = checkBilling([pol({ bill_type: '' }), pol({ policy_number: 'P-2', status: 'Cancelled' }), pol({ policy_number: 'P-3', status: 'Expired' })], [], []);
  assert.equal(r.policies, 1); assert.equal(r.rows[0].status, 'bill_type_missing');
});

test('statement and invoice numbers match with a term suffix or different punctuation', () => {
  assert.equal(checkBilling([pol({ policy_number: 'BOP 12345' })], [st({ policy_number: 'BOP-12345-01' })], [inv({ policy_number: 'bop12345' })]).rows[0].status, 'double_billed');
});

test('a statement line with no commission amount does not count as billing', () => {
  assert.equal(checkBilling([pol({ bill_type: 'Agency' })], [st({ commission: '' })], []).rows[0].status, 'ok');
});
