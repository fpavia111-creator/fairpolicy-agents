// Agency-bill receivables aging: what clients owe the agency, how late, and where the agency has already paid the carrier.
import { str, num, round2, sum, daysBetween, countBy, groupBy, clientKey } from 'fairpolicy-core';

export const STATUSES = ['fronted_premium', 'over_90', 'credit_balance', 'over_60', 'over_30', 'current', 'not_due'];
const NEXT = {
  fronted_premium: 'The agency has already paid the carrier and the client has not paid it: call the client this week.',
  over_90: 'Very late: review with the producer; a carrier notice of cancellation may follow if the premium is not paid.',
  credit_balance: 'The agency owes the client money (return premium or overpayment): refund or apply it.',
  over_60: 'Second reminder and a call from the account manager.',
  over_30: 'Send a reminder.',
  current: '', not_due: '',
};
const yes = (v) => /^(y|yes|true|1|x)$/i.test(str(v));

export function ageReceivables(rows, { asOf, frontedDays = 30 } = {}) {
  const items = rows.map((r) => ({ client: str(r.client), client_id: str(r.client_id), invoice: str(r.invoice), policy_number: str(r.policy_number), carrier: str(r.carrier), due_date: str(r.due_date), amount: num(r.amount), balance: num(r.balance) ?? num(r.amount), producer: str(r.producer), csr: str(r.csr), remitted: yes(r.remitted) }))
    .filter((r) => (r.invoice || r.policy_number) && r.balance !== null && Math.abs(r.balance) >= 0.005);
  const out = items.map((r) => {
    const late = r.due_date ? daysBetween(r.due_date, asOf) : null;
    const status = r.balance < 0 ? 'credit_balance' : r.remitted && late !== null && late > frontedDays ? 'fronted_premium' : late === null || late <= 0 ? 'not_due' : late > 90 ? 'over_90' : late > 60 ? 'over_60' : late > 30 ? 'over_30' : 'current';
    const detail = status === 'credit_balance' ? `${-r.balance} owed to the client.` : late > 0 ? `${r.balance} open, ${late} days past due${r.remitted ? '; the agency already paid the carrier' : ''}.` : `${r.balance} due ${r.due_date || '(no due date)'}.`;
    return { status, invoice: r.invoice, policy_number: r.policy_number, client: r.client, client_id: r.client_id, carrier: r.carrier, due_date: r.due_date, days_past_due: late !== null && late > 0 ? late : 0, balance: r.balance, remitted: r.remitted, producer: r.producer, csr: r.csr, detail, next_step: NEXT[status] };
  });
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || b.days_past_due - a.days_past_due || a.invoice.localeCompare(b.invoice));
  const open = out.filter((r) => r.balance > 0);
  const byClient = [...groupBy(open, (r) => clientKey(r.client) || r.client_id).values()].map((g) => ({ client: g[0].client, invoices: g.length, balance: sum(g, (r) => r.balance), past_due_30: sum(g.filter((r) => r.days_past_due > 30), (r) => r.balance), oldest_days: Math.max(...g.map((r) => r.days_past_due)) })).sort((a, b) => b.past_due_30 - a.past_due_30 || b.balance - a.balance || String(a.client).localeCompare(String(b.client)));
  const byProducer = [...groupBy(open, (r) => r.producer || '(none)').values()].map((g) => ({ producer: g[0].producer || '(none)', invoices: g.length, balance: sum(g, (r) => r.balance), past_due_30: sum(g.filter((r) => r.days_past_due > 30), (r) => r.balance) })).sort((a, b) => b.past_due_30 - a.past_due_30 || a.producer.localeCompare(b.producer));
  const bucket = (lo, hi) => sum(open.filter((r) => r.days_past_due > lo && r.days_past_due <= hi), (r) => r.balance);
  return {
    as_of: asOf, invoices: out.length, open_balance: sum(open, (r) => r.balance), credit_balances: sum(out.filter((r) => r.balance < 0), (r) => -r.balance),
    not_due: sum(open.filter((r) => r.days_past_due === 0), (r) => r.balance), days_1_30: bucket(0, 30), days_31_60: bucket(30, 60), days_61_90: bucket(60, 90), days_over_90: bucket(90, 1e9),
    fronted: sum(out.filter((r) => r.status === 'fronted_premium'), (r) => r.balance), by_status: countBy(out, STATUSES), by_client: byClient, by_producer: byProducer, rows: out,
  };
}

export const summaryLine = (o) => `${o.invoices} open item(s) as of ${o.as_of}: ${o.open_balance} owed by clients (${o.not_due} not due, ${o.days_1_30} 1-30 days, ${o.days_31_60} 31-60, ${o.days_61_90} 61-90, ${o.days_over_90} over 90); ${o.fronted} already paid to carriers and not collected; ${o.credit_balances} in credit balances owed to clients.`;

export function reminderText(items, a) {
  const total = sum(items, (r) => r.balance);
  const rows = items.map((r) => `| ${r.invoice} | ${r.policy_number} | ${r.due_date} | ${r.balance} |`);
  return { total, text: `**To:** ${a.to || items[0].client}\n**From:** ${a.from || '[TO CONFIRM your name and agency]'}\n**Re:** Premium balance due\n\nDear ${items[0].client},\n\nOur records show the following premium balance on your account. If you have already paid, thank you, and please let us know the date so we can match it.\n\n| Invoice | Policy | Due | Balance |\n|---|---|---|---|\n${rows.join('\n')}\n\nTotal due: ${total}.\n\nIf a payment is not received, the insurance company may send a notice about the policy. Please call us at [TO CONFIRM agency phone] with any questions.\n\nThank you,\n${a.from || '[TO CONFIRM your name]'}\n` };
}
