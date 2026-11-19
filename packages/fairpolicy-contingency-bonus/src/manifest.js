import { fairpolicyAgent } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkContingency, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const GRID_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['carriers'],
  properties: {
    tolerance: { type: 'number', minimum: 0, maximum: 100000, description: 'Differences this small between estimate and amount received are ok (default 1)' },
    carriers: { type: 'array', maxItems: 500, items: { type: 'object', additionalProperties: false, required: ['carrier', 'tiers'], properties: {
      carrier: { type: 'string', minLength: 1, maxLength: 200 },
      received: { type: 'number', description: 'Bonus received so far for the year checked' },
      note: { type: 'string', maxLength: 500 },
      tiers: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'object', additionalProperties: false, required: ['bonus_pct'], properties: { name: { type: 'string', maxLength: 80 }, min_premium: { type: 'number', minimum: 0 }, max_loss_ratio: { type: 'number', minimum: 0, maximum: 500 }, min_growth_pct: { type: 'number', minimum: -100, maximum: 1000 }, bonus_pct: { type: 'number', minimum: 0, maximum: 50 } } } },
    } } },
  },
};
const EXPERIENCE_FIELDS = {
  carrier: { aliases: ['Carrier', 'Company', 'Insurer', 'Carrier Name'], required: true },
  year: { type: 'number', aliases: ['Year', 'Report Year', 'Calendar Year', 'Contract Year'] },
  written_premium: { type: 'money', aliases: ['Written Premium', 'WP', 'Direct Written Premium', 'Written'], translate: 'premium' },
  earned_premium: { type: 'money', aliases: ['Earned Premium', 'EP', 'Direct Earned Premium', 'Earned'] },
  incurred: { type: 'money', aliases: ['Incurred Losses', 'Incurred', 'Losses Incurred', 'Incurred Loss', 'Total Incurred'] },
  loss_ratio: { type: 'number', aliases: ['Loss Ratio', 'LR', 'Loss Ratio %', 'Incurred Loss Ratio'] },
};
const files = {
  experience: { type: 'string', description: 'Carrier experience by year (the profit-sharing or agency experience reports carriers send): carrier, year, written and earned premium, incurred losses' },
  grid: { type: 'string', description: 'Bonus grids JSON: each carrier\'s tiers (minimum premium, maximum loss ratio, minimum growth, bonus percent) and any bonus received' },
};
const args = {
  year: { type: 'integer', minimum: 1990, maximum: 2100, description: 'Year to check (default: the latest year in the file)' },
  close_pct: { type: 'number', minimum: 0, maximum: 100, description: 'Flag a carrier as close when the premium needed for the next tier is within this percent of its minimum (default 10)' },
};
const run = (a, ctx) => checkContingency(ctx.records(a.experience, 'experience'), ctx.readJson(a.grid, 'bonus_grid'), { year: a.year, closePct: a.close_pct ?? 10 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-contingency-bonus', version: pkg.version, prefix: 'contingency', key: 'carrier', keyKind: 'carrier', noun: 'carrier',
  role: 'an agency principal tracking carrier profit-sharing',
  description: 'Reads the experience reports carriers send (written and earned premium, incurred losses, by year) against each carrier\'s contingency or profit-sharing grid: which tier is met, the estimated bonus, the premium needed for the next tier, how much more loss the tier can take, and bonuses received below the estimate. An estimate from your files, not the carrier\'s calculation; never moves business.',
  files, args, statuses: STATUSES,
  sources: { experience: { label: 'Carrier experience', args: ['experience'], fields: EXPERIENCE_FIELDS } },
  configSchemas: { bonus_grid: GRID_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Track contingency bonuses', description: 'Each carrier for the year: written premium, growth, loss ratio, the tier met, the estimated bonus, the next tier and what it needs, and a status (received_less, loss_ratio_too_high, close_to_next, below_minimum, qualifies, no_grid).' },
  report: {
    base: 'contingency-bonus', titleShort: 'Write the bonus tracker',
    title: { en: 'Contingency bonus tracker', de: 'Übersicht Bonus- und Gewinnbeteiligungen', fr: 'Suivi des commissions de résultat', es: 'Seguimiento de bonos por resultados', pt: 'Acompanhamento de bônus por desempenho', it: 'Monitoraggio dei bonus di risultato', ja: '成績連動ボーナスの追跡', zh: '业绩奖金跟踪', ko: '성과 보너스 추적' },
    columns: ['status', 'carrier', 'year', 'written_premium', 'prior_premium', 'growth_pct', 'earned_premium', 'incurred', 'loss_ratio', 'tier', 'bonus_pct', 'estimated_bonus', 'received', 'next_tier', 'premium_to_next', 'incurred_room', 'detail', 'next_step'],
    htmlColumns: ['status', 'carrier', 'written_premium', 'growth_pct', 'loss_ratio', 'tier', 'estimated_bonus', 'received', 'next_tier', 'premium_to_next', 'detail'],
    limits: ['Carriers define earned premium, incurred losses (with or without IBNR or large-loss caps) and growth in their own contracts. The figures here use the report you loaded and the grid as you typed it; the carrier\'s calculation is the one that pays.', 'Close to the next tier is information for the agency; placing a client is a decision about that client\'s needs, made by a licensed person.'],
  },
  refused: [
    { name: 'carrier_portal_submit', category: 'binding_send', description: 'It never submits anything to a carrier.' },
    { name: 'book_transfer', category: 'production_deploy', description: 'It never moves policies between carriers.' },
  ],
});
