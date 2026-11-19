import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkLicenses, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const STATE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['states'],
  properties: {
    note: { type: 'string', maxLength: 1000, description: 'Who confirmed these settings and when' },
    states: { type: 'object', description: 'By state code: continuing education hours and ethics hours needed per renewal period, as your agency confirmed them', additionalProperties: { type: 'object', additionalProperties: false, properties: { ce_hours: { type: 'number', minimum: 0, maximum: 200 }, ethics_hours: { type: 'number', minimum: 0, maximum: 50 }, period_months: { type: 'integer', minimum: 1, maximum: 120 }, confirmed_by: { type: 'string', maxLength: 120 }, confirmed_on: { type: 'string', maxLength: 20 } } } },
  },
};
const LICENSE_FIELDS = {
  person: { aliases: ['Name', 'Producer', 'Licensee', 'Employee', 'Agent Name', 'Individual'], required: true, translate: false },
  role: { aliases: ['Role', 'Title', 'Position'] },
  state: { aliases: ['State', 'License State', 'Jurisdiction'], required: true },
  license_number: { aliases: ['License Number', 'License #', 'License No', 'NPN'], translate: 'license_number' },
  license_type: { aliases: ['License Type', 'Class', 'Lines of Authority', 'Type'], translate: false },
  resident: { aliases: ['Resident', 'Resident State', 'Residency', 'Resident/Non-Resident'], translate: false },
  expiration_date: { type: 'date', aliases: ['Expiration Date', 'Expires', 'License Expiration', 'Exp Date'] },
  ce_hours: { type: 'number', aliases: ['CE Hours', 'CE Hours Completed', 'Hours Completed', 'Credits'], translate: false },
  ethics_hours: { type: 'number', aliases: ['Ethics Hours', 'Ethics Completed', 'Ethics Credits'], translate: false },
};
const files = {
  licenses: { type: 'string', description: 'Licences of producers and staff (an NIPR or licensing-tool export, or your own list): person, state, licence, resident or not, expiration, CE and ethics hours completed this period' },
  states: { type: 'string', description: 'State settings JSON: continuing education and ethics hours per state as your agency confirmed them' },
};
const args = { as_of: AS_OF_ARG, due_days: { type: 'integer', minimum: 1, maximum: 365, description: 'Licences expiring within this many days are due for renewal (default 60)' }, ce_days: { type: 'integer', minimum: 1, maximum: 365, description: 'Continuing education short within this many days of expiration is flagged (default 90)' } };
const run = (a, ctx) => checkLicenses(ctx.records(a.licenses, 'licenses'), ctx.readJson(a.states, 'state_settings'), { asOf: asOf(a), dueDays: a.due_days ?? 60, ceDays: a.ce_days ?? 90 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-license-renewals', version: pkg.version, prefix: 'licenses', key: 'license_number', keyKind: 'license', noun: 'license',
  role: 'an agency office manager or compliance contact',
  description: 'Tracks producer and staff licences by state: expired licences, continuing education and ethics hours short of the state setting before expiration, renewals due in the next 60 days, and states with no setting yet, by person. State rules are settings your agency confirms; the agent gives no legal advice and never files a renewal.',
  files, args, required: ['licenses', 'states'], statuses: STATUSES,
  sources: { licenses: { label: 'Licences', args: ['licenses'], fields: LICENSE_FIELDS } },
  configSchemas: { state_settings: STATE_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Check licences and continuing education', description: 'Each licence: days to expiration, CE and ethics hours against the state setting, and a status (expired, ce_short, renewal_due, no_state_rule, current). Totals by person.' },
  report: {
    base: 'license-renewals', titleShort: 'Write the licensing worklist',
    title: { en: 'Licence renewals and continuing education', de: 'Zulassungsverlängerungen und Weiterbildung', fr: 'Renouvellements d’agrément et formation continue', es: 'Renovación de licencias y formación continua', pt: 'Renovação de licenças e educação continuada', it: 'Rinnovi di abilitazione e formazione continua', ja: '資格更新と継続教育', zh: '执照续期与继续教育', ko: '자격 갱신과 보수 교육' },
    columns: ['status', 'person', 'role', 'state', 'license_number', 'license_type', 'resident', 'expiration_date', 'days_left', 'ce_hours', 'ce_required', 'ethics_hours', 'ethics_required', 'detail', 'next_step'],
    htmlColumns: ['status', 'person', 'state', 'license_type', 'resident', 'expiration_date', 'days_left', 'ce_hours', 'ce_required', 'ethics_hours'],
    sections: (o) => [{ title: { en: 'By person', de: 'Nach Person', fr: 'Par personne', es: 'Por persona', pt: 'Por pessoa', it: 'Per persona', ja: '担当者別', zh: '按人员', ko: '사람별' }, rows: o.by_person, columns: ['person', 'role', 'licenses', 'needing_attention', 'next_expiration'] }],
    limits: ['State continuing education and licensing rules change and differ by licence type; the hours used are the settings in your file. Check them with each state\'s insurance department before relying on this list.', 'The list does not check appointments or lines of authority; see the carrier appointments agent.'],
  },
  refused: [
    { name: 'license_renewal_file', category: 'binding_send', description: 'It never files a licence renewal or pays a state fee.' },
    { name: 'ce_course_purchase', category: 'move_money', description: 'It never buys a course.' },
  ],
});
