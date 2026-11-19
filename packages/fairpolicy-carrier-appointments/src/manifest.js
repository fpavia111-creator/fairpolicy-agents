import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkAppointments, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const APPT_FIELDS = {
  producer: { aliases: ['Producer', 'Name', 'Agent', 'Licensee', 'Individual'], required: true, translate: false },
  carrier: { aliases: ['Carrier', 'Company', 'Insurer', 'Appointing Company'], required: true },
  state: { aliases: ['State', 'Appointment State', 'Jurisdiction'] },
  status: { aliases: ['Status', 'Appointment Status'] },
  effective_date: { type: 'date', aliases: ['Effective Date', 'Appointed Date', 'Appointment Date'] },
  termination_date: { type: 'date', aliases: ['Termination Date', 'Terminated', 'End Date'] },
};
const files = {
  appointments: { type: 'string', description: 'Appointments by producer, carrier and state (NIPR or carrier lists, or your own): status, appointed and termination dates' },
  policies: { type: 'string', description: 'Policy list with producer, carrier, state and effective date' },
};
const args = { as_of: AS_OF_ARG, lookback_days: { type: 'integer', minimum: 30, maximum: 1100, description: 'An active appointment with no business in this many days is unused (default 365)' } };
const run = (a, ctx) => checkAppointments(ctx.records(a.appointments, 'appointments'), ctx.records(a.policies, 'policies'), { asOf: asOf(a), lookbackDays: a.lookback_days ?? 365 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-carrier-appointments', version: pkg.version, prefix: 'appointments', key: 'ref', keyKind: 'ref', noun: 'combination',
  role: 'an agency office manager or compliance contact',
  description: 'Matches each producer\'s business to their carrier appointments by state: business written with a carrier where the producer has no appointment, business after an appointment was terminated or while it is pending, and appointments with no business for a year. It never applies for, renews or ends an appointment; state rules are your agency\'s to confirm.',
  files, args, required: ['appointments', 'policies'], statuses: STATUSES,
  sources: { appointments: { label: 'Appointments', args: ['appointments'], fields: APPT_FIELDS }, policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES } },
  run, summary: summaryLine,
  check: { title: 'Check carrier appointments', description: 'Each producer, carrier and state: the appointment on file, policies written, and a status (not_appointed, terminated_with_business, pending_with_business, unused, ok).' },
  explain: { title: 'Explain one combination', description: 'One producer|carrier|state combination with its appointment and policies.' },
  report: {
    base: 'carrier-appointments', titleShort: 'Write the appointments worklist',
    title: { en: 'Carrier appointments against business written', de: 'Versicherer-Bestellungen gegen geschriebenes Geschäft', fr: 'Mandats d’assureurs et affaires souscrites', es: 'Nombramientos de aseguradoras frente al negocio emitido', pt: 'Nomeações de seguradoras e negócios emitidos', it: 'Mandati delle compagnie e affari emessi', ja: '保険会社委託と取扱契約の照合', zh: '保险公司委任与已承保业务', ko: '보험사 위촉과 체결 계약 대조' },
    columns: ['status', 'producer', 'carrier', 'state', 'appointment', 'appointment_effective', 'terminated', 'policies', 'written_last_year', 'policy_numbers', 'detail', 'next_step'],
    htmlColumns: ['status', 'producer', 'carrier', 'state', 'appointment', 'policies', 'written_last_year', 'detail'],
    limits: ['Whether a producer must be appointed, and when, depends on the state and the carrier; this list shows where your files do not line up, for a person to check.', 'Carrier names match with words like Insurance Company ignored; writing companies inside one group stay apart.'],
  },
  refused: [
    { name: 'appointment_request', category: 'binding_send', description: 'It never applies for or renews an appointment.' },
    { name: 'appointment_terminate', category: 'binding_send', description: 'It never ends an appointment.' },
  ],
});
