// Producer commission splits: what each producer should get from the commission received, against what was paid.
import { str, num, round2, sum, policyIndex, policyKey, normPolicy, normStatementLine, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['underpaid', 'not_paid', 'wrong_producer', 'no_commission_received', 'overpaid', 'no_split_rate', 'ok'];
const NEXT = {
  underpaid: 'Pay the difference on the next producer statement, or correct the split schedule if the rate changed.',
  not_paid: 'This producer has a share of the policy and was not paid; check the split with the producers.',
  wrong_producer: 'Paid to someone who is not a producer of record on this policy; check the producer code before the next payroll.',
  no_commission_received: 'Paid a share of commission the agency has not received; hold it or confirm the statement.',
  overpaid: 'Paid more than the split schedule allows; confirm before the next statement.',
  no_split_rate: 'Add this producer to the split schedule.',
  ok: '',
};
const who = (v) => str(v).toLowerCase().replace(/\s+/g, ' ');

export function checkSplits(receivedRows, policyRows, payRows, settings = {}) {
  const tol = num(settings.tolerance) ?? 1;
  const producers = new Map((settings.producers || []).map((p) => [who(p.name), p]));
  const house = new Set((settings.house_producers || ['House']).map(who));
  const shared = new Map((settings.shared || []).map((s) => [policyKey(s.policy_number), s.producers]));
  const pIdx = policyIndex(policyRows.map((r) => normPolicy(r)));
  const exp = new Map(); let houseLines = 0; let unmatched = 0;
  for (const l of receivedRows.map(normStatementLine)) {
    if (!l.policy_key || l.commission === null) continue;
    const p = pIdx.find(l.policy_number)[0];
    if (!p) { unmatched++; continue; }
    const kind = l.tx === 'new' || l.tx === 'renewal' ? l.tx : p.kind || 'renewal';
    const shares = shared.get(p.policy_key) || [{ name: p.producer, share: 1 }];
    for (const s of shares) {
      const k = who(s.name);
      if (house.has(k)) { houseLines++; continue; }
      const key = `${p.policy_key}|${k}`;
      const pr = producers.get(k);
      const pct = pr ? num(kind === 'new' ? pr.new_pct : pr.renewal_pct) : null;
      const e = exp.get(key) || { policy_number: p.policy_number, client: p.client, carrier: p.carrier, producer: str(s.name), kind, share: num(s.share) ?? 1, split_pct: pct, commission: 0, expected: pct === null ? null : 0 };
      e.commission = round2(e.commission + l.commission);
      if (e.expected !== null && pct !== null) e.expected = round2(e.expected + l.commission * (num(s.share) ?? 1) * pct / 100);
      exp.set(key, e);
    }
  }
  const paid = new Map();
  for (const r of payRows) { const k = policyKey(r.policy_number); const amt = num(r.amount); if (!k || amt === null) continue; const key = `${k}|${who(r.producer)}`; const e = paid.get(key) || { policy_number: str(r.policy_number), producer: str(r.producer), paid: 0 }; e.paid = round2(e.paid + amt); paid.set(key, e); }
  const polWithExp = new Set([...exp.keys()].map((k) => k.split('|')[0]));
  const rows = [];
  for (const [key, e] of exp) {
    const pd = paid.get(key); const got = pd ? pd.paid : 0;
    const diff = e.expected === null ? null : round2(got - e.expected);
    const status = e.expected === null ? 'no_split_rate' : !pd && e.expected !== 0 ? 'not_paid' : diff < -tol ? 'underpaid' : diff > tol ? 'overpaid' : 'ok';
    rows.push({ status, ...e, paid: got, difference: diff, detail: status === 'no_split_rate' ? `${e.producer} is not in the split schedule.` : status === 'ok' ? '' : `${e.split_pct}% of ${e.share < 1 ? `${round2(e.share * 100)}% of ` : ''}${e.commission} ${e.kind} commission is ${e.expected}; paid ${got}.`, next_step: NEXT[status] });
  }
  for (const [key, pd] of paid) {
    if (exp.has(key)) continue;
    const pk = key.split('|')[0]; const p = pIdx.find(pd.policy_number)[0];
    const status = polWithExp.has(pk) || (p && house.has(who(p.producer))) ? 'wrong_producer' : 'no_commission_received';
    rows.push({ status, policy_number: pd.policy_number, client: p ? p.client : '', carrier: p ? p.carrier : '', producer: pd.producer, kind: p ? p.kind || '' : '', share: null, split_pct: null, commission: null, expected: 0, paid: pd.paid, difference: pd.paid, detail: status === 'wrong_producer' ? `${pd.producer} was paid ${pd.paid} but is not a producer of record on this policy${p ? ` (${p.producer})` : ''}.` : `${pd.producer} was paid ${pd.paid}; no commission for this policy is in the received file.`, next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.policy_number.localeCompare(b.policy_number) || a.producer.localeCompare(b.producer));
  const byProducer = [...groupBy(rows, (r) => who(r.producer)).values()].map((g) => ({ producer: g[0].producer, policies: g.length, expected: sum(g.filter((r) => r.expected !== null), (r) => r.expected), paid: sum(g, (r) => r.paid), difference: round2(sum(g, (r) => r.paid) - sum(g.filter((r) => r.expected !== null), (r) => r.expected)) })).sort((a, b) => a.difference - b.difference || a.producer.localeCompare(b.producer));
  return {
    pairs: rows.length, expected: sum(rows.filter((r) => r.expected !== null), (r) => r.expected), paid: sum(rows, (r) => r.paid),
    underpaid_total: sum(rows.filter((r) => r.status === 'underpaid'), (r) => -r.difference), not_paid_total: sum(rows.filter((r) => r.status === 'not_paid'), (r) => r.expected),
    overpaid_total: sum(rows.filter((r) => r.status === 'overpaid'), (r) => r.difference), wrong_producer_total: sum(rows.filter((r) => r.status === 'wrong_producer'), (r) => r.paid),
    house_lines: houseLines, lines_without_policy: unmatched, by_status: countBy(rows, STATUSES), by_producer: byProducer, rows,
  };
}

export const summaryLine = (o) => `${o.pairs} policy-producer share(s): ${o.paid} paid against ${o.expected} due; ${o.by_status.underpaid || 0} underpaid by ${o.underpaid_total}, ${o.by_status.not_paid || 0} not paid (${o.not_paid_total}), ${o.by_status.overpaid || 0} overpaid by ${o.overpaid_total}, ${o.by_status.wrong_producer || 0} paid to the wrong producer (${o.wrong_producer_total}); ${o.house_lines} house-account line(s) set aside.`;
