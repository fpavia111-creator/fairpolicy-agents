// Commission chargebacks on cancellations: what the carrier should take back, what it took, and the producer side.
import { str, num, round2, sum, policyIndex, normPolicy, normStatementLine, unearnedPremium, commissionAt, countBy, addDays } from 'fairpolicy-core';

export const STATUSES = ['overcharged', 'chargeback_without_cancel', 'producer_not_reversed', 'pending_chargeback', 'charged_ok'];
const NEXT = {
  overcharged: 'Ask the carrier to recalculate: the chargeback is more than the commission on the unearned premium.',
  chargeback_without_cancel: 'Find the cancellation in your agency system or dispute the chargeback with the carrier.',
  producer_not_reversed: 'The carrier took the commission back but the producer\'s share was not reversed; review with the producer before the next payroll.',
  pending_chargeback: 'Expect this chargeback on a coming statement; hold it as a reserve.',
  charged_ok: '',
};

export function checkChargebacks(policyRows, statementRows, producerRows = null, { asOf, lookbackDays = 180, tolerance = 1, method = 'pro_rata' } = {}) {
  const since = addDays(asOf, -lookbackDays);
  const lines = statementRows.map(normStatementLine).filter((l) => l.policy_key);
  const sIdx = policyIndex(lines);
  const prod = producerRows ? policyIndex(producerRows.map((r) => ({ ...r, amount: num(r.amount) }))) : null;
  const pols = policyRows.map((r) => normPolicy(r));
  const pIdx = policyIndex(pols);
  const rows = [];
  for (const p of pols) {
    const cd = str(p.cancel_date);
    if (!p.policy_key || p.status_code !== 'cancelled' || !cd || cd < since || cd > asOf) continue;
    const flat = cd <= str(p.effective_date);
    const unearned = flat ? p.premium : unearnedPremium(p.premium, p.effective_date, p.expiration_date, cd, { method });
    const expected = unearned !== null && p.commission_rate !== null ? commissionAt(unearned, p.commission_rate) : null;
    const taken = round2(-sum(sIdx.find(p.policy_number).filter((l) => l.tx === 'cancellation' || (l.commission ?? 0) < 0), (l) => l.commission));
    let status;
    if (taken <= 0) status = 'pending_chargeback';
    else if (expected !== null && taken > expected + tolerance) status = 'overcharged';
    else status = 'charged_ok';
    let producer_reversed = null;
    if (prod && taken > 0) {
      const pl = prod.find(p.policy_number);
      producer_reversed = pl.some((x) => (x.amount ?? 0) < 0) || !pl.some((x) => (x.amount ?? 0) > 0);
      if (!producer_reversed && status === 'charged_ok') status = 'producer_not_reversed';
    }
    const detail = status === 'overcharged' ? `Charged back ${taken}; ${p.commission_rate}% of the ${flat ? 'full' : 'unearned'} premium ${unearned} is ${expected}, so ${round2(taken - expected)} too much.`
      : status === 'pending_chargeback' ? `Cancelled ${cd}; no chargeback on the statements yet.${expected !== null ? ` Expect about ${expected}.` : ''}`
      : status === 'producer_not_reversed' ? `Carrier took back ${taken}; the producer pay file still shows the commission with no reversal.` : `Charged back ${taken}${expected !== null ? ` (expected ${expected})` : ''}.`;
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, effective_date: str(p.effective_date), expiration_date: str(p.expiration_date), cancel_date: cd, flat_cancel: flat, premium: p.premium, unearned, commission_rate: p.commission_rate, expected, taken, difference: expected === null ? null : round2(taken - expected), producer: p.producer, producer_reversed, detail, next_step: NEXT[status] });
  }
  // Chargebacks on the statements for policies that are not cancelled in the agency system.
  const seen = new Set();
  for (const l of lines) {
    if ((l.commission ?? 0) >= 0 || seen.has(l.policy_key)) continue;
    const p = pIdx.find(l.policy_number)[0];
    if (p && p.status_code === 'cancelled') continue;
    seen.add(l.policy_key);
    const taken = round2(-sum(sIdx.find(l.policy_number).filter((x) => (x.commission ?? 0) < 0), (x) => x.commission));
    rows.push({ status: 'chargeback_without_cancel', policy_number: l.policy_number, client: l.client || (p && p.client) || '', carrier: l.carrier || (p && p.carrier) || '', line: p ? p.line_code : '', effective_date: str(l.effective_date), expiration_date: '', cancel_date: '', flat_cancel: false, premium: l.premium, unearned: null, commission_rate: l.commission_rate, expected: null, taken, difference: null, producer: p ? p.producer : '', producer_reversed: null, detail: `${taken} charged back, but ${p ? `the policy is ${p.status_code} in your agency system` : 'the policy is not in your policy list'}.`, next_step: NEXT.chargeback_without_cancel });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.policy_number.localeCompare(b.policy_number));
  const cancels = rows.filter((r) => r.status !== 'chargeback_without_cancel');
  return {
    as_of: asOf, window_from: since, method, cancellations: cancels.length,
    expected_chargebacks: sum(cancels.filter((r) => r.expected !== null), (r) => r.expected), taken: sum(rows, (r) => r.taken),
    reserve_for_pending: sum(rows.filter((r) => r.status === 'pending_chargeback' && r.expected !== null), (r) => r.expected),
    overcharged_by: sum(rows.filter((r) => r.status === 'overcharged'), (r) => r.difference),
    producer_checked: !!producerRows, by_status: countBy(rows, STATUSES), rows,
  };
}

export const summaryLine = (o) => `${o.cancellations} cancellation(s) since ${o.window_from}: ${o.expected_chargebacks} in chargebacks expected (${o.method.replace('_', ' ')}), ${o.taken} taken; ${o.by_status.overcharged || 0} overcharged by ${o.overcharged_by}, ${o.by_status.pending_chargeback || 0} still to come (reserve ${o.reserve_for_pending}), ${o.by_status.chargeback_without_cancel || 0} chargeback(s) with no cancellation${o.producer_checked ? `, ${o.by_status.producer_not_reversed || 0} not reversed on producer pay` : ''}.`;

export function disputeText(items, a) {
  const total = sum(items, (r) => r.difference);
  const rows = items.map((r) => `| ${r.policy_number} | ${r.client} | ${r.cancel_date} | ${r.unearned} | ${r.commission_rate}% | ${r.expected} | ${r.taken} | ${r.difference} |`);
  return { total, text: `**To:** ${a.contact || '[TO CONFIRM carrier commission contact]'}\n**From:** ${a.from || '[TO CONFIRM your name and agency]'}\n**Re:** Chargeback recalculation, ${items[0].carrier}\n\nHello,\n\nThe chargebacks below are larger than the commission on the unearned premium by our calculation (pro rata from the cancellation date). Could you check them against your cancellation figures?\n\n| Policy | Insured | Cancelled | Unearned premium | Rate | Our chargeback | Charged | Difference |\n|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\nTotal difference: ${total}.\n\n[CHECK whether the carrier used short-rate cancellation; our figures are pro rata.]\n\nThank you,\n${a.from || '[TO CONFIRM your name]'}\n` };
}
