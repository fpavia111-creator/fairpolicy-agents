import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkLapses, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const files = { policies: { type: 'string', description: 'Policy list from your agency system including cancelled, lapsed and expired policies, with status, dates and cancellation reason' } };
const args = {
  as_of: AS_OF_ARG,
  lookback_days: { type: 'integer', minimum: 7, maximum: 730, description: 'Policies that ended this many days back are checked (default 90)' },
  reinstate_days: { type: 'integer', minimum: 0, maximum: 120, description: 'Days after a non-payment cancellation when the agency still calls about reinstatement (default 30; your carriers\' rules decide)' },
  replace_window_days: { type: 'integer', minimum: 0, maximum: 180, description: 'A new policy for the same client and line that started up to this many days before the end date counts as a replacement (default 45)' },
};
const run = (a, ctx) => checkLapses(ctx.records(a.policies, 'policies'), { asOf: asOf(a), lookbackDays: a.lookback_days ?? 90, reinstateDays: a.reinstate_days ?? 30, replaceWindowDays: a.replace_window_days ?? 45 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-lapsed-policies', version: pkg.version, prefix: 'lapses', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency service manager',
  description: 'Finds policies cancelled, lapsed or expired in the last 90 days and sorts them: non-payment cancellations still inside a reinstatement window, clients with no replacement policy for that line, policies shown active but past expiration with no renewal record, and those replaced. Personal lines first. It never reinstates, rewrites or advises a client; a person calls.',
  files, args, required: ['policies'], statuses: STATUSES,
  sources: { policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES } },
  run, summary: summaryLine,
  check: { title: 'Find lapsed and cancelled policies', description: 'Each policy that ended in the window: how and when it ended, the replacement if there is one, and a status (reinstatement_window, not_replaced, expired_no_renewal_record, replaced).' },
  report: {
    base: 'lapsed-policies', titleShort: 'Write the lapse call list',
    title: { en: 'Lapsed and cancelled policies', de: 'Abgelaufene und stornierte Verträge', fr: 'Polices échues et résiliées', es: 'Pólizas vencidas y anuladas', pt: 'Apólices vencidas e canceladas', it: 'Polizze scadute e annullate', ja: '失効・解約された契約', zh: '失效与退保保单', ko: '실효 및 해지 계약' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'policy_status', 'end_date', 'days_since', 'reason', 'premium', 'replacement', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'line', 'policy_status', 'end_date', 'days_since', 'reason', 'replacement', 'csr'],
    limits: ['A replacement is any active policy in your system for the same client name and line. A client insured through another agency is not seen.', 'Reinstatement rules belong to each carrier and state; the window here is your setting.'],
  },
  refused: [
    { name: 'reinstatement_request', category: 'binding_send', description: 'It never asks a carrier to reinstate a policy.' },
    { name: 'client_message_send', category: 'binding_send', description: 'It never contacts a client.' },
  ],
});
