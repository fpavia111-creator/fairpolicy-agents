// Missing commissions: policies written or renewed that never reached a commission statement.
import { str, num, round2, sum, policyIndex, normPolicy, normStatementLine, commissionAt, daysBetween, addDays, countBy, groupBy, carrierKey } from 'fairpolicy-core';

export const STATUSES = ['missing', 'partial', 'not_yet_due', 'agency_bill', 'cancelled_flat', 'received'];
const NEXT = {
  missing: 'Ask the carrier for the commission, or check whether the policy was coded to another agency or producer code.',
  partial: 'The term\'s new or renewal commission is not on any statement; ask the carrier for it.',
  not_yet_due: 'Wait for the next statement cycle.',
  agency_bill: 'Agency bill: commission is kept when the premium is paid, not on carrier statements.',
  cancelled_flat: 'Flat cancelled: no commission expected.',
  received: '',
};

export function findMissing(policyRows, statementRows, { asOf, graceDays = 45, lookbackDays = 365, lineAliases = {} } = {}) {
  const lines = statementRows.map(normStatementLine).filter((l) => l.policy_key);
  const idx = policyIndex(lines);
  const since = addDays(asOf, -lookbackDays);
  let outside = 0;
  const rows = [];
  for (const raw of policyRows) {
    const p = normPolicy(raw, { lineAliases });
    if (!p.policy_key) continue;
    const eff = str(p.effective_date);
    if (!eff || eff < since || eff > asOf) { outside++; continue; }
    const got = idx.find(p.policy_number);
    const termLines = got.filter((l) => l.tx === 'new' || l.tx === 'renewal');
    const received = sum(got, (l) => l.commission);
    const expected = p.premium !== null && p.commission_rate !== null ? commissionAt(p.premium, p.commission_rate) : null;
    const age = daysBetween(eff, asOf);
    const flat = p.status_code === 'cancelled' && str(raw.cancel_date) && str(raw.cancel_date) <= eff;
    let status;
    if (flat) status = 'cancelled_flat';
    else if (p.bill === 'agency') status = 'agency_bill';
    else if (termLines.length) status = 'received';
    else if (got.length) status = 'partial';
    else if (age <= graceDays) status = 'not_yet_due';
    else status = 'missing';
    const detail = status === 'missing' ? `Effective ${eff} (${age} days ago); no commission on any statement given.${expected === null ? ' No premium or rate on the policy to estimate it.' : ` About ${expected} expected.`}`
      : status === 'partial' ? `Only ${got.map((l) => l.tx).sort().join(', ')} line(s) (${received}) on the statements; no ${p.kind || 'new or renewal'} commission for the term.`
      : status === 'not_yet_due' ? `Effective ${age} days ago; inside the ${graceDays}-day wait.` : status === 'received' ? `${termLines.length} term line(s), ${received} received.` : '';
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, effective_date: eff, premium: p.premium, commission_rate: p.commission_rate, expected, received, days_since_effective: age, producer: p.producer, detail, next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.policy_number.localeCompare(b.policy_number));
  const open = rows.filter((r) => r.status === 'missing' || r.status === 'partial');
  const roll = (key) => [...groupBy(open, (r) => (key === 'carrier' ? carrierKey(r.carrier) : r[key]) || '(none)').values()].map((g) => ({ [key]: g.map((r) => r[key]).sort()[0] || '(none)', count: g.length, expected: sum(g.filter((r) => r.expected !== null), (r) => r.expected) })).sort((a, b) => b.expected - a.expected || String(a[key]).localeCompare(String(b[key])));
  return {
    as_of: asOf, grace_days: graceDays, window_from: since, policies: rows.length, outside_window: outside,
    missing: rows.filter((r) => r.status === 'missing').length, partial: rows.filter((r) => r.status === 'partial').length,
    expected_missing: sum(open.filter((r) => r.expected !== null), (r) => r.expected), no_estimate: open.filter((r) => r.expected === null).length,
    by_status: countBy(rows, STATUSES), by_carrier: roll('carrier'), by_producer: roll('producer'), rows,
  };
}

export const summaryLine = (o) => `${o.policies} policy(ies) effective ${o.window_from} to ${o.as_of}: ${o.missing} with no commission on any statement and ${o.partial} paid only on endorsements, about ${o.expected_missing} expected${o.no_estimate ? ` (${o.no_estimate} with no premium or rate to estimate)` : ''}; ${o.by_status.not_yet_due || 0} still inside the ${o.grace_days}-day wait.`;

export function requestText(items, a) {
  const rows = items.map((r) => `| ${r.policy_number} | ${r.client} | ${r.line} | ${r.effective_date} | ${r.premium ?? '[CHECK premium]'} | ${r.expected ?? '[CHECK rate]'} |`);
  const total = sum(items.filter((r) => r.expected !== null), (r) => r.expected);
  return { total, text: `**To:** ${a.contact || '[TO CONFIRM carrier commission contact]'}\n**From:** ${a.from || '[TO CONFIRM your name and agency]'}\n**Re:** Commission not received, ${items[0].carrier}\n\nHello,\n\nWe have not found commission for the policies below on any statement we have received. Could you check that they are coded to our agency and producer code, and pay or tell us when they will appear?\n\n| Policy | Insured | Line | Effective | Premium | Commission we expected |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\nTotal expected: ${total}.\n\nThank you,\n${a.from || '[TO CONFIRM your name]'}\n` };
}
