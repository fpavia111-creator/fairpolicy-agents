import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkTimelines, summaryLine, STATUSES, DEFAULT_MILESTONES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const TIMELINE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['milestones'],
  properties: { milestones: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'object', additionalProperties: false, required: ['name', 'days_before'], properties: { name: { type: 'string', pattern: '^[a-z][a-z0-9_]{1,40}$' }, label: { type: 'string', maxLength: 120 }, days_before: { type: 'integer', minimum: 0, maximum: 365 } } } } },
};
const MILESTONE_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  milestone: { aliases: ['Milestone', 'Step', 'Task', 'Activity Code', 'Activity'], required: true },
  completed_date: { type: 'date', aliases: ['Completed Date', 'Completed', 'Date Completed', 'Done', 'Date'] },
};
const files = {
  policies: { type: 'string', description: 'Policy or expiration list from your agency system (commercial lines are picked out by line of business)' },
  milestones: { type: 'string', description: 'Renewal milestones recorded so far: policy, milestone name (loss_runs, exposures, submissions, quotes, proposal, bind_order or your own) and completed date' },
};
const args = { as_of: AS_OF_ARG, schedule: { type: 'string', description: 'Optional milestone schedule JSON (name and days before expiration); default loss runs 120, exposures 90, submissions 75, quotes 30, proposal 21, client decision 7' } };
const run = (a, ctx) => checkTimelines(ctx.records(a.policies, 'policies'), ctx.records(a.milestones, 'milestones'), { asOf: asOf(a), milestones: a.schedule ? ctx.readJson(a.schedule, 'renewal_schedule').milestones : DEFAULT_MILESTONES });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-commercial-renewals', version: pkg.version, prefix: 'timeline', key: 'policy_number', keyKind: 'policy', noun: 'renewal',
  role: 'a commercial lines account manager',
  description: 'Builds a renewal timeline for every commercial policy expiring in the next 150 days, counted back from expiration (loss runs, exposures, submissions, quotes, proposal, client decision, or your own schedule), and lists the renewals with overdue milestones, milestones due this week, and those on track. Never sends a submission or binds.',
  files, args, required: ['policies', 'milestones'], statuses: STATUSES,
  sources: { policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES }, milestones: { label: 'Renewal milestones', args: ['milestones'], fields: MILESTONE_FIELDS } },
  configSchemas: { renewal_schedule: TIMELINE_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Check commercial renewal timelines', description: 'Each commercial renewal: days left, milestones done, overdue milestones, the next milestone and its date, and a status (overdue, due_this_week, on_track, complete).' },
  report: {
    base: 'commercial-renewals', titleShort: 'Write the renewal timeline',
    title: { en: 'Commercial renewal timelines', de: 'Zeitpläne für Gewerbeverlängerungen', fr: 'Calendriers des renouvellements entreprises', es: 'Calendario de renovaciones comerciales', pt: 'Cronograma de renovações empresariais', it: 'Tempistiche dei rinnovi aziende', ja: '企業契約の更改スケジュール', zh: '商业险续保时间表', ko: '기업보험 갱신 일정' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'expiration_date', 'days_left', 'premium', 'done', 'of', 'overdue', 'next_milestone', 'next_due', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'line', 'expiration_date', 'days_left', 'done', 'overdue', 'next_milestone', 'next_due'],
    limits: ['Commercial policies are picked out by line of business; an umbrella with no segment column is treated as not commercial.', 'The schedule is your agency\'s; carriers\' own submission deadlines can be earlier.'],
  },
  refused: [
    { name: 'carrier_submission_send', category: 'binding_send', description: 'It never sends a submission to a carrier.' },
    { name: 'policy_bind', category: 'binding_send', description: 'It never binds or renews a policy.' },
  ],
});
