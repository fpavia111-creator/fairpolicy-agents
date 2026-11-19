// Trust account: balance against premiums owed, withdrawals, commission transfers, remittance due dates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileTrust } from '../src/index.js';

const pay = (o) => ({ carrier: 'Example Mutual', policy_number: 'P-1', client: 'Fictional A', gross_premium: '1000', commission: '100', net_due: '900', due_date: '2026-11-30', received_date: '2026-11-01', paid_date: '', ...o });
const bk = (date, description, amount, balance) => ({ date, description, amount: String(amount), balance: balance === undefined ? '' : String(balance) });
const run = (p, b, s = {}, asOf = '2026-11-18') => reconcileTrust(p, b, s, { asOf });

test('a balance below the premiums collected and owed is a shortfall, listed first', () => {
  const r = run([pay({})], [bk('2026-11-01', 'Deposit', 1000, 800)]);
  assert.equal(r.rows[0].status, 'shortfall'); assert.equal(r.shortfall, 100);
  assert.equal(run([pay({})], [bk('2026-11-01', 'Deposit', 1000, 950)]).shortfall, 0);
});

test('premium not yet collected is not owed; remitted payables are not owed', () => {
  const r = run([pay({ received_date: '' }), pay({ policy_number: 'P-2', paid_date: '2026-11-10' })], [bk('2026-11-01', 'Deposit', 0, 0)]);
  assert.equal(r.owed_to_carriers, 0); assert.deepEqual(r.rows.map((x) => x.status).sort(), ['covered', 'not_due', 'remitted']);
});

test('past due is overdue; within the due-soon days is due soon', () => {
  const r = run([pay({ due_date: '2026-11-10' }), pay({ policy_number: 'P-2', due_date: '2026-11-20' })], [bk('2026-11-01', 'x', 0, 5000)]);
  assert.deepEqual(r.rows.filter((x) => x.ref !== 'balance').map((x) => [x.ref, x.status]), [['P-1', 'overdue_remittance'], ['P-2', 'due_soon']]);
});

test('carrier remittances, refunds and commission transfers are expected; anything else is an unexpected withdrawal', () => {
  const r = run([pay({})], [bk('2026-11-02', 'ACH Example Mutual remittance', -900, 5000), bk('2026-11-03', 'Refund return premium', -50, 4950), bk('2026-11-04', 'Transfer to operating account', -50, 4900), bk('2026-11-05', 'Payroll run', -400, 4500)]);
  assert.deepEqual(r.rows.filter((x) => x.status === 'unexpected_withdrawal').map((x) => x.amount), [400]);
});

test('commission moved beyond what was earned on collected premium is an overdraw', () => {
  const r = run([pay({})], [bk('2026-11-04', 'Transfer to operating account', -250, 5000)]);
  assert.equal(r.rows.find((x) => x.status === 'commission_overdraw').amount, 150);
});

test('without a balance column the opening balance setting is used, and without either the balance is unknown', () => {
  assert.equal(run([pay({})], [bk('2026-11-01', 'Deposit', 1000)], { opening_balance: 100 }).balance, 1100);
  const r = run([pay({})], [bk('2026-11-01', 'Deposit', 1000)]);
  assert.equal(r.balance, null); assert.equal(r.rows.find((x) => x.ref === 'balance').status, 'covered');
});

test('bank lines after as_of are not counted in the balance', () => {
  assert.equal(run([pay({})], [bk('2026-11-01', 'Deposit', 1000, 1000), bk('2026-12-01', 'Deposit', 1000, 2000)]).balance, 1000);
});
