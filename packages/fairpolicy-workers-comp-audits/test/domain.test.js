// Premium audits: started or not, additional and return premium, payroll changes, pending audits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAudits } from '../src/index.js';

const au = (o) => ({ policy_number: 'W-1', client: 'Fictional Co', carrier: 'Sample Casualty', expiration_date: '2026-07-01', audit_status: 'Completed', completed_date: '2026-09-01', estimated_payroll: '100000', audited_payroll: '105000', estimated_premium: '3000', audit_premium: '150', ...o });
const st = (o, opt = {}) => checkAudits([au(o)], { asOf: '2026-11-18', ...opt }).rows[0].status;

test('ended with nothing recorded after the start days is not started; requested or scheduled is pending', () => {
  assert.equal(st({ audit_status: '', completed_date: '' }), 'audit_not_started');
  assert.equal(st({ audit_status: 'Requested', completed_date: '' }), 'pending');
  assert.equal(st({ audit_status: '', completed_date: '', expiration_date: '2026-11-01' }), 'pending');
});

test('additional premium at or above the percent of the estimate is large; returns are due', () => {
  assert.equal(st({ audit_premium: '300' }), 'large_additional_premium');
  assert.equal(st({ audit_premium: '-100' }), 'return_due');
  assert.equal(st({}), 'ok');
});

test('payroll far from the estimate with a small premium change needs the estimate updated', () => {
  assert.equal(st({ audited_payroll: '130000' }), 'update_estimate');
  assert.equal(st({ audited_payroll: '130000' }, { payrollPct: 40 }), 'ok');
});

test('policies not yet ended are left out, and totals split additional from return premium', () => {
  const r = checkAudits([au({}), au({ policy_number: 'W-2', audit_premium: '-80' }), au({ policy_number: 'W-3', expiration_date: '2027-01-01' })], { asOf: '2026-11-18' });
  assert.equal(r.audits, 2); assert.equal(r.additional_premium, 150); assert.equal(r.return_premium, 80);
});
