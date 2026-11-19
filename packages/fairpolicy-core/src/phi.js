// Personal-data masking. Every Fairpolicy tool result passes through here before it
// leaves the runtime, so the AI model that called the tool sees stable pseudonyms
// (CL-3f2a9c1d) instead of client names, birth dates, driver licence numbers,
// home addresses and the like. Files the tools write on this machine (worklists,
// drafts) keep the real values, because the people servicing the accounts need them.
//
// What it is, honestly:
//   - It removes the direct identifiers below from what the model sees. It is NOT
//     anonymisation: in the default "mask" mode, policy numbers, carriers, lines,
//     dates, ZIP codes and amounts still reach the model. "strict" also pseudonymises
//     policy and claim numbers and VINs, and cuts ZIP codes to three digits.
//   - It works from column and field names plus a few text patterns (SSN, e-mail,
//     phone). A client name typed into a free-text column the agent does not know
//     about can get through. Use "strict" for sensitive books, and keep your model
//     provider's data terms in line with your state's privacy and insurance data rules.
//   - Commercial insureds are businesses, not people; they are masked too, because
//     an export does not say which clients are people.
//
// Pseudonyms are HMAC-SHA256 of the value with a per-installation key
// (<stateDir>/phi.key, created on first use, never returned), so the same client
// gets the same pseudonym in every result, and a pseudonym cannot be reversed
// without the key. A tool argument may be a pseudonym; tools match it with phi.same().
// (The option is still called "phi" because the core is shared with the medical families.)

import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const PHI_MODES = Object.freeze(['mask', 'strict', 'off']);
export const PHI_KEY_FILE = 'phi.key';

/** Keys whose values describe the file's columns (field → header), never personal data. Free-text scrubbing still applies. */
const META_KEYS = new Set(['mapped', 'unmapped', 'missing', 'translated', 'columns', 'recognised_by', 'signature']);
const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');
const keys = (kind, list) => list.map((k) => [norm(k), kind]);

// Field names (any case or punctuation) → kind. Kinds marked strict are masked only in strict mode.
// Staff (producer, CSR, account manager) and carriers are not masked: they are the agency's own people and partners.
const KEY_KIND = new Map([
  ...keys('name', ['client', 'client_name', 'insured', 'insured_name', 'named_insured', 'first_named_insured', 'customer', 'customer_name', 'contact', 'contact_name', 'driver', 'driver_name', 'drivers', 'first_name', 'last_name', 'middle_name', 'policyholder', 'policy_holder', 'applicant', 'claimant', 'claimant_name', 'household', 'insureds', 'clients', 'other_client']),
  ...keys('dob', ['dob', 'date_of_birth', 'birth_date', 'birthdate', 'driver_dob', 'insured_dob', 'birthday']),
  ...keys('dl', ['drivers_license', 'driver_license', 'dl_number', 'dl', 'drivers_licence', 'driver_licence_number', 'driver_license_number']),
  ...keys('client_id', ['client_id', 'client_code', 'client_number', 'lookup_code', 'customer_id', 'customer_number', 'insured_id', 'account_number', 'account_no', 'client_ids', 'other_client_id']),
  ...keys('ssn', ['ssn', 'social_security_number', 'social_security', 'ssn_last4']),
  ...keys('address', ['address', 'street', 'street_address', 'address1', 'address2', 'address_line_1', 'address_line_2', 'mailing_address', 'home_address', 'location_address', 'garaging_address', 'risk_address', 'property_address']),
  ...keys('phone', ['phone', 'phone_number', 'home_phone', 'mobile_phone', 'mobile', 'cell_phone', 'telephone', 'fax', 'client_phone']),
  ...keys('email', ['email', 'email_address', 'client_email', 'insured_email', 'contact_email']),
  ...keys('zip', ['zip', 'zip_code', 'postal_code', 'zipcode', 'garaging_zip', 'mailing_zip']),
  ...keys('policy', ['policy_number', 'policy_no', 'policy', 'policy_numbers', 'prior_policy', 'renewal_policy', 'replacement_policy']),
  ...keys('claim', ['claim_number', 'claim_no', 'carrier_claim_number', 'claim_id', 'claim_numbers']),
  ...keys('vin', ['vin', 'vehicle_vin', 'vins', 'vehicle_id_number']),
]);
const STRICT_ONLY = new Set(['zip', 'policy', 'claim', 'vin']);
const PREFIX = { name: 'CL', client_id: 'CID', policy: 'POL', claim: 'CLM', vin: 'VIN' };
const FIXED = { ssn: '[SSN]', address: '[ADDRESS]', phone: '[PHONE]', email: '[EMAIL]', dl: '[DL]' };
// Minimum length before a registered value is also searched for inside free text.
const MIN_TEXT = { name: 4, client_id: 5, policy: 5, claim: 5, dob: 8, dl: 5, vin: 11 };

const TEXT_PATTERNS = [
  [/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]'],
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]'],
  [/(?<![\d-])\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/g, '[PHONE]'],
];

// A value that is already a pseudonym or placeholder is left alone (results pass the masker more than once).
const ALREADY = /^((CL|CID|POL|CLM|VIN)-[0-9a-f]{8}|\[(SSN|ADDRESS|PHONE|EMAIL|DOB|ZIP|DL)\]|\d{4} \(birth year\)|\d{3}XX)$/;

/** Kind of a field name, or null. */
export const phiKindOf = (key, mode = 'mask') => { const k = KEY_KIND.get(norm(key)); return !k || (STRICT_ONLY.has(k) && mode !== 'strict') ? null : k; };

/** Name variants a person's name appears as in text: as given, "First Last" and "Last, First". */
function nameVariants(raw) {
  const s = String(raw).trim(); if (!s) return [];
  const out = new Set([s]);
  const m = /^([^,]+),\s*(.+)$/.exec(s);
  if (m) out.add(`${m[2]} ${m[1]}`.trim());
  else { const p = s.split(/\s+/); if (p.length >= 2) out.add(`${p.at(-1)}, ${p.slice(0, -1).join(' ')}`); }
  return [...out];
}
const nameKey = (s) => String(s).toLowerCase().split(/[^a-z0-9À-￿]+/).filter(Boolean).sort().join(' ');

/** Read or create the per-installation pseudonym key. */
export function loadPhiKey(stateDir) {
  if (!stateDir) return randomBytes(32);
  const f = join(stateDir, PHI_KEY_FILE);
  if (existsSync(f)) { const h = readFileSync(f, 'utf8').trim(); if (/^[0-9a-f]{64}$/.test(h)) return Buffer.from(h, 'hex'); throw new Error(`${PHI_KEY_FILE} in the state folder is not a 64-character hex key; restore it from backup or delete it (pseudonyms will change)`); }
  mkdirSync(dirname(f), { recursive: true });
  const k = randomBytes(32);
  writeFileSync(f, k.toString('hex') + '\n', { mode: 0o600 });
  try { chmodSync(f, 0o600); } catch { /* Windows */ }
  return k;
}

export class PhiMasker {
  constructor({ mode = 'mask', key = null } = {}) {
    if (!PHI_MODES.includes(mode)) throw new Error(`phi mode must be one of ${PHI_MODES.join(', ')}`);
    this.mode = mode;
    this.key = key || randomBytes(32);
    this.reset();
  }

  /** Forget the values registered for the last call. */
  reset() { this.seen = new Map(); this.counts = {}; this.index = null; }

  get on() { return this.mode !== 'off'; }

  /** Stable pseudonym for a value of one kind. */
  token(kind, value) {
    const v = kind === 'name' ? nameKey(value) : String(value).trim().toUpperCase();
    return `${PREFIX[kind] || 'ID'}-${createHmac('sha256', this.key).update(`${kind}|${v}`).digest('hex').slice(0, 8)}`;
  }

  /** What the model sees for one value of one kind. */
  maskValue(kind, value) {
    if (value === null || value === undefined || value === '' || !this.on) return value;
    if (Array.isArray(value)) return value.map((v) => this.maskValue(kind, v));
    if (typeof value === 'object') return value;
    const s = String(value);
    if (ALREADY.test(s)) return value;
    this.counts[kind] = (this.counts[kind] || 0) + 1;
    if (FIXED[kind]) { this.register(kind, s); return FIXED[kind]; }
    if (kind === 'dob') { this.register(kind, s); const y = /(\d{4})/.exec(s); return this.mode === 'strict' || !y ? '[DOB]' : `${y[1]} (birth year)`; }
    if (kind === 'zip') { const d = s.replace(/\D/g, ''); return d.length >= 3 ? `${d.slice(0, 3)}XX` : '[ZIP]'; }
    this.register(kind, s);
    return this.token(kind, s);
  }

  /** Remember a raw value so it is also replaced where it appears inside other text. */
  register(kind, raw) {
    if (!this.on || raw === null || raw === undefined) return;
    if (STRICT_ONLY.has(kind) && this.mode !== 'strict') return;
    const vals = kind === 'name' ? nameVariants(raw) : [String(raw).trim()];
    const rep = FIXED[kind] || (kind === 'dob' ? '[DOB]' : this.token(kind, raw));
    // Leading and trailing punctuation is dropped for matching, so a value with junk in front of it
    // (a spreadsheet formula, a quote, a bullet) is still found where it appears in text (Evergreen fix, 18 Nov 2026).
    for (const v0 of vals) { const v = v0.replace(/^[^a-z0-9\u00C0-\uFFFF]+|[^a-z0-9\u00C0-\uFFFF]+$/gi, ''); if (v.length >= (MIN_TEXT[kind] || 4) && !this.seen.has(v.toLowerCase())) { this.seen.set(v.toLowerCase(), { value: v, rep }); this.index = null; } }
  }

  /** Register every PHI-named field of plain records (used when a tool reads a source file). */
  registerRecords(rows, fieldKinds = {}) {
    if (!this.on || !Array.isArray(rows)) return;
    const cols = new Map();
    for (const r of rows.slice(0, 1)) if (r && typeof r === 'object') for (const k of Object.keys(r)) { const kind = fieldKinds[k] || phiKindOf(k, this.mode); if (kind) cols.set(k, kind); }
    if (!cols.size) return;
    for (const r of rows) if (r && typeof r === 'object') for (const [k, kind] of cols) if (r[k] !== null && r[k] !== undefined && r[k] !== '') this.register(kind, r[k]);
  }

  #buildIndex() {
    const idx = new Map();
    for (const [low, e] of this.seen) {
      const first = (/[a-z0-9À-￿]+/.exec(low) || [low])[0];
      if (!idx.has(first)) idx.set(first, []);
      idx.get(first).push({ low, ...e });
    }
    for (const list of idx.values()) list.sort((a, b) => b.low.length - a.low.length);
    this.index = idx;
  }

  /** Replace registered values and SSN/e-mail/phone patterns inside free text. */
  maskText(s) {
    if (!this.on || typeof s !== 'string' || !s) return s;
    let out = s;
    for (const [re, rep] of TEXT_PATTERNS) out = out.replace(re, (m) => { this.counts.pattern = (this.counts.pattern || 0) + 1; return rep; });
    if (!this.seen.size) return out;
    if (!this.index) this.#buildIndex();
    const low = out.toLowerCase(); let res = ''; let i = 0;
    const word = /[a-z0-9À-￿]+/g; let m;
    while ((m = word.exec(low))) {
      if (m.index < i) continue;
      const before = m.index === 0 || !/[a-z0-9À-￿]/.test(low[m.index - 1]);
      const cands = before ? this.index.get(m[0]) : null;
      if (cands) {
        const hit = cands.find((c) => low.startsWith(c.low, m.index) && !/[a-z0-9À-￿]/.test(low[m.index + c.low.length] || ' '));
        if (hit) { res += out.slice(i, m.index) + hit.rep; i = m.index + hit.low.length; word.lastIndex = i; this.counts.text = (this.counts.text || 0) + 1; continue; }
      }
    }
    return res + out.slice(i);
  }

  /** Masked deep copy of a tool result: PHI-named fields first, then free text everywhere. */
  maskResult(value) {
    // Column-mapping reports ({ mapped: { client: "Named Insured" } }) name columns, not people: their values are headers.
    if (!this.on) return value;
    const byKey = (v, key, depth) => {
      if (depth > 40) return v;
      const kind = key === null ? null : phiKindOf(key, this.mode);
      if (Array.isArray(v)) return v.map((x) => (kind && (typeof x !== 'object' || x === null) ? this.maskValue(kind, x) : byKey(x, kind ? null : key, depth + 1)));
      if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[k] = META_KEYS.has(k) ? x : byKey(x, k, depth + 1); return o; }
      // Counts and flags under a PHI-named key (by_check.member_id: 3) are not identifiers; long numbers may be.
      if (kind && (typeof v === 'boolean' || (typeof v === 'number' && Math.abs(v) < 100000))) return v;
      return kind ? this.maskValue(kind, v) : v;
    };
    const keyed = byKey(value, null, 0);
    const text = (v, depth) => {
      if (depth > 40) return v;
      if (typeof v === 'string') return this.maskText(v);
      if (Array.isArray(v)) return v.map((x) => text(x, depth + 1));
      if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[this.maskText(k)] = text(x, depth + 1); return o; }
      return v;
    };
    return text(keyed, 0);
  }

  /**
   * Does a value the model passed back (a pseudonym or the raw value) name this raw value?
   * Used by tools that take a policy number or client pseudonym as an argument.
   */
  same(raw, given, kind = 'claim') {
    const r = String(raw ?? '').trim(), g = String(given ?? '').trim();
    if (!r || !g) return false;
    if (r.toLowerCase() === g.toLowerCase()) return true;
    return this.on && PREFIX[kind] && g.toUpperCase().startsWith(`${PREFIX[kind]}-`) && this.token(kind, r).toLowerCase() === g.toLowerCase();
  }

  /** Summary of what was masked in the last result (counts by kind, no values). */
  report() { return { mode: this.mode, masked: { ...this.counts } }; }
}
