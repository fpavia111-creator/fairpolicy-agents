import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, COMMISSION_FIELDS, COMMISSION_PROFILES, AS_OF_ARG, asOf, sectionTitle, sameCarrier } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { findMissing, summaryLine, requestText, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = {
  policies: { type: 'string', description: 'Policy list exported from your agency system with policy number, carrier, effective date, premium, commission rate and bill type' },
  statements: { type: 'string', description: 'Commission statement lines for the same months, all carriers in one file (CSV, Excel or JSON)' },
};
const args = {
  as_of: AS_OF_ARG,
  grace_days: { type: 'integer', minimum: 0, maximum: 365, description: 'Days after the effective date before a missing commission is flagged (default 45)' },
  lookback_days: { type: 'integer', minimum: 30, maximum: 1100, description: 'How far back to look at effective dates (default 365)' },
};
const run = (a, ctx) => findMissing(ctx.records(a.policies, 'policies'), ctx.records(a.statements, 'statements'), { asOf: asOf(a), graceDays: a.grace_days ?? 45, lookbackDays: a.lookback_days ?? 365 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-missing-commissions', version: pkg.version, prefix: 'missing', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency accounting lead',
  description: 'Finds direct-bill policies written or renewed in the last year that never appeared on a carrier commission statement, and the ones paid only on endorsements, with the commission you expected, by carrier and producer. Agency-bill and flat-cancelled policies are set aside. Drafts a request to one carrier for a named person to send; never posts or sends.',
  files, args, required: ['policies', 'statements'], statuses: STATUSES,
  sources: {
    policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES },
    statements: { label: 'Commission statement lines', args: ['statements'], fields: COMMISSION_FIELDS, profiles: COMMISSION_PROFILES },
  },
  run, summary: summaryLine,
  check: { title: 'Find missing commissions', description: 'Every policy effective in the window: missing (no statement line after the wait), partial (endorsements only), not_yet_due, agency_bill, cancelled_flat or received, with the commission expected from the premium and the rate booked on the policy. Totals by carrier and producer.' },
  report: {
    base: 'missing-commissions', titleShort: 'Write the missing-commission worklist',
    title: { en: 'Missing commissions', de: 'Fehlende Courtagen', fr: 'Commissions manquantes', es: 'Comisiones no recibidas', pt: 'Comissões não recebidas', it: 'Provvigioni mancanti', ja: '未受領の手数料', zh: '未收到的佣金', ko: '미수령 수수료' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'effective_date', 'premium', 'commission_rate', 'expected', 'received', 'days_since_effective', 'producer', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'line', 'effective_date', 'premium', 'expected', 'received', 'producer', 'detail'],
    sections: (o) => [{ title: sectionTitle('by_carrier'), rows: o.by_carrier, columns: ['carrier', 'count', 'expected'] }, { title: sectionTitle('by_producer'), rows: o.by_producer, columns: ['producer', 'count', 'expected'] }],
    limits: ['A policy counts as paid when any new or renewal line for it is on the statements you give; load every carrier\'s statements for the months since the effective date.', 'Expected commission uses the rate booked on the policy in your agency system.'],
  },
  draft: {
    noun: 'request', verb: 'send', category: 'binding_send', actor: 'a person at your agency', title: 'Draft a missing-commission request',
    description: 'Write drafts/request-<carrier>.md asking one carrier about its policies with no commission, with the premium and the commission expected. Marked DRAFT. Sending goes through missing_request_send (one click).',
    required: ['carrier'],
    args: { carrier: { type: 'string', description: 'Carrier as named in the policy list' }, from: { type: 'string', description: 'Your name and agency' }, contact: { type: 'string', description: 'Carrier commission contact' } },
    build: (a, ctx, o) => {
      const items = o.rows.filter((r) => (r.status === 'missing' || r.status === 'partial') && sameCarrier(r.carrier, a.carrier));
      if (!items.length) throw new Error(`no missing commissions for "${a.carrier}"`);
      const d = requestText(items, a);
      return { id: items[0].carrier, to: a.contact, text: d.text, amount: d.total, extra: { policies: items.length } };
    },
  },
  refused: [
    { name: 'ams_post_commission', category: 'move_money', description: 'It never posts commission or receivable entries in your agency system.' },
    { name: 'email_send', category: 'binding_send', description: 'It never sends e-mail; a person sends the approved request.' },
  ],
});
