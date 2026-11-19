// Commission statement check: each statement line against the commission you expect.
import { str, num, round2, sum, policyIndex, lineOf, sameCarrier, carrierKey, normPolicy, normStatementLine, commissionAt, countBy, byPriority, groupBy } from 'fairpolicy-core';

export const STATUSES = ['underpaid', 'possible_duplicate', 'overpaid', 'no_policy', 'no_rate', 'not_checked', 'ok'];
const NEXT = {
  underpaid: 'Ask the carrier for the missing commission (draft an inquiry), or correct the schedule if the rate really changed.',
  possible_duplicate: 'Check the statement: the same policy, transaction and amount appear more than once.',
  overpaid: 'Confirm before you keep it: an overpayment is often charged back later.',
  no_policy: 'Find the policy in your agency system (new number, rewrite, or a book transfer) or ask the carrier.',
  no_rate: 'Add the carrier and line to your commission schedule so the next run can check it.',
  not_checked: 'The line has no premium to work from; check it by hand.',
  ok: '',
};

/** The rate the schedule gives for a carrier, line and new/renewal, with how specific the match was. */
export function expectedRate(schedule, carrier, lineCode, kind) {
  const rates = (schedule && schedule.rates) || [];
  const aliases = (schedule && schedule.carrier_aliases) || {};
  const cand = rates.filter((r) => sameCarrier(r.carrier, carrier, aliases));
  let best = null; let score = -1;
  for (const r of cand) {
    const rl = r.line ? lineOf(r.line, schedule.line_aliases) : null;
    if (rl && rl !== lineCode) continue;
    const rk = r.kind && r.kind !== 'any' ? r.kind : null;
    if (rk && rk !== kind) continue;
    const s = (rl ? 2 : 0) + (rk ? 1 : 0) + (carrierKey(r.carrier) === carrierKey(carrier) ? 0.5 : 0);
    if (s > score || (s === score && Number(r.rate) < Number(best.rate))) { best = r; score = s; }
  }
  return best ? { rate: num(best.rate), source: `schedule: ${best.carrier}${best.line ? ` ${best.line}` : ''}${best.kind && best.kind !== 'any' ? ` ${best.kind}` : ''}` } : null;
}

export function checkStatement(statementRows, policyRows, schedule = {}, { tolerance } = {}) {
  const tol = num(tolerance ?? schedule.tolerance) ?? 1;
  const policies = policyRows.map((r) => normPolicy(r, { lineAliases: schedule.line_aliases }));
  const idx = policyIndex(policies);
  const lines = statementRows.map(normStatementLine).filter((l) => l.policy_key);
  // Same policy, transaction, effective date and commission more than once.
  const dupKey = (l) => [l.policy_key, l.tx, str(l.effective_date), l.commission].join('|');
  const dupCount = new Map(); for (const l of lines) dupCount.set(dupKey(l), (dupCount.get(dupKey(l)) || 0) + 1);
  const rows = lines.map((l) => {
    const found = idx.find(l.policy_number);
    const p = found.length ? found.slice().sort((a, b) => str(b.effective_date).localeCompare(str(a.effective_date)))[0] : null;
    const carrier = ((schedule.carrier_aliases || {})[l.carrier]) || l.carrier || (p && p.carrier) || '';
    const lineCode = lineOf(l.line || (p && p.line), schedule.line_aliases);
    const kind = l.tx === 'new' || l.tx === 'renewal' ? l.tx : (p && p.kind) || 'renewal';
    const premium = l.premium ?? ((l.tx === 'new' || l.tx === 'renewal') && p ? p.premium : null);
    const fromSchedule = expectedRate(schedule, carrier, lineCode, kind);
    const rate = fromSchedule ? fromSchedule.rate : p && p.commission_rate !== null ? p.commission_rate : null;
    const rateSource = fromSchedule ? fromSchedule.source : rate !== null ? 'rate booked on the policy in your agency system' : null;
    const expected = rate !== null && premium !== null ? commissionAt(premium, rate) : null;
    const paid = l.commission ?? 0;
    const diff = expected === null ? null : round2(paid - expected);
    let status; let detail;
    if (dupCount.get(dupKey(l)) > 1) { status = 'possible_duplicate'; detail = `The same ${l.tx} line for ${l.policy_number} (${paid}) appears ${dupCount.get(dupKey(l))} times.`; }
    else if (!p) { status = 'no_policy'; detail = `${l.policy_number} is not in your policy list.`; }
    else if (rate === null) { status = 'no_rate'; detail = `No expected rate for ${carrier || 'this carrier'} ${lineCode} ${kind} in the schedule, and none booked on the policy.`; }
    else if (premium === null) { status = 'not_checked'; detail = `No premium on the ${l.tx} line to apply ${rate}% to.`; }
    else if (diff < -tol) { status = 'underpaid'; detail = `Paid ${paid} on premium ${premium}; ${rate}% (${rateSource}) is ${expected}, so ${round2(-diff)} short${l.commission_rate !== null && l.commission_rate !== rate ? ` (the statement shows ${l.commission_rate}%)` : ''}.`; }
    else if (diff > tol) { status = 'overpaid'; detail = `Paid ${paid} on premium ${premium}; ${rate}% (${rateSource}) is ${expected}, so ${diff} more than expected.`; }
    else { status = 'ok'; detail = ''; }
    return {
      status, statement_id: str(l.statement_id), carrier, policy_number: l.policy_number, client: l.client || (p && p.client) || '', line: lineCode, transaction_type: l.tx,
      effective_date: str(l.effective_date), premium, expected_rate: rate, paid_rate: l.commission_rate, expected, paid, difference: diff, producer: (p && p.producer) || str(l.producer), detail, next_step: NEXT[status],
    };
  });
  const sorted = byPriority(rows, STATUSES).sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.policy_number.localeCompare(b.policy_number) || String(a.transaction_type).localeCompare(String(b.transaction_type)));
  const short = rows.filter((r) => r.status === 'underpaid');
  const over = rows.filter((r) => r.status === 'overpaid');
  const byCarrier = [...groupBy(rows, (r) => carrierKey(r.carrier) || '(none)').values()].map((g) => ({ carrier: g.map((r) => r.carrier).sort()[0] || '(none)', count: g.length, paid: sum(g, (r) => r.paid), expected: sum(g.filter((r) => r.expected !== null), (r) => r.expected), short: sum(g.filter((r) => r.status === 'underpaid'), (r) => -r.difference), over: sum(g.filter((r) => r.status === 'overpaid'), (r) => r.difference) })).sort((a, b) => b.short - a.short || a.carrier.localeCompare(b.carrier));
  return {
    lines: rows.length, paid: sum(rows, (r) => r.paid), expected: sum(rows.filter((r) => r.expected !== null), (r) => r.expected),
    underpaid: short.length, short_total: sum(short, (r) => -r.difference), overpaid: over.length, over_total: sum(over, (r) => r.difference),
    tolerance: tol, by_status: countBy(rows, STATUSES), by_carrier: byCarrier, rows: sorted,
  };
}

export const summaryLine = (o) => `${o.lines} statement line(s), ${o.paid} paid against ${o.expected} expected: ${o.underpaid} underpaid by ${o.short_total}, ${o.overpaid} overpaid by ${o.over_total}; ${o.by_status.possible_duplicate || 0} possible duplicate(s), ${o.by_status.no_policy || 0} not in your policy list, ${o.by_status.no_rate || 0} with no expected rate.`;

/** Text of a commission inquiry to one carrier, listing its underpaid lines. */
export function inquiryText(items, a) {
  const total = sum(items, (r) => -r.difference);
  const lines = items.map((r) => `| ${r.policy_number} | ${r.client} | ${r.transaction_type} | ${r.effective_date || '[CHECK date]'} | ${r.premium} | ${r.expected_rate}% | ${r.expected} | ${r.paid} | ${round2(-r.difference)} |`);
  const text = `**To:** ${a.contact || '[TO CONFIRM carrier accounting contact]'}\n**From:** ${a.from || '[TO CONFIRM your name and agency]'}\n**Re:** Commission inquiry, ${items[0].carrier}${items[0].statement_id ? `, statement ${items[0].statement_id}` : ''}\n\nHello,\n\nOn the statement lines below the commission paid is lower than the rate in our agency agreement on the premium shown. Could you confirm the rate applied, and pay the difference or tell us why it differs?\n\n| Policy | Insured | Transaction | Effective | Premium | Agreed rate | Expected | Paid | Short |\n|---|---|---|---|---|---|---|---|---|\n${lines.join('\n')}\n\nTotal short: ${total}.\n\n[CHECK the agreed rates against your current agency agreement before sending.]\n\nThank you,\n${a.from || '[TO CONFIRM your name]'}\n`;
  return { text, total };
}

