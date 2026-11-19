import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, AS_OF_ARG, asOf, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkRetention, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { policies: { type: 'string', description: 'Policy list with every term (active, expired, cancelled, non-renewed) for at least the last year and a half, with producer, line, carrier, dates and premium' } };
const args = {
  as_of: AS_OF_ARG,
  months: { type: 'integer', minimum: 1, maximum: 36, description: 'Length of the period ending on as_of (default 12)' },
  target: { type: 'number', minimum: 0, maximum: 100, description: 'Retention target in percent (default 85)' },
  min_terms: { type: 'integer', minimum: 1, maximum: 1000, description: 'Fewer renewals than this is too few to judge (default 5)' },
};
const run = (a, ctx) => checkRetention(ctx.records(a.policies, 'policies'), { asOf: asOf(a), months: a.months ?? 12, target: a.target ?? 85, minTerms: a.min_terms ?? 5 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-producer-retention', version: pkg.version, prefix: 'retention', key: 'producer', keyKind: 'producer', noun: 'producer',
  role: 'an agency principal or sales manager',
  description: 'Works out retention from your policy terms: of the policies that came up for renewal or were cancelled in the last 12 months, how many renewed (same policy number, or a new policy for the same client and line), by count and by premium, for each producer, line and carrier, with the lost policies and their reasons. Never contacts a client.',
  files, args, required: ['policies'], statuses: STATUSES,
  sources: { policies: { label: 'Policy terms', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES } },
  run, summary: summaryLine,
  check: { title: 'Measure retention by producer', description: 'Each producer: terms due, renewed, retention by count and premium, lost policies with reasons, and a status (below_target, too_few, at_target). Also by line, by carrier and lost reasons.' },
  report: {
    base: 'producer-retention', titleShort: 'Write the retention report',
    title: { en: 'Retention by producer', de: 'Bestandserhalt nach Vermittler', fr: 'Taux de conservation par producteur', es: 'Retención por productor', pt: 'Retenção por produtor', it: 'Mantenimento del portafoglio per produttore', ja: '募集人別の継続率', zh: '按业务员的续保率', ko: '설계사별 유지율' },
    columns: ['status', 'producer', 'due', 'renewed', 'retention_pct', 'premium_due', 'premium_renewed', 'premium_retention_pct', 'lost', 'lost_policies', 'detail', 'next_step'],
    htmlColumns: ['status', 'producer', 'due', 'renewed', 'retention_pct', 'premium_retention_pct', 'lost_policies'],
    sections: (o) => [{ title: sectionTitle('by_line'), rows: o.by_line, columns: ['line', 'due', 'renewed', 'retention_pct', 'premium_retention_pct'] }, { title: sectionTitle('by_carrier'), rows: o.by_carrier, columns: ['carrier', 'due', 'renewed', 'retention_pct', 'premium_retention_pct'] }, { title: { en: 'Lost reasons', de: 'Verlustgründe', fr: 'Motifs de perte', es: 'Motivos de pérdida', pt: 'Motivos de perda', it: 'Motivi di perdita', ja: '失注理由', zh: '流失原因', ko: '이탈 사유' }, rows: o.lost_reasons, columns: ['reason', 'count'] }],
    limits: ['A term counts as renewed when a later term with the same policy number, or a policy for the same client and line, starts within 45 days of its expiration. A rewrite under another name is counted as lost.', 'Agencies measure retention in different ways; this is one plain method, stated so it can be compared from year to year.'],
  },
  refused: [
    { name: 'producer_pay_adjust', category: 'move_money', description: 'It never changes producer pay or bonuses.' },
    { name: 'client_message_send', category: 'binding_send', description: 'It never contacts a client.' },
  ],
});
