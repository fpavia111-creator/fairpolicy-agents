// Contingency and profit-sharing bonus tracking: carrier experience against each carrier's bonus grid.
import { str, num, round2, sum, pct, findCarrier, carrierKey, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['received_less', 'loss_ratio_too_high', 'close_to_next', 'below_minimum', 'qualifies', 'no_grid'];
const NEXT = {
  received_less: 'Ask the carrier for its bonus calculation; the amount received is below the estimate from its own grid.',
  loss_ratio_too_high: 'The loss ratio is above every tier; review the large losses with the carrier marketing rep before year end.',
  close_to_next: 'Close to the next tier: the premium needed is shown. A person decides whether and where to place business; this is not a reason to move a client.',
  below_minimum: 'Below the grid\'s minimum premium.',
  qualifies: '',
  no_grid: 'Add this carrier\'s bonus grid to the settings file if it has one.',
};

const tierFails = (t, x) => {
  const f = [];
  if (num(t.min_premium) !== null && x.written_premium < num(t.min_premium)) f.push('premium');
  if (num(t.max_loss_ratio) !== null && (x.loss_ratio === null || x.loss_ratio > num(t.max_loss_ratio))) f.push('loss_ratio');
  // Growth is only known when the prior year is in the file; without it, a tier that asks for growth above zero is not met.
  if (num(t.min_growth_pct) !== null && (x.growth_pct === null ? num(t.min_growth_pct) > 0 : x.growth_pct < num(t.min_growth_pct))) f.push('growth');
  return f;
};

export function checkContingency(rows, grid = {}, { year, closePct = 10 } = {}) {
  const recs = rows.map((r) => ({ carrier: str(r.carrier), year: num(r.year), written: num(r.written_premium) ?? 0, earned: num(r.earned_premium), incurred: num(r.incurred), lr: num(r.loss_ratio) })).filter((r) => r.carrier && r.year !== null);
  const y = year ?? Math.max(...recs.map((r) => r.year), 0);
  const carriers = grid.carriers || [];
  const out = [];
  for (const g of groupBy(recs, (r) => carrierKey(r.carrier)).values()) {
    const cur = g.filter((r) => r.year === y); if (!cur.length) continue;
    const prev = g.filter((r) => r.year === y - 1);
    const name = cur.map((r) => r.carrier).sort()[0];
    const written = sum(cur, (r) => r.written), prior = prev.length ? sum(prev, (r) => r.written) : null;
    const earned = cur.every((r) => r.earned === null) ? null : sum(cur, (r) => r.earned);
    const incurred = cur.every((r) => r.incurred === null) ? null : sum(cur, (r) => r.incurred);
    const lr = earned && incurred !== null ? pct(incurred, earned) : cur.length === 1 ? cur[0].lr : null;
    const x = { carrier: name, year: y, written_premium: written, prior_premium: prior, growth_pct: prior ? pct(written - prior, prior) : null, earned_premium: earned, incurred, loss_ratio: lr };
    const gc = findCarrier(carriers, name);
    if (!gc) { out.push({ status: 'no_grid', ...x, tier: '', bonus_pct: null, estimated_bonus: null, received: null, next_tier: '', premium_to_next: null, incurred_room: null, detail: 'No bonus grid for this carrier in the settings file.', next_step: NEXT.no_grid }); continue; }
    const tiers = [...(gc.tiers || [])].sort((a, b) => (num(a.bonus_pct) ?? 0) - (num(b.bonus_pct) ?? 0));
    const met = tiers.filter((t) => !tierFails(t, x).length).pop() || null;
    const above = tiers.filter((t) => (num(t.bonus_pct) ?? 0) > (met ? num(met.bonus_pct) ?? 0 : -1));
    const next = above[0] || null; const nf = next ? tierFails(next, x) : [];
    const premiumToNext = next && nf.includes('premium') ? round2(num(next.min_premium) - written) : next ? 0 : null;
    const est = met ? round2(written * (num(met.bonus_pct) ?? 0) / 100) : 0;
    const received = gc.received === undefined ? null : num(gc.received);
    const lrLimit = met ? num(met.max_loss_ratio) : next ? num(next.max_loss_ratio) : null;
    const room = lrLimit !== null && earned ? round2(earned * lrLimit / 100 - (incurred ?? 0)) : null;
    const close = next && nf.length && nf.every((f) => f === 'premium') && premiumToNext <= num(next.min_premium) * closePct / 100;
    let status;
    if (met && received !== null && received < est - (num(grid.tolerance) ?? 1)) status = 'received_less';
    else if (!met && nf.includes('loss_ratio')) status = 'loss_ratio_too_high';
    else if (close) status = 'close_to_next';
    else if (!met) status = 'below_minimum';
    else status = 'qualifies';
    const why = nf.map((f) => (f === 'premium' ? `premium ${written} below ${next.min_premium}` : f === 'loss_ratio' ? `loss ratio ${lr}% above ${next.max_loss_ratio}%` : `growth ${x.growth_pct}% below ${next.min_growth_pct}%`)).join('; ');
    const detail = status === 'received_less' ? `${met.name || 'Tier'} at ${met.bonus_pct}% of ${written} is about ${est}; ${received} received.` : met ? `Meets ${met.name || 'a tier'} (${met.bonus_pct}%): about ${est}.${next ? ` Next: ${next.name || 'tier'} (${why}).` : ' Top tier.'}` : `No tier met${next ? ` (${next.name || 'first tier'}: ${why})` : ''}.`;
    out.push({ status, ...x, tier: met ? met.name || `${met.bonus_pct}%` : '', bonus_pct: met ? num(met.bonus_pct) : null, estimated_bonus: est, received, next_tier: next ? next.name || `${next.bonus_pct}%` : '', premium_to_next: premiumToNext, incurred_room: room, detail, next_step: NEXT[status] });
  }
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.carrier.localeCompare(b.carrier));
  return { year: y, carriers: out.length, estimated_bonus: sum(out, (r) => r.estimated_bonus ?? 0), received: sum(out.filter((r) => r.received !== null), (r) => r.received), qualifying: out.filter((r) => r.tier).length, by_status: countBy(out, STATUSES), rows: out };
}

export const summaryLine = (o) => `${o.carriers} carrier(s) for ${o.year}: ${o.qualifying} meet a bonus tier, about ${o.estimated_bonus} estimated, ${o.received} received so far; ${o.by_status.close_to_next || 0} close to the next tier, ${o.by_status.loss_ratio_too_high || 0} over the loss ratio, ${o.by_status.received_less || 0} paid less than the estimate. Estimates use each carrier's grid as written in your settings.`;
