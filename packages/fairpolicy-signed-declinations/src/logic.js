// E&O file check: the signed documents each policy should have on file (applications, UM/UIM rejections, flood offers, declinations).
import { str, normPolicy, policyIndex, countBy, normalizeName } from 'fairpolicy-core';

export const STATUSES = ['missing', 'unsigned', 'complete'];
export const DEFAULT_REQUIRED = Object.freeze({ pauto: ['signed_application'], home: ['signed_application', 'flood_offer'], condo: ['signed_application', 'flood_offer'], dwelling: ['signed_application', 'flood_offer'], pumbr: ['signed_application'], cgl: ['signed_application'], bop: ['signed_application'], wc: ['signed_application'], cauto: ['signed_application'], cprop: ['signed_application'], cumbr: ['signed_application'] });
const NEXT = {
  missing: 'A document your agency requires on file is not there: get it signed and filed. Whether coverage was offered is a fact for the file; the agent does not judge it.',
  unsigned: 'The document is on file but not signed: get the signature.',
  complete: '',
};
const DOCS = [['um_rejection', /\b(um|uim|uninsured|underinsured)\b/], ['flood_offer', /\bflood\b/], ['declination', /\b(declin|declination|rejection of coverage|coverage rejection|refus)/], ['signed_application', /\b(application|app|acord)\b/]];
export function docTypeOf(text, aliases = {}) {
  const t = normalizeName(text);
  for (const [k, v] of Object.entries(aliases || {})) if (normalizeName(k) === t) return v;
  for (const [k, re] of DOCS) if (re.test(t)) return k;
  return t.replace(/ /g, '_') || 'other';
}
const signed = (v) => /^(y|yes|true|1|x|signed|e-?signed)$/i.test(str(v));

export function checkFiles(policyRows, docRows, settings = {}) {
  const required = { ...DEFAULT_REQUIRED, ...(settings.required || {}) };
  const docs = policyIndex(docRows.map((d) => ({ policy_number: str(d.policy_number), type: docTypeOf(d.document_type, settings.document_aliases), signed: signed(d.signed), date: str(d.date) })).filter((d) => d.policy_number));
  const rows = [];
  for (const p of policyRows.map((r) => ({ ...normPolicy(r), um: str(r.um_selection), declined: str(r.declined_coverages) }))) {
    if (!p.policy_key || ['cancelled', 'expired', 'non_renewed', 'lapsed'].includes(p.status_code)) continue;
    const need = [...(required[p.line_code] || [])];
    if (/reject|reduc|lower|waiv/i.test(p.um) && !need.includes('um_rejection')) need.push('um_rejection');
    if (p.declined && !need.includes('declination')) need.push('declination');
    if (!need.length) continue;
    const have = docs.find(p.policy_number);
    const missing = need.filter((n) => !have.some((d) => d.type === n));
    const unsignedDocs = need.filter((n) => !missing.includes(n) && !have.some((d) => d.type === n && d.signed));
    const status = missing.length ? 'missing' : unsignedDocs.length ? 'unsigned' : 'complete';
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, effective_date: str(p.effective_date), required: need.join(', '), missing: missing.join(', '), unsigned: unsignedDocs.join(', '), um_selection: p.um, declined_coverages: p.declined, producer: p.producer, csr: p.csr, detail: [missing.length ? `Not on file: ${missing.join(', ')}.` : '', unsignedDocs.length ? `On file, not signed: ${unsignedDocs.join(', ')}.` : ''].filter(Boolean).join(' '), next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || String(a.effective_date).localeCompare(String(b.effective_date)) || a.policy_number.localeCompare(b.policy_number));
  const gaps = rows.flatMap((r) => [...(r.missing ? r.missing.split(', ') : []), ...(r.unsigned ? r.unsigned.split(', ') : [])]);
  return { policies: rows.length, with_gaps: rows.filter((r) => r.status !== 'complete').length, by_document: Object.entries(countBy(gaps.map((g) => ({ g })), [], 'g')).map(([document, count]) => ({ document, count })).sort((a, b) => b.count - a.count || a.document.localeCompare(b.document)), by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.policies} active policy(ies) checked: ${o.by_status.missing || 0} with a required document not on file, ${o.by_status.unsigned || 0} with a document not signed, ${o.by_status.complete || 0} complete. The required documents are your agency's own list.`;
