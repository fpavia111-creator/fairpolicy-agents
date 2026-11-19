// Return premiums: money the carrier credited back on agency-bill policies that has not reached the client.
import { str, num, sum, billTypeOf, daysBetween, countBy } from 'fairpolicy-core';

export const STATUSES = ['refund_overdue', 'check_uncashed', 'refund_due', 'carrier_refunds', 'refunded'];
const NEXT = {
  refund_overdue: 'The carrier credited this return premium to the agency and the client has not received it: refund or apply it now.',
  check_uncashed: 'The refund check has not cleared: contact the client; uncashed money may have to be reported under your state\'s unclaimed property rules, which your accountant confirms.',
  refund_due: 'Refund within your agency\'s usual days.',
  carrier_refunds: 'Direct bill: the carrier refunds the client; nothing for the agency to send.',
  refunded: '',
};

export function checkRefunds(rows, { asOf, refundDays = 30, clearDays = 90 } = {}) {
  const out = rows.filter((r) => str(r.policy_number) && num(r.return_amount) !== null && str(r.credited_date) && str(r.credited_date) <= asOf).map((r) => {
    const amt = Math.abs(num(r.return_amount)); const bill = billTypeOf(r.bill_type);
    const credited = str(r.credited_date), refunded = str(r.refunded_date) && str(r.refunded_date) <= asOf ? str(r.refunded_date) : '', cleared = str(r.cleared_date) && str(r.cleared_date) <= asOf ? str(r.cleared_date) : '';
    const applied = str(r.applied_to);
    const since = daysBetween(credited, asOf);
    let status;
    if (bill === 'direct') status = 'carrier_refunds';
    else if (applied) status = 'refunded';
    else if (refunded) status = !cleared && str(r.check_number) && daysBetween(refunded, asOf) > clearDays ? 'check_uncashed' : 'refunded';
    else status = since > refundDays ? 'refund_overdue' : 'refund_due';
    const detail = status === 'refund_overdue' || status === 'refund_due' ? `${amt} credited by the carrier ${credited} (${since} days ago); not refunded.` : status === 'check_uncashed' ? `Check ${str(r.check_number)} for ${amt} sent ${refunded} (${daysBetween(refunded, asOf)} days); not cleared.` : applied ? `Applied to ${applied}.` : status === 'carrier_refunds' ? 'Direct bill.' : `Refunded ${refunded}.`;
    return { status, policy_number: str(r.policy_number), client: str(r.client), carrier: str(r.carrier), bill_type: bill || '', return_amount: amt, credited_date: credited, days_since_credit: since, refunded_date: refunded, check_number: str(r.check_number), cleared_date: cleared, applied_to: applied, csr: str(r.csr), detail, next_step: NEXT[status] };
  });
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || b.days_since_credit - a.days_since_credit || a.policy_number.localeCompare(b.policy_number));
  return { as_of: asOf, returns: out.length, owed_to_clients: sum(out.filter((r) => r.status === 'refund_overdue' || r.status === 'refund_due'), (r) => r.return_amount), uncashed: sum(out.filter((r) => r.status === 'check_uncashed'), (r) => r.return_amount), by_status: countBy(out, STATUSES), rows: out };
}

export const summaryLine = (o) => `${o.returns} return premium(s) credited by ${o.as_of}: ${o.owed_to_clients} still owed to clients (${o.by_status.refund_overdue || 0} overdue, ${o.by_status.refund_due || 0} due), ${o.by_status.check_uncashed || 0} refund check(s) not cleared (${o.uncashed}), ${o.by_status.carrier_refunds || 0} refunded by the carrier directly.`;
