// Loss runs: incurred, loss ratio, large losses, frequency, the window, claim-free accounts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLosses } from '../src/index.js';

const cl = (o) => ({ client: 'Fictional Co', policy_year: '2026', claim_number: 'C-1', status: 'Closed', paid: '1000', reserve: '0', ...o });
const pr = (o) => ({ client: 'Fictional Co', policy_year: '2026', premium: '10000', ...o });
const one = (c, p = [pr({})], o = {}) => summarizeLosses(c, p, o).rows[0];

test('incurred is paid plus reserve, and the loss ratio is against premium', () => {
  const r = one([cl({ paid: '2000', reserve: '1000' })]);
  assert.equal(r.incurred, 3000); assert.equal(r.loss_ratio, 30); assert.equal(r.status, 'normal');
});

test('a loss ratio at the limit is high; one large claim is a large loss; three in a year is frequency', () => {
  assert.equal(one([cl({ paid: '7000' })]).status, 'high_loss_ratio');
  assert.equal(one([cl({ paid: '30000' })], [pr({ premium: '100000' })]).status, 'large_loss');
  assert.equal(one([cl({}), cl({ claim_number: 'C-2' }), cl({ claim_number: 'C-3' })]).status, 'frequency');
});

test('an account with premium and no claims is clean; with claims and no premium the ratio is unknown', () => {
  assert.equal(one([], [pr({})]).status, 'clean');
  const r = one([cl({})], []);
  assert.equal(r.loss_ratio, null); assert.equal(r.status, 'normal');
});

test('the policy year comes from the column or from the date of loss, and the window counts back from the latest', () => {
  const r = summarizeLosses([cl({ policy_year: '', loss_date: '2019-05-01' }), cl({ claim_number: 'C-2' })], [pr({})]);
  assert.equal(r.claims, 1); assert.equal(r.years, '2022-2026');
});

test('open claims are counted; names group with legal forms ignored', () => {
  const r = summarizeLosses([cl({ status: 'Open' }), cl({ client: 'Fictional Co LLC', claim_number: 'C-2' })], [pr({})]);
  assert.equal(r.accounts, 1); assert.equal(r.rows[0].open_claims, 1);
});
