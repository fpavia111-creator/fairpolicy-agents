import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkEndorsements, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
const CHANGE_FIELDS = {
  request_id: { aliases: ['Request ID', 'Change ID', 'Activity ID', 'Request #', 'Ticket'], required: true, translate: false },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'] },
  carrier: { aliases: ['Carrier', 'Company', 'Writing Company'] },
  change: { aliases: ['Change', 'Change Type', 'Description', 'Endorsement'], translate: false },
  requested_date: d(['Requested Date', 'Received Date', 'Date Requested', 'Created']),
  submitted_date: d(['Submitted Date', 'Sent To Carrier', 'Date Submitted']),
  confirmed_date: d(['Confirmed Date', 'Processed Date', 'Carrier Confirmed', 'Endorsement Issued']),
  premium_change: { type: 'money', aliases: ['Premium Change', 'Additional Premium', 'Return Premium', 'Change in Premium'], translate: false },
  bill_type: { aliases: ['Bill Type', 'Billing Method', 'Bill Method'] },
  invoiced: { aliases: ['Invoiced', 'Invoice Number', 'Invoice #', 'Billed'], translate: false },
  csr: { aliases: ['CSR', 'Account Manager', 'Assigned To'] },
};
const files = { changes: { type: 'string', description: 'Policy change requests from your activity log or service system: policy, change, dates asked, sent to carrier, confirmed, premium change, bill type, invoice' } };
const args = { as_of: AS_OF_ARG, submit_days: { type: 'integer', minimum: 0, maximum: 30, description: 'A change not sent to the carrier after this many days is flagged (default 2)' }, confirm_days: { type: 'integer', minimum: 1, maximum: 90, description: 'A change sent with no confirmation after this many days is flagged (default 14)' } };
const run = (a, ctx) => checkEndorsements(ctx.records(a.changes, 'changes'), { asOf: asOf(a), submitDays: a.submit_days ?? 2, confirmDays: a.confirm_days ?? 14 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-pending-endorsements', version: pkg.version, prefix: 'endorsements', key: 'request_id', keyKind: 'request', noun: 'change',
  role: 'an agency service manager',
  description: 'Follows every policy change a client asked for: not yet sent to the carrier, sent with no confirmation after 14 days, or confirmed with a premium change on an agency-bill policy that was never invoiced or credited. Never sends a change to a carrier or tells a client a change is made.',
  files, args, required: ['changes'], statuses: STATUSES,
  sources: { changes: { label: 'Change requests', args: ['changes'], fields: CHANGE_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Follow pending endorsements', description: 'Each change request with its dates and a status (not_submitted, unconfirmed, premium_change_not_billed, waiting, done).' },
  report: {
    base: 'pending-endorsements', titleShort: 'Write the endorsement worklist',
    title: { en: 'Pending policy changes', de: 'Offene Vertragsänderungen', fr: 'Avenants en attente', es: 'Suplementos pendientes', pt: 'Endossos pendentes', it: 'Appendici in sospeso', ja: '未完了の契約変更', zh: '待处理批改', ko: '처리 중인 계약 변경' },
    columns: ['status', 'request_id', 'policy_number', 'client', 'carrier', 'change', 'requested_date', 'submitted_date', 'confirmed_date', 'premium_change', 'bill_type', 'invoiced', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'request_id', 'policy_number', 'change', 'requested_date', 'submitted_date', 'confirmed_date', 'premium_change', 'csr'],
    limits: ['A change is only made when the carrier confirms it; the dates come from your log, so a change sent by phone and not logged shows as not sent.'],
  },
  refused: [
    { name: 'carrier_change_submit', category: 'binding_send', description: 'It never sends a policy change to a carrier.' },
    { name: 'client_confirmation_send', category: 'binding_send', description: 'It never tells a client that a change is done.' },
  ],
});
