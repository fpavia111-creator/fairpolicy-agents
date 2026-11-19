import { fairpolicyAgent, AS_OF_ARG, asOf, sameCarrier } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { reconcilePayables, summaryLine, noteText, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const ITEM_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  client: { aliases: ['Insured', 'Insured Name', 'Named Insured', 'Customer Name', 'Account Name'] },
  carrier: { aliases: ['Carrier', 'Company', 'Writing Company', 'Billing Company'] },
  transaction_type: { aliases: ['Transaction Type', 'Trans Type', 'Transaction', 'Type', 'Trans Code'] },
  effective_date: { type: 'date', aliases: ['Effective Date', 'Eff Date', 'Transaction Effective'] },
  gross_premium: { type: 'money', aliases: ['Gross Premium', 'Premium', 'Gross', 'Written Premium'], translate: 'premium' },
  commission: { type: 'money', aliases: ['Commission', 'Commission Amount', 'Agency Commission'] },
  net_due: { type: 'money', aliases: ['Net Due', 'Net Amount', 'Net Premium', 'Amount Due', 'Net Payable'] },
  due_date: { type: 'date', aliases: ['Due Date', 'Statement Due', 'Payment Due'] },
};
const files = {
  carrier_statement: { type: 'string', description: 'The carrier\'s agency-bill account current statement (CSV, Excel, or PDF text saved as CSV): policy, transaction, premium, commission, net due, due date' },
  agency_payables: { type: 'string', description: 'Carrier payables for the same carrier and period from your agency system' },
};
const args = { as_of: AS_OF_ARG, tolerance: { type: 'number', minimum: 0, maximum: 1000, description: 'Differences this small are ok (default 1.00)' } };
const run = (a, ctx) => reconcilePayables(ctx.records(a.carrier_statement, 'carrier_statement'), ctx.records(a.agency_payables, 'agency_payables'), { asOf: asOf(a), tolerance: a.tolerance ?? 1 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-carrier-payables', version: pkg.version, prefix: 'payables', key: 'policy_number', keyKind: 'policy', noun: 'item',
  role: 'an agency bookkeeper paying carrier statements',
  description: 'Reconciles a carrier\'s agency-bill account current with the payables in your agency system, item by item: net amounts that differ, items the carrier bills that you do not have, items you owe that the carrier has not billed, and items past the statement due date. Drafts a reconciliation note; never pays the carrier.',
  files, args, required: ['carrier_statement', 'agency_payables'], statuses: STATUSES,
  sources: { carrier_statement: { label: 'Carrier account current', args: ['carrier_statement'], fields: ITEM_FIELDS }, agency_payables: { label: 'Agency payables', args: ['agency_payables'], fields: ITEM_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Reconcile a carrier account current', description: 'Each policy and transaction on either side: the carrier\'s net, your net, the difference and a status (amount_differs, not_in_agency_system, not_on_carrier_statement, past_due, ok).' },
  report: {
    base: 'carrier-payables', titleShort: 'Write the account current worklist',
    title: { en: 'Carrier account current reconciliation', de: 'Abstimmung des Versicherer-Kontokorrents', fr: 'Rapprochement du compte courant assureur', es: 'Conciliación de la cuenta corriente con la aseguradora', pt: 'Conciliação da conta corrente com a seguradora', it: 'Riconciliazione del conto corrente con la compagnia', ja: '保険会社精算書の照合', zh: '保险公司往来账核对', ko: '보험사 정산서 대사' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'transaction_type', 'effective_date', 'carrier_net', 'agency_net', 'difference', 'due_date', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'transaction_type', 'carrier_net', 'agency_net', 'difference', 'due_date', 'detail'],
    limits: ['Items are matched by policy number (with or without a term suffix) and transaction type; several lines of the same kind are added together.'],
  },
  draft: {
    noun: 'reconciliation', verb: 'send', category: 'binding_send', actor: 'a person at your agency', title: 'Draft a reconciliation note to the carrier',
    description: 'Write drafts/reconciliation-<carrier>.md listing one carrier\'s items that differ or are not in your records. Marked DRAFT. Sending goes through payables_request_send (one click).',
    required: ['carrier'],
    args: { carrier: { type: 'string', description: 'Carrier as named on the statement' }, from: { type: 'string', description: 'Your name and agency' }, contact: { type: 'string', description: 'Carrier agency-bill contact' } },
    build: (a, ctx, o) => {
      const items = o.rows.filter((r) => (r.status === 'amount_differs' || r.status === 'not_in_agency_system') && sameCarrier(r.carrier, a.carrier));
      if (!items.length) throw new Error(`nothing to reconcile for "${a.carrier}"`);
      return { id: items[0].carrier, to: a.contact, text: noteText(items, a).text, extra: { items: items.length } };
    },
  },
  refused: [
    { name: 'carrier_payment', category: 'move_money', description: 'It never pays a carrier statement; a person pays after review.' },
    { name: 'ams_post_payable', category: 'production_deploy', description: 'It never changes payables in your agency system.' },
  ],
});
