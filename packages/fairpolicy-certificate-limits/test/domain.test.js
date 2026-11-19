// Certificates: in force, limits, AI and waiver endorsements, dates, unknown policies, several issues on one line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCertificates } from '../src/index.js';

const cov = (o) => ({ policy_number: 'G-1', client: 'Fictional Co', line: 'General Liability', each_occurrence: '1000000', aggregate: '2000000', effective_date: '2026-01-01', expiration_date: '2027-01-01', status: 'Active', cancel_date: '', ai_endorsement: 'Blanket', waiver_endorsement: 'No', ...o });
const cert = (o) => ({ certificate: 'C-1', holder: 'Example Holder', policy_number: 'G-1', issued_date: '2026-06-01', each_occurrence: '1000000', aggregate: '2000000', effective_date: '2026-01-01', expiration_date: '2027-01-01', additional_insured: 'Y', waiver: 'N', ...o });
const st = (c, p = {}) => checkCertificates([cert(c)], [cov(p)]).rows[0];

test('a certificate that matches the policy is ok', () => { assert.equal(st({}).status, 'ok'); });

test('issued after a cancellation or after expiration is not in force', () => {
  assert.equal(st({ issued_date: '2026-10-01' }, { status: 'Cancelled', cancel_date: '2026-09-01' }).status, 'policy_not_in_force');
  assert.equal(st({ issued_date: '2027-02-01' }).status, 'policy_not_in_force');
  assert.equal(st({ issued_date: '2026-08-01' }, { status: 'Cancelled', cancel_date: '2026-09-01' }).status, 'ok');
});

test('a higher occurrence or aggregate than the policy is overstated; lower is fine', () => {
  assert.equal(st({ aggregate: '3000000' }).status, 'limit_overstated');
  assert.equal(st({ each_occurrence: '500000' }).status, 'ok');
});

test('AI and waiver shown without the endorsement are flagged', () => {
  assert.equal(st({}, { ai_endorsement: 'No' }).status, 'ai_not_on_policy');
  assert.equal(st({ waiver: 'Y' }).status, 'waiver_not_on_policy');
  assert.equal(st({ waiver: 'Y' }, { waiver_endorsement: 'Yes' }).status, 'ok');
});

test('several issues on one line are all listed, the most serious decides the status', () => {
  const r = st({ aggregate: '3000000', waiver: 'Y', effective_date: '2026-02-01' });
  assert.equal(r.status, 'limit_overstated'); assert.equal(r.issues, 'limit_overstated, waiver_not_on_policy, dates_wrong');
});

test('an unknown policy number is named; certificates count once however many lines they have', () => {
  const r = checkCertificates([cert({}), cert({ policy_number: 'X-9' })], [cov({})]);
  assert.equal(r.certificates, 1); assert.equal(r.lines_checked, 2); assert.equal(r.rows[0].status, 'policy_unknown');
});
