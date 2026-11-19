import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, COMMISSION_FIELDS, COMMISSION_PROFILES, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkSplits, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const SPLITS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['producers'],
  properties: {
    tolerance: { type: 'number', minimum: 0, maximum: 1000, description: 'Differences this small are ok (default 1.00)' },
    producers: { type: 'array', maxItems: 500, items: { type: 'object', additionalProperties: false, required: ['name', 'new_pct', 'renewal_pct'], properties: { name: { type: 'string', minLength: 1, maxLength: 120 }, new_pct: { type: 'number', minimum: 0, maximum: 100 }, renewal_pct: { type: 'number', minimum: 0, maximum: 100 }, note: { type: 'string', maxLength: 300 } } } },
    house_producers: { type: 'array', maxItems: 50, items: { type: 'string', maxLength: 120 }, description: 'Producer codes that mean a house account (no split), default ["House"]' },
    shared: { type: 'array', maxItems: 5000, items: { type: 'object', additionalProperties: false, required: ['policy_number', 'producers'], properties: { policy_number: { type: 'string', maxLength: 60 }, producers: { type: 'array', minItems: 1, maxItems: 10, items: { type: 'object', additionalProperties: false, required: ['name', 'share'], properties: { name: { type: 'string', maxLength: 120 }, share: { type: 'number', minimum: 0, maximum: 1 } } } } } } },
  },
};
const PAY_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  producer: { aliases: ['Producer', 'Producer Name', 'Payee', 'Agent'], required: true },
  amount: { type: 'money', aliases: ['Amount', 'Paid', 'Producer Commission', 'Split Amount', 'Commission Paid'], required: true },
};
const files = {
  received: { type: 'string', description: 'Commission received this period, by policy (carrier statement lines or your agency system\'s commission received report)' },
  policies: { type: 'string', description: 'Policy list with the producer of record and new or renewal' },
  producer_pay: { type: 'string', description: 'What each producer was paid this period, by policy (producer statement or payroll export)' },
  splits: { type: 'string', description: 'Split schedule JSON: each producer\'s new and renewal percent, house account codes, shared policies' },
};
const run = (a, ctx) => checkSplits(ctx.records(a.received, 'received'), ctx.records(a.policies, 'policies'), ctx.records(a.producer_pay, 'producer_pay'), ctx.readJson(a.splits, 'split_schedule'));

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-producer-splits', version: pkg.version, prefix: 'splits', key: 'policy_number', keyKind: 'policy', noun: 'share',
  role: 'an agency principal or bookkeeper running producer pay',
  description: 'Works out each producer\'s share of the commission the agency received (new and renewal percents, shared policies, house accounts) and compares it with the producer statement: underpaid, not paid, overpaid, paid to the wrong producer, or paid on commission not yet received, with totals by producer. Never changes producer pay.',
  files, statuses: STATUSES,
  sources: {
    received: { label: 'Commission received', args: ['received'], fields: COMMISSION_FIELDS, profiles: COMMISSION_PROFILES },
    policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES },
    producer_pay: { label: 'Producer pay', args: ['producer_pay'], fields: PAY_FIELDS },
  },
  configSchemas: { split_schedule: SPLITS_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Check producer splits', description: 'Each policy and producer: commission received, the producer\'s share and percent, what is due, what was paid and a status (underpaid, not_paid, wrong_producer, no_commission_received, overpaid, no_split_rate, ok). Totals by producer.' },
  report: {
    base: 'producer-splits', titleShort: 'Write the producer split worklist',
    title: { en: 'Producer commission splits', de: 'Courtage-Aufteilung nach Vermittler', fr: 'Partage des commissions par producteur', es: 'Reparto de comisiones por productor', pt: 'Divisão de comissões por produtor', it: 'Ripartizione provvigioni per produttore', ja: '募集人別の手数料配分', zh: '业务员佣金分成', ko: '설계사별 수수료 배분' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'producer', 'kind', 'share', 'split_pct', 'commission', 'expected', 'paid', 'difference', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'producer', 'kind', 'split_pct', 'commission', 'expected', 'paid', 'difference', 'detail'],
    sections: (o) => [{ title: sectionTitle('by_producer'), rows: o.by_producer, columns: ['producer', 'policies', 'expected', 'paid', 'difference'] }],
    limits: ['Shares are worked out from the commission in the received file and your split schedule; draws, bonuses, advances and payroll taxes are not part of it.'],
  },
  refused: [
    { name: 'payroll_adjust', category: 'move_money', description: 'It never changes producer pay or payroll; your bookkeeper does after review.' },
    { name: 'producer_statement_send', category: 'binding_send', description: 'It never sends producer statements.' },
  ],
});
