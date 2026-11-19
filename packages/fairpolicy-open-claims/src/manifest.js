import { fairpolicyAgent, AS_OF_ARG, asOf, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkClaims, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
export const CLAIM_FIELDS = {
  agency_claim_id: { aliases: ['Agency Claim ID', 'Claim ID', 'Loss ID', 'Agency Claim #'], translate: false },
  claim_number: { aliases: ['Carrier Claim Number', 'Claim Number', 'Claim #', 'Company Claim Number'] },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'] },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  carrier: { aliases: ['Carrier', 'Company', 'Insurer'] },
  line: { aliases: ['Line of Business', 'Line', 'Coverage'] },
  loss_date: d(['Date of Loss', 'Loss Date', 'Accident Date']),
  reported_date: d(['Reported Date', 'Date Reported', 'Reported To Agency', 'First Notice']),
  status: { aliases: ['Claim Status', 'Status'] },
  last_activity_date: d(['Last Activity', 'Last Activity Date', 'Last Contact', 'Last Update', 'Last Note']),
  adjuster: { aliases: ['Adjuster', 'Adjuster Name', 'Claim Rep'], translate: false },
  paid: { type: 'money', aliases: ['Paid', 'Total Paid', 'Paid to Date', 'Indemnity Paid'] },
  reserve: { type: 'money', aliases: ['Reserve', 'Outstanding Reserve', 'Open Reserve', 'Reserves'] },
  policy_expiration: d(['Policy Expiration', 'Expiration Date', 'Renewal Date', 'X-Date']),
  csr: { aliases: ['CSR', 'Account Manager', 'Claims Contact'] },
};
const files = { claims: { type: 'string', description: 'Claims list from your agency system or carrier loss notices: claim, policy, carrier, dates, status, last activity, paid and reserve' } };
const args = {
  as_of: AS_OF_ARG,
  quiet_days: { type: 'integer', minimum: 1, maximum: 365, description: 'An open claim with no activity for longer than this is flagged (default 30)' },
  long_days: { type: 'integer', minimum: 30, maximum: 2000, description: 'A claim open longer than this is flagged (default 180)' },
  renewal_days: { type: 'integer', minimum: 0, maximum: 180, description: 'Open claims on policies renewing within this many days are flagged (default 60)' },
};
const run = (a, ctx) => checkClaims(ctx.records(a.claims, 'claims'), { asOf: asOf(a), quietDays: a.quiet_days ?? 30, longDays: a.long_days ?? 180, renewalDays: a.renewal_days ?? 60 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-open-claims', version: pkg.version, prefix: 'claims', key: 'claim_ref', keyKind: 'claim', noun: 'claim',
  role: 'an agency claims contact or account manager',
  description: 'Ages the open claims your agency tracks: losses logged with no carrier claim number, claims with no update for 30 days, claims open on policies renewing within 60 days, and claims open longer than 180 days, with incurred amounts by carrier. It never files, settles or comments on a claim; the carrier\'s adjuster decides.',
  files, args, required: ['claims'], statuses: STATUSES,
  sources: { claims: { label: 'Claims', args: ['claims'], fields: CLAIM_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Age open claims', description: 'Each open claim: days open, days since the last activity, renewal date, paid, reserve, and a status (not_reported, no_update, renewal_soon, open_long, active). Totals by carrier.' },
  report: {
    base: 'open-claims', titleShort: 'Write the claims follow-up list',
    title: { en: 'Open claims follow-up', de: 'Nachverfolgung offener Schäden', fr: 'Suivi des sinistres ouverts', es: 'Seguimiento de siniestros abiertos', pt: 'Acompanhamento de sinistros abertos', it: 'Follow-up dei sinistri aperti', ja: '未決事故のフォローアップ', zh: '未结赔案跟进', ko: '미결 사고 후속 관리' },
    columns: ['status', 'claim_ref', 'claim_number', 'client', 'policy_number', 'carrier', 'line', 'loss_date', 'reported_date', 'days_open', 'last_activity', 'days_quiet', 'adjuster', 'paid', 'reserve', 'incurred', 'policy_expiration', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'claim_ref', 'carrier', 'line', 'loss_date', 'days_open', 'days_quiet', 'incurred', 'policy_expiration'],
    sections: (o) => [{ title: sectionTitle('by_carrier'), rows: o.by_carrier, columns: ['carrier', 'open', 'incurred', 'needing_attention'] }],
    limits: ['Claims are handled by the carrier\'s adjuster. The agent reads your tracking file; it does not see the carrier\'s claim file and says nothing about coverage.'],
  },
  refused: [
    { name: 'claim_file', category: 'binding_send', description: 'It never reports or files a claim with a carrier.' },
    { name: 'claim_settlement_accept', category: 'binding_send', description: 'It never accepts, negotiates or comments on a settlement.' },
  ],
});
