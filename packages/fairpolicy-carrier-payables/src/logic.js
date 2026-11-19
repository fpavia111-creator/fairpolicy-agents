// Carrier payables: the carrier's agency-bill account current against the payables in your agency system.
import { str, num, round2, sum, policyKey, policyBase, transactionOf, countBy, carrierKey } from 'fairpolicy-core';

export const STATUSES = ['amount_differs', 'not_in_agency_system', 'not_on_carrier_statement', 'past_due', 'ok'];
const NEXT = {
  amount_differs: 'The net due differs from your agency system: check the premium and commission rate with the carrier before paying.',
  not_in_agency_system: 'The carrier bills an item your agency system does not have: find the endorsement or audit, or dispute it.',
  not_on_carrier_statement: 'Your agency system owes the carrier an item the carrier has not billed yet: hold it, or ask the carrier.',
  past_due: 'Due to the carrier and past the statement due date.',
  ok: '',
};
const pk = (v) => { const b = policyBase(v); return b.length >= 5 ? b : policyKey(v); };
const keyOf = (r) => `${pk(r.policy_number)}|${transactionOf(r.transaction_type)}`;
const norm = (r, side) => ({ side, policy_number: str(r.policy_number), client: str(r.client), carrier: str(r.carrier), tx: transactionOf(r.transaction_type), effective_date: str(r.effective_date), gross: num(r.gross_premium), commission: num(r.commission), net: num(r.net_due) ?? round2((num(r.gross_premium) ?? 0) - (num(r.commission) ?? 0)), due_date: str(r.due_date) });

export function reconcilePayables(carrierRows, agencyRows, { asOf, tolerance = 1 } = {}) {
  const group = (rows, side) => { const m = new Map(); for (const r of rows) { if (!str(r.policy_number)) continue; const k = keyOf(r); const x = norm(r, side); const e = m.get(k); if (e) { e.net = round2(e.net + x.net); e.gross = round2((e.gross ?? 0) + (x.gross ?? 0)); e.commission = round2((e.commission ?? 0) + (x.commission ?? 0)); if (x.due_date && (!e.due_date || x.due_date < e.due_date)) e.due_date = x.due_date; } else m.set(k, x); } return m; };
  const c = group(carrierRows, 'carrier'), a = group(agencyRows, 'agency');
  const rows = [];
  for (const k of new Set([...c.keys(), ...a.keys()])) {
    const x = c.get(k), y = a.get(k); const base = x || y;
    const diff = x && y ? round2(x.net - y.net) : null;
    const status = !y ? 'not_in_agency_system' : !x ? 'not_on_carrier_statement' : Math.abs(diff) > tolerance ? 'amount_differs' : x.due_date && x.due_date < asOf ? 'past_due' : 'ok';
    const detail = status === 'amount_differs' ? `Carrier net ${x.net} (premium ${x.gross}, commission ${x.commission}); your system ${y.net} (premium ${y.gross}, commission ${y.commission}).` : status === 'not_in_agency_system' ? `${x.net} billed by the carrier.` : status === 'not_on_carrier_statement' ? `${y.net} in your payables, not on the carrier statement.` : status === 'past_due' ? `${x.net} was due ${x.due_date}.` : '';
    rows.push({ status, policy_number: base.policy_number, client: (x && x.client) || (y && y.client) || '', carrier: (x && x.carrier) || (y && y.carrier) || '', transaction_type: base.tx, effective_date: base.effective_date, carrier_net: x ? x.net : null, agency_net: y ? y.net : null, difference: diff, due_date: x ? x.due_date : '', detail, next_step: NEXT[status] });
  }
  rows.sort((p, q) => STATUSES.indexOf(p.status) - STATUSES.indexOf(q.status) || p.policy_number.localeCompare(q.policy_number) || p.transaction_type.localeCompare(q.transaction_type));
  return {
    as_of: asOf, lines: rows.length, carrier_total: sum(rows, (r) => r.carrier_net ?? 0), agency_total: sum(rows, (r) => r.agency_net ?? 0),
    differences: sum(rows.filter((r) => r.status === 'amount_differs'), (r) => r.difference), past_due_total: sum(rows.filter((r) => r.status === 'past_due'), (r) => r.carrier_net),
    carriers: [...new Set(rows.map((r) => carrierKey(r.carrier)).filter(Boolean))].length, by_status: countBy(rows, STATUSES), rows,
  };
}

export const summaryLine = (o) => `${o.lines} item(s): the carriers bill ${o.carrier_total}, your agency system shows ${o.agency_total}. ${o.by_status.amount_differs || 0} differ (net ${o.differences}), ${o.by_status.not_in_agency_system || 0} billed but not in your system, ${o.by_status.not_on_carrier_statement || 0} in your system but not billed, ${o.by_status.past_due || 0} past due (${o.past_due_total}).`;

export function noteText(items, a) {
  const rows = items.map((r) => `| ${r.policy_number} | ${r.client} | ${r.transaction_type} | ${r.carrier_net ?? ''} | ${r.agency_net ?? ''} | ${r.status === 'amount_differs' ? r.difference : 'not in our records'} |`);
  return { text: `**To:** ${a.contact || '[TO CONFIRM carrier agency-bill accounting contact]'}\n**From:** ${a.from || '[TO CONFIRM your name and agency]'}\n**Re:** Account current reconciliation, ${items[0].carrier}\n\nHello,\n\nBefore we pay this statement, could you check the items below against our records?\n\n| Policy | Insured | Transaction | Your net | Our net | Difference |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\n[CHECK the commission rates against the agency agreement.]\n\nThank you,\n${a.from || '[TO CONFIRM your name]'}\n` };
}
