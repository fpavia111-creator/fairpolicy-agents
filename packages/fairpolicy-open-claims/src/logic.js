// Open claims: not reported to the carrier, no update for weeks, open a long time, or open on a policy about to renew.
import { str, num, round2, sum, daysBetween, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['not_reported', 'no_update', 'renewal_soon', 'open_long', 'active'];
const NEXT = {
  not_reported: 'The agency logged this loss but there is no carrier claim number: confirm today that the carrier has it.',
  no_update: 'No contact or update for weeks: ask the adjuster for a status and tell the client what you learn.',
  renewal_soon: 'Open claim on a policy renewing soon: get a current status and reserve for the renewal submission.',
  open_long: 'Open for a long time: ask the adjuster what is holding it.',
  active: '',
};
const closed = (s) => /closed|close|settled|denied|withdrawn|complete/i.test(str(s));

export function checkClaims(rows, { asOf, reportDays = 3, quietDays = 30, longDays = 180, renewalDays = 60 } = {}) {
  let closedCount = 0;
  const out = [];
  for (const r of rows) {
    const ref = str(r.agency_claim_id) || str(r.claim_number); if (!ref) continue;
    if (closed(r.status)) { closedCount++; continue; }
    const reported = str(r.reported_date) || str(r.loss_date);
    if (reported && reported > asOf) continue;
    const last = [str(r.last_activity_date), reported].filter(Boolean).sort().at(-1) || '';
    const quiet = last ? daysBetween(last, asOf) : null; const age = reported ? daysBetween(reported, asOf) : null;
    const exp = str(r.policy_expiration); const toRenewal = exp && exp >= asOf ? daysBetween(asOf, exp) : null;
    const paid = num(r.paid) ?? 0, reserve = num(r.reserve) ?? 0;
    let status;
    if (!str(r.claim_number) && age !== null && age > reportDays) status = 'not_reported';
    else if (quiet !== null && quiet > quietDays) status = 'no_update';
    else if (toRenewal !== null && toRenewal <= renewalDays) status = 'renewal_soon';
    else if (age !== null && age > longDays) status = 'open_long';
    else status = 'active';
    const detail = status === 'not_reported' ? `Reported to the agency ${reported} (${age} days); no carrier claim number.` : status === 'no_update' ? `Last activity ${last} (${quiet} days ago).` : status === 'renewal_soon' ? `Policy renews ${exp} (${toRenewal} days); claim open.` : status === 'open_long' ? `Open ${age} days.` : '';
    out.push({ status, claim_ref: ref, claim_number: str(r.claim_number), client: str(r.client), policy_number: str(r.policy_number), carrier: str(r.carrier), line: str(r.line), loss_date: str(r.loss_date), reported_date: reported, days_open: age, last_activity: last, days_quiet: quiet, adjuster: str(r.adjuster), paid, reserve, incurred: round2(paid + reserve), policy_expiration: exp, csr: str(r.csr), detail, next_step: NEXT[status] });
  }
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (b.days_quiet ?? 0) - (a.days_quiet ?? 0) || a.claim_ref.localeCompare(b.claim_ref));
  const byCarrier = [...groupBy(out, (r) => r.carrier || '(none)').values()].map((g) => ({ carrier: g[0].carrier || '(none)', open: g.length, incurred: sum(g, (r) => r.incurred), needing_attention: g.filter((r) => r.status !== 'active').length })).sort((a, b) => b.needing_attention - a.needing_attention || a.carrier.localeCompare(b.carrier));
  return { as_of: asOf, open: out.length, closed: closedCount, incurred_open: sum(out, (r) => r.incurred), needing_attention: out.filter((r) => r.status !== 'active').length, by_status: countBy(out, STATUSES), by_carrier: byCarrier, rows: out };
}

export const summaryLine = (o) => `${o.open} open claim(s) as of ${o.as_of} (${o.incurred_open} incurred): ${o.by_status.not_reported || 0} with no carrier claim number, ${o.by_status.no_update || 0} with no update for weeks, ${o.by_status.renewal_soon || 0} on policies renewing soon, ${o.by_status.open_long || 0} open a long time.`;
