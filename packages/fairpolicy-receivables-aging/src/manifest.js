import { fairpolicyAgent, exportProfile, AS_OF_ARG, asOf, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { ageReceivables, summaryLine, reminderText, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const RECEIVABLE_FIELDS = {
  client: { aliases: ['Account Name', 'Customer Name', 'Client Name', 'Insured', 'Insured Name', 'Bill To'] },
  client_id: { aliases: ['Lookup Code', 'Customer #', 'Client Code', 'Account Code', 'Client Number'] },
  invoice: { aliases: ['Invoice #', 'Invoice Number', 'Item Number', 'Invoice', 'Item #'], translate: false },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  carrier: { aliases: ['Carrier', 'Company', 'Issuing Company', 'Writing Company'] },
  due_date: { type: 'date', aliases: ['Due Date', 'Invoice Due Date', 'Payment Due'] },
  amount: { type: 'money', aliases: ['Amount', 'Invoice Amount', 'Original Amount', 'Billed'] },
  balance: { type: 'money', aliases: ['Balance', 'Balance Due', 'Open Balance', 'Amount Due', 'Outstanding'] },
  producer: { aliases: ['Producer', 'Exec', 'Account Executive'] },
  csr: { aliases: ['Account Manager', 'CSR', 'Rep', 'Servicer'] },
  remitted: { type: 'bool', aliases: ['Remitted To Carrier', 'Paid To Carrier', 'Carrier Paid', 'Remitted'] },
};
const PROFILES = [
  exportProfile('applied_epic_transactions', { client_id: 'Lookup Code', client: ['Account Name'], invoice: 'Item Number', balance: 'Balance', amount: ['Amount', 'Transaction Amount'], policy_number: ['Policy Number'], due_date: ['Due Date'], producer: ['Producer'], csr: ['Account Manager'] }),
  exportProfile('ams360_invoices', { client_id: 'Customer #', client: ['Customer Name'], invoice: 'Invoice #', policy_number: 'Policy #', due_date: 'Due Date', balance: 'Balance Due', amount: ['Invoice Amount', 'Amount'], producer: ['Exec'], csr: ['Rep'] }),
];
const files = { receivables: { type: 'string', description: 'Open agency-bill receivables from your agency system (Applied Epic, AMS360 or any CSV): client, invoice, policy, due date, balance, and whether the carrier is already paid' } };
const args = { as_of: AS_OF_ARG, fronted_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days past due before an item the agency already paid the carrier is flagged (default 30)' } };
const run = (a, ctx) => ageReceivables(ctx.records(a.receivables, 'receivables'), { asOf: asOf(a), frontedDays: a.fronted_days ?? 30 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-receivables-aging', version: pkg.version, prefix: 'receivables', key: 'invoice', keyKind: 'invoice', noun: 'item',
  role: 'an agency bookkeeper or account manager',
  description: 'Ages agency-bill receivables: what each client owes, how many days past due (not due, 1-30, 31-60, 61-90, over 90), premiums the agency already paid the carrier but has not collected, and credit balances owed back to clients, by client and producer. Drafts a balance reminder for one client; never sends, charges or cancels.',
  files, args, required: ['receivables'], statuses: STATUSES,
  sources: { receivables: { label: 'Agency-bill receivables', args: ['receivables'], fields: RECEIVABLE_FIELDS, profiles: PROFILES } },
  run, summary: summaryLine,
  check: { title: 'Age agency-bill receivables', description: 'Every open item with days past due and a status (fronted_premium, over_90, credit_balance, over_60, over_30, current, not_due), bucket totals, and totals by client and producer.' },
  report: {
    base: 'receivables-aging', titleShort: 'Write the receivables worklist',
    title: { en: 'Agency-bill receivables aging', de: 'Altersstruktur der Beitragsforderungen', fr: 'Balance âgée des primes à encaisser', es: 'Antigüedad de primas por cobrar', pt: 'Envelhecimento de prêmios a receber', it: 'Scadenzario dei premi da incassare', ja: '代理店集金の売掛金年齢表', zh: '代理收费应收账龄', ko: '대리점 수금 미수금 연령' },
    columns: ['status', 'invoice', 'policy_number', 'client', 'client_id', 'carrier', 'due_date', 'days_past_due', 'balance', 'remitted', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'invoice', 'policy_number', 'carrier', 'due_date', 'days_past_due', 'balance', 'remitted', 'producer'],
    sections: (o) => [{ title: sectionTitle('by_client'), rows: o.by_client, columns: ['client', 'invoices', 'balance', 'past_due_30', 'oldest_days'] }, { title: sectionTitle('by_producer'), rows: o.by_producer, columns: ['producer', 'invoices', 'balance', 'past_due_30'] }],
    limits: ['Ages from the due date in your file. Payments posted after the export are not seen; run it on a fresh export.', 'Whether and when a carrier may cancel for non-payment is the carrier\'s and the state\'s rule; the agent sends no notice.'],
  },
  draft: {
    noun: 'reminder', verb: 'send', category: 'binding_send', actor: 'the account manager', title: 'Draft a balance reminder',
    description: 'Write drafts/reminder-<client>.md: a polite reminder of one client\'s past-due items over 30 days. Marked DRAFT. Sending goes through receivables_request_send (one click).',
    required: ['client'],
    args: { client: { type: 'string', description: 'Client name or its pseudonym from receivables_check' }, from: { type: 'string', description: 'Your name and agency' }, to: { type: 'string', description: 'Client e-mail or address line' } },
    build: (a, ctx, o) => {
      const items = o.rows.filter((r) => r.days_past_due > 30 && r.balance > 0 && (ctx.phi ? ctx.phi.same(r.client, a.client, 'name') : r.client === a.client));
      if (!items.length) throw new Error('no items over 30 days past due for that client');
      const d = reminderText(items, a);
      return { id: items[0].client_id || items[0].invoice, to: a.to, text: d.text, amount: d.total, extra: { items: items.length } };
    },
  },
  refused: [
    { name: 'carrier_cancel_request', category: 'binding_send', description: 'It never asks a carrier to cancel a policy for non-payment.' },
    { name: 'card_charge', category: 'move_money', description: 'It never charges a client\'s card or bank account.' },
  ],
});
