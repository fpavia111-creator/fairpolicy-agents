// Cross-sell gaps: accounts with one line, and the line combinations your agency asked to look for.
import { str, sum, normPolicy, clientKey, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['monoline', 'gaps', 'rounded'];
export const DEFAULT_RULES = Object.freeze([
  { name: 'auto_without_home', label: 'Personal auto with no home, condo, renters or dwelling policy here', has_all: ['pauto'], missing_all: ['home', 'condo', 'renters', 'dwelling'] },
  { name: 'home_without_auto', label: 'Home or condo with no personal auto policy here', has_any: ['home', 'condo'], missing_all: ['pauto'] },
  { name: 'no_personal_umbrella', label: 'Auto and home here, no personal umbrella', has_all: ['pauto'], has_any: ['home', 'condo'], missing_all: ['pumbr', 'umbrella'] },
  { name: 'gl_without_wc', label: 'General liability or BOP with no workers compensation here', has_any: ['cgl', 'bop'], missing_all: ['wc'] },
  { name: 'no_commercial_umbrella', label: 'Commercial auto with no commercial umbrella or excess here', has_all: ['cauto'], missing_all: ['cumbr', 'umbrella'] },
]);
const NEXT = {
  monoline: 'One line with the agency: the account manager reviews the account at its next renewal and records what the client says.',
  gaps: 'A line your agency asked to look for is not written here: review at renewal. The client may have it elsewhere or not need it.',
  rounded: '',
};
const hits = (rule, set) => (!rule.has_all || rule.has_all.every((c) => set.has(c))) && (!rule.has_any || rule.has_any.some((c) => set.has(c))) && (!rule.missing_all || rule.missing_all.every((c) => !set.has(c)));

export function findGaps(policyRows, { rules = DEFAULT_RULES, lineAliases = {} } = {}) {
  const active = policyRows.map((r) => normPolicy(r, { lineAliases })).filter((p) => p.policy_key && !['cancelled', 'expired', 'non_renewed', 'lapsed'].includes(p.status_code));
  const rows = [];
  for (const g of groupBy(active, (p) => clientKey(p.client) || p.client_id || p.policy_key).values()) {
    const lines = new Set(g.map((p) => p.line_code));
    const found = rules.filter((r) => hits(r, lines));
    const status = lines.size === 1 ? 'monoline' : found.length ? 'gaps' : 'rounded';
    const names = g.map((p) => p.client).sort();
    rows.push({ status, client: names[0], client_id: g.map((p) => p.client_id).filter(Boolean).sort()[0] || '', lines: [...lines].sort().join(', '), policies: g.length, premium: sum(g, (p) => p.premium ?? 0), gaps: found.map((r) => r.name).join(', '), producer: g.map((p) => p.producer).filter(Boolean).sort()[0] || '', csr: g.map((p) => p.csr).filter(Boolean).sort()[0] || '', next_renewal: g.map((p) => str(p.expiration_date)).filter(Boolean).sort()[0] || '', detail: found.map((r) => r.label).join('; '), next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || String(a.next_renewal).localeCompare(String(b.next_renewal)) || String(a.client).localeCompare(String(b.client)));
  const byRule = rules.map((r) => ({ rule: r.name, label: r.label, count: rows.filter((x) => x.gaps.split(', ').includes(r.name)).length })).filter((r) => r.count);
  const byProducer = [...groupBy(rows, (r) => r.producer || '(none)').values()].map((g) => ({ producer: g[0].producer || '(none)', accounts: g.length, monoline: g.filter((r) => r.status === 'monoline').length, with_gaps: g.filter((r) => r.status === 'gaps').length })).sort((a, b) => b.monoline + b.with_gaps - (a.monoline + a.with_gaps) || a.producer.localeCompare(b.producer));
  return { accounts: rows.length, policies: active.length, monoline: rows.filter((r) => r.status === 'monoline').length, policies_per_account: rows.length ? Math.round((active.length / rows.length) * 100) / 100 : 0, by_status: countBy(rows, STATUSES), by_rule: byRule, by_producer: byProducer, rows };
}

export const summaryLine = (o) => `${o.accounts} active account(s), ${o.policies_per_account} policies each on average: ${o.monoline} with one line, ${o.by_status.gaps || 0} with a line your agency looks for not written here, ${o.by_status.rounded || 0} rounded. A review list for licensed staff, not a recommendation to any client.`;
