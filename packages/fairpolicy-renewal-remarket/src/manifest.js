import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkRenewals, summaryLine, STATUSES, REVIEW_WORDS, REMARKET_WORDS } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const RENEWAL_POLICY_FIELDS = { ...POLICY_FIELDS, renewal_premium: { type: 'money', aliases: ['Renewal Premium', 'Renewal Prem', 'New Term Premium', 'Renewal Offer', 'Proposed Premium'], translate: false } };
export const ACTIVITY_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  client: { aliases: ['Account Name', 'Client Name', 'Customer Name', 'Insured', 'Regarding'] },
  date: { type: 'date', aliases: ['Date', 'Activity Date', 'Created', 'Created Date', 'Completed Date', 'Due Date'], required: true },
  type: { aliases: ['Activity Type', 'Activity Code', 'Type', 'Category', 'Action'] },
  description: { aliases: ['Description', 'Subject', 'Notes', 'Summary', 'Note'] },
};
const words = (d) => ({ type: 'array', maxItems: 40, items: { type: 'string', minLength: 2, maxLength: 60 }, description: d });
const files = {
  policies: { type: 'string', description: 'Expiration or policy list from your agency system, with the renewal premium if your system has it' },
  activities: { type: 'string', description: 'Activity or notes export (policy or client, date, activity type, description) for the last few months' },
};
const args = {
  as_of: AS_OF_ARG,
  window_days: { type: 'integer', minimum: 7, maximum: 365, description: 'Policies expiring within this many days are checked (default 120)' },
  urgent_days: { type: 'integer', minimum: 1, maximum: 180, description: 'Expiring within this many days with no review is urgent (default 45)' },
  increase_pct: { type: 'number', minimum: 0, maximum: 500, description: 'A renewal premium up by this percent or more needs a remarket logged (default 10)' },
  review_words: words('Words in an activity that mean a renewal review (default: renewal review, remarket, quote, marketing, submission ...)'),
  remarket_words: words('Words that mean the account was remarketed (default: remarket, quote, marketing, submission ...)'),
};
const run = (a, ctx) => checkRenewals(ctx.records(a.policies, 'policies'), ctx.records(a.activities, 'activities'), { asOf: asOf(a), windowDays: a.window_days ?? 120, urgentDays: a.urgent_days ?? 45, increasePct: a.increase_pct ?? 10, reviewWords: a.review_words || REVIEW_WORDS, remarketWords: a.remarket_words || REMARKET_WORDS });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-renewal-remarket', version: pkg.version, prefix: 'renewals', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency service manager',
  description: 'Lists the policies renewing in the next 120 days that have no renewal review in your activity log, the ones expiring within 45 days with nothing logged, and renewals whose premium goes up 10% or more with no remarket logged, by account manager. It never quotes, binds or recommends a carrier; a licensed person decides.',
  files, args, required: ['policies', 'activities'], statuses: STATUSES,
  sources: { policies: { label: 'Policy or expiration list', args: ['policies'], fields: RENEWAL_POLICY_FIELDS, profiles: POLICY_PROFILES }, activities: { label: 'Activity log', args: ['activities'], fields: ACTIVITY_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Check upcoming renewals', description: 'Each policy renewing in the window: days left, premium change, last renewal activity and a status (urgent_no_review, increase_not_remarketed, no_review, reviewed). Totals by account manager.' },
  report: {
    base: 'renewal-remarket', titleShort: 'Write the renewal worklist',
    title: { en: 'Renewals without a review or remarket', de: 'Verlängerungen ohne Prüfung oder Neuausschreibung', fr: 'Renouvellements sans revue ni remise en concurrence', es: 'Renovaciones sin revisión ni recotización', pt: 'Renovações sem revisão nem recotação', it: 'Rinnovi senza revisione né nuova quotazione', ja: '見直しや再見積のない更新', zh: '未复核或未重新询价的续保', ko: '검토나 재견적이 없는 갱신' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'expiration_date', 'days_left', 'premium', 'renewal_premium', 'change_pct', 'last_activity', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'line', 'expiration_date', 'days_left', 'premium', 'renewal_premium', 'change_pct', 'csr'],
    sections: (o) => [{ title: { en: 'By account manager', de: 'Nach Sachbearbeiter', fr: 'Par gestionnaire', es: 'Por gestor', pt: 'Por atendente', it: 'Per gestore', ja: '事務担当別', zh: '按客服', ko: '사무담당별' }, rows: o.by_csr, columns: ['csr', 'count', 'premium'] }],
    limits: ['A review counts when an activity on the policy (or on the client with no policy named) in the 150 days before expiration contains one of the review words. Activities logged elsewhere are not seen.', 'Whether to remarket a renewal is a judgement about the client\'s needs; the list shows what is not recorded, not what to do.'],
  },
  refused: [
    { name: 'carrier_submission_send', category: 'binding_send', description: 'It never sends a submission or quote request to a carrier.' },
    { name: 'policy_bind', category: 'binding_send', description: 'It never binds, renews or non-renews a policy.' },
  ],
});
