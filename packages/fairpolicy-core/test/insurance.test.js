// Insurance helpers: carriers, policy numbers, lines, transactions, statuses, premium math, masking of client data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  carrierKey, sameCarrier, findCarrier, policyKey, policyBase, samePolicy, policyIndex, lineOf, isPersonal, transactionOf, billTypeOf, statusOf,
  unearnedPremium, commissionAt, asPercent, asOf, bucketOf, yearsBetween, normPolicy, normStatementLine, PhiMasker, adaptRecords, POLICY_FIELDS, POLICY_PROFILES,
} from '../src/index.js';

test('carrier names match across files without merging writing companies', () => {
  assert.equal(carrierKey('Example Insurance Company'), carrierKey('Example Ins Co'));
  assert.ok(sameCarrier('Example', 'Example Casualty Company'));
  assert.ok(!sameCarrier('Example Casualty', 'Example Indemnity'));
  const list = [{ carrier: 'Harborline Mutual' }, { carrier: 'Example Casualty' }, { carrier: 'Example Indemnity' }];
  assert.equal(findCarrier(list, 'Harborline Mutual Insurance Co').carrier, 'Harborline Mutual');
  assert.equal(findCarrier(list, 'Example'), null, 'a short name pointing at two writing companies is not guessed');
});

test('policy numbers match with spaces, dashes and a term suffix', () => {
  assert.equal(policyKey(' bop-104 455 '), 'BOP104455');
  assert.equal(policyBase('BOP 104455-02'), 'BOP104455');
  assert.ok(samePolicy('BOP 104455-02', 'BOP104455'));
  assert.ok(!samePolicy('BOP104455', 'BOP104456'));
  const idx = policyIndex([{ policy_number: 'HO-3000-01' }, { policy_number: 'PA 77' }]);
  assert.equal(idx.find('HO3000').length, 1); assert.equal(idx.find('pa-77').length, 1); assert.equal(idx.find('XX').length, 0);
});

test('lines of business from labels and codes, personal or commercial', () => {
  assert.equal(lineOf('Business Auto'), 'cauto'); assert.equal(lineOf('Personal Auto'), 'pauto'); assert.equal(lineOf('HO-3'), 'home');
  assert.equal(lineOf('Workers Compensation'), 'wc'); assert.equal(lineOf('BOP'), 'bop'); assert.equal(lineOf('Errors & Omissions'), 'prof');
  assert.equal(lineOf('Pet'), 'other'); assert.equal(lineOf('PKG', { PKG: 'cprop' }), 'cprop');
  assert.equal(isPersonal('home'), true); assert.equal(isPersonal('wc'), false); assert.equal(isPersonal('umbrella', 'Commercial Lines'), false); assert.equal(isPersonal('umbrella'), null);
});

test('transactions, billing and statuses from the words systems use', () => {
  assert.deepEqual(['NEW', 'RWL', 'PCH', 'XLC', 'Flat Cancel', 'REI', 'Audit', '??'].map(transactionOf), ['new', 'renewal', 'endorsement', 'cancellation', 'cancellation', 'reinstatement', 'audit', 'other']);
  assert.deepEqual(['A', 'Agency Bill', 'DB', 'Direct', 'x'].map(billTypeOf), ['agency', 'agency', 'direct', 'direct', null]);
  assert.deepEqual(['Active', 'In Force', 'Cancelled - Non Pay', 'Non-Renewed', 'Expired', 'Lapsed', 'quote', ''].map(statusOf), ['active', 'active', 'cancelled', 'non_renewed', 'expired', 'lapsed', 'pending', 'unknown']);
});

test('pro-rata and short-rate unearned premium, commission at a rate', () => {
  assert.equal(unearnedPremium(1200, '2026-01-01', '2027-01-01', '2027-01-01'), 0);
  assert.equal(unearnedPremium(1200, '2026-01-01', '2027-01-01', '2026-01-01'), 1200);
  assert.equal(unearnedPremium(1000, '2026-01-01', '2027-01-01', '2026-07-02', { method: 'short_rate' }), 451.23);
  assert.equal(unearnedPremium(null, '2026-01-01', '2027-01-01', '2026-07-02'), null);
  assert.equal(commissionAt(1000, 15), 150); assert.equal(commissionAt(1000, 0.15), 150); assert.equal(asPercent(0.125), 12.5);
});

test('dates: as_of, aging buckets and whole years', () => {
  assert.equal(asOf({ as_of: '2026-11-18' }), '2026-11-18');
  assert.throws(() => asOf({ as_of: 'soon' }), /not a date/);
  assert.equal(bucketOf(-3), 'not_due'); assert.equal(bucketOf(45), '31-60'); assert.equal(bucketOf(200), '120+');
  assert.equal(yearsBetween('2020-05-01', '2026-04-30'), 5);
});

test('policy and statement rows are normalised once, the original values kept', () => {
  const p = normPolicy({ policy_number: ' ho-1 ', line: 'Homeowners', status: 'In Force', bill_type: 'DB', premium: '1,200.00', commission_rate: '0.15', business_type: 'NB' });
  assert.deepEqual([p.policy_key, p.line_code, p.personal, p.status_code, p.bill, p.premium, p.commission_rate, p.kind], ['HO1', 'home', true, 'active', 'direct', 1200, 15, 'new']);
  const s = normStatementLine({ policy_number: 'HO-1', transaction_type: 'CAN', commission: '(12.50)' });
  assert.deepEqual([s.tx, s.commission], ['cancellation', -12.5]);
});

test('an AMS360 policy list is recognised and mapped to the shared columns', () => {
  const matrix = [['Customer #', 'Customer Name', 'Policy #', 'Line of Business', 'Writing Company', 'Eff Date', 'Exp Date', 'Full Term Premium', 'Exec', 'Rep'], ['C100', 'Fictional Client A', 'PA-1', 'Personal Auto', 'Example Casualty', '01/15/2026', '01/15/2027', '$1,450.00', 'Pat Producer', 'Casey CSR']];
  const r = adaptRecords({ format: 'csv', matrix }, { label: 'Policies', fields: POLICY_FIELDS, profiles: POLICY_PROFILES }, { kind: 'policies', arg: 'policies', file: 'p.csv' });
  assert.equal(r.report.profile, 'ams360_policies');
  assert.deepEqual([r.rows[0].policy_number, r.rows[0].producer, r.rows[0].csr, r.rows[0].effective_date, r.rows[0].premium], ['PA-1', 'Pat Producer', 'Casey CSR', '2026-01-15', '1450.00']);
});

test('client data is masked for the model; policy numbers only in strict mode', () => {
  const m = new PhiMasker({ key: Buffer.alloc(32, 1) });
  const out = m.maskResult({ client: 'Fictional Bakery LLC', dob: '1979-03-04', drivers_license: 'D1234567', vin: '1FTFW1E50PFA00001', policy_number: 'HO-777', summary: 'Call Fictional Bakery LLC' });
  assert.match(out.client, /^CL-[0-9a-f]{8}$/); assert.equal(out.dob, '1979 (birth year)'); assert.equal(out.drivers_license, '[DL]');
  assert.equal(out.policy_number, 'HO-777'); assert.equal(out.vin, '1FTFW1E50PFA00001'); assert.ok(!out.summary.includes('Fictional Bakery'));
  const strict = new PhiMasker({ key: Buffer.alloc(32, 1), mode: 'strict' }).maskResult({ policy_number: 'HO-777', vin: '1FTFW1E50PFA00001', zip: '78209' });
  assert.match(strict.policy_number, /^POL-/); assert.match(strict.vin, /^VIN-/); assert.equal(strict.zip, '782XX');
});

test('a value with junk in front (a planted formula) is still found inside text', () => {
  const m = new PhiMasker({ key: Buffer.alloc(32, 2) });
  const out = m.maskResult({ rows: [{ client: '=Fictional Roofing Co' }], note: 'Fictional Roofing Co asked for a COI' });
  assert.ok(!out.note.includes('Fictional Roofing'), out.note);
});

test('a path longer than 1,024 characters is refused before anything touches the disk', async () => {
  const { safePath } = await import('../src/index.js');
  assert.throws(() => safePath('.', 'a'.repeat(200000)), /too long/);
  assert.ok(safePath('.', 'fixtures/x.csv'));
});

test('carrier keys keep assurance, underwriters, group, corp and inc apart (real-data fix, TDI insurer list, 19 Nov); a loose match still links "X Inc" when it is the only fit', () => {
  const pairs = [['Example Insurance Company', 'Example Assurance Company'], ['Sample Insurance Underwriters Inc.', 'Sample Insurance Corporation'], ['Demo Property and Casualty Insurance Company', 'Demo Group Property and Casualty Insurance Company'], ['Test Republic Insurance Company', 'Test Republic Corp Insurance Company'], ['Example Health Insurance Company', 'Example Health Inc.']];
  for (const [a, b] of pairs) assert.notEqual(carrierKey(a), carrierKey(b), `${a} / ${b}`);
  assert.equal(carrierKey('Example Ins Co'), carrierKey('Example Insurance Company'));
  assert.equal(carrierKey('Example Mutual Insurance Company, The'), carrierKey('The Example Mutual Ins. Co.'));
  const list = [{ carrier: 'Example Mutual Insurance Company' }, { carrier: 'Sample Casualty Company' }];
  assert.equal(findCarrier(list, 'Example Mutual Inc').carrier, 'Example Mutual Insurance Company');
  assert.equal(findCarrier([...list, { carrier: 'Example Mutual Inc' }], 'Example Mutual Inc').carrier, 'Example Mutual Inc');
});
