// Lapsed and cancelled policies: which were replaced, which still have a reinstatement window, which left a client with no policy.
import { str, sum, normPolicy, clientKey, daysBetween, addDays, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['reinstatement_window', 'not_replaced', 'expired_no_renewal_record', 'replaced'];
const NEXT = {
  reinstatement_window: 'Cancelled for non-payment and still inside the reinstatement days: the account manager calls the client today. Whether a carrier reinstates is the carrier\'s decision.',
  not_replaced: 'No replacement policy for this client and line in your system: the account manager contacts the client and records the answer. The agent gives no coverage advice.',
  expired_no_renewal_record: 'Shown as active but past its expiration with no renewal term in your system: check the download or the renewal.',
  replaced: '',
};
const NONPAY = /non.?pay|nsf|nonpayment|non payment|payment|unpaid/i;
const GONE = ['cancelled', 'lapsed', 'expired', 'non_renewed'];

export function checkLapses(policyRows, { asOf, lookbackDays = 90, reinstateDays = 30, replaceWindowDays = 45 } = {}) {
  const pols = policyRows.map((r) => normPolicy(r)).filter((p) => p.policy_key);
  const byClientLine = groupBy(pols, (p) => `${clientKey(p.client)}|${p.line_code}`);
  const byKey = groupBy(pols, (p) => p.policy_key);
  const since = addDays(asOf, -lookbackDays);
  const rows = [];
  for (const p of pols) {
    const exp = str(p.expiration_date);
    const gone = GONE.includes(p.status_code);
    const endDate = p.status_code === 'cancelled' ? str(p.cancel_date) || exp : exp;
    const staleActive = !gone && p.status_code !== 'pending' && exp && exp < asOf && exp >= since;
    if (!gone && !staleActive) continue;
    if (!endDate || endDate < since || endDate > asOf) continue;
    const renewed = (byKey.get(p.policy_key) || []).some((o) => o !== p && str(o.effective_date) >= exp && !GONE.includes(o.status_code));
    if (staleActive && renewed) continue;
    const others = (byClientLine.get(`${clientKey(p.client)}|${p.line_code}`) || []).filter((o) => o !== p && !GONE.includes(o.status_code) && str(o.effective_date) >= addDays(endDate, -replaceWindowDays) && str(o.expiration_date) > endDate);
    const replacement = renewed ? p.policy_number : others.map((o) => o.policy_number).sort()[0] || '';
    const days = daysBetween(endDate, asOf);
    const nonpay = p.status_code === 'cancelled' && NONPAY.test(str(p.cancel_reason) + ' ' + str(p.status));
    let status;
    if (replacement) status = 'replaced';
    else if (staleActive) status = 'expired_no_renewal_record';
    else if (nonpay && days <= reinstateDays) status = 'reinstatement_window';
    else status = 'not_replaced';
    const detail = status === 'replaced' ? `Replaced by ${replacement}.` : `${staleActive ? 'Expired' : p.status_code === 'cancelled' ? `Cancelled${nonpay ? ' for non-payment' : ''}` : p.status_code.replace('_', '-')} ${endDate} (${days} days ago); no other ${p.line_code} policy for this client.`;
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, personal: p.personal, policy_status: p.status_code, end_date: endDate, days_since: days, reason: str(p.cancel_reason), premium: p.premium, replacement, producer: p.producer, csr: p.csr, detail, next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (b.personal === true) - (a.personal === true) || a.days_since - b.days_since || a.policy_number.localeCompare(b.policy_number));
  const lost = rows.filter((r) => r.status === 'not_replaced' || r.status === 'reinstatement_window');
  return { as_of: asOf, window_from: since, policies: rows.length, not_replaced: lost.length, premium_not_replaced: sum(lost, (r) => r.premium ?? 0), replaced: rows.filter((r) => r.status === 'replaced').length, by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.policies} policy(ies) cancelled, lapsed or expired since ${o.window_from}: ${o.by_status.reinstatement_window || 0} still in a reinstatement window, ${o.by_status.not_replaced || 0} with no replacement (${o.premium_not_replaced} premium including the reinstatement window), ${o.by_status.expired_no_renewal_record || 0} shown active but expired with no renewal record, ${o.replaced} replaced.`;
