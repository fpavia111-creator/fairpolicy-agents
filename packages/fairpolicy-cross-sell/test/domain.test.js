// Cross-sell: grouping by client, one-line accounts, the default rules, the agency's rules, cancelled policies.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findGaps, DEFAULT_RULES } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', carrier: 'Example Mutual', line: 'Personal Auto', status: 'Active', premium: '1000', expiration_date: '2027-01-01', producer: 'Pat', ...o });

test('one line is monoline, with the rule it meets', () => {
  const r = findGaps([pol({})]);
  assert.equal(r.rows[0].status, 'monoline'); assert.equal(r.rows[0].gaps, 'auto_without_home');
});

test('home and auto without an umbrella is a gap; with one it is rounded', () => {
  assert.equal(findGaps([pol({}), pol({ policy_number: 'P-2', line: 'Homeowners' })]).rows[0].gaps, 'no_personal_umbrella');
  assert.equal(findGaps([pol({}), pol({ policy_number: 'P-2', line: 'Homeowners' }), pol({ policy_number: 'P-3', line: 'Personal Umbrella' })]).rows[0].status, 'rounded');
});

test('policies group by client name with legal forms ignored', () => {
  const r = findGaps([pol({ client: 'Fictional Co LLC', line: 'BOP' }), pol({ policy_number: 'P-2', client: 'Fictional Co', line: 'Workers Comp' })]);
  assert.equal(r.accounts, 1); assert.equal(r.rows[0].status, 'rounded');
});

test('cancelled and expired policies do not count toward an account', () => {
  const r = findGaps([pol({}), pol({ policy_number: 'P-2', line: 'Homeowners', status: 'Cancelled' })]);
  assert.equal(r.rows[0].status, 'monoline');
});

test('the agency\'s own rules replace the defaults', () => {
  const r = findGaps([pol({ line: 'BOP' }), pol({ policy_number: 'P-2', line: 'Workers Comp' })], { rules: [{ name: 'no_cyber', label: 'x', has_any: ['bop'], missing_all: ['cyber'] }] });
  assert.equal(r.rows[0].gaps, 'no_cyber');
  assert.equal(DEFAULT_RULES.length, 5);
});

test('a line code the agency uses is read through its alias', () => {
  const r = findGaps([pol({ line: 'PKGHO' }), pol({ policy_number: 'P-2' })], { lineAliases: { PKGHO: 'home' } });
  assert.equal(r.rows[0].gaps, 'no_personal_umbrella');
});
