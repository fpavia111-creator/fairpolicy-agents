import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkFinance, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
const FINANCE_FIELDS = {
  agreement: { aliases: ['Agreement Number', 'Agreement #', 'Loan Number', 'Account Number PFA', 'Contract Number', 'PFA Number'], required: true, translate: false },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  client: { aliases: ['Insured', 'Insured Name', 'Borrower', 'Client Name', 'Customer Name'] },
  finance_company: { aliases: ['Finance Company', 'Premium Finance Company', 'Lender', 'PFC'] },
  signed_date: d(['Signed Date', 'Agreement Date', 'Contract Date', 'Date Signed']),
  amount_financed: { type: 'money', aliases: ['Amount Financed', 'Financed Amount', 'Principal'] },
  funded_date: d(['Funded Date', 'Funding Date', 'Date Funded', 'Disbursed Date']),
  funded_amount: { type: 'money', aliases: ['Funded Amount', 'Funding Amount', 'Disbursed Amount'] },
  remitted_date: d(['Remitted To Carrier', 'Remitted Date', 'Carrier Paid Date', 'Date Remitted']),
  installment: { type: 'money', aliases: ['Installment', 'Installment Amount', 'Payment Amount', 'Monthly Payment'] },
  next_due_date: d(['Next Due Date', 'Next Payment Due', 'Due Date', 'Next Due']),
  last_paid_date: d(['Last Paid Date', 'Last Payment Date', 'Last Paid', 'Date Last Paid']),
  notice_date: d(['NOIC Date', 'Notice Date', 'Notice of Intent Date', 'Intent to Cancel Date']),
  cancel_date: d(['Cancel Date', 'Cancellation Date', 'Cancel Effective Date']),
  balance: { type: 'money', aliases: ['Balance', 'Unpaid Balance', 'Payoff', 'Balance Due'] },
};
const files = { agreements: { type: 'string', description: 'Premium finance agreements from the finance company portal or your agency system: agreement, policy, funding and remittance dates, next due date, notices' } };
const args = {
  as_of: AS_OF_ARG,
  fund_days: { type: 'integer', minimum: 0, maximum: 120, description: 'Days after signing before an unfunded agreement is flagged (default 14)' },
  remit_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Days after funding before premium not passed to the carrier is flagged (default 5)' },
  soon_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Installments due within this many days are listed as due soon (default 10)' },
};
const run = (a, ctx) => checkFinance(ctx.records(a.agreements, 'agreements'), { asOf: asOf(a), fundDays: a.fund_days ?? 14, remitDays: a.remit_days ?? 5, soonDays: a.soon_days ?? 10 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-premium-finance', version: pkg.version, prefix: 'finance', key: 'agreement', keyKind: 'agreement', noun: 'agreement',
  role: 'an agency account manager',
  description: 'Watches premium finance agreements: notices of intent to cancel (with days left), installments past due or due soon, agreements signed but not funded, and funding the agency received but has not passed on to the carrier. Never signs, pays, reinstates or cancels.',
  files, args, required: ['agreements'], statuses: STATUSES,
  sources: { agreements: { label: 'Premium finance agreements', args: ['agreements'], fields: FINANCE_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Check premium finance agreements', description: 'Each agreement with a status (notice_of_intent, past_due, not_funded, funded_not_remitted, due_soon, current, paid_off), the dates behind it and what to do.' },
  report: {
    base: 'premium-finance', titleShort: 'Write the premium finance worklist',
    title: { en: 'Premium finance agreements', de: 'Prämienfinanzierungsverträge', fr: 'Contrats de financement de primes', es: 'Contratos de financiación de primas', pt: 'Contratos de financiamento de prêmios', it: 'Contratti di finanziamento premi', ja: '保険料ファイナンス契約', zh: '保费融资合同', ko: '보험료 금융 계약' },
    columns: ['status', 'agreement', 'policy_number', 'client', 'finance_company', 'signed_date', 'amount_financed', 'funded_date', 'funded_amount', 'remitted_date', 'installment', 'next_due_date', 'last_paid_date', 'days_past_due', 'notice_date', 'cancel_date', 'balance', 'detail', 'next_step'],
    htmlColumns: ['status', 'agreement', 'policy_number', 'finance_company', 'next_due_date', 'days_past_due', 'cancel_date', 'detail'],
    limits: ['Dates come from the export you load; finance company notices and state notice periods are the finance company\'s and the state\'s rules, not checked here.'],
  },
  refused: [
    { name: 'finance_payment_make', category: 'move_money', description: 'It never makes a payment for a client or the agency.' },
    { name: 'reinstatement_request', category: 'binding_send', description: 'It never asks a finance company or carrier to reinstate or cancel.' },
  ],
});
