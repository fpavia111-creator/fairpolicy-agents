// Additional insured, waiver and primary/non-contributory requests: covered by the policy, waiting on the carrier, or stuck.
import { str, policyIndex, daysBetween, countBy, normalizeName } from 'fairpolicy-core';

export const STATUSES = ['needs_endorsement', 'endorsement_pending', 'open_overdue', 'ready_to_issue', 'awaiting_carrier', 'complete'];
const NEXT = {
  needs_endorsement: 'The policy has no blanket wording and does not schedule this holder: ask the carrier for the endorsement before a certificate shows it.',
  endorsement_pending: 'The carrier has not sent the endorsement: follow up with the underwriter.',
  open_overdue: 'Covered by the policy but the request is still open: issue the certificate after a person checks the contract wording.',
  ready_to_issue: 'Covered by the policy: a person issues the certificate.',
  awaiting_carrier: 'Endorsement requested recently; waiting on the carrier.',
  complete: '',
};
export function requirementOf(text) {
  const t = normalizeName(text);
  if (/\b(waiver|wos|subrogation|subro)\b/.test(t)) return 'waiver';
  if (/\b(pnc|primary|non contributory|noncontributory)\b/.test(t)) return 'pnc';
  if (/\b(ai|additional insured|addl insd|addl insured|additional)\b/.test(t)) return 'ai';
  return 'other';
}
const yes = (v) => /^(y|yes|true|1|x|blanket)$/i.test(str(v));

export function checkRequests(requestRows, coverageRows, { asOf, overdueDays = 7, pendingDays = 14 } = {}) {
  const cov = policyIndex(coverageRows.map((r) => ({ policy_number: str(r.policy_number), client: str(r.client), ai: yes(r.blanket_ai), waiver: yes(r.blanket_waiver), pnc: yes(r.primary_noncontributory), scheduled: str(r.scheduled_holders).split(/[;|]/).map((h) => normalizeName(h)).filter(Boolean) })));
  const rows = requestRows.filter((r) => str(r.request_id)).map((r) => {
    const req = requirementOf(r.requirement); const p = cov.find(r.policy_number)[0] || null;
    const holder = str(r.holder);
    const blanket = p && (req === 'ai' ? p.ai : req === 'waiver' ? p.waiver : req === 'pnc' ? p.pnc : false);
    const scheduled = p && p.scheduled.includes(normalizeName(holder));
    const received = str(r.endorsement_received_date) && str(r.endorsement_received_date) <= asOf;
    const available = blanket || scheduled || received;
    const completed = str(r.completed_date) && str(r.completed_date) <= asOf;
    const age = daysBetween(str(r.requested_date), asOf);
    const asked = str(r.endorsement_requested_date) && str(r.endorsement_requested_date) <= asOf ? daysBetween(str(r.endorsement_requested_date), asOf) : null;
    let status;
    if (completed) status = 'complete';
    else if (available) status = age !== null && age > overdueDays ? 'open_overdue' : 'ready_to_issue';
    else if (asked !== null) status = asked > pendingDays ? 'endorsement_pending' : 'awaiting_carrier';
    else status = 'needs_endorsement';
    const how = blanket ? 'blanket wording on the policy' : scheduled ? 'holder scheduled on the policy' : received ? 'endorsement received' : p ? 'not on the policy' : 'policy not in the coverage file';
    return { status, request_id: str(r.request_id), client: str(r.client) || (p ? p.client : ''), policy_number: str(r.policy_number), holder, requirement: req, requested_date: str(r.requested_date), days_open: completed ? 0 : age, covered_by: how, endorsement_requested_date: str(r.endorsement_requested_date), csr: str(r.csr), detail: `${req.toUpperCase()} for ${holder}: ${how}.${asked !== null && !available ? ` Endorsement asked for ${asked} days ago.` : ''}`, next_step: NEXT[status] };
  });
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (b.days_open ?? 0) - (a.days_open ?? 0) || a.request_id.localeCompare(b.request_id));
  return { as_of: asOf, requests: rows.length, open: rows.filter((r) => r.status !== 'complete').length, by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.requests} request(s), ${o.open} open as of ${o.as_of}: ${o.by_status.needs_endorsement || 0} need an endorsement from the carrier, ${o.by_status.endorsement_pending || 0} endorsement(s) overdue from the carrier, ${o.by_status.open_overdue || 0} covered but still open, ${o.by_status.ready_to_issue || 0} ready to issue, ${o.by_status.awaiting_carrier || 0} waiting on the carrier.`;
