// Pending endorsements: changes a client asked for that were not sent, not confirmed, or confirmed and not billed.
import { str, num, sum, billTypeOf, daysBetween, countBy } from 'fairpolicy-core';

export const STATUSES = ['not_submitted', 'unconfirmed', 'premium_change_not_billed', 'waiting', 'done'];
const NEXT = {
  not_submitted: 'The client asked for this change and it has not gone to the carrier: a person submits it today and tells the client it is not done until confirmed.',
  unconfirmed: 'Sent to the carrier with no confirmation: follow up and check the change on the next policy download.',
  premium_change_not_billed: 'The carrier confirmed a premium change on an agency-bill policy and no invoice or credit was raised: bill or credit the client.',
  waiting: '', done: '',
};
const yes = (v) => { const s = str(v); return !!s && !/^(n|no|false|0)$/i.test(s); };

export function checkEndorsements(rows, { asOf, submitDays = 2, confirmDays = 14 } = {}) {
  const out = rows.filter((r) => (str(r.request_id) || str(r.policy_number)) && !(str(r.requested_date) && str(r.requested_date) > asOf)).map((r) => {
    const req = str(r.requested_date), sub = str(r.submitted_date) && str(r.submitted_date) <= asOf ? str(r.submitted_date) : '', conf = str(r.confirmed_date) && str(r.confirmed_date) <= asOf ? str(r.confirmed_date) : '';
    const change = num(r.premium_change) ?? 0; const bill = billTypeOf(r.bill_type); const billed = yes(r.invoiced);
    let status;
    if (conf) status = change !== 0 && bill === 'agency' && !billed ? 'premium_change_not_billed' : 'done';
    else if (!sub) status = req && daysBetween(req, asOf) > submitDays ? 'not_submitted' : 'waiting';
    else status = daysBetween(sub, asOf) > confirmDays ? 'unconfirmed' : 'waiting';
    const detail = status === 'not_submitted' ? `Asked for ${req} (${daysBetween(req, asOf)} days ago); not sent to the carrier.` : status === 'unconfirmed' ? `Sent ${sub} (${daysBetween(sub, asOf)} days ago); no confirmation.` : status === 'premium_change_not_billed' ? `Confirmed ${conf} with a premium change of ${change} on agency bill; not invoiced.` : status === 'waiting' ? (sub ? `Sent ${sub}.` : `Asked for ${req}.`) : '';
    return { status, request_id: str(r.request_id), policy_number: str(r.policy_number), client: str(r.client), carrier: str(r.carrier), change: str(r.change), requested_date: req, submitted_date: sub, confirmed_date: conf, premium_change: change, bill_type: bill || '', invoiced: billed, csr: str(r.csr), detail, next_step: NEXT[status] };
  });
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || String(a.requested_date).localeCompare(String(b.requested_date)) || a.request_id.localeCompare(b.request_id));
  return { as_of: asOf, requests: out.length, open: out.filter((r) => r.status !== 'done').length, unbilled_premium: sum(out.filter((r) => r.status === 'premium_change_not_billed'), (r) => r.premium_change), by_status: countBy(out, STATUSES), rows: out };
}

export const summaryLine = (o) => `${o.requests} change request(s), ${o.open} open as of ${o.as_of}: ${o.by_status.not_submitted || 0} not sent to the carrier, ${o.by_status.unconfirmed || 0} sent and not confirmed, ${o.by_status.premium_change_not_billed || 0} confirmed and not billed (${o.unbilled_premium}), ${o.by_status.waiting || 0} waiting.`;
