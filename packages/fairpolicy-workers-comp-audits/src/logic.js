// Premium audits (workers comp and other auditable policies): not started, large additional premium, returns due, estimates to update.
import { str, num, round2, sum, pct, daysBetween, countBy } from 'fairpolicy-core';

export const STATUSES = ['audit_not_started', 'large_additional_premium', 'return_due', 'update_estimate', 'pending', 'ok'];
const NEXT = {
  audit_not_started: 'The policy ended and no audit is recorded: contact the carrier\'s audit department and the client so records are ready.',
  large_additional_premium: 'The audit adds a lot of premium: review the audit with the client promptly; the carrier\'s dispute process and deadline apply.',
  return_due: 'The audit returns premium: make sure the client receives it.',
  update_estimate: 'Audited payroll is well away from the estimate: update the estimate on the renewal so the next audit is closer.',
  pending: '', ok: '',
};
const done = (s, d) => /complete|final|closed|billed/i.test(str(s)) || !!str(d);
const started = (s) => /request|schedul|progress|open|sent|pending/i.test(str(s));

export function checkAudits(rows, { asOf, startDays = 30, additionalPct = 10, payrollPct = 20 } = {}) {
  const out = [];
  for (const r of rows) {
    const exp = str(r.expiration_date); if (!str(r.policy_number) || !exp || exp > asOf) continue;
    const completed = done(r.audit_status, r.completed_date) && (!str(r.completed_date) || str(r.completed_date) <= asOf);
    const estPay = num(r.estimated_payroll), audPay = num(r.audited_payroll), estPrem = num(r.estimated_premium), change = num(r.audit_premium);
    const payChange = estPay && audPay !== null ? pct(audPay - estPay, estPay) : null;
    const premPct = estPrem && change !== null ? pct(change, estPrem) : null;
    const since = daysBetween(exp, asOf);
    let status;
    if (!completed && !started(r.audit_status) && since > startDays) status = 'audit_not_started';
    else if (!completed) status = 'pending';
    else if (change !== null && change > 0 && premPct !== null && premPct >= additionalPct) status = 'large_additional_premium';
    else if (change !== null && change < 0) status = 'return_due';
    else if (payChange !== null && Math.abs(payChange) > payrollPct) status = 'update_estimate';
    else status = 'ok';
    const detail = status === 'audit_not_started' ? `Ended ${exp} (${since} days); audit status "${str(r.audit_status) || 'none'}".` : status === 'pending' ? `Audit ${str(r.audit_status).toLowerCase() || 'open'}${str(r.scheduled_date) ? ` for ${str(r.scheduled_date)}` : ''}.` : `Payroll ${estPay ?? '?'} estimated, ${audPay ?? '?'} audited (${payChange ?? '?'}%); audit premium ${change ?? '?'}${premPct !== null ? ` (${premPct}% of the estimated premium)` : ''}.`;
    out.push({ status, policy_number: str(r.policy_number), client: str(r.client), carrier: str(r.carrier), line: str(r.line), expiration_date: exp, days_since_end: since, audit_status: str(r.audit_status), completed_date: str(r.completed_date), estimated_payroll: estPay, audited_payroll: audPay, payroll_change_pct: payChange, estimated_premium: estPrem, audit_premium: change, csr: str(r.csr), detail, next_step: NEXT[status] });
  }
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || b.days_since_end - a.days_since_end || a.policy_number.localeCompare(b.policy_number));
  return { as_of: asOf, audits: out.length, additional_premium: sum(out.filter((r) => (r.audit_premium ?? 0) > 0), (r) => r.audit_premium), return_premium: round2(-sum(out.filter((r) => (r.audit_premium ?? 0) < 0), (r) => r.audit_premium)), by_status: countBy(out, STATUSES), rows: out };
}

export const summaryLine = (o) => `${o.audits} auditable policy(ies) ended by ${o.as_of}: ${o.by_status.audit_not_started || 0} with no audit started, ${o.by_status.large_additional_premium || 0} with large additional premium, ${o.by_status.return_due || 0} returning premium (${o.return_premium}), ${o.by_status.update_estimate || 0} with payroll far from the estimate, ${o.by_status.pending || 0} in progress. Audits added ${o.additional_premium} in all.`;
