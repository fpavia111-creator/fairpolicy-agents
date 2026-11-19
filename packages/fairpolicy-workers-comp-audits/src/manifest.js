import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkAudits, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const money = (aliases) => ({ type: 'money', aliases, translate: false });
const AUDIT_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'] },
  carrier: { aliases: ['Carrier', 'Company', 'Insurer'] },
  line: { aliases: ['Line of Business', 'Line', 'Coverage'] },
  expiration_date: { type: 'date', aliases: ['Expiration Date', 'Policy Expiration', 'Exp Date', 'Period End'] },
  audit_status: { aliases: ['Audit Status', 'Status'], translate: false },
  scheduled_date: { type: 'date', aliases: ['Scheduled Date', 'Audit Date', 'Appointment'] },
  completed_date: { type: 'date', aliases: ['Completed Date', 'Audit Completed', 'Billed Date'] },
  estimated_payroll: money(['Estimated Payroll', 'Estimated Exposure', 'Est Payroll']),
  audited_payroll: money(['Audited Payroll', 'Audited Exposure', 'Actual Payroll']),
  estimated_premium: money(['Estimated Premium', 'Deposit Premium', 'Est Premium']),
  audit_premium: money(['Audit Premium', 'Additional Premium', 'Audit Adjustment', 'Return Premium']),
  csr: { aliases: ['CSR', 'Account Manager'] },
};
const files = { audits: { type: 'string', description: 'Auditable policies (workers comp, GL) with expiration, audit status and dates, estimated and audited payroll, and the audit premium (additional positive, return negative)' } };
const args = {
  as_of: AS_OF_ARG,
  start_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days after expiration before an audit with nothing recorded is flagged (default 30)' },
  additional_pct: { type: 'number', minimum: 0, maximum: 500, description: 'Additional premium at or above this percent of the estimated premium is large (default 10)' },
  payroll_pct: { type: 'number', minimum: 0, maximum: 500, description: 'Audited payroll more than this percent away from the estimate means the estimate needs updating (default 20)' },
};
const run = (a, ctx) => checkAudits(ctx.records(a.audits, 'audits'), { asOf: asOf(a), startDays: a.start_days ?? 30, additionalPct: a.additional_pct ?? 10, payrollPct: a.payroll_pct ?? 20 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-workers-comp-audits', version: pkg.version, prefix: 'audits', key: 'policy_number', keyKind: 'policy', noun: 'audit',
  role: 'a commercial lines account manager',
  description: 'Follows premium audits on workers compensation and other auditable policies: policies ended a month ago with no audit started, audits that add large additional premium, audits returning premium, payroll far from the estimate (so the renewal estimate can be updated), and audits in progress. Never disputes an audit or contacts the carrier.',
  files, args, required: ['audits'], statuses: STATUSES,
  sources: { audits: { label: 'Premium audits', args: ['audits'], fields: AUDIT_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Follow premium audits', description: 'Each auditable policy that has ended: audit status, payroll change, audit premium, and a status (audit_not_started, large_additional_premium, return_due, update_estimate, pending, ok).' },
  report: {
    base: 'workers-comp-audits', titleShort: 'Write the audit worklist',
    title: { en: 'Premium audits', de: 'Beitragsrevisionen', fr: 'Régularisations de prime', es: 'Auditorías de prima', pt: 'Auditorias de prêmio', it: 'Regolazioni premio', ja: '保険料精算監査', zh: '保费审计', ko: '보험료 정산 감사' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'expiration_date', 'days_since_end', 'audit_status', 'completed_date', 'estimated_payroll', 'audited_payroll', 'payroll_change_pct', 'estimated_premium', 'audit_premium', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'expiration_date', 'audit_status', 'payroll_change_pct', 'audit_premium', 'detail'],
    limits: ['Audit rules, class codes and dispute deadlines are the carrier\'s and the rating bureau\'s; the agent reads the figures in your file and does not re-rate anything.'],
  },
  refused: [
    { name: 'audit_dispute_file', category: 'binding_send', description: 'It never files an audit dispute.' },
    { name: 'payroll_report_send', category: 'binding_send', description: 'It never sends payroll records to a carrier.' },
  ],
});
