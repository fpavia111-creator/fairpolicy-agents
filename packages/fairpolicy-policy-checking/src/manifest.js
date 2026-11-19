import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkPolicies, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
const COVERAGE_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy', 'Binder Number'], required: true },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name'] },
  carrier: { aliases: ['Carrier', 'Company', 'Insurer'] },
  line: { aliases: ['Line of Business', 'Line', 'Policy Type'] },
  coverage: { aliases: ['Coverage', 'Coverage Name', 'Coverage Code'], required: true, translate: false },
  limit: { type: 'money', aliases: ['Limit', 'Coverage Limit', 'Amount of Insurance'], translate: false },
  deductible: { type: 'money', aliases: ['Deductible', 'Ded'], translate: false },
  premium: { type: 'money', aliases: ['Premium', 'Coverage Premium'] },
  effective_date: d(['Effective Date', 'Eff Date']),
  expiration_date: d(['Expiration Date', 'Exp Date']),
  bound_date: d(['Bound Date', 'Binder Date', 'Date Bound']),
};
const files = {
  bound: { type: 'string', description: 'What was bound, one row per coverage (from your binder or proposal): policy, coverage, limit, deductible, premium, dates, bound date' },
  issued: { type: 'string', description: 'The issued policy, one row per coverage (from the carrier download or the declarations): policy, coverage, limit, deductible, premium, dates' },
};
const args = { as_of: AS_OF_ARG, issue_days: { type: 'integer', minimum: 1, maximum: 180, description: 'Bound with no issued policy after this many days is flagged (default 30)' }, tolerance: { type: 'number', minimum: 0, maximum: 10000, description: 'Premium differences this small are ok (default 25)' } };
const run = (a, ctx) => checkPolicies(ctx.records(a.bound, 'bound'), ctx.records(a.issued, 'issued'), { asOf: asOf(a), issueDays: a.issue_days ?? 30, tolerance: a.tolerance ?? 25 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-policy-checking', version: pkg.version, prefix: 'checking', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency account manager checking new and renewal policies',
  description: 'Checks each policy the carrier issued against what was bound, coverage by coverage: coverages missing, limits lower or deductibles higher than bound, premium different, dates different, and policies bound with nothing issued after 30 days. It compares documents; it never binds, endorses or tells a client what coverage they have.',
  files, args, required: ['bound', 'issued'], statuses: STATUSES,
  sources: { bound: { label: 'Bound coverages', args: ['bound'], fields: COVERAGE_FIELDS }, issued: { label: 'Issued coverages', args: ['issued'], fields: COVERAGE_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Check issued policies against binders', description: 'Each bound policy: coverages compared, premiums, dates, every difference, and a status (not_issued, coverage_reduced, premium_differs, dates_differ, matches).' },
  report: {
    base: 'policy-checking', titleShort: 'Write the policy checking list',
    title: { en: 'Policy checking: issued against bound', de: 'Policenprüfung: ausgestellt gegen gebunden', fr: 'Contrôle des polices : émises contre souscrites', es: 'Revisión de pólizas: emitidas frente a vinculadas', pt: 'Conferência de apólices: emitidas e contratadas', it: 'Verifica polizze: emesse rispetto al vincolato', ja: '証券チェック：発行内容と引受内容', zh: '保单核对：签发与承保对比', ko: '증권 점검: 발행과 인수 내용 대조' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'bound_date', 'coverages', 'bound_premium', 'issued_premium', 'issues', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'line', 'bound_date', 'bound_premium', 'issued_premium', 'issues', 'detail'],
    limits: ['Coverages are matched by name; forms, endorsements and wording are not compared. A full policy check still means reading the policy against the binder.'],
  },
  refused: [
    { name: 'carrier_correction_send', category: 'binding_send', description: 'It never asks a carrier for a correction.' },
    { name: 'policy_bind', category: 'binding_send', description: 'It never binds or endorses a policy.' },
  ],
});
