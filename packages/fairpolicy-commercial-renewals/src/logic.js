// Commercial renewal timelines: each renewal's milestones counted back from expiration, done or overdue.
import { str, normPolicy, policyIndex, addDays, daysBetween, countBy, normalizeName } from 'fairpolicy-core';

export const STATUSES = ['overdue', 'due_this_week', 'on_track', 'complete'];
export const DEFAULT_MILESTONES = Object.freeze([
  { name: 'loss_runs', label: 'Loss runs requested', days_before: 120 },
  { name: 'exposures', label: 'Updated exposures and applications received', days_before: 90 },
  { name: 'submissions', label: 'Submissions sent to markets', days_before: 75 },
  { name: 'quotes', label: 'Quotes received', days_before: 30 },
  { name: 'proposal', label: 'Proposal reviewed with the client', days_before: 21 },
  { name: 'bind_order', label: 'Client decision recorded', days_before: 7 },
]);
const NEXT = {
  overdue: 'One or more milestones are past due: the account manager updates the plan with the producer this week.',
  due_this_week: 'A milestone is due within days.',
  on_track: '', complete: '',
};
const key = (v) => normalizeName(v).replace(/ /g, '_');

export function checkTimelines(policyRows, doneRows, { asOf, milestones = DEFAULT_MILESTONES, windowDays = 150, soonDays = 7 } = {}) {
  const done = policyIndex(doneRows.map((r) => ({ policy_number: str(r.policy_number), milestone: key(r.milestone), date: str(r.completed_date) })).filter((r) => r.policy_number && r.milestone && r.date && r.date <= asOf));
  const until = addDays(asOf, windowDays);
  const rows = [];
  for (const p of policyRows.map((r) => normPolicy(r))) {
    const exp = str(p.expiration_date);
    if (!p.policy_key || p.personal !== false || !exp || exp < asOf || exp > until) continue;
    if (['cancelled', 'non_renewed', 'expired', 'lapsed'].includes(p.status_code)) continue;
    const got = new Set(done.find(p.policy_number).map((d) => d.milestone));
    const steps = milestones.map((m) => ({ ...m, due: addDays(exp, -m.days_before), done: got.has(key(m.name)) }));
    const overdue = steps.filter((s) => !s.done && s.due < asOf);
    const next = steps.filter((s) => !s.done && s.due >= asOf).sort((a, b) => a.due.localeCompare(b.due))[0] || null;
    const status = overdue.length ? 'overdue' : !next ? 'complete' : daysBetween(asOf, next.due) <= soonDays ? 'due_this_week' : 'on_track';
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, expiration_date: exp, days_left: daysBetween(asOf, exp), premium: p.premium, done: steps.filter((s) => s.done).length, of: steps.length, overdue: overdue.map((s) => s.name).join(', '), next_milestone: next ? next.name : '', next_due: next ? next.due : '', producer: p.producer, csr: p.csr, detail: overdue.length ? `Overdue: ${overdue.map((s) => `${s.label} (due ${s.due})`).join('; ')}.` : next ? `Next: ${next.label} by ${next.due}.` : 'Every milestone recorded.', next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.days_left - b.days_left || a.policy_number.localeCompare(b.policy_number));
  return { as_of: asOf, renewals: rows.length, overdue_milestones: rows.reduce((n, r) => n + (r.overdue ? r.overdue.split(', ').length : 0), 0), by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.renewals} commercial renewal(s) in the next 150 days: ${o.by_status.overdue || 0} with overdue milestones (${o.overdue_milestones} in all), ${o.by_status.due_this_week || 0} with a milestone due this week, ${o.by_status.on_track || 0} on track, ${o.by_status.complete || 0} complete.`;
