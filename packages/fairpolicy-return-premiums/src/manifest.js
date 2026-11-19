import { fairpolicyAgent, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkRefunds, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
const RETURN_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Customer Name'] },
  carrier: { aliases: ['Carrier', 'Company'] },
  bill_type: { aliases: ['Bill Type', 'Billing Method', 'Bill Method'] },
  return_amount: { type: 'money', aliases: ['Return Premium', 'Return Amount', 'Credit Amount', 'Refund Amount'], required: true, translate: false },
  credited_date: d(['Credited Date', 'Carrier Credit Date', 'Statement Date', 'Date Credited']),
  refunded_date: d(['Refunded Date', 'Refund Date', 'Check Date', 'Date Refunded']),
  check_number: { aliases: ['Check Number', 'Check #', 'Refund Reference'], translate: false },
  cleared_date: d(['Cleared Date', 'Check Cleared', 'Cashed Date']),
  applied_to: { aliases: ['Applied To', 'Applied To Invoice', 'Credit Applied'], translate: false },
  csr: { aliases: ['CSR', 'Account Manager'] },
};
const files = { returns: { type: 'string', description: 'Return premiums from cancellations and endorsements: policy, bill type, amount, date the carrier credited it, refund date and check, cleared date, or invoice it was applied to' } };
const args = { as_of: AS_OF_ARG, refund_days: { type: 'integer', minimum: 1, maximum: 180, description: 'Days after the carrier credit before an unrefunded return is overdue (default 30)' }, clear_days: { type: 'integer', minimum: 7, maximum: 365, description: 'Days after a refund check before an uncleared check is flagged (default 90)' } };
const run = (a, ctx) => checkRefunds(ctx.records(a.returns, 'returns'), { asOf: asOf(a), refundDays: a.refund_days ?? 30, clearDays: a.clear_days ?? 90 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-return-premiums', version: pkg.version, prefix: 'refunds', key: 'policy_number', keyKind: 'policy', noun: 'return',
  role: 'an agency bookkeeper',
  description: 'Follows return premiums on agency-bill policies from the carrier\'s credit to the client: returns not refunded after 30 days, refunds due, refund checks not cleared after 90 days, and direct-bill returns the carrier pays itself. Never writes a check, moves money or files an unclaimed property report.',
  files, args, required: ['returns'], statuses: STATUSES,
  sources: { returns: { label: 'Return premiums', args: ['returns'], fields: RETURN_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Follow return premiums', description: 'Each return premium: amount, days since the carrier credited it, refund or application, and a status (refund_overdue, check_uncashed, refund_due, carrier_refunds, refunded).' },
  report: {
    base: 'return-premiums', titleShort: 'Write the refund worklist',
    title: { en: 'Return premiums owed to clients', de: 'Beitragsrückerstattungen an Kunden', fr: 'Primes à rembourser aux clients', es: 'Primas a devolver a clientes', pt: 'Prêmios a restituir aos clientes', it: 'Premi da rimborsare ai clienti', ja: '顧客への返戻保険料', zh: '应退客户保费', ko: '고객 환급 보험료' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'bill_type', 'return_amount', 'credited_date', 'days_since_credit', 'refunded_date', 'check_number', 'cleared_date', 'applied_to', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'return_amount', 'credited_date', 'days_since_credit', 'refunded_date', 'check_number'],
    limits: ['How long an agency may hold a return premium, and when uncashed money must be reported as unclaimed property, are state rules your agency and accountant confirm.'],
  },
  refused: [
    { name: 'refund_check_issue', category: 'move_money', description: 'It never writes a refund check or sends money.' },
    { name: 'unclaimed_property_file', category: 'binding_send', description: 'It never files an unclaimed property report.' },
  ],
});
