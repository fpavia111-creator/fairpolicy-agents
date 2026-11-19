import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, COMMISSION_FIELDS, COMMISSION_PROFILES, AS_OF_ARG, asOf, sameCarrier } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkChargebacks, summaryLine, disputeText, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  policies: { type: 'string', description: 'Policy list from your agency system with status, effective, expiration and cancellation dates, premium and commission rate' },
  statements: { type: 'string', description: 'Carrier commission statement lines covering the months since the cancellations' },
};
const args = {
  producer_pay: { type: 'string', description: 'Optional producer commission file (policy number, producer, amount; reversals negative) to check the producer\'s share was reversed' },
  as_of: AS_OF_ARG,
  lookback_days: { type: 'integer', minimum: 30, maximum: 730, description: 'Cancellations this many days back are checked (default 180)' },
  method: { type: 'string', enum: ['pro_rata', 'short_rate'], description: 'How the unearned premium is worked out (default pro_rata)' },
};
const PRODUCER_PAY_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  producer: { aliases: ['Producer', 'Producer Name', 'Agent'] },
  amount: { type: 'money', aliases: ['Amount', 'Commission', 'Producer Commission', 'Paid', 'Split Amount'] },
  type: { aliases: ['Type', 'Transaction', 'Entry Type'], translate: false },
};
const run = (a, ctx) => checkChargebacks(ctx.records(a.policies, 'policies'), ctx.records(a.statements, 'statements'), a.producer_pay ? ctx.records(a.producer_pay, 'producer_pay') : null, { asOf: asOf(a), lookbackDays: a.lookback_days ?? 180, method: a.method || 'pro_rata' });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-commission-chargebacks', version: pkg.version, prefix: 'chargebacks', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency accounting lead',
  description: 'For every cancelled policy, works out the commission chargeback on the unearned premium (pro rata or short rate), compares it with what the carrier took back, and flags overcharges, chargebacks still to come (a reserve), chargebacks with no cancellation in your system, and producer shares not reversed. Drafts a recalculation request; never posts, pays or sends.',
  files, args, required: ['policies', 'statements'], statuses: STATUSES,
  sources: {
    policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES },
    statements: { label: 'Commission statement lines', args: ['statements'], fields: COMMISSION_FIELDS, profiles: COMMISSION_PROFILES },
    producer_pay: { label: 'Producer commission file', args: ['producer_pay'], fields: PRODUCER_PAY_FIELDS },
  },
  run, summary: summaryLine,
  check: { title: 'Check cancellation chargebacks', description: 'Each cancelled policy: unearned premium, expected chargeback, what was taken and a status (overcharged, chargeback_without_cancel, producer_not_reversed, pending_chargeback, charged_ok). Totals: expected, taken, reserve for chargebacks still to come.' },
  report: {
    base: 'commission-chargebacks', titleShort: 'Write the chargeback worklist',
    title: { en: 'Cancellation chargebacks', de: 'Courtage-Rückbelastungen bei Storno', fr: 'Reprises de commission sur résiliation', es: 'Contracargos de comisión por anulación', pt: 'Estornos de comissão por cancelamento', it: 'Storni provvigionali per annullamento', ja: '解約に伴う手数料戻し', zh: '退保佣金回扣', ko: '해지 수수료 환수' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'effective_date', 'expiration_date', 'cancel_date', 'flat_cancel', 'premium', 'unearned', 'commission_rate', 'expected', 'taken', 'difference', 'producer', 'producer_reversed', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'cancel_date', 'unearned', 'expected', 'taken', 'difference', 'producer', 'detail'],
    limits: ['Unearned premium is worked out pro rata (or short rate, 10% penalty) from the dates in your policy list. Carriers\' own cancellation tables, minimum earned premiums and fees differ.'],
  },
  draft: {
    noun: 'recalculation', verb: 'send', category: 'binding_send', actor: 'a person at your agency', title: 'Draft a chargeback recalculation request',
    description: 'Write drafts/recalculation-<carrier>.md listing one carrier\'s overcharged chargebacks with the unearned premium and the difference. Marked DRAFT. Sending goes through chargebacks_request_send (one click).',
    required: ['carrier'],
    args: { carrier: { type: 'string', description: 'Carrier as named in the policy list' }, from: { type: 'string', description: 'Your name and agency' }, contact: { type: 'string', description: 'Carrier commission contact' } },
    build: (a, ctx, o) => {
      const items = o.rows.filter((r) => r.status === 'overcharged' && sameCarrier(r.carrier, a.carrier));
      if (!items.length) throw new Error(`no overcharged chargebacks for "${a.carrier}"`);
      const d = disputeText(items, a);
      return { id: items[0].carrier, to: a.contact, text: d.text, amount: d.total, extra: { policies: items.length } };
    },
  },
  refused: [
    { name: 'producer_pay_adjust', category: 'move_money', description: 'It never changes producer pay; your accounting staff reverse a share after review.' },
    { name: 'email_send', category: 'binding_send', description: 'It never sends e-mail; a person sends the approved request.' },
  ],
});
