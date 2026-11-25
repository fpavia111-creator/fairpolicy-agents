// Carrier download errors: transactions that failed or never matched a policy, and carriers whose downloads stopped.
import { str, daysBetween, countBy, carrierKey, groupBy } from 'fairpolicy-core';

export const STATUSES = ['download_error', 'unmatched_old', 'carrier_stale', 'unmatched_new', 'ok'];
const NEXT = {
  download_error: 'The download failed for this transaction: check the message, fix the policy or code in your agency system, and ask the carrier to resend if needed.',
  unmatched_old: 'Sitting in suspense: match it to the policy (or add the policy) so the change is not lost.',
  carrier_stale: 'No successful download from this carrier for days: check the carrier\'s download setup or your download service.',
  unmatched_new: 'Recently downloaded and not yet matched.',
  ok: '',
};
const kind = (s) => { const t = str(s).toLowerCase(); return /error|fail|reject/.test(t) ? 'error' : /unmatch|suspense|not found|pending match|unassigned/.test(t) ? 'unmatched' : /post|match|applied|success|complete/.test(t) ? 'posted' : 'unknown'; };

export function checkDownloads(rows, { asOf, unmatchedDays = 3, staleDays = 7 } = {}) {
  const tx = rows.filter((r) => str(r.carrier) && str(r.date) && str(r.date) <= asOf).map((r) => ({ id: str(r.download_id) || `${str(r.carrier)} ${str(r.policy_number)} ${str(r.date)}`, date: str(r.date), carrier: str(r.carrier), policy_number: str(r.policy_number), transaction_type: str(r.transaction_type), state: kind(r.status), message: str(r.message) }));
  const out = [];
  for (const t of tx) {
    if (t.state === 'posted') continue;
    const age = daysBetween(t.date, asOf);
    const status = t.state === 'error' ? 'download_error' : age > unmatchedDays ? 'unmatched_old' : 'unmatched_new';
    out.push({ status, ref: t.id, carrier: t.carrier, policy_number: t.policy_number, transaction_type: t.transaction_type, date: t.date, days: age, message: t.message, detail: `${t.transaction_type || 'Transaction'} for ${t.policy_number || 'no policy number'} on ${t.date}: ${t.message || t.state}.`, next_step: NEXT[status] });
  }
  for (const g of groupBy(tx, (t) => carrierKey(t.carrier)).values()) {
    const ok = g.filter((t) => t.state === 'posted').map((t) => t.date).sort().at(-1) || '';
    const days = ok ? daysBetween(ok, asOf) : null;
    const status = days === null || days > staleDays ? 'carrier_stale' : 'ok';
    const name = g.map((t) => t.carrier).sort()[0];
    out.push({ status, ref: `carrier:${name}`, carrier: name, policy_number: '', transaction_type: '', date: ok, days, message: '', detail: ok ? `Last successful download ${ok} (${days} days ago).` : 'No successful download in the file.', next_step: NEXT[status] });
  }
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (b.days ?? 0) - (a.days ?? 0) || a.ref.localeCompare(b.ref));
  return { as_of: asOf, transactions: tx.length, posted: tx.filter((t) => t.state === 'posted').length, problems: out.filter((r) => !r.ref.startsWith('carrier:') && r.status !== 'ok').length, carriers: out.filter((r) => r.ref.startsWith('carrier:')).length, by_status: countBy(out, STATUSES), rows: out };
}

export const summaryLine = (o) => `${o.transactions} downloaded transaction(s) to ${o.as_of}: ${o.posted} posted, ${o.by_status.download_error || 0} failed, ${o.by_status.unmatched_old || 0} unmatched for more than a few days, ${o.by_status.unmatched_new || 0} unmatched recently; ${o.by_status.carrier_stale || 0} of ${o.carriers} carrier(s) with no successful download for a week.`;
