import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, COMMISSION_FIELDS, COMMISSION_PROFILES } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkBilling, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const INVOICE_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  client: { aliases: ['Customer Name', 'Account Name', 'Client Name', 'Insured'] },
  invoice: { aliases: ['Invoice #', 'Invoice Number', 'Item Number'], translate: false },
  amount: { type: 'money', aliases: ['Amount', 'Invoice Amount', 'Billed', 'Total'] },
  invoice_date: { type: 'date', aliases: ['Invoice Date', 'Date', 'Billed Date'] },
};
const files = {
  policies: { type: 'string', description: 'Policy list from your agency system with the bill type (agency or direct) coded on each policy' },
  statements: { type: 'string', description: 'Carrier direct-bill commission statement lines' },
  invoices: { type: 'string', description: 'Agency-bill invoices issued to clients in the same period (invoice register export)' },
};
const run = (a, ctx) => checkBilling(ctx.records(a.policies, 'policies'), ctx.records(a.statements, 'statements'), ctx.records(a.invoices, 'invoices'));

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-direct-agency-bill', version: pkg.version, prefix: 'billing', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency bookkeeper',
  description: 'Compares how each active policy is coded (agency bill or direct bill) with how it is really billed: on the carrier\'s direct-bill commission statement, invoiced by the agency, or both. Flags clients who may be billed twice, policies coded agency bill that the carrier bills directly, direct-bill policies the agency invoiced, and policies with no bill type. Never changes a policy or an invoice.',
  files, statuses: STATUSES,
  sources: {
    policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES },
    statements: { label: 'Direct-bill commission statement', args: ['statements'], fields: COMMISSION_FIELDS, profiles: COMMISSION_PROFILES },
    invoices: { label: 'Agency invoices', args: ['invoices'], fields: INVOICE_FIELDS },
  },
  run, summary: summaryLine,
  check: { title: 'Check direct and agency bill', description: 'Each active policy: the coded bill type, whether it is on a direct-bill statement, what the agency invoiced, and a status (double_billed, coded_agency_paid_direct, coded_direct_invoiced, bill_type_missing, ok).' },
  report: {
    base: 'direct-agency-bill', titleShort: 'Write the billing worklist',
    title: { en: 'Direct bill and agency bill check', de: 'Prüfung Direkt- und Maklerinkasso', fr: 'Contrôle encaissement direct ou par l’agence', es: 'Revisión de cobro directo y por agencia', pt: 'Conferência de cobrança direta e pela agência', it: 'Verifica incasso diretto e di agenzia', ja: '直接集金と代理店集金の確認', zh: '直接收费与代理收费核对', ko: '직접 수납과 대리점 수납 점검' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'coded_bill_type', 'on_direct_statement', 'agency_invoiced', 'premium', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'coded_bill_type', 'on_direct_statement', 'agency_invoiced', 'detail'],
    limits: ['A policy on the direct-bill statement is treated as direct bill by the carrier. Load the statements and invoices for the same months so the comparison is fair.'],
  },
  refused: [
    { name: 'ams_update_policy', category: 'production_deploy', description: 'It never changes a policy\'s bill type in your agency system.' },
    { name: 'invoice_void', category: 'move_money', description: 'It never voids or changes an invoice.' },
  ],
});
