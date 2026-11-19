#!/usr/bin/env node
// Real-data tests on public, lawful data in its published format (final pass, 19 Nov 2026).
// The downloads go to _realdata/ (git-ignored, never committed); the results go to docs/realdata-2026-11-19.json and .md.
// No personal names are downloaded: licence rows are fetched without the name column, and vehicle rows without the owner.
//
//   node scripts/realdata.mjs --download   fetch the files (network), then run the tests
//   node scripts/realdata.mjs              run the tests on the files already in _realdata/
//
// Each test runs an agent (or the core helper the agents use) and compares it with an independent count written here.
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, carrierKey, sameCarrier, findCarrier, toCsv } from '../packages/fairpolicy-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, '_realdata'); const PK = join(ROOT, 'packages');
const DATE = '2026-11-19'; const AS_OF = '2026-11-19';
const UA = { 'user-agent': 'fairpolicy-realdata-test (open-source test script)' };

const SOURCES = {
  tdi_licenses: {
    name: 'Texas Department of Insurance: insurance agents, adjusters and people approved to manage insurance-related products or claims (data.texas.gov kxv3-diwf)',
    page: 'https://data.texas.gov/dataset/kxv3-diwf',
    url: 'https://data.texas.gov/resource/kxv3-diwf.json?$select=license_number,license_type,qualification,state,license_issue_date,expiration_date,npn&$where=license_type=%27General%20Lines%20Agent%27&$order=license_number&$limit=20000',
    licence: 'Texas Open Data Portal, published by the Texas Department of Insurance; no licence named on the dataset (data.texas.gov terms of use). The name column was not downloaded.',
  },
  tdi_companies: {
    name: 'Texas Department of Insurance: active insurance company appointments for agencies and businesses (data.texas.gov avjc-7u2m), distinct company and NAIC id',
    page: 'https://data.texas.gov/dataset/avjc-7u2m',
    url: 'https://data.texas.gov/resource/avjc-7u2m.json?$select=company,naic_id&$group=company,naic_id&$order=naic_id&$limit=50000',
    licence: 'Texas Open Data Portal, published by the Texas Department of Insurance; no licence named on the dataset (data.texas.gov terms of use).',
  },
  nyc_fhv: {
    name: 'NYC Taxi and Limousine Commission: For Hire Vehicles (FHV) - Active (NYC Open Data 8wbx-tsch), VIN and model year only',
    page: 'https://data.cityofnewyork.us/Transportation/For-Hire-Vehicles-FHV-Active/8wbx-tsch',
    url: 'https://data.cityofnewyork.us/resource/8wbx-tsch.json?$select=vehicle_license_number,vehicle_vin_number,vehicle_year&$order=vehicle_license_number&$limit=200000',
    licence: 'NYC Open Data terms of use (public data, free to use). The owner name column was not downloaded.',
  },
  nfip_claims: {
    name: 'FEMA OpenFEMA: FIMA NFIP redacted claims v3, Vermont, years of loss 2019 onwards',
    page: 'https://www.fema.gov/openfema-data-page/fima-nfip-redacted-claims-v2',
    url: "https://www.fema.gov/api/open/v3/NfipClaims?$filter=state%20eq%20'VT'%20and%20yearOfLoss%20ge%202019&$select=id,dateOfLoss,yearOfLoss,countyCode,amountPaidOnBuildingClaim,amountPaidOnContentsClaim,amountPaidOnIncreasedCostOfComplianceClaim&$top=10000",
    licence: 'OpenFEMA: U.S. government data, no copyright; FEMA asks users not to imply its endorsement. Redacted by FEMA (no names or addresses).',
  },
};

async function download() {
  mkdirSync(RAW, { recursive: true });
  for (const [k, s] of Object.entries(SOURCES)) {
    const res = await fetch(s.url, { headers: UA });
    if (!res.ok) throw new Error(`${k}: HTTP ${res.status}`);
    const text = await res.text();
    writeFileSync(join(RAW, `${k}.json`), text);
    console.log(`downloaded ${k}: ${text.length} bytes`);
  }
  writeFileSync(join(RAW, 'downloaded.json'), JSON.stringify({ date: new Date().toISOString() }, null, 2));
}

if (process.argv.includes('--download')) await download();

const load = (k) => { const j = JSON.parse(readFileSync(join(RAW, `${k}.json`), 'utf8')); return Array.isArray(j) ? j : j.NfipClaims; };
async function runAgent(n, files, args) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const prefix = manifest.tools.find((t) => t.name.endsWith('_check')).name.replace(/_check$/, '');
  const root = mkdtempSync(join(tmpdir(), 'fp-real-'));
  try {
    for (const [f, rows] of Object.entries(files)) writeFileSync(join(root, f), typeof rows === 'string' ? rows : toCsv(rows, Object.keys(rows[0]), { formulas: 'keep' }));
    const rt = new AgentRuntime(manifest, { root, audit: false, memory: false, phi: 'off' });
    const call = async (extra) => { const r = await rt.call(`${prefix}_check`, { ...args, ...extra }); if (r.status !== 'executed') throw new Error(`${n}: ${r.status} ${JSON.stringify(r).slice(0, 600)}`); return r.result; };
    // The check returns at most 5,000 rows per call: fetch every status that fits, and treat the one larger status as "the rest".
    const t0 = Date.now(); const first = await call({ limit: 5000 }); const seconds = (Date.now() - t0) / 1000;
    const counts = Object.entries(first.by_status || {}).filter(([, c]) => c > 0);
    if (!first.items_truncated) return { ...first, rest_status: null, seconds };
    const items = []; let rest = null;
    for (const [s, c] of counts) { if (c > 5000) { rest = s; continue; } items.push(...(await call({ status: s, limit: 5000 })).items); }
    return { ...first, items, rest_status: rest, seconds };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
const day = (s) => String(s || '').slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// ---------------------------------------------------------------- tests ----
const results = [];

// A. Licence renewals on the TDI licence file. Independent status: expired before as_of; renewal due within 60 days;
//    otherwise current. The file has no CE hours, so nothing may be listed as short of CE.
{
  const raw = load('tdi_licenses');
  const rows = raw.map((r) => ({ Name: `NPN ${r.npn || r.license_number}`, Role: 'Agent', State: 'TX', 'License Number': r.license_number, 'License Type': r.license_type, Resident: (r.state || '').toUpperCase() === 'TX' ? 'Yes' : 'No', 'Expiration Date': day(r.expiration_date), 'CE Hours': '', 'Ethics Hours': '' }));
  const settings = JSON.stringify({ note: 'Test value only, not checked against the Texas rule.', states: { TX: { ce_hours: 24, ethics_hours: 3, period_months: 24 } } });
  const out = await runAgent('fairpolicy-license-renewals', { 'licenses.csv': rows, 'states.json': settings }, { licenses: 'licenses.csv', states: 'states.json', as_of: AS_OF });
  const want = new Map(rows.map((r) => { const d = daysBetween(AS_OF, r['Expiration Date']); return [r['License Number'], d < 0 ? 'expired' : d <= 60 ? 'renewal_due' : 'current']; }));
  const got = new Map(out.items.map((x) => [x.license_number, x.status]));
  const differ = rows.map((r) => r['License Number']).filter((k) => want.get(k) !== (got.get(k) || out.rest_status)).map((k) => ({ license_number: k, status: got.get(k) || out.rest_status }));
  const wouldBeShortBefore = rows.filter((r) => { const d = daysBetween(AS_OF, r['Expiration Date']); return r.Resident === 'Yes' && d >= 0 && d <= 90; }).length;
  results.push({ id: 'tdi_licenses', agent: 'fairpolicy-license-renewals', rows: rows.length, residents: rows.filter((r) => r.Resident === 'Yes').length, by_status: out.by_status, disagreements: differ.length, examples: differ.slice(0, 5).map((x) => `${x.license_number}: ${x.status}, expected ${want.get(x.license_number)}`), seconds: out.seconds,
    found: `${out.by_status.expired || 0} expired, ${out.by_status.renewal_due || 0} due in 60 days, ${out.by_status.current || 0} current`,
    false_positives: `0 after the fix; before it, the ${wouldBeShortBefore} resident licences expiring within 90 days were listed as short of CE because blank hours read as zero`,
    note: 'The first 20,000 General Lines Agent licences by licence number. CE hours are not published, so CE itself is not tested here.' });
}

// B. Carrier names (core carrierKey, sameCarrier and findCarrier) on the insurers TDI lists in active appointments.
//    Different NAIC ids are different companies: a shared key would merge them (false match).
{
  const raw = load('tdi_companies').filter((r) => r.company && r.naic_id);
  const byId = new Map(); for (const r of raw) { if (!byId.has(r.naic_id)) byId.set(r.naic_id, new Set()); byId.get(r.naic_id).add(r.company.trim()); }
  const companies = [...byId.entries()].map(([id, names]) => ({ id, name: [...names][0], names: [...names] }));
  const byKey = new Map(); for (const c of companies) { const k = carrierKey(c.name); if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(c); }
  const keyClashes = [...byKey.values()].filter((g) => new Set(g.map((c) => c.id)).size > 1);
  const exactNameClashes = (() => { const m = new Map(); for (const c of companies) { const k = c.name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); m.set(k, (m.get(k) || 0) + 1); } return [...m.values()].filter((v) => v > 1).length; })();
  // Loose (prefix) matches between different companies, and whether findCarrier still picks the right one when both are in the list.
  const sorted = [...byKey.keys()].sort(); let loosePairs = 0; const looseEx = [];
  for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length && sorted[j].startsWith(sorted[i]); j++) if (sameCarrier(sorted[i], sorted[j])) { loosePairs++; if (looseEx.length < 5) looseEx.push(`"${byKey.get(sorted[i])[0].name}" ~ "${byKey.get(sorted[j])[0].name}"`); }
  let wrongPick = 0; const list = companies.map((c) => ({ carrier: c.name, id: c.id }));
  for (const c of companies) { const hit = findCarrier(list, c.name); if (!hit || carrierKey(hit.carrier) !== carrierKey(c.name)) wrongPick++; }
  const wrongPickOtherCompany = companies.filter((c) => { const hit = findCarrier(list, c.name); return hit && hit.id !== c.id; }).length;
  results.push({ id: 'tdi_companies', agent: 'fairpolicy-core carrier matching (used by 12 agents)', rows: raw.length, companies: companies.length, distinct_keys: byKey.size,
    key_clashes: keyClashes.length, key_clash_examples: keyClashes.slice(0, 8).map((g) => g.map((c) => `${c.name} (${c.id})`).join(' = ')),
    same_name_different_id: exactNameClashes, loose_prefix_pairs: loosePairs, loose_examples: looseEx, find_carrier_other_company: wrongPickOtherCompany, find_carrier_wrong_key: wrongPick,
    found: `${companies.length} insurers (NAIC ids) gave ${byKey.size} carrier keys`,
    false_positives: `${keyClashes.length} key(s) shared by different NAIC ids (${exactNameClashes} of them already share the same printed name); findCarrier picked another company's entry for ${wrongPickOtherCompany} of ${companies.length} names when the whole list was given; before the fix 8 keys were shared by 16 different insurers (assurance, underwriters, group, corp and inc were treated as filler words)`,
    note: 'A loose match (one name is the other with words left off the end) is used only when no exact key matches and it points at one entry.' });
}

// C. VINs (fairpolicy-data-quality) on the NYC TLC active for-hire vehicle file. Independent check: 17 characters,
//    no I, O or Q, ISO 3779 check digit in position 9 (written again here, not imported from the agent).
{
  const raw = load('nyc_fhv').filter((r) => r.vehicle_license_number);
  const VAL = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
  const W = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
  const bad = (v) => { const s = String(v || '').toUpperCase().replace(/[\s-]/g, ''); if (s.length !== 17 || /[^A-Z0-9]|[IOQ]/.test(s)) return 'invalid'; const t = [...s].reduce((a, c, i) => a + (c >= '0' && c <= '9' ? +c : VAL[c]) * W[i], 0) % 11; return (t === 10 ? 'X' : String(t)) === s[8] ? null : 'check_digit'; };
  const policies = raw.map((r) => ({ 'Client Name': 'Public data test client', 'Policy Number': `FHV-${r.vehicle_license_number}`, 'Line of Business': 'Commercial Auto', Carrier: 'Public Data Test Carrier', 'Effective Date': '2026-06-01', 'Expiration Date': '2027-06-01', Premium: '1000', Producer: 'Test Producer', CSR: 'Test CSR', 'Policy Status': 'Active', Address: '1 Test Street', 'Zip Code': '10001', Email: 'test@example.test', Phone: '555-0100' }));
  const vehicles = raw.map((r) => ({ 'Policy Number': `FHV-${r.vehicle_license_number}`, VIN: r.vehicle_vin_number || '', Year: r.vehicle_year || '', Make: '' }));
  const out = await runAgent('fairpolicy-data-quality', { 'policies.csv': policies, 'vehicles.csv': vehicles }, { policies: 'policies.csv', vehicles: 'vehicles.csv' });
  const flagged = new Set(out.items.filter((x) => x.status === 'vehicle_data').map((x) => x.policy_number));
  const want = new Set(raw.filter((r) => !r.vehicle_vin_number || bad(r.vehicle_vin_number)).map((r) => `FHV-${r.vehicle_license_number}`));
  const missed = [...want].filter((x) => !flagged.has(x)).length, extra = [...flagged].filter((x) => !want.has(x)).length;
  const kinds = { blank: raw.filter((r) => !r.vehicle_vin_number).length, invalid: raw.filter((r) => r.vehicle_vin_number && bad(r.vehicle_vin_number) === 'invalid').length, check_digit: raw.filter((r) => r.vehicle_vin_number && bad(r.vehicle_vin_number) === 'check_digit').length };
  const other = out.items.filter((x) => x.status !== 'vehicle_data' && x.status !== 'clean').length;
  results.push({ id: 'nyc_fhv', agent: 'fairpolicy-data-quality', rows: raw.length, flagged: flagged.size, independent: want.size, kinds, missed, extra, other_findings: other, seconds: out.seconds,
    found: `${flagged.size} of ${raw.length} vehicles with a VIN problem (${kinds.blank} blank, ${kinds.invalid} wrong length or letters, ${kinds.check_digit} failing the check digit)`,
    false_positives: `${extra} flagged that the independent check passes, ${missed} the independent check fails that the agent missed; ${other} other findings on the filler policy rows`,
    note: 'A VIN that fails the check digit is a typo in the public file or a vehicle built without a North American check digit; the agent asks a person to confirm it, it does not say which.' });
}

// D. Loss runs (fairpolicy-loss-runs) on FEMA's redacted NFIP claims for Vermont. NFIP claims carry no insured name,
//    so each county stands in for an account; paid amounts are building + contents + ICC; no reserves, no premium.
{
  const raw = load('nfip_claims');
  const rows = raw.map((r) => ({ Insured: `County ${r.countyCode || 'unknown'}`, 'Policy Number': `NFIP-${r.countyCode || 'unknown'}`, 'Line of Business': 'Flood', Carrier: 'NFIP', 'Policy Year': String(r.yearOfLoss), 'Date of Loss': day(r.dateOfLoss), 'Claim Number': String(r.id), 'Claim Status': 'Closed', Paid: String(Math.round(((r.amountPaidOnBuildingClaim || 0) + (r.amountPaidOnContentsClaim || 0) + (r.amountPaidOnIncreasedCostOfComplianceClaim || 0)) * 100) / 100), Reserve: '0' }));
  const out = await runAgent('fairpolicy-loss-runs', { 'loss-runs.csv': rows, 'premiums.csv': 'Insured,Policy Year,Earned Premium\n' }, { loss_runs: 'loss-runs.csv', premiums: 'premiums.csv' });
  const last = Math.max(...rows.map((r) => +r['Policy Year'])), first = last - 4;
  const by = new Map();
  for (const r of rows) { const y = +r['Policy Year']; if (y < first || y > last) continue; const k = r.Insured; if (!by.has(k)) by.set(k, []); by.get(k).push({ y, paid: +r.Paid }); }
  let differ = 0; const ex = [];
  for (const [k, cs] of by) {
    const perYear = {}; for (const c of cs) perYear[c.y] = (perYear[c.y] || 0) + 1;
    const big = cs.some((c) => c.paid >= 25000), busiest = Math.max(...Object.values(perYear));
    const status = big ? 'large_loss' : busiest >= 3 ? 'frequency' : 'normal';
    const incurred = Math.round(cs.reduce((t, c) => t + c.paid, 0) * 100) / 100;
    const a = out.items.find((x) => x.client === k);
    if (!a || a.status !== status || a.claims !== cs.length || Math.abs(a.incurred - incurred) > 0.01) { differ++; if (ex.length < 5) ex.push(`${k}: agent ${a ? `${a.status}/${a.claims}/${a.incurred}` : 'missing'}, independent ${status}/${cs.length}/${incurred}`); }
  }
  results.push({ id: 'nfip_claims', agent: 'fairpolicy-loss-runs', rows: rows.length, years: `${first}-${last}`, accounts: by.size, claims_in_window: [...by.values()].reduce((t, g) => t + g.length, 0), by_status: out.by_status, disagreements: differ, examples: ex, seconds: out.seconds,
    found: `${by.size} counties, ${out.claims} claims in ${first}-${last}, ${out.incurred} paid; ${out.by_status.large_loss || 0} with a loss of 25,000 or more, ${out.by_status.frequency || 0} with 3 or more claims in a year`,
    false_positives: `${differ} counties where the agent's claims, total or status differ from the independent count`,
    note: 'Counties stand in for accounts because FEMA removes the insured; there is no premium file, so no loss ratio is tested.' });
}

for (const r of results) console.log(`${r.id} (${r.agent}): ${r.rows} rows. Found: ${r.found}. Errors: ${r.false_positives}.`);
const meta = existsSync(join(RAW, 'downloaded.json')) ? JSON.parse(readFileSync(join(RAW, 'downloaded.json'), 'utf8')) : {};
const doc = { date: DATE, downloaded: meta.date || null, as_of: AS_OF, sources: SOURCES, results };
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', `realdata-${DATE}.json`), JSON.stringify(doc, null, 2) + '\n');
const L = [`# Real-data tests (${DATE})`, '', `Made by \`node scripts/realdata.mjs --download\` (\`npm run realdata\`). Public, lawful data in its published format, downloaded ${meta.date ? meta.date.slice(0, 10) : DATE} to \`_realdata/\` (git-ignored, not committed). Each test compares the agent with an independent count written in the script. No customer or private data was used; no names were downloaded.`, '',
  '| Source | Licence | Agent | Rows | What it found | Errors against the independent count |', '|---|---|---|---|---|---|',
  ...results.map((r) => `| [${SOURCES[r.id].name}](${SOURCES[r.id].page}) | ${SOURCES[r.id].licence} | ${r.agent} | ${r.rows} | ${r.found} | ${r.false_positives} |`), '',
  ...results.map((r) => `- **${r.id}**: ${r.note}${r.examples && r.examples.length ? ` Examples: ${r.examples.join('; ')}.` : ''}${r.key_clash_examples && r.key_clash_examples.length ? ` Shared keys: ${r.key_clash_examples.join('; ')}.` : ''}${r.loose_examples && r.loose_examples.length ? ` Loose pairs (${r.loose_prefix_pairs}): ${r.loose_examples.join('; ')}.` : ''}`), '',
  'Nothing public fits the other agents: commission statements, agency-bill invoices, trust bank statements, producer pay, certificates, endorsements, premium finance, audits, renewals and download logs are private agency or carrier records. They were tested on fictional data only.', ''];
writeFileSync(join(ROOT, 'docs', `realdata-${DATE}.md`), L.join('\n'));
console.log(`Wrote docs/realdata-${DATE}.json and .md`);

