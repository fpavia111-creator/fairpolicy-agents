// Data quality: VIN check digit, dates, premium, contact fields, staff, severity order.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkQuality, vinProblem } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', line: 'Personal Auto', carrier: 'Example Mutual', effective_date: '2026-06-01', expiration_date: '2026-12-01', premium: '1000', producer: 'Pat', csr: 'Casey', status: 'Active', address: '1 Example Way', zip: '78209', email: 'a@example.test', phone: '', ...o });
const veh = (o) => ({ policy_number: 'P-1', vin: '0EXAM1203A0001011', ...o });
const one = (p, v = [veh({})]) => checkQuality([pol(p)], v).rows[0];

test('a VIN with a right check digit passes; wrong length, banned letters or a wrong check digit do not', () => {
  assert.equal(vinProblem('0EXAM1203A0001011'), null);
  assert.equal(vinProblem('0EXAM1203A000101'), 'vin_invalid');
  assert.equal(vinProblem('0EXAM12O3A0001011'), 'vin_invalid');
  assert.equal(vinProblem('0EXAM1209A0001011'), 'vin_check_digit');
});

test('a clean auto policy with a good VIN is clean; missing vehicles or VINs are vehicle data', () => {
  assert.equal(one({}).status, 'clean');
  assert.equal(one({}, []).issues, 'no_vehicles');
  assert.equal(one({}, [veh({ vin: '' })]).issues, 'vin_missing');
});

test('dates, carrier and premium problems are critical and come first', () => {
  const r = one({ expiration_date: '2026-01-01', premium: '0', producer: '' }, []);
  assert.equal(r.status, 'critical'); assert.equal(r.issues, 'expiration_before_effective, no_premium, no_vehicles, no_producer');
});

test('personal lines need an e-mail or phone; commercial lines do not', () => {
  assert.equal(one({ email: '' }).issues, 'no_email_or_phone');
  assert.equal(checkQuality([pol({ line: 'General Liability', email: '' })]).rows[0].status, 'clean');
});

test('expired and cancelled policies are left out; a nine-digit ZIP is fine', () => {
  assert.equal(checkQuality([pol({ status: 'Expired' })]).policies, 0);
  assert.equal(one({ zip: '78209-1234' }).status, 'clean');
});
