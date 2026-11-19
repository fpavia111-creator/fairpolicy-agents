// Policy data quality: the fields that break downloads, renewals, certificates and E&O files when they are wrong or empty.
import { str, normPolicy, policyIndex, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['critical', 'vehicle_data', 'contact_data', 'staff_data', 'clean'];
const SEVERITY = { expiration_before_effective: 'critical', no_carrier: 'critical', no_premium: 'critical', no_dates: 'critical', vin_missing: 'vehicle_data', vin_invalid: 'vehicle_data', vin_check_digit: 'vehicle_data', no_vehicles: 'vehicle_data', no_address: 'contact_data', zip_invalid: 'contact_data', no_email_or_phone: 'contact_data', no_producer: 'staff_data', no_csr: 'staff_data' };
const NEXT = {
  critical: 'Fix in your agency system first: dates, carrier and premium drive renewals, commissions and downloads.',
  vehicle_data: 'Get the VIN from the client or the carrier and correct the vehicle.',
  contact_data: 'Complete the client\'s address, ZIP and an e-mail or phone.',
  staff_data: 'Assign a producer and an account manager.',
  clean: '',
};
const TR = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const WT = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
/** VIN problem: null when it looks right, else 'vin_invalid' (length or letters I, O, Q) or 'vin_check_digit'. */
export function vinProblem(v) {
  const s = str(v).toUpperCase().replace(/[\s-]/g, '');
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(s)) return 'vin_invalid';
  let sum = 0; for (let i = 0; i < 17; i++) sum += (/\d/.test(s[i]) ? Number(s[i]) : TR[s[i]]) * WT[i];
  const r = sum % 11; return (r === 10 ? 'X' : String(r)) === s[8] ? null : 'vin_check_digit';
}
const AUTO = new Set(['pauto', 'cauto', 'cycle', 'rv']);

export function checkQuality(policyRows, vehicleRows = null, { requireContact = true } = {}) {
  const vIdx = vehicleRows ? policyIndex(vehicleRows.filter((v) => str(v.policy_number))) : null;
  const rows = [];
  for (const raw of policyRows) {
    const p = normPolicy(raw);
    if (!p.policy_key || ['cancelled', 'expired', 'non_renewed', 'lapsed'].includes(p.status_code)) continue;
    const issues = [];
    const eff = str(p.effective_date), exp = str(p.expiration_date);
    if (!eff || !exp) issues.push('no_dates'); else if (exp <= eff) issues.push('expiration_before_effective');
    if (!p.carrier) issues.push('no_carrier');
    if (p.premium === null || p.premium <= 0) issues.push('no_premium');
    if (vIdx && AUTO.has(p.line_code)) {
      const vs = vIdx.find(p.policy_number);
      if (!vs.length) issues.push('no_vehicles');
      for (const v of vs) { const vin = str(v.vin); if (!vin) issues.push('vin_missing'); else { const pr = vinProblem(vin); if (pr) issues.push(pr); } }
    }
    if (requireContact) {
      if (!str(raw.address)) issues.push('no_address');
      const zip = str(raw.zip); if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) issues.push('zip_invalid');
      if (p.personal && !str(raw.email) && !str(raw.phone)) issues.push('no_email_or_phone');
    }
    if (!p.producer) issues.push('no_producer');
    if (!p.csr) issues.push('no_csr');
    const uniq = [...new Set(issues)].sort((a, b) => STATUSES.indexOf(SEVERITY[a]) - STATUSES.indexOf(SEVERITY[b]) || a.localeCompare(b));
    const status = uniq.length ? SEVERITY[uniq[0]] : 'clean';
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, effective_date: eff, expiration_date: exp, issues: uniq.join(', '), issue_count: uniq.length, producer: p.producer, csr: p.csr, detail: uniq.length ? `${uniq.length} issue(s): ${uniq.join(', ')}.` : '', next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || b.issue_count - a.issue_count || a.policy_number.localeCompare(b.policy_number));
  const all = rows.flatMap((r) => (r.issues ? r.issues.split(', ') : []));
  const byIssue = Object.entries(countBy(all.map((i) => ({ i })), [], 'i')).map(([issue, count]) => ({ issue, severity: SEVERITY[issue], count })).sort((a, b) => b.count - a.count || a.issue.localeCompare(b.issue));
  const byCsr = [...groupBy(rows.filter((r) => r.status !== 'clean'), (r) => r.csr || '(none)').values()].map((g) => ({ csr: g[0].csr || '(none)', policies: g.length, issues: g.reduce((n, r) => n + r.issue_count, 0) })).sort((a, b) => b.issues - a.issues || a.csr.localeCompare(b.csr));
  return { policies: rows.length, clean: rows.filter((r) => r.status === 'clean').length, issues: all.length, clean_pct: rows.length ? Math.round((rows.filter((r) => r.status === 'clean').length / rows.length) * 10000) / 100 : 0, vehicles_checked: !!vehicleRows, by_status: countBy(rows, STATUSES), by_issue: byIssue, by_csr: byCsr, rows };
}

export const summaryLine = (o) => `${o.policies} active policy(ies): ${o.clean} clean (${o.clean_pct}%), ${o.issues} issue(s) in all; ${o.by_status.critical || 0} with critical problems (dates, carrier, premium), ${o.by_status.vehicle_data || 0} with vehicle data problems${o.vehicles_checked ? '' : ' (no vehicle file given)'}, ${o.by_status.contact_data || 0} with contact gaps, ${o.by_status.staff_data || 0} without a producer or account manager.`;
