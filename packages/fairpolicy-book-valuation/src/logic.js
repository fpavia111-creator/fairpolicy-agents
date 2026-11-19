// Book of business summary: the figures a valuation conversation starts from, with concentration and data gaps flagged.
import { str, num, round2, sum, pct, normPolicy, clientKey, commissionAt, carrierKey, groupBy, countBy } from 'fairpolicy-core';

export const STATUSES = ['watch', 'info', 'ok'];

export function summarizeBook(policyRows, settings = {}) {
  const lim = { carrier: num(settings.top_carrier_limit_pct) ?? 40, client: num(settings.largest_client_limit_pct) ?? 10, top10: num(settings.top_10_limit_pct) ?? 25, missing: num(settings.missing_commission_limit_pct) ?? 5 };
  const pols = policyRows.map((r) => normPolicy(r)).filter((p) => p.policy_key && !['cancelled', 'expired', 'non_renewed', 'lapsed'].includes(p.status_code));
  for (const p of pols) p.revenue = p.commission ?? (p.premium !== null && p.commission_rate !== null ? commissionAt(p.premium, p.commission_rate) : null);
  const revenue = sum(pols, (p) => p.revenue ?? 0), premium = sum(pols, (p) => p.premium ?? 0);
  const roll = (key, f) => [...groupBy(pols, f).values()].map((g) => ({ [key]: g.map((p) => p[key]).sort()[0] || '(none)', policies: g.length, premium: sum(g, (p) => p.premium ?? 0), revenue: sum(g, (p) => p.revenue ?? 0), revenue_share_pct: pct(sum(g, (p) => p.revenue ?? 0), revenue) })).sort((a, b) => b.revenue - a.revenue || String(a[key]).localeCompare(String(b[key])));
  const byCarrier = roll('carrier', (p) => carrierKey(p.carrier));
  const byLine = roll('line_code', (p) => p.line_code).map(({ line_code, ...r }) => ({ line: line_code, ...r }));
  const byClient = roll('client', (p) => clientKey(p.client) || p.client_id);
  const missing = pols.filter((p) => p.revenue === null).length;
  const personal = sum(pols.filter((p) => p.personal === true), (p) => p.revenue ?? 0);
  const m = (metric, value, status, detail) => ({ status, metric, value, detail });
  const rows = [
    m('annual_commission', revenue, 'ok', 'Commission on the policies in force (booked commission, or premium times the booked rate).'),
    m('written_premium', premium, 'ok', 'Premium on the policies in force.'),
    m('policies', pols.length, 'ok', 'Policies in force.'),
    m('accounts', byClient.length, 'ok', 'Clients with at least one policy in force.'),
    m('policies_per_account', byClient.length ? round2(pols.length / byClient.length) : 0, 'ok', 'Policies in force divided by accounts.'),
    m('avg_commission_per_account', byClient.length ? round2(revenue / byClient.length) : 0, 'ok', 'Commission divided by accounts.'),
    m('personal_lines_share_pct', pct(personal, revenue), 'ok', 'Share of commission from personal lines.'),
    m('top_carrier_share_pct', byCarrier[0] ? byCarrier[0].revenue_share_pct : 0, byCarrier[0] && byCarrier[0].revenue_share_pct > lim.carrier ? 'watch' : 'ok', `Largest carrier: ${byCarrier[0] ? byCarrier[0].carrier : '-'} (limit ${lim.carrier}%).`),
    m('largest_client_share_pct', byClient[0] ? byClient[0].revenue_share_pct : 0, byClient[0] && byClient[0].revenue_share_pct > lim.client ? 'watch' : 'ok', `One client's share of commission (limit ${lim.client}%).`),
    m('top_10_clients_share_pct', pct(sum(byClient.slice(0, 10), (c) => c.revenue), revenue), pct(sum(byClient.slice(0, 10), (c) => c.revenue), revenue) > lim.top10 ? 'watch' : 'ok', `Share of commission from the ten largest clients (limit ${lim.top10}%).`),
    m('missing_commission_pct', pct(missing, pols.length), pct(missing, pols.length) > lim.missing ? 'watch' : 'ok', `${missing} policy(ies) with no commission and no rate: the revenue above leaves them out (limit ${lim.missing}%).`),
  ];
  const lo = num(settings.revenue_multiple_low), hi = num(settings.revenue_multiple_high);
  if (lo !== null && hi !== null) {
    rows.push(m('indicative_value_low', round2(revenue * lo), 'info', `Commission times ${lo}, the low multiple you set. Not an appraisal.`));
    rows.push(m('indicative_value_high', round2(revenue * hi), 'info', `Commission times ${hi}, the high multiple you set. Not an appraisal.`));
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
  return { revenue, premium, policies: pols.length, accounts: byClient.length, watch: rows.filter((r) => r.status === 'watch').length, by_status: countBy(rows, STATUSES), by_carrier: byCarrier, by_line: byLine, top_clients: byClient.slice(0, 10), rows };
}

export const summaryLine = (o) => `${o.policies} policies in force for ${o.accounts} account(s): ${o.revenue} annual commission on ${o.premium} premium; ${o.watch} figure(s) to watch (concentration or missing data). A summary of your files for a valuation conversation, not an appraisal.`;
