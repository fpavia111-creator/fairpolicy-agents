// Loss run summary: by account and policy year, claims, incurred, loss ratio, large losses and frequency.
import { str, num, round2, sum, pct, clientKey, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['high_loss_ratio', 'large_loss', 'frequency', 'normal', 'clean'];
const NEXT = {
  high_loss_ratio: 'Losses are high against premium: prepare the renewal early and gather what the client has done since the losses.',
  large_loss: 'A large loss is on the record: gather its status and what changed since.',
  frequency: 'Several claims in one year: ask the client what is behind them.',
  normal: '', clean: '',
};
const yearOf = (r) => num(r.policy_year) ?? (str(r.loss_date).slice(0, 4) ? num(str(r.loss_date).slice(0, 4)) : null);

export function summarizeLosses(claimRows, premiumRows = [], { years = 5, toYear = null, lrLimit = 70, largeLoss = 25000, frequency = 3 } = {}) {
  const claims = claimRows.map((r) => ({ client: str(r.client), year: yearOf(r), claim_number: str(r.claim_number), line: str(r.line), carrier: str(r.carrier), open: !/closed|settled|denied/i.test(str(r.status)), incurred: round2((num(r.paid) ?? 0) + (num(r.reserve) ?? 0)), paid: num(r.paid) ?? 0, reserve: num(r.reserve) ?? 0 })).filter((c) => c.client && c.year !== null);
  const prem = premiumRows.map((r) => ({ client: str(r.client), year: num(r.policy_year), premium: num(r.premium) ?? 0 })).filter((p) => p.client && p.year !== null);
  const last = toYear ?? Math.max(0, ...claims.map((c) => c.year), ...prem.map((p) => p.year));
  const first = last - years + 1;
  const inW = (y) => y >= first && y <= last;
  const cBy = groupBy(claims.filter((c) => inW(c.year)), (c) => clientKey(c.client));
  const pBy = groupBy(prem.filter((p) => inW(p.year)), (p) => clientKey(p.client));
  const rows = [];
  for (const k of new Set([...cBy.keys(), ...pBy.keys()])) {
    const cs = cBy.get(k) || [], ps = pBy.get(k) || [];
    const name = [...cs, ...ps].map((x) => x.client).sort()[0];
    const incurred = sum(cs, (c) => c.incurred), premium = sum(ps, (p) => p.premium);
    const lr = premium ? pct(incurred, premium) : null;
    const big = cs.filter((c) => c.incurred >= largeLoss).sort((a, b) => b.incurred - a.incurred);
    const perYear = [...groupBy(cs, (c) => c.year).entries()].map(([year, g]) => ({ year, claims: g.length, incurred: sum(g, (c) => c.incurred) })).sort((a, b) => a.year - b.year);
    const busiest = perYear.reduce((m, y) => Math.max(m, y.claims), 0);
    const status = !cs.length ? 'clean' : lr !== null && lr >= lrLimit ? 'high_loss_ratio' : big.length ? 'large_loss' : busiest >= frequency ? 'frequency' : 'normal';
    const detail = [cs.length ? `${cs.length} claim(s), ${incurred} incurred (${sum(cs, (c) => c.paid)} paid, ${sum(cs, (c) => c.reserve)} reserved)` : 'No claims', premium ? `on ${premium} premium: loss ratio ${lr}%` : 'no premium in the file', big.length ? `largest ${big[0].incurred} (${big[0].claim_number}, ${big[0].year})` : '', busiest >= frequency ? `${busiest} claims in one year` : ''].filter(Boolean).join('; ') + '.';
    rows.push({ status, client: name, years: `${first}-${last}`, claims: cs.length, open_claims: cs.filter((c) => c.open).length, paid: sum(cs, (c) => c.paid), reserve: sum(cs, (c) => c.reserve), incurred, premium, loss_ratio: lr, large_losses: big.length, largest_loss: big[0] ? big[0].incurred : 0, most_claims_in_a_year: busiest, by_year: perYear.map((y) => `${y.year}: ${y.claims}/${y.incurred}`).join('; '), detail, next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || b.incurred - a.incurred || String(a.client).localeCompare(String(b.client)));
  return { years: `${first}-${last}`, accounts: rows.length, claims: sum(rows, (r) => r.claims), incurred: sum(rows, (r) => r.incurred), premium: sum(rows, (r) => r.premium), loss_ratio: pct(sum(rows, (r) => r.incurred), sum(rows, (r) => r.premium)), by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.accounts} account(s), policy years ${o.years}: ${o.claims} claim(s), ${o.incurred} incurred on ${o.premium} premium (${o.loss_ratio}%). ${o.by_status.high_loss_ratio || 0} with a high loss ratio, ${o.by_status.large_loss || 0} with a large loss, ${o.by_status.frequency || 0} with several claims in a year, ${o.by_status.clean || 0} claim-free.`;
