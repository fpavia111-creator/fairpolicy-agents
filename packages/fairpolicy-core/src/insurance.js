// Insurance agency helpers shared by the Fairpolicy agents. Pure functions, no I/O.
//
// Nothing here is a carrier's rule, a state's law or coverage advice. Line names,
// transaction words and the pro-rata formula are working defaults; an agency's
// own settings file overrides them, and every agent says which defaults it used.
import { normalizeName } from './text.js';

export const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
export const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/[$€£¥₩\s,]/g, '').replace(/^\((.*)\)$/, '-$1').replace(/%$/, '');
  if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  const n = Number(s); return Number.isFinite(n) ? n : null;
};
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const sum = (xs, f = (x) => x) => round2(xs.reduce((s, x) => s + (Number(f(x)) || 0), 0));
export const pct = (a, b) => (b ? round2((a / b) * 100) : 0);
export function groupBy(xs, key) { const m = new Map(); for (const x of xs) { const k = typeof key === 'function' ? key(x) : x[key]; if (!m.has(k)) m.set(k, []); m.get(k).push(x); } return m; }

// ------------------------------------------------------------------- dates ----

/** 'YYYY-MM-DD' from an ISO-ish date or Date, else null. */
export function isoDate(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) { const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`); return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== `${m[1]}-${m[2]}-${m[3]}` ? null : `${m[1]}-${m[2]}-${m[3]}`; }
  if (/^\d{8}$/.test(s)) return isoDate(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
  return null;
}
const ms = (d) => new Date(`${d}T00:00:00Z`).getTime();
export const daysBetween = (a, b) => { const x = isoDate(a), y = isoDate(b); return x && y ? Math.round((ms(y) - ms(x)) / 86400000) : null; };
export const addDays = (d, n) => { const x = isoDate(d); return x ? new Date(ms(x) + n * 86400000).toISOString().slice(0, 10) : null; };
export const addMonths = (d, n) => { const x = isoDate(d); if (!x) return null; const dt = new Date(ms(x)); const day = dt.getUTCDate(); dt.setUTCDate(1); dt.setUTCMonth(dt.getUTCMonth() + n); const last = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate(); dt.setUTCDate(Math.min(day, last)); return dt.toISOString().slice(0, 10); };
export const today = () => new Date().toISOString().slice(0, 10);
/** The "as of" date for a check: the as_of argument when given (so a run can be repeated), else today. */
export function asOf(a = {}) {
  if (a && a.as_of !== undefined && a.as_of !== null && a.as_of !== '') { const d = isoDate(a.as_of); if (!d) throw new Error(`as_of "${String(a.as_of).slice(0, 40)}" is not a date (use YYYY-MM-DD)`); return d; }
  return today();
}
/** Aging bucket label for a number of days. */
export const bucketOf = (days, edges = [30, 60, 90, 120]) => { if (days === null || days === undefined) return 'unknown'; if (days < 0) return 'not_due'; let lo = 0; for (const e of edges) { if (days <= e) return `${lo}-${e}`; lo = e + 1; } return `${edges.at(-1)}+`; };
/** Whole years between two dates. */
export function yearsBetween(a, b) {
  const x = isoDate(a), y = isoDate(b); if (!x || !y) return null;
  let n = Number(y.slice(0, 4)) - Number(x.slice(0, 4));
  if (y.slice(5) < x.slice(5)) n--;
  return n;
}

/** The argument every dated check takes. */
export const AS_OF_ARG = Object.freeze({ type: 'string', description: 'Date to check as of, YYYY-MM-DD (default today). Pass it to repeat a run exactly.' });

// --------------------------------------------------------------- carriers ----

// Words that do not tell carriers apart in agency exports ("Example Insurance Company",
// "Example Ins Co" and "Example" are the same carrier). Words that name a writing
// company inside a group (casualty, indemnity, mutual, fire, national) are kept.
const CARRIER_FILLER = new Set(['insurance', 'ins', 'company', 'co', 'companies', 'cos', 'group', 'grp', 'the', 'of', 'and', 'corp', 'corporation', 'inc', 'incorporated', 'llc', 'ltd', 'assurance', 'underwriters']);
const CKEYS = new Map();
/** Canonical key for a carrier name, for matching across files. */
export function carrierKey(v) {
  const s = str(v); if (!s) return '';
  const hit = CKEYS.get(s); if (hit !== undefined) return hit;
  const words = normalizeName(s).split(' ').filter((w) => w && !CARRIER_FILLER.has(w));
  const k = words.join(' ') || normalizeName(s) || s.toLowerCase();
  if (CKEYS.size > 50000) CKEYS.clear();
  CKEYS.set(s, k); return k;
}
/** True when two carrier names name the same carrier: same key, or one is the other with words left off the end ("Example" and "Example Casualty"). */
export function sameCarrier(a, b, aliases = {}) {
  const ka = carrierKey(aliases[str(a)] || a), kb = carrierKey(aliases[str(b)] || b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  const [s, l] = ka.length < kb.length ? [ka, kb] : [kb, ka];
  return l.startsWith(`${s} `);
}
/** The entry of a list naming this carrier, or null. An exact key wins; a looser match counts only when it points at one entry. */
export function findCarrier(list, name, namesOf = (x) => [x.carrier]) {
  const k = carrierKey(name); if (!k) return null;
  const exact = list.filter((x) => namesOf(x).some((n) => carrierKey(n) === k));
  if (exact.length) return exact[0];
  const loose = list.filter((x) => namesOf(x).some((n) => sameCarrier(n, name)));
  return new Set(loose.map((x) => carrierKey(namesOf(x)[0]))).size === 1 ? loose[0] : null;
}

// --------------------------------------------------------------- policies ----

/** Policy number key: letters and digits only, upper case. */
export const policyKey = (v) => str(v).toUpperCase().replace(/[^0-9A-Z]/g, '');
/** Policy number without a trailing term suffix ("BOP 104455-02" → "BOP104455"). */
export const policyBase = (v) => policyKey(str(v).toUpperCase().replace(/[\s\-/.]+\d{1,2}$/, ''));
/** True when two policy numbers name the same policy (same key, or the same number with and without a term suffix). */
export function samePolicy(a, b) {
  const ka = policyKey(a), kb = policyKey(b);
  if (!ka || !kb) return false;
  if (ka === kb || policyBase(a) === kb || ka === policyBase(b)) return true;
  // Both carry a suffix: compare the bases only when they are long enough not to be a prefix ("PA-1" and "PA-2" stay apart).
  const ba = policyBase(a), bb = policyBase(b);
  return ba.length >= MIN_BASE && ba === bb;
}
const MIN_BASE = 5;
/** Index rows by policy key and by base number, so a statement line finds its policy with or without the term suffix. */
export function policyIndex(rows, field = 'policy_number') {
  const byKey = new Map(), byBase = new Map();
  for (const r of rows) { const k = policyKey(r[field]); if (!k) continue; if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(r); const b = policyBase(r[field]); if (b.length < MIN_BASE) continue; if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(r); }
  const find = (v) => { const k = policyKey(v), b = policyBase(v); return byKey.get(k) || byKey.get(b) || byBase.get(k) || (b.length >= MIN_BASE ? byBase.get(b) : null) || []; };
  return { find, byKey, byBase };
}

// ------------------------------------------------------- lines of business ----

/**
 * Lines of business used across the Fairpolicy agents, with the words agency systems
 * and carriers use for them. A line nobody recognises is 'other'; an agency adds its
 * own words in the settings file (line_aliases).
 */
export const LINES = Object.freeze({
  pauto: { label: 'Personal auto', personal: true, words: ['personal auto', 'private passenger auto', 'ppa', 'auto personal', 'pa', 'automobile', 'auto', 'car'] },
  home: { label: 'Homeowners', personal: true, words: ['homeowners', 'homeowner', 'home', 'ho3', 'ho 3', 'ho5', 'ho 5', 'hown', 'hoi'] },
  condo: { label: 'Condo', personal: true, words: ['condo', 'condominium', 'ho6', 'ho 6'] },
  renters: { label: 'Renters', personal: true, words: ['renters', 'tenants', 'ho4', 'ho 4'] },
  dwelling: { label: 'Dwelling fire', personal: true, words: ['dwelling fire', 'dwelling', 'dp3', 'dp 3', 'dfire', 'landlord'] },
  pumbr: { label: 'Personal umbrella', personal: true, words: ['personal umbrella', 'pumbr', 'pumb', 'umbrella personal', 'pup'] },
  flood: { label: 'Flood', personal: true, words: ['flood', 'nfip', 'flood insurance'] },
  quake: { label: 'Earthquake', personal: true, words: ['earthquake', 'eq'] },
  boat: { label: 'Boat / watercraft', personal: true, words: ['boat', 'watercraft', 'marine personal', 'yacht'] },
  cycle: { label: 'Motorcycle', personal: true, words: ['motorcycle', 'mcycl', 'cycle'] },
  rv: { label: 'RV / motorhome', personal: true, words: ['rv', 'motorhome', 'recreational vehicle', 'travel trailer'] },
  life: { label: 'Life', personal: true, words: ['life', 'term life', 'whole life'] },
  health: { label: 'Health', personal: true, words: ['health', 'medical', 'dental', 'medicare supplement'] },
  cgl: { label: 'General liability', personal: false, words: ['general liability', 'commercial general liability', 'cgl', 'gl'] },
  bop: { label: 'Business owners (BOP)', personal: false, words: ['business owners', 'businessowners', 'business owners policy', 'bop'] },
  cprop: { label: 'Commercial property', personal: false, words: ['commercial property', 'property commercial', 'cprop', 'cpp', 'commercial package', 'package'] },
  cauto: { label: 'Commercial auto', personal: false, words: ['commercial auto', 'business auto', 'cauto', 'bauto', 'ca', 'truck', 'trucking', 'fleet'] },
  wc: { label: 'Workers compensation', personal: false, words: ['workers compensation', 'workers comp', 'work comp', 'wc', 'workcomp', 'workers compensation and employers liability'] },
  cumbr: { label: 'Commercial umbrella / excess', personal: false, words: ['commercial umbrella', 'excess liability', 'cumbr', 'umbrella commercial', 'excess', 'xs'] },
  prof: { label: 'Professional / E&O', personal: false, words: ['professional liability', 'errors and omissions', 'e o', 'eo', 'e&o', 'malpractice', 'prof liability'] },
  cyber: { label: 'Cyber', personal: false, words: ['cyber', 'cyber liability', 'data breach'] },
  dno: { label: 'D&O', personal: false, words: ['directors and officers', 'd o', 'd&o', 'dno', 'management liability'] },
  epli: { label: 'Employment practices', personal: false, words: ['employment practices', 'epli', 'epl'] },
  inland: { label: 'Inland marine', personal: false, words: ['inland marine', 'im', 'equipment floater', 'contractors equipment', 'builders risk'] },
  bond: { label: 'Surety / bond', personal: false, words: ['surety', 'bond', 'fidelity', 'contract bond', 'license bond'] },
  liquor: { label: 'Liquor liability', personal: false, words: ['liquor liability', 'liquor', 'dram shop'] },
  umbrella: { label: 'Umbrella (personal or commercial)', personal: null, words: ['umbrella', 'umb'] },
  other: { label: 'Other / unrecognised', personal: null, words: [] },
});
const LINE_INDEX = Object.entries(LINES).flatMap(([code, { words }]) => words.map((w) => [normalizeName(w) || w, code])).sort((a, b) => b[0].length - a[0].length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Map a line-of-business label or code to a LINES key. `aliases` maps your own words to codes. */
export function lineOf(text, aliases = {}) {
  const raw = str(text); if (!raw) return 'other';
  if (LINES[raw.toLowerCase()]) return raw.toLowerCase();
  const t = normalizeName(raw.replace(/&/g, ' and ')) || raw.toLowerCase();
  for (const [k, v] of Object.entries(aliases || {})) if (normalizeName(k) === t) return LINES[v] ? v : 'other';
  for (const [w, code] of LINE_INDEX) if (w && (t === w || new RegExp(`(^| )${esc(w)}( |$)`).test(t))) return code;
  return 'other';
}
/** Personal (true), commercial (false) or unknown (null), from a line code and an optional segment column ("Personal Lines", "Commercial"). */
export function isPersonal(code, segment = '') {
  const s = str(segment).toLowerCase();
  if (/^(pl|personal)/.test(s)) return true;
  if (/^(cl|commercial|business)/.test(s)) return false;
  return LINES[code] ? LINES[code].personal : null;
}

// ------------------------------------------------- transactions and status ----

const TX = [
  ['new', /^(new|nbs|nb|nbus|new business|new bus|new policy|n)$/],
  ['renewal', /^(ren|rwl|rnl|rn|renew|renewal|renewed|renewal business|rewrite|r)$/],
  ['endorsement', /^(end|endt|endorsement|pch|policy change|change|chg|adjustment|adj|add|amend|amendment|e)$/],
  ['cancellation', /^(can|canc|cxl|xlc|cncl|cancel|cancellation|cancelled|canceled|flat cancel|flat|c|return|return premium)$/],
  ['reinstatement', /^(rei|rin|reinst|reinstate|reinstatement|reinstated)$/],
  ['audit', /^(aud|audit|premium audit|final audit)$/],
  ['installment', /^(inst|installment|instl|pay plan)$/],
];
/** Transaction kind from a code or label: new, renewal, endorsement, cancellation, reinstatement, audit, installment or other. */
export function transactionOf(text) {
  const t = normalizeName(str(text)) || str(text).toLowerCase();
  if (!t) return 'other';
  for (const [k, re] of TX) if (re.test(t)) return k;
  if (/cancel|cxl|xlc/.test(t)) return 'cancellation';
  if (/reinstat/.test(t)) return 'reinstatement';
  if (/renew/.test(t)) return 'renewal';
  if (/new/.test(t)) return 'new';
  if (/endors|change/.test(t)) return 'endorsement';
  if (/audit/.test(t)) return 'audit';
  return 'other';
}
/** Agency bill ('agency'), direct bill ('direct') or null. */
export function billTypeOf(text) {
  const t = str(text).toLowerCase().replace(/[^a-z]/g, '');
  if (!t) return null;
  if (/^(a|ab|agency|agencybill|agencybilled|agcy|agencybilling)$/.test(t)) return 'agency';
  if (/^(d|db|direct|directbill|directbilled|companybill|carrierbill|directbilling|billedbycarrier)$/.test(t)) return 'direct';
  return null;
}
const STATUS = [
  ['active', /^(active|a|in force|inforce|issued|bound|current|live|renewal issued)$/],
  ['cancelled', /^(cancelled|canceled|cancel|c|cxl|canc|cancelled non pay|cancel non pay|cancelled nonpay|flat cancelled)$/],
  ['expired', /^(expired|e|exp)$/],
  ['renewed', /^(renewed|r|rewritten|rewrite)$/],
  ['non_renewed', /^(non renewed|nonrenewed|non renew|nr|non renewal|nonrenewal)$/],
  ['lapsed', /^(lapsed|lapse|l)$/],
  ['pending', /^(pending|quote|quoted|submitted|p|pending cancel|pending cancellation)$/],
  ['reinstated', /^(reinstated)$/],
];
/** Policy status from a label: active, cancelled, expired, renewed, non_renewed, lapsed, pending, reinstated or unknown. */
export function statusOf(text) {
  const t = normalizeName(str(text).replace(/-/g, ' ')) || str(text).toLowerCase();
  if (!t) return 'unknown';
  for (const [k, re] of STATUS) if (re.test(t)) return k;
  if (/cancel/.test(t)) return 'cancelled';
  if (/non ?renew/.test(t)) return 'non_renewed';
  if (/expir/.test(t)) return 'expired';
  if (/laps/.test(t)) return 'lapsed';
  if (/active|force/.test(t)) return 'active';
  return 'unknown';
}

// ---------------------------------------------------------- premium math ----

/** Days in a policy term (expiration minus effective), or null. */
export const termDays = (eff, exp) => { const d = daysBetween(eff, exp); return d && d > 0 ? d : null; };

/**
 * Unearned premium on a cancellation: pro rata by days left in the term, or short
 * rate (pro rata less a penalty share, default 10%). This is arithmetic on your
 * figures, not the carrier's cancellation table; carriers' own tables differ.
 */
export function unearnedPremium(premium, eff, exp, cancelDate, { method = 'pro_rata', shortRatePenalty = 0.1 } = {}) {
  const p = num(premium), days = termDays(eff, exp), left = daysBetween(cancelDate, exp);
  if (p === null || !days || left === null) return null;
  const share = Math.min(Math.max(left / days, 0), 1);
  const pr = p * share;
  return round2(method === 'short_rate' ? pr * (1 - shortRatePenalty) : pr);
}

/** Commission at a rate given as a percent (15) or a fraction (0.15). */
export function commissionAt(premium, rate) {
  const p = num(premium), r = num(rate);
  if (p === null || r === null) return null;
  return round2(p * (r > 1 ? r / 100 : r));
}
/** A rate given as a percent (15) or a fraction (0.15), as a percent. */
export const asPercent = (rate) => { const r = num(rate); return r === null ? null : round2(r > 1 ? r : r * 100); };

// ---------------------------------------------------------- client names ----

/** Name key for people and businesses: legal forms and punctuation dropped, word order kept. */
export const clientKey = (v) => normalizeName(str(v));

/** Settings every agent can read: the agency's own words for lines, carriers and statuses. */
export const ALIASES_SCHEMA = Object.freeze({
  line_aliases: { type: 'object', description: 'Your words for lines of business, e.g. {"PKG": "cprop"}', additionalProperties: { type: 'string', enum: Object.keys(LINES) } },
  carrier_aliases: { type: 'object', description: 'Other names a carrier goes by in your files, e.g. {"EXM": "Example Mutual"}', additionalProperties: { type: 'string', maxLength: 200 } },
});
