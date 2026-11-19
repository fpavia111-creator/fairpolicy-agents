// Policy checking: the policy the carrier issued against what was bound (coverages, limits, deductibles, premium, dates).
import { str, num, round2, sum, policyIndex, policyKey, daysBetween, countBy, groupBy, normalizeName } from 'fairpolicy-core';

export const STATUSES = ['not_issued', 'coverage_reduced', 'premium_differs', 'dates_differ', 'matches'];
const NEXT = {
  not_issued: 'Bound and no policy issued after the days: ask the carrier for the policy; the binder may be running out.',
  coverage_reduced: 'The issued policy has a lower limit, a higher deductible or a missing coverage compared with what was bound: ask the carrier to correct it, and tell the client only what a licensed person has confirmed.',
  premium_differs: 'The issued premium differs from the bound premium: confirm with the carrier before billing the client.',
  dates_differ: 'The policy dates differ from the binder: ask the carrier to correct them.',
  matches: '',
};
const cov = (v) => normalizeName(v);

export function checkPolicies(boundRows, issuedRows, { asOf, issueDays = 30, tolerance = 25 } = {}) {
  const issued = policyIndex(issuedRows.filter((r) => str(r.policy_number)));
  const rows = [];
  for (const g of groupBy(boundRows.filter((r) => str(r.policy_number)), (r) => policyKey(r.policy_number)).values()) {
    const b0 = g[0]; const iss = issued.find(b0.policy_number);
    const bound = str(b0.bound_date) || str(b0.effective_date);
    const issues = [];
    if (!iss.length) {
      const age = bound ? daysBetween(bound, asOf) : null;
      if (age === null || age > issueDays) issues.push(`not_issued: bound ${bound || '(no date)'}${age !== null ? `, ${age} days ago` : ''}, no issued policy`);
      else continue;
    } else {
      for (const b of g) {
        const i = iss.find((x) => cov(x.coverage) === cov(b.coverage));
        if (!i) { issues.push(`coverage_reduced: ${str(b.coverage)} not on the issued policy`); continue; }
        const bl = num(b.limit), il = num(i.limit), bd = num(b.deductible), id = num(i.deductible);
        if (bl !== null && il !== null && il < bl) issues.push(`coverage_reduced: ${str(b.coverage)} limit ${il} issued, ${bl} bound`);
        if (bd !== null && id !== null && id > bd) issues.push(`coverage_reduced: ${str(b.coverage)} deductible ${id} issued, ${bd} bound`);
      }
      const bp = sum(g, (r) => num(r.premium) ?? 0), ip = sum(iss, (r) => num(r.premium) ?? 0);
      if (Math.abs(ip - bp) > tolerance) issues.push(`premium_differs: ${ip} issued, ${bp} bound (${round2(ip - bp)})`);
      const i0 = iss[0];
      if ((str(i0.effective_date) && str(b0.effective_date) && str(i0.effective_date) !== str(b0.effective_date)) || (str(i0.expiration_date) && str(b0.expiration_date) && str(i0.expiration_date) !== str(b0.expiration_date))) issues.push(`dates_differ: issued ${str(i0.effective_date)} to ${str(i0.expiration_date)}, bound ${str(b0.effective_date)} to ${str(b0.expiration_date)}`);
    }
    const kinds = [...new Set(issues.map((x) => x.split(':')[0]))].sort((x, y) => STATUSES.indexOf(x) - STATUSES.indexOf(y));
    const status = kinds[0] || 'matches';
    rows.push({ status, policy_number: str(b0.policy_number), client: str(b0.client), carrier: str(b0.carrier), line: str(b0.line), bound_date: bound, coverages: g.length, bound_premium: sum(g, (r) => num(r.premium) ?? 0), issued_premium: iss.length ? sum(iss, (r) => num(r.premium) ?? 0) : null, issues: kinds.join(', '), detail: issues.map((x) => x.replace(/^[a-z_]+: /, '')).join('; ') + (issues.length ? '.' : ''), next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.policy_number.localeCompare(b.policy_number));
  return { as_of: asOf, policies: rows.length, with_differences: rows.filter((r) => r.status !== 'matches').length, by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.policies} bound policy(ies) checked against what was issued: ${o.by_status.not_issued || 0} not issued yet, ${o.by_status.coverage_reduced || 0} with a coverage, limit or deductible worse than bound, ${o.by_status.premium_differs || 0} with a different premium, ${o.by_status.dates_differ || 0} with different dates, ${o.by_status.matches || 0} matching.`;
