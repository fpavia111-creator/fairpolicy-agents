import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { reconcileTrust, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const words = (d) => ({ type: 'array', maxItems: 50, items: { type: 'string', maxLength: 80 }, description: d });
export const TRUST_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    tolerance: { type: 'number', minimum: 0, maximum: 1000, description: 'Differences this small are ok (default 1.00)' },
    due_soon_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Remittances due within this many days are listed as due soon (default 7)' },
    opening_balance: { type: 'number', description: 'Balance before the first bank line, when the bank export has no balance column' },
    operating_words: words('Words in a bank description that mean a commission transfer to the operating account'),
    refund_words: words('Words that mean a return premium refunded to a client'),
    fee_words: words('Words for charges your state and bank allow from the trust account (for example bank service charges); check your state rule'),
    carrier_names: words('Carrier names to accept as remittance payees besides those in the payables file'),
    state_note: { type: 'string', maxLength: 500, description: 'Your state\'s trust account rule as your agency confirmed it, shown in the report' },
  },
};
const PAYABLE_FIELDS = {
  carrier: { aliases: ['Carrier', 'Company', 'Payee', 'Billing Company', 'Writing Company'] },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  client: { aliases: ['Customer Name', 'Client Name', 'Insured', 'Insured Name', 'Account Name'] },
  invoice: { aliases: ['Invoice #', 'Invoice Number', 'Invoice', 'Item Number'], translate: false },
  gross_premium: { type: 'money', aliases: ['Gross Premium', 'Premium', 'Gross', 'Total Premium'], translate: 'premium' },
  commission: { type: 'money', aliases: ['Commission', 'Agency Commission', 'Commission Amount'] },
  net_due: { type: 'money', aliases: ['Net Due', 'Net Premium', 'Net Payable', 'Amount Due', 'Net Amount'] },
  due_date: { type: 'date', aliases: ['Due Date', 'Payable Due Date', 'Remit By', 'Statement Due'] },
  received_date: { type: 'date', aliases: ['Premium Received', 'Received Date', 'Date Received', 'Collected Date', 'Paid By Insured'] },
  paid_date: { type: 'date', aliases: ['Paid Date', 'Remitted Date', 'Date Paid', 'Paid To Carrier'] },
};
const BANK_FIELDS = {
  date: { type: 'date', aliases: ['Date', 'Posting Date', 'Transaction Date', 'Posted Date'], required: true },
  description: { aliases: ['Description', 'Memo', 'Payee', 'Details', 'Transaction Description'] },
  amount: { type: 'money', aliases: ['Amount', 'Transaction Amount', 'Net Amount'], required: true },
  balance: { type: 'money', aliases: ['Balance', 'Running Balance', 'Ledger Balance', 'Available Balance'] },
};
const files = {
  payables: { type: 'string', description: 'Agency-bill carrier payables from your agency system: carrier, policy, net due, due date, date the client paid, date remitted' },
  bank: { type: 'string', description: 'Premium trust account bank export: date, description, amount and (if the bank gives it) running balance' },
  settings: { type: 'string', description: 'Trust settings JSON: words for commission transfers, refunds and allowed fees, extra carrier names, due-soon days' },
};
const run = (a, ctx) => reconcileTrust(ctx.records(a.payables, 'payables'), ctx.records(a.bank, 'bank'), ctx.readJson(a.settings, 'trust_settings'), { asOf: asOf(a) });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-trust-account', version: pkg.version, prefix: 'trust', key: 'ref', keyKind: 'ref', noun: 'item',
  role: 'an agency principal or bookkeeper',
  description: 'Reconciles the premium trust account: the bank balance against agency-bill premiums collected and still owed to carriers (a shortfall is flagged first), withdrawals that are not a carrier remittance, client refund or commission transfer, commission moved out beyond what was earned, and remittances overdue or due soon. Never moves money or pays a carrier.',
  files, args: { as_of: AS_OF_ARG }, required: ['payables', 'bank', 'settings'], statuses: STATUSES,
  sources: { payables: { label: 'Carrier payables', args: ['payables'], fields: PAYABLE_FIELDS }, bank: { label: 'Trust bank account', args: ['bank'], fields: BANK_FIELDS } },
  configSchemas: { trust_settings: TRUST_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Reconcile the trust account', description: 'The balance against premiums owed (shortfall or covered), each unexpected withdrawal, commission overdraw, and each payable as overdue_remittance, due_soon, not_due or remitted.' },
  report: {
    base: 'trust-account', titleShort: 'Write the trust reconciliation',
    title: { en: 'Premium trust account reconciliation', de: 'Abstimmung des Prämientreuhandkontos', fr: 'Rapprochement du compte de primes en fiducie', es: 'Conciliación de la cuenta fiduciaria de primas', pt: 'Conciliação da conta fiduciária de prêmios', it: 'Riconciliazione del conto fiduciario premi', ja: '保険料信託口座の照合', zh: '保费信托账户对账', ko: '보험료 신탁계좌 대사' },
    columns: ['status', 'ref', 'carrier', 'client', 'date', 'amount', 'detail', 'next_step'],
    htmlColumns: ['status', 'ref', 'carrier', 'date', 'amount', 'detail'],
    limits: ['Whether a payment may come out of a premium trust account, and how commission may be moved, is set by your state\'s rules; the words in your settings file decide what counts as allowed. This is a reconciliation aid, not an audit or legal advice.', 'Return premiums owed to clients and unapplied client payments are not in the payables file unless you add them; the balance test covers carrier payables only.'],
  },
  refused: [
    { name: 'bank_transfer', category: 'move_money', description: 'It never moves money in or out of any account.' },
    { name: 'carrier_remit', category: 'move_money', description: 'It never pays a carrier; a person remits after review.' },
  ],
});
