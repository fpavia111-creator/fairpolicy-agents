// E&O file check: document types, conditional forms, signatures, the agency checklist.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFiles, docTypeOf } from '../src/index.js';

const pol = (o) => ({ policy_number: 'P-1', client: 'Fictional A', line: 'Personal Auto', carrier: 'Example Mutual', status: 'Active', um_selection: 'Accepted', declined_coverages: '', ...o });
const doc = (o) => ({ policy_number: 'P-1', document_type: 'Signed Application', signed: 'Yes', ...o });
const one = (p, d, s) => checkFiles([pol(p)], d, s).rows[0];

test('document names map to types', () => {
  assert.deepEqual(['ACORD 90 Application', 'UM/UIM Rejection', 'Flood Offer', 'Coverage Declination', 'EMR'].map((x) => docTypeOf(x)), ['signed_application', 'um_rejection', 'flood_offer', 'declination', 'emr']);
  assert.equal(docTypeOf('EMR', { EMR: 'experience_mod_worksheet' }), 'experience_mod_worksheet');
});

test('a signed application is enough for an auto policy with UM accepted', () => {
  assert.equal(one({}, [doc({})]).status, 'complete');
  assert.equal(one({}, []).status, 'missing');
});

test('UM rejected or reduced needs the rejection form; declined coverages need a declination', () => {
  assert.equal(one({ um_selection: 'Reduced limits' }, [doc({})]).missing, 'um_rejection');
  assert.equal(one({ line: 'General Liability', declined_coverages: 'Cyber' }, [doc({})]).missing, 'declination');
});

test('a document on file but not signed is unsigned', () => {
  assert.equal(one({}, [doc({ signed: 'No' })]).status, 'unsigned');
  assert.equal(one({}, [doc({ signed: 'E-signed' })]).status, 'complete');
});

test('the agency checklist replaces the defaults for a line; lines with nothing required are skipped', () => {
  assert.equal(one({ line: 'Personal Auto' }, [doc({})], { required: { pauto: ['signed_application', 'driver_list'] } }).missing, 'driver_list');
  assert.equal(checkFiles([pol({ line: 'Pet' })], [], {}).policies, 0);
});
