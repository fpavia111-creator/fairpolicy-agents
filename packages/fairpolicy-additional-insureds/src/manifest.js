import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkRequests, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
const REQUEST_FIELDS = {
  request_id: { aliases: ['Request ID', 'Request #', 'Request', 'Ticket', 'Activity ID'], required: true, translate: false },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'] },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  holder: { aliases: ['Holder', 'Certificate Holder', 'Additional Insured Name', 'Requested For'], translate: false },
  requirement: { aliases: ['Requirement', 'Request Type', 'Type', 'Wording Requested'], translate: false },
  requested_date: d(['Requested Date', 'Request Date', 'Received Date', 'Date Requested']),
  endorsement_requested_date: d(['Endorsement Requested', 'Sent To Carrier', 'Carrier Requested Date']),
  endorsement_received_date: d(['Endorsement Received', 'Received From Carrier', 'Endorsement Date']),
  completed_date: d(['Completed Date', 'Completed', 'Closed Date', 'Certificate Issued']),
  csr: { aliases: ['CSR', 'Account Manager', 'Assigned To'] },
};
const COVERAGE_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name'] },
  blanket_ai: { aliases: ['Blanket AI', 'Blanket Additional Insured', 'AI Endorsement'], translate: false },
  blanket_waiver: { aliases: ['Blanket Waiver', 'Waiver Endorsement', 'Blanket Waiver of Subrogation'], translate: false },
  primary_noncontributory: { aliases: ['Primary Non-Contributory', 'Primary Noncontributory', 'PNC'], translate: false },
  scheduled_holders: { aliases: ['Scheduled Holders', 'Scheduled Additional Insureds', 'Scheduled AI'], translate: false },
};
const files = {
  requests: { type: 'string', description: 'Additional insured, waiver and primary/non-contributory requests from your activity or certificate log' },
  coverage: { type: 'string', description: 'For each policy: blanket additional insured, blanket waiver, primary/non-contributory wording, and holders scheduled by name' },
};
const args = { as_of: AS_OF_ARG, overdue_days: { type: 'integer', minimum: 1, maximum: 90, description: 'A covered request open longer than this is overdue (default 7)' }, pending_days: { type: 'integer', minimum: 1, maximum: 120, description: 'An endorsement asked of the carrier longer ago than this is overdue (default 14)' } };
const run = (a, ctx) => checkRequests(ctx.records(a.requests, 'requests'), ctx.records(a.coverage, 'coverage'), { asOf: asOf(a), overdueDays: a.overdue_days ?? 7, pendingDays: a.pending_days ?? 14 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-additional-insureds', version: pkg.version, prefix: 'insureds', key: 'request_id', keyKind: 'request', noun: 'request',
  role: 'an agency account manager',
  description: 'Sorts additional insured, waiver of subrogation and primary/non-contributory requests: which the policy already covers (blanket wording or a scheduled holder) and can be issued, which need an endorsement from the carrier, endorsements the carrier has not sent, and requests left open too long. Never issues a certificate or asks a carrier for an endorsement itself.',
  files, args, required: ['requests', 'coverage'], statuses: STATUSES,
  sources: { requests: { label: 'Requests', args: ['requests'], fields: REQUEST_FIELDS }, coverage: { label: 'Policy endorsements', args: ['coverage'], fields: COVERAGE_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Sort additional insured requests', description: 'Each request: what it asks for, whether the policy covers it and how, days open, and a status (needs_endorsement, endorsement_pending, open_overdue, ready_to_issue, awaiting_carrier, complete).' },
  report: {
    base: 'additional-insureds', titleShort: 'Write the request worklist',
    title: { en: 'Additional insured and waiver requests', de: 'Anfragen zu Mitversicherten und Regressverzicht', fr: 'Demandes d’assurés additionnels et de renonciation à recours', es: 'Solicitudes de asegurado adicional y renuncia de subrogación', pt: 'Pedidos de segurado adicional e renúncia de sub-rogação', it: 'Richieste di assicurato aggiuntivo e rinuncia alla rivalsa', ja: '追加被保険者と代位権放棄の依頼', zh: '附加被保险人与放弃代位请求', ko: '추가 피보험자 및 대위권 포기 요청' },
    columns: ['status', 'request_id', 'client', 'policy_number', 'holder', 'requirement', 'requested_date', 'days_open', 'covered_by', 'endorsement_requested_date', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'request_id', 'policy_number', 'holder', 'requirement', 'days_open', 'covered_by'],
    limits: ['Whether blanket wording satisfies a contract depends on both documents; a person reads the contract and the endorsement before a certificate shows it.'],
  },
  refused: [
    { name: 'certificate_issue', category: 'binding_send', description: 'It never issues a certificate.' },
    { name: 'endorsement_request_send', category: 'binding_send', description: 'It never asks a carrier for an endorsement.' },
  ],
});
