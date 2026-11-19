import { fairpolicyAgent } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { summarizeLosses, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const LOSS_FIELDS = {
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'], required: true },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  line: { aliases: ['Line of Business', 'Line', 'Coverage'] },
  carrier: { aliases: ['Carrier', 'Company', 'Insurer'] },
  policy_year: { type: 'number', aliases: ['Policy Year', 'Year', 'Term Year', 'Policy Period Year'], translate: false },
  loss_date: { type: 'date', aliases: ['Date of Loss', 'Loss Date', 'Accident Date'] },
  claim_number: { aliases: ['Claim Number', 'Claim #', 'Carrier Claim Number'] },
  status: { aliases: ['Claim Status', 'Status', 'Open/Closed'] },
  paid: { type: 'money', aliases: ['Paid', 'Total Paid', 'Paid to Date', 'Indemnity Paid'] },
  reserve: { type: 'money', aliases: ['Reserve', 'Outstanding Reserve', 'Open Reserve'] },
};
const PREMIUM_FIELDS = {
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'], required: true },
  policy_year: { type: 'number', aliases: ['Policy Year', 'Year', 'Term Year'], translate: false },
  premium: { type: 'money', aliases: ['Earned Premium', 'Premium', 'Written Premium', 'Annual Premium'] },
};
const files = {
  loss_runs: { type: 'string', description: 'Loss runs from the carriers (or your claim log) as CSV or Excel: insured, policy year or date of loss, claim, status, paid and reserve' },
  premiums: { type: 'string', description: 'Premium by insured and policy year, to work out loss ratios' },
};
const args = {
  years: { type: 'integer', minimum: 1, maximum: 10, description: 'Policy years to include, ending with the latest (default 5)' },
  loss_ratio_limit: { type: 'number', minimum: 0, maximum: 500, description: 'Loss ratio at or above this percent is high (default 70)' },
  large_loss: { type: 'number', minimum: 0, description: 'One claim incurred at or above this is a large loss (default 25000)' },
  frequency: { type: 'integer', minimum: 2, maximum: 50, description: 'This many claims in one policy year is flagged (default 3)' },
};
const run = (a, ctx) => summarizeLosses(ctx.records(a.loss_runs, 'loss_runs'), ctx.records(a.premiums, 'premiums'), { years: a.years ?? 5, lrLimit: a.loss_ratio_limit ?? 70, largeLoss: a.large_loss ?? 25000, frequency: a.frequency ?? 3 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-loss-runs', version: pkg.version, prefix: 'losses', key: 'client', keyKind: 'name', noun: 'account',
  role: 'a commercial account manager preparing renewals',
  description: 'Summarises loss runs by account over the last five policy years: claims, paid, reserved and incurred, loss ratio against premium, large losses and years with several claims, with a year-by-year line for each account. It reads the loss runs you have; it does not request them from carriers or judge a claim.',
  files, args, statuses: STATUSES,
  sources: { loss_runs: { label: 'Loss runs', args: ['loss_runs'], fields: LOSS_FIELDS }, premiums: { label: 'Premium by year', args: ['premiums'], fields: PREMIUM_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Summarise loss runs by account', description: 'Each account: claims, open claims, paid, reserve, incurred, premium, loss ratio, large losses, most claims in a year, by year, and a status (high_loss_ratio, large_loss, frequency, normal, clean).' },
  explain: { title: 'Explain one account', description: 'One account\'s loss summary with the year-by-year line. The client can be given by name or pseudonym.' },
  report: {
    base: 'loss-runs', titleShort: 'Write the loss run summary',
    title: { en: 'Loss run summary', de: 'Schadenverlauf im Überblick', fr: 'Synthèse de la sinistralité', es: 'Resumen de siniestralidad', pt: 'Resumo do histórico de sinistros', it: 'Sintesi dell’andamento sinistri', ja: '損害履歴の概要', zh: '赔付记录摘要', ko: '손해 이력 요약' },
    columns: ['status', 'client', 'years', 'claims', 'open_claims', 'paid', 'reserve', 'incurred', 'premium', 'loss_ratio', 'large_losses', 'largest_loss', 'most_claims_in_a_year', 'by_year', 'detail', 'next_step'],
    htmlColumns: ['status', 'years', 'claims', 'open_claims', 'incurred', 'premium', 'loss_ratio', 'largest_loss', 'by_year'],
    limits: ['Incurred is paid plus reserve as the loss run shows it on its date; reserves change. Underwriters also weigh development, the type of loss and what changed since; this summary does not.'],
  },
  refused: [
    { name: 'loss_run_request_send', category: 'binding_send', description: 'It never requests loss runs from a carrier.' },
    { name: 'submission_send', category: 'binding_send', description: 'It never sends a renewal submission.' },
  ],
});
