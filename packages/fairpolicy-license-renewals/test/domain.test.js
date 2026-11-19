// Licences: expired, CE short near expiration, renewal due, non-residents, states without settings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLicenses } from '../src/index.js';

const lic = (o) => ({ person: 'Pat Example', role: 'Producer', state: 'TX', license_number: 'L-1', resident: 'Yes', expiration_date: '2027-06-01', ce_hours: '24', ethics_hours: '3', ...o });
const settings = { states: { tx: { ce_hours: 24, ethics_hours: 3 } } };
const st = (o, opt = {}) => checkLicenses([lic(o)], settings, { asOf: '2026-11-18', ...opt }).rows[0].status;

test('past the expiration date is expired, whatever the hours', () => {
  assert.equal(st({ expiration_date: '2026-11-01' }), 'expired');
});

test('hours or ethics short within the CE days is ce_short; further off it is current', () => {
  assert.equal(st({ expiration_date: '2027-01-15', ce_hours: '20' }), 'ce_short');
  assert.equal(st({ expiration_date: '2027-01-15', ethics_hours: '2' }), 'ce_short');
  assert.equal(st({ ce_hours: '20' }), 'current');
});

test('complete hours within the due days is renewal due', () => {
  assert.equal(st({ expiration_date: '2027-01-10' }), 'renewal_due');
  assert.equal(st({ expiration_date: '2027-01-10' }, { dueDays: 30 }), 'current');
});

test('a resident licence in a state with no settings says so; a non-resident licence is not held to CE hours', () => {
  assert.equal(st({ state: 'NV' }), 'no_state_rule');
  assert.equal(st({ state: 'NV', resident: 'No', expiration_date: '2027-08-01' }), 'current');
  assert.equal(st({ resident: 'No', ce_hours: '0', expiration_date: '2027-02-15' }), 'current');
});

test('state codes compare without case; totals by person count what needs attention', () => {
  const r = checkLicenses([lic({ state: 'tx', expiration_date: '2026-10-01' }), lic({ license_number: 'L-2' })], settings, { asOf: '2026-11-18' });
  assert.equal(r.by_person[0].needing_attention, 1); assert.equal(r.rows[0].state, 'TX');
});
