// Retention: of the policy terms that came up for renewal (or were cancelled) in the period, how many stayed, by producer.
import { str, sum, pct, normPolicy, clientKey, daysBetween, addDays, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['below_target', 'too_few', 'at_target'];
const NEXT = {
  below_target: 'Retention is under the agency target: review the lost policies and their reasons with the producer.',
  too_few: 'Too few renewals in the period to judge; read with care.',
  at_target: '',
};

/** Every term that came due in the period, renewed or lost. */
export function dueTerms(policyRows, { from, to, matchDays = 45 } = {}) {
  const pols = policyRows.map((r) => normPolicy(r)).filter((p) => p.policy_key);
  const byKey = groupBy(pols, (p) => p.policy_key);
  const byClientLine = groupBy(pols, (p) => `${clientKey(p.client)}|${p.line_code}`);
  const out = [];
  for (const p of pols) {
    const exp = str(p.expiration_date); const cd = p.status_code === 'cancelled' ? str(p.cancel_date) : '';
    const end = cd && cd < exp ? cd : exp;
    if (!end || end < from || end > to) continue;
    const later = (o) => o !== p && o.status_code !== 'pending' && str(o.effective_date) > str(p.effective_date) && Math.abs(daysBetween(exp, o.effective_date) ?? 9999) <= matchDays;
    const next = !cd ? (byKey.get(p.policy_key) || []).find(later) || (byClientLine.get(`${clientKey(p.client)}|${p.line_code}`) || []).find(later) : null;
    out.push({ policy_number: p.policy_number, client: p.client, producer: p.producer || '(none)', line: p.line_code, carrier: p.carrier, end_date: end, premium: p.premium ?? 0, renewed: !!next, renewed_as: next ? next.policy_number : '', lost_reason: next ? '' : str(p.cancel_reason) || (p.status_code === 'unknown' ? 'expired, no renewal term' : p.status_code.replace('_', '-')) });
  }
  return out;
}

const rate = (g) => ({ due: g.length, renewed: g.filter((t) => t.renewed).length, retention_pct: pct(g.filter((t) => t.renewed).length, g.length), premium_due: sum(g, (t) => t.premium), premium_renewed: sum(g.filter((t) => t.renewed), (t) => t.premium), premium_retention_pct: pct(sum(g.filter((t) => t.renewed), (t) => t.premium), sum(g, (t) => t.premium)) });

export function checkRetention(policyRows, { asOf, months = 12, target = 85, minTerms = 5, matchDays = 45 } = {}) {
  const from = addDays(asOf, -Math.round(months * 30.44)); const to = asOf;
  const terms = dueTerms(policyRows, { from, to, matchDays });
  const rows = [...groupBy(terms, (t) => t.producer).values()].map((g) => {
    const r = rate(g);
    const status = r.due < minTerms ? 'too_few' : r.retention_pct < target ? 'below_target' : 'at_target';
    const lost = g.filter((t) => !t.renewed);
    return { status, producer: g[0].producer, ...r, lost: lost.length, lost_policies: lost.map((t) => t.policy_number).sort().join(', '), detail: `${r.renewed} of ${r.due} renewed (${r.retention_pct}%); premium ${r.premium_retention_pct}%.${lost.length ? ` Lost: ${lost.map((t) => `${t.policy_number} (${t.lost_reason})`).sort().join('; ')}.` : ''}`, next_step: NEXT[status] };
  }).sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.retention_pct - b.retention_pct || a.producer.localeCompare(b.producer));
  const roll = (key) => [...groupBy(terms, (t) => t[key] || '(none)').values()].map((g) => ({ [key]: g[0][key] || '(none)', ...rate(g) })).sort((a, b) => a.retention_pct - b.retention_pct || String(a[key]).localeCompare(String(b[key])));
  const reasons = Object.entries(countBy(terms.filter((t) => !t.renewed), [], 'lost_reason')).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
  return { as_of: asOf, period_from: from, target_pct: target, ...rate(terms), producers: rows.length, by_status: countBy(rows, STATUSES), by_line: roll('line'), by_carrier: roll('carrier'), lost_reasons: reasons, rows };
}

export const summaryLine = (o) => `${o.renewed} of ${o.due} policy term(s) due since ${o.period_from} renewed: ${o.retention_pct}% by count, ${o.premium_retention_pct}% by premium (target ${o.target_pct}%). ${o.by_status.below_target || 0} producer(s) below target, ${o.by_status.too_few || 0} with too few renewals to judge.`;
