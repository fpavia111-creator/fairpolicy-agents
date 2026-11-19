// Premium trust account: is the balance enough for the premiums owed to carriers, and what left the account.
import { str, num, round2, sum, countBy, daysBetween, findCarrier, sameCarrier, normalizeName } from 'fairpolicy-core';

export const STATUSES = ['shortfall', 'unexpected_withdrawal', 'commission_overdraw', 'overdue_remittance', 'due_soon', 'not_due', 'remitted', 'covered'];
const NEXT = {
  shortfall: 'The account holds less than the premiums owed to carriers. Tell the agency principal today; how to restore it is a decision for them and their accountant.',
  unexpected_withdrawal: 'A payment out of the trust account that is not a carrier remittance, a client refund or a commission transfer. Find out what it was.',
  commission_overdraw: 'More commission was moved to operating than was earned on premiums collected.',
  overdue_remittance: 'Premium collected and past the carrier\'s due date; remit or ask the carrier for its statement.',
  due_soon: 'Due to the carrier within the next few days.',
  not_due: '', remitted: '', covered: '',
};
const has = (text, words) => { const t = normalizeName(text); return (words || []).some((w) => { const k = normalizeName(w); return k && (` ${t} `).includes(` ${k} `); }); };

export function reconcileTrust(payRows, bankRows, settings = {}, { asOf }) {
  const tol = num(settings.tolerance) ?? 1; const soon = num(settings.due_soon_days) ?? 7;
  const pays = payRows.map((r) => ({ carrier: str(r.carrier), policy_number: str(r.policy_number), client: str(r.client), invoice: str(r.invoice), gross: num(r.gross_premium), commission: num(r.commission) ?? 0, net: num(r.net_due) ?? round2((num(r.gross_premium) ?? 0) - (num(r.commission) ?? 0)), due: str(r.due_date), received: str(r.received_date) && str(r.received_date) <= asOf ? str(r.received_date) : '', paid: str(r.paid_date) && str(r.paid_date) <= asOf ? str(r.paid_date) : '' })).filter((p) => p.policy_number || p.invoice);
  const rows = [];
  for (const p of pays) {
    const late = p.due && p.due < asOf; const days = p.due ? daysBetween(asOf, p.due) : null;
    const status = p.paid ? 'remitted' : !p.received ? 'not_due' : late ? 'overdue_remittance' : days !== null && days <= soon ? 'due_soon' : 'not_due';
    rows.push({ status, ref: p.policy_number || p.invoice, carrier: p.carrier, client: p.client, date: p.due, amount: p.net, detail: status === 'overdue_remittance' ? `Collected ${p.received}; ${p.net} was due to ${p.carrier} on ${p.due} (${-days} days ago).` : status === 'due_soon' ? `${p.net} due to ${p.carrier} on ${p.due}.` : status === 'not_due' && !p.received ? 'Premium not collected yet.' : status === 'remitted' ? `Remitted ${p.paid}.` : '', next_step: NEXT[status] });
  }
  const carriers = [...new Set([...pays.map((p) => p.carrier), ...(settings.carrier_names || [])].filter(Boolean))].map((c) => ({ carrier: c }));
  const bank = bankRows.map((r) => ({ date: str(r.date), description: str(r.description), amount: num(r.amount), balance: num(r.balance) })).filter((b) => b.date && b.amount !== null).sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description) || a.amount - b.amount);
  let transferred = 0;
  for (const b of bank) {
    if (b.amount >= 0 || b.date > asOf) continue;
    if (has(b.description, settings.operating_words || ['operating', 'commission transfer', 'commission sweep'])) { transferred = round2(transferred - b.amount); continue; }
    if (has(b.description, settings.refund_words || ['refund', 'return premium'])) continue;
    if (has(b.description, settings.fee_words || [])) continue;
    if (findCarrier(carriers, b.description, (x) => [x.carrier]) || carriers.some((c) => normalizeName(b.description).includes(normalizeName(c.carrier)))) continue;
    rows.push({ status: 'unexpected_withdrawal', ref: `${b.date} ${b.description}`.slice(0, 80), carrier: '', client: '', date: b.date, amount: round2(-b.amount), detail: `${-b.amount} paid out on ${b.date}: "${b.description}" is not a carrier, a refund or a commission transfer.`, next_step: NEXT.unexpected_withdrawal });
  }
  const earned = sum(pays.filter((p) => p.received), (p) => p.commission);
  if (transferred > earned + tol) rows.push({ status: 'commission_overdraw', ref: 'commission-transfers', carrier: '', client: '', date: asOf, amount: round2(transferred - earned), detail: `${transferred} moved to operating; ${earned} commission earned on premiums collected.`, next_step: NEXT.commission_overdraw });
  const last = bank.filter((b) => b.date <= asOf).at(-1);
  const opening = num(settings.opening_balance);
  const balance = last && last.balance !== null ? last.balance : opening !== null ? round2(opening + sum(bank.filter((b) => b.date <= asOf), (b) => b.amount)) : null;
  const owed = sum(pays.filter((p) => p.received && !p.paid), (p) => p.net);
  const gap = balance === null ? null : round2(owed - balance);
  rows.push({ status: gap !== null && gap > tol ? 'shortfall' : 'covered', ref: 'balance', carrier: '', client: '', date: last ? last.date : asOf, amount: gap === null ? null : Math.max(gap, 0), detail: balance === null ? 'No balance column and no opening_balance setting: the balance could not be worked out.' : `Balance ${balance}; premiums collected and still owed to carriers ${owed}.`, next_step: gap !== null && gap > tol ? NEXT.shortfall : '' });
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || String(a.date).localeCompare(String(b.date)) || a.ref.localeCompare(b.ref));
  return { as_of: asOf, balance, owed_to_carriers: owed, shortfall: gap !== null && gap > tol ? gap : 0, commission_earned: earned, commission_transferred: transferred, unexpected_withdrawals: sum(rows.filter((r) => r.status === 'unexpected_withdrawal'), (r) => r.amount), overdue: sum(rows.filter((r) => r.status === 'overdue_remittance'), (r) => r.amount), by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `Trust balance ${o.balance ?? 'unknown'} as of ${o.as_of} against ${o.owed_to_carriers} owed to carriers: ${o.shortfall ? `SHORT by ${o.shortfall}` : 'covered'}. ${o.by_status.overdue_remittance || 0} remittance(s) overdue (${o.overdue}), ${o.by_status.unexpected_withdrawal || 0} unexpected withdrawal(s) (${o.unexpected_withdrawals}), commission moved ${o.commission_transferred} against ${o.commission_earned} earned.`;
export { sameCarrier };
