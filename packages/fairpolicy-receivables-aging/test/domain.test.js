// Receivables aging: buckets, fronted premium, credit balances, paid items, totals by client and producer, the reminder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageReceivables, reminderText } from '../src/index.js';

const inv = (o) => ({ client: 'Fictional A', client_id: 'A-1', invoice: 'I-1', policy_number: 'P-1', carrier: 'Example Mutual', due_date: '2026-10-01', amount: '100', balance: '100', producer: 'Pat', remitted: 'No', ...o });
const run = (rows, o = {}) => ageReceivables(rows, { asOf: '2026-11-18', ...o });

test('days past due put each item in its bucket', () => {
  const r = run([inv({ due_date: '2026-12-01' }), inv({ invoice: 'I-2', due_date: '2026-11-10' }), inv({ invoice: 'I-3', due_date: '2026-10-10' }), inv({ invoice: 'I-4', due_date: '2026-09-10' }), inv({ invoice: 'I-5', due_date: '2026-08-01' })]);
  assert.deepEqual(r.rows.map((x) => x.status), ['over_90', 'over_60', 'over_30', 'current', 'not_due']);
  assert.deepEqual([r.not_due, r.days_1_30, r.days_31_60, r.days_61_90, r.days_over_90], [100, 100, 100, 100, 100]);
});

test('an item the agency already remitted, past the fronted days, comes first', () => {
  const r = run([inv({ due_date: '2026-08-01' }), inv({ invoice: 'I-2', remitted: 'Yes', due_date: '2026-10-01' })]);
  assert.equal(r.rows[0].status, 'fronted_premium'); assert.equal(r.fronted, 100);
  assert.equal(run([inv({ remitted: 'Yes', due_date: '2026-11-10' })]).rows[0].status, 'current');
});

test('a negative balance is a credit owed to the client; a zero balance is left out', () => {
  const r = run([inv({ balance: '-40' }), inv({ invoice: 'I-2', balance: '0' })]);
  assert.equal(r.invoices, 1); assert.equal(r.rows[0].status, 'credit_balance'); assert.equal(r.credit_balances, 40); assert.equal(r.open_balance, 0);
});

test('the balance column wins over the original amount; with no balance the amount is used', () => {
  assert.equal(run([inv({ amount: '500', balance: '120' })]).open_balance, 120);
  assert.equal(run([inv({ amount: '500', balance: '' })]).open_balance, 500);
});

test('totals by client and producer put the oldest money first', () => {
  const r = run([inv({}), inv({ invoice: 'I-2', client: 'Fictional B', producer: 'Lee', due_date: '2026-07-01', balance: '50' })]);
  assert.equal(r.by_client[0].client, 'Fictional A'); assert.equal(r.by_producer[0].producer, 'Pat');
});

test('the reminder lists the items and leaves the agency phone for a person to fill in', () => {
  const r = run([inv({}), inv({ invoice: 'I-2', balance: '25' })]);
  const d = reminderText(r.rows, { from: 'Pat Example' });
  assert.equal(d.total, 125); assert.match(d.text, /\| I-1 \|/); assert.match(d.text, /\[TO CONFIRM agency phone\]/);
});
