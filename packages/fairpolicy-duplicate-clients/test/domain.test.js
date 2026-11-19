// Duplicate clients: exact, likely, possible, households, blocking, pair numbering.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicates } from '../src/index.js';

const c = (id, client, o = {}) => ({ client_id: id, client, address: '', zip: '', phone: '', email: '', ...o });

test('the same name with the same e-mail is an exact duplicate', () => {
  const r = findDuplicates([c('A', 'Fictional Person', { email: 'x@example.test' }), c('B', 'Fictional Person', { email: 'X@example.test' })]);
  assert.equal(r.rows[0].status, 'exact_duplicate');
});

test('a spelling difference with a shared phone is likely; with nothing shared it is possible', () => {
  assert.equal(findDuplicates([c('A', 'Bartholomew Example', { phone: '555 201 9999' }), c('B', 'Bartholemew Example', { phone: '(555) 201-9999' })]).rows[0].status, 'likely_duplicate');
  assert.equal(findDuplicates([c('A', 'Bartholomew Example', { zip: '78201' }), c('B', 'Bartholemew Example', { zip: '78299' })]).rows[0].status, 'possible_duplicate');
});

test('different people at one address are a household, not a duplicate', () => {
  const r = findDuplicates([c('A', 'Fictional One', { address: '1 Example Way', zip: '78209' }), c('B', 'Other Person', { address: '1 Example Way', zip: '78209' })]);
  assert.equal(r.rows[0].status, 'same_household'); assert.equal(r.clients_in_duplicates, 0);
});

test('records that share nothing are not paired', () => {
  assert.equal(findDuplicates([c('A', 'Fictional One'), c('B', 'Other Person')]).pairs, 0);
});

test('pairs are numbered after sorting, so the numbering does not depend on row order', () => {
  const rows = [c('A', 'Fictional Person', { email: 'x@example.test' }), c('B', 'Fictional Person', { email: 'x@example.test' }), c('C', 'Other Person', { email: 'x@example.test' })];
  assert.deepEqual(findDuplicates(rows).rows.map((r) => r.pair + r.client_id + r.other_client_id), findDuplicates([...rows].reverse()).rows.map((r) => r.pair + r.client_id + r.other_client_id));
});
