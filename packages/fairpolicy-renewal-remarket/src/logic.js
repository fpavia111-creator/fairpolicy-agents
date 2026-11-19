// Renewals coming due: which have no renewal review logged, and which go up in price with no remarket.
import { str, num, sum, pct, normPolicy, policyIndex, clientKey, daysBetween, addDays, countBy, groupBy, normalizeName } from 'fairpolicy-core';

export const STATUSES = ['urgent_no_review', 'increase_not_remarketed', 'no_review', 'reviewed'];
const NEXT = {
  urgent_no_review: 'Expires soon with no renewal review logged: an account manager reviews it this week.',
  increase_not_remarketed: 'The renewal premium is up and no remarket is logged: the account manager decides whether to shop it and records the decision.',
  no_review: 'Schedule the renewal review.',
  reviewed: '',
};
export const REVIEW_WORDS = ['renewal review', 'review', 'remarket', 're-market', 'quote', 'marketing', 'submission', 'renewal meeting', 'renewal call'];
export const REMARKET_WORDS = ['remarket', 're-market', 'quote', 'quotes', 'marketing', 'submission', 'shopped'];
const has = (text, words) => { const t = ` ${normalizeName(text)} `; return words.some((w) => { const k = normalizeName(w); return k && t.includes(` ${k} `); }); };

export function checkRenewals(policyRows, activityRows, { asOf, windowDays = 120, urgentDays = 45, increasePct = 10, lookbackDays = 150, reviewWords = REVIEW_WORDS, remarketWords = REMARKET_WORDS } = {}) {
  const acts = activityRows.map((r) => ({ policy_number: str(r.policy_number), client: str(r.client), date: str(r.date), text: `${str(r.type)} ${str(r.description)}` })).filter((x) => x.date && x.date <= asOf);
  const aIdx = policyIndex(acts.filter((x) => x.policy_number));
  const byClient = groupBy(acts.filter((x) => !x.policy_number && x.client), (x) => clientKey(x.client));
  const until = addDays(asOf, windowDays);
  const rows = [];
  for (const raw of policyRows) {
    const p = normPolicy(raw);
    const exp = str(p.expiration_date);
    if (!p.policy_key || !exp || exp < asOf || exp > until) continue;
    if (['cancelled', 'non_renewed', 'expired', 'lapsed'].includes(p.status_code)) continue;
    const from = addDays(exp, -lookbackDays);
    const mine = [...aIdx.find(p.policy_number), ...(byClient.get(clientKey(p.client)) || [])].filter((x) => x.date >= from);
    const remarketed = mine.some((x) => has(x.text, remarketWords));
    const reviewed = remarketed || mine.some((x) => has(x.text, reviewWords));
    const renewal = num(raw.renewal_premium);
    const change = renewal !== null && p.premium ? pct(renewal - p.premium, p.premium) : null;
    const days = daysBetween(asOf, exp);
    let status;
    if (change !== null && change >= increasePct && !remarketed) status = 'increase_not_remarketed';
    else if (!reviewed && days <= urgentDays) status = 'urgent_no_review';
    else if (!reviewed) status = 'no_review';
    else status = 'reviewed';
    const last = mine.map((x) => x.date).sort().at(-1) || '';
    const detail = [`Expires ${exp} (${days} days).`, change !== null ? `Renewal premium ${renewal} (${change >= 0 ? '+' : ''}${change}%).` : '', last ? `Last renewal activity ${last}.` : 'No renewal activity logged.', status === 'increase_not_remarketed' && reviewed ? 'Reviewed, but no remarket logged.' : ''].filter(Boolean).join(' ');
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, expiration_date: exp, days_left: days, premium: p.premium, renewal_premium: renewal, change_pct: change, last_activity: last, producer: p.producer, csr: p.csr, detail, next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.days_left - b.days_left || a.policy_number.localeCompare(b.policy_number));
  const open = rows.filter((r) => r.status !== 'reviewed');
  const byCsr = [...groupBy(open, (r) => r.csr || '(none)').values()].map((g) => ({ csr: g[0].csr || '(none)', count: g.length, premium: sum(g, (r) => r.premium ?? 0) })).sort((a, b) => b.count - a.count || a.csr.localeCompare(b.csr));
  return { as_of: asOf, window_days: windowDays, expiring: rows.length, premium_expiring: sum(rows, (r) => r.premium ?? 0), needing_attention: open.length, premium_needing_attention: sum(open, (r) => r.premium ?? 0), by_status: countBy(rows, STATUSES), by_csr: byCsr, rows };
}

export const summaryLine = (o) => `${o.expiring} policy(ies) renew in the next ${o.window_days} days (${o.premium_expiring} premium): ${o.by_status.urgent_no_review || 0} expire soon with no review, ${o.by_status.increase_not_remarketed || 0} go up with no remarket, ${o.by_status.no_review || 0} have no review yet; ${o.by_status.reviewed || 0} reviewed.`;
