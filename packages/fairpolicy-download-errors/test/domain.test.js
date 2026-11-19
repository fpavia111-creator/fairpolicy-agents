// Downloads: status words, unmatched age, failed transactions, stale carriers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkDownloads } from '../src/index.js';

const dl = (o) => ({ download_id: 'D-1', date: '2026-11-17', carrier: 'Example Mutual', policy_number: 'P-1', transaction_type: 'RWL', status: 'Posted', message: '', ...o });
const run = (rows, o = {}) => checkDownloads(rows, { asOf: '2026-11-18', ...o });

test('posted transactions are counted, not listed; the carrier is ok', () => {
  const r = run([dl({})]);
  assert.equal(r.posted, 1); assert.deepEqual(r.rows.map((x) => x.status), ['ok']);
});

test('failed transactions come first; unmatched ones are old after the days', () => {
  const r = run([dl({}), dl({ download_id: 'D-2', status: 'Rejected' }), dl({ download_id: 'D-3', status: 'Suspense', date: '2026-11-10' }), dl({ download_id: 'D-4', status: 'Unmatched' })]);
  assert.deepEqual(r.rows.filter((x) => !x.ref.startsWith('carrier:')).map((x) => [x.ref, x.status]), [['D-2', 'download_error'], ['D-3', 'unmatched_old'], ['D-4', 'unmatched_new']]);
});

test('a carrier with no successful download for longer than the stale days is flagged', () => {
  assert.equal(run([dl({ date: '2026-11-01' })]).rows[0].status, 'carrier_stale');
  assert.equal(run([dl({ date: '2026-11-01' })], { staleDays: 30 }).rows[0].status, 'ok');
  assert.equal(run([dl({ status: 'Error' })]).rows.find((x) => x.ref.startsWith('carrier:')).status, 'carrier_stale');
});

test('carrier names group with "Insurance Company" ignored; lines after as_of are left out', () => {
  const r = run([dl({}), dl({ download_id: 'D-2', carrier: 'Example Mutual Insurance Company' }), dl({ download_id: 'D-3', date: '2026-11-25', status: 'Error' })]);
  assert.equal(r.carriers, 1); assert.equal(r.transactions, 2);
});
