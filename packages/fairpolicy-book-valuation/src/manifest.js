import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { summarizeBook, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const BOOK_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    top_carrier_limit_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Flag when one carrier pays more than this share of commission (default 40)' },
    largest_client_limit_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Flag when one client is more than this share (default 10)' },
    top_10_limit_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Flag when the ten largest clients are more than this share (default 25)' },
    missing_commission_limit_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Flag when more than this share of policies has no commission or rate (default 5)' },
    revenue_multiple_low: { type: 'number', minimum: 0, maximum: 20, description: 'A low revenue multiple you choose; the agent only multiplies' },
    revenue_multiple_high: { type: 'number', minimum: 0, maximum: 20, description: 'A high revenue multiple you choose' },
  },
};
const files = { policies: { type: 'string', description: 'Policy list of the whole book from your agency system, with client, line, carrier, premium and commission or commission rate' } };
const args = { settings: { type: 'string', description: 'Optional settings JSON: concentration limits and, only if you want a range, the low and high revenue multiples you choose' } };
const run = (a, ctx) => summarizeBook(ctx.records(a.policies, 'policies'), a.settings ? ctx.readJson(a.settings, 'book_settings') : {});

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-book-valuation', version: pkg.version, prefix: 'book', key: 'metric', keyKind: 'metric', noun: 'figure',
  role: 'an agency principal preparing for a valuation, perpetuation or sale conversation',
  description: 'Summarises the book of business from your policy list: annual commission and premium in force, accounts and policies per account, personal and commercial mix, revenue by carrier and line, the largest clients, and concentration and missing-data figures to watch. With multiples you choose it shows the arithmetic range; it is not an appraisal and gives no price.',
  files, args, required: ['policies'], statuses: STATUSES,
  sources: { policies: { label: 'Policy list (whole book)', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES } },
  configSchemas: { book_settings: BOOK_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Summarise the book of business', description: 'Book figures with a status (watch, info, ok), plus revenue by carrier and line and the ten largest clients.' },
  explain: { title: 'Explain one figure', description: 'One figure with how it was worked out.' },
  report: {
    base: 'book-valuation', titleShort: 'Write the book summary',
    title: { en: 'Book of business summary', de: 'Bestandsübersicht', fr: 'Synthèse du portefeuille', es: 'Resumen de la cartera', pt: 'Resumo da carteira', it: 'Sintesi del portafoglio', ja: '保有契約の概要', zh: '业务组合概览', ko: '보유 계약 요약' },
    columns: ['status', 'metric', 'value', 'detail'],
    sections: (o) => [{ title: sectionTitle('by_carrier'), rows: o.by_carrier, columns: ['carrier', 'policies', 'premium', 'revenue', 'revenue_share_pct'] }, { title: sectionTitle('by_line'), rows: o.by_line, columns: ['line', 'policies', 'premium', 'revenue', 'revenue_share_pct'] }, { title: sectionTitle('by_client'), rows: o.top_clients, columns: ['client', 'policies', 'premium', 'revenue', 'revenue_share_pct'] }],
    limits: ['Commission is what your agency system books on the policies in force, not cash received, contingencies, fees or overrides.', 'A valuation depends on retention, growth, profitability, contracts and the market; these figures are inputs for that conversation with a qualified adviser, not a value.'],
  },
  refused: [
    { name: 'book_transfer', category: 'production_deploy', description: 'It never moves policies or books between agencies or producers.' },
    { name: 'data_room_upload', category: 'binding_send', description: 'It never uploads or sends your book to anyone.' },
  ],
});
