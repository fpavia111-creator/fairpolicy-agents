// Appointments: no appointment, terminated, pending, unused, carrier names, states.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAppointments } from '../src/index.js';

const ap = (o) => ({ producer: 'Pat Example', carrier: 'Example Mutual', state: 'TX', status: 'Active', effective_date: '2020-01-01', termination_date: '', ...o });
const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', state: 'TX', effective_date: '2026-06-01', producer: 'Pat Example', status: 'Active', ...o });
const run = (a, p) => checkAppointments(a, p, { asOf: '2026-11-18' });

test('business with an active appointment is ok; with none it is not appointed', () => {
  assert.equal(run([ap({})], [pol({})]).rows[0].status, 'ok');
  assert.equal(run([], [pol({})]).rows[0].status, 'not_appointed');
  assert.equal(run([ap({ state: 'OK' })], [pol({})]).rows.find((r) => r.state === 'TX').status, 'not_appointed');
});

test('business after a termination is flagged; business before it is not', () => {
  assert.equal(run([ap({ status: 'Terminated', termination_date: '2026-05-01' })], [pol({})]).rows[0].status, 'terminated_with_business');
  assert.equal(run([ap({ status: 'Terminated', termination_date: '2026-07-01' })], [pol({})]).rows[0].status, 'ok');
});

test('business while pending is flagged; an active appointment with no business for a year is unused', () => {
  assert.equal(run([ap({ status: 'Pending' })], [pol({})]).rows[0].status, 'pending_with_business');
  assert.equal(run([ap({})], [pol({ effective_date: '2025-01-01' })]).rows[0].status, 'unused');
});

test('carrier names match without "Insurance Company"; producers without case', () => {
  assert.equal(run([ap({ carrier: 'Example Mutual Insurance Company', producer: 'PAT EXAMPLE' })], [pol({})]).rows.length, 1);
});

test('expired policies and policies starting after as_of are not counted', () => {
  assert.equal(run([], [pol({ status: 'Expired' }), pol({ policy_number: 'P-2', effective_date: '2026-12-01' })]).combinations, 0);
});
