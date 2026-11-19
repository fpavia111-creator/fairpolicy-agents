// Carrier appointments: business written where the producer is not appointed, pending or terminated, and appointments nobody uses.
import { str, normPolicy, carrierKey, addDays, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['not_appointed', 'terminated_with_business', 'pending_with_business', 'unused', 'ok'];
const NEXT = {
  not_appointed: 'Business written with a carrier in a state where this producer has no appointment: the agency principal reviews it with the carrier today.',
  terminated_with_business: 'The appointment ended before this business started: review with the carrier.',
  pending_with_business: 'Business written while the appointment is pending: confirm with the carrier that it is in place.',
  unused: 'No business in the last year under this appointment: decide whether to keep it before the next renewal fee.',
  ok: '',
};
const who = (v) => str(v).toLowerCase().replace(/\s+/g, ' ');
const apptStatus = (v) => { const t = str(v).toLowerCase(); return /pend|applied|submitted/.test(t) ? 'pending' : /term|cancel|inactive|ended/.test(t) ? 'terminated' : 'active'; };

export function checkAppointments(apptRows, policyRows, { asOf, lookbackDays = 365 } = {}) {
  const since = addDays(asOf, -lookbackDays);
  const appts = apptRows.filter((a) => str(a.producer) && str(a.carrier)).map((a) => ({ producer: str(a.producer), carrier: str(a.carrier), state: str(a.state).toUpperCase(), status: apptStatus(a.status), effective_date: str(a.effective_date), termination_date: str(a.termination_date) }));
  const key = (p, c, s) => `${who(p)}|${carrierKey(c)}|${str(s).toUpperCase()}`;
  const aBy = new Map(appts.map((a) => [key(a.producer, a.carrier, a.state), a]));
  const pols = policyRows.map((r) => normPolicy(r)).filter((p) => p.policy_key && p.producer && p.carrier && !['cancelled', 'expired', 'non_renewed', 'lapsed'].includes(p.status_code) && str(p.effective_date) <= asOf);
  const pBy = groupBy(pols, (p) => key(p.producer, p.carrier, p.state));
  const rows = [];
  for (const k of new Set([...aBy.keys(), ...pBy.keys()])) {
    const a = aBy.get(k) || null; const ps = pBy.get(k) || [];
    const recent = ps.filter((p) => str(p.effective_date) >= since);
    const base = a || { producer: ps[0].producer, carrier: ps[0].carrier, state: str(ps[0].state).toUpperCase() };
    let status;
    if (!a && ps.length) status = 'not_appointed';
    else if (a.status === 'terminated' && ps.some((p) => !a.termination_date || str(p.effective_date) > a.termination_date)) status = 'terminated_with_business';
    else if (a.status === 'pending' && ps.length) status = 'pending_with_business';
    else if (a.status === 'active' && !recent.length) status = 'unused';
    else status = 'ok';
    const nums = ps.map((p) => p.policy_number).sort();
    rows.push({ status, ref: `${base.producer}|${base.carrier}|${base.state}`, producer: base.producer, carrier: base.carrier, state: base.state, appointment: a ? a.status : 'none', appointment_effective: a ? a.effective_date : '', terminated: a ? a.termination_date : '', policies: ps.length, written_last_year: recent.length, policy_numbers: nums.slice(0, 10).join(', '), detail: status === 'not_appointed' ? `${ps.length} policy(ies) with ${base.carrier} in ${base.state}; no appointment on file.` : status === 'terminated_with_business' ? `Appointment terminated ${a.termination_date}; business effective after it.` : status === 'pending_with_business' ? `Appointment pending; ${ps.length} policy(ies) already written.` : status === 'unused' ? 'No business written in the last year.' : '', next_step: NEXT[status] });
  }
  rows.sort((x, y) => STATUSES.indexOf(x.status) - STATUSES.indexOf(y.status) || x.ref.localeCompare(y.ref));
  return { as_of: asOf, combinations: rows.length, appointments: appts.length, needing_attention: rows.filter((r) => r.status !== 'ok').length, by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.combinations} producer, carrier and state combination(s), ${o.appointments} appointment(s) on file: ${o.by_status.not_appointed || 0} with business and no appointment, ${o.by_status.terminated_with_business || 0} with business after termination, ${o.by_status.pending_with_business || 0} with business while pending, ${o.by_status.unused || 0} appointment(s) unused for a year.`;
