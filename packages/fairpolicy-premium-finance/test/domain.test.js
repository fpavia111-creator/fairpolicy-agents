// Premium finance: notices, late installments, funding, remittance, due soon, paid off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFinance } from '../src/index.js';

const ag = (o) => ({ agreement: 'A-1', policy_number: 'P-1', client: 'Fictional A', finance_company: 'Example Finance', signed_date: '2026-10-01', amount_financed: '1000', funded_date: '2026-10-05', funded_amount: '1000', remitted_date: '2026-10-06', installment: '100', next_due_date: '2026-12-15', last_paid_date: '2026-11-15', notice_date: '', cancel_date: '', balance: '800', ...o });
const st = (o, opt = {}) => checkFinance([ag(o)], { asOf: '2026-11-18', ...opt }).rows[0].status;

test('a notice of intent to cancel comes first while the cancellation date is ahead', () => {
  assert.equal(st({ notice_date: '2026-11-10', cancel_date: '2026-11-25' }), 'notice_of_intent');
  assert.equal(st({ notice_date: '2026-11-10', cancel_date: '2026-11-01' }), 'current');
});

test('an unpaid installment past its due date is past due; a payment after the due date clears it', () => {
  assert.equal(st({ next_due_date: '2026-11-10', last_paid_date: '2026-10-10' }), 'past_due');
  assert.equal(st({ next_due_date: '2026-11-10', last_paid_date: '2026-11-12' }), 'current');
});

test('signed and not funded after the wait; the wait is a setting', () => {
  assert.equal(st({ funded_date: '', funded_amount: '', remitted_date: '' }), 'not_funded');
  assert.equal(st({ funded_date: '', funded_amount: '', remitted_date: '' }, { fundDays: 60 }), 'current');
});

test('funded and not passed to the carrier after the remit wait', () => {
  assert.equal(st({ funded_date: '2026-11-01', remitted_date: '' }), 'funded_not_remitted');
  assert.equal(st({ funded_date: '2026-11-16', remitted_date: '' }), 'current');
});

test('due within the soon days is due soon; a zero balance is paid off', () => {
  assert.equal(st({ next_due_date: '2026-11-25' }), 'due_soon');
  assert.equal(st({ balance: '0', next_due_date: '2026-11-01' }), 'paid_off');
});

test('totals add the money in each situation', () => {
  const r = checkFinance([ag({ funded_date: '', remitted_date: '', amount_financed: '700' }), ag({ agreement: 'A-2', funded_date: '2026-11-01', remitted_date: '', funded_amount: '900' })], { asOf: '2026-11-18' });
  assert.equal(r.not_funded_amount, 700); assert.equal(r.funded_not_remitted_amount, 900);
});
