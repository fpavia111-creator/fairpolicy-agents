// Carrier payables: amounts that differ, items on one side only, past due, transaction words, several lines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcilePayables, noteText } from '../src/index.js';

const it = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Sample Casualty', transaction_type: 'NEW', gross_premium: '1000', commission: '100', net_due: '900', due_date: '2026-12-01', ...o });
const run = (c, a, o = {}) => reconcilePayables(c, a, { asOf: '2026-11-18', ...o });

test('the same net on both sides is ok; a different net is named with the difference', () => {
  assert.equal(run([it({})], [it({})]).rows[0].status, 'ok');
  const r = run([it({})], [it({ commission: '150', net_due: '850' })]);
  assert.equal(r.rows[0].status, 'amount_differs'); assert.equal(r.rows[0].difference, 50);
});

test('items on one side only are named for that side', () => {
  const r = run([it({ policy_number: 'P-2' })], [it({})]);
  assert.deepEqual(r.rows.map((x) => [x.policy_number, x.status]), [['P-2', 'not_in_agency_system'], ['P-1', 'not_on_carrier_statement']]);
});

test('agreed items past the due date are past due', () => {
  assert.equal(run([it({ due_date: '2026-11-01' })], [it({})]).rows[0].status, 'past_due');
});

test('transaction words differ between systems but mean the same', () => {
  assert.equal(run([it({ transaction_type: 'RWL' })], [it({ transaction_type: 'Renewal' })]).rows[0].status, 'ok');
  assert.equal(run([it({ transaction_type: 'RWL' })], [it({ transaction_type: 'NEW' })]).rows.length, 2);
});

test('several lines of the same policy and kind are added before comparing', () => {
  const r = run([it({ net_due: '400' }), it({ net_due: '500' })], [it({})]);
  assert.equal(r.lines, 1); assert.equal(r.rows[0].status, 'ok');
});

test('with no net column the net is premium less commission', () => {
  assert.equal(run([it({ net_due: '' })], [it({})]).rows[0].status, 'ok');
});

test('the note lists the items and leaves the contact for a person', () => {
  const r = run([it({})], [it({ net_due: '850' })]);
  assert.match(noteText(r.rows, {}).text, /\[TO CONFIRM carrier agency-bill accounting contact\]/);
});
