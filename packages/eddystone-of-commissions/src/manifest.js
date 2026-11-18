import { fresnelAgent, POLICY_FIELDS, POLICY_PROFILES, COMMISSION_FIELDS, COMMISSION_PROFILES, ALIASES_SCHEMA, sectionTitle, sameCarrier } from 'fresnel-core';
import { readFileSync } from 'node:fs';
import { checkStatement, summaryLine, inquiryText, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

export const SCHEDULE_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['rates'],
  properties: {
    tolerance: { type: 'number', minimum: 0, maximum: 1000, description: 'Differences this small are ok (default 1.00)' },
    rates: { type: 'array', maxItems: 5000, items: { type: 'object', additionalProperties: false, required: ['carrier', 'rate'], properties: { carrier: { type: 'string', minLength: 1, maxLength: 200 }, line: { type: 'string', maxLength: 100 }, kind: { type: 'string', enum: ['new', 'renewal', 'any'] }, rate: { type: 'number', minimum: 0, maximum: 100 }, note: { type: 'string', maxLength: 300 } } } },
    ...ALIASES_SCHEMA,
  },
};

export const MEMORY_KINDS = Object.freeze({
  carrier_alias: {
    description: 'Another name a carrier\'s statement uses for a carrier in your schedule, e.g. {"alias": "EXM Statement Svcs", "carrier": "Example Mutual"}.',
    effect: 'matches statement lines under that name to the carrier\'s rates. It changes matching only; every line is still checked.',
    schema: { type: 'object', additionalProperties: false, required: ['alias', 'carrier'], properties: { alias: { type: 'string', minLength: 2, maxLength: 120 }, carrier: { type: 'string', minLength: 2, maxLength: 120 } } },
  },
});

const files = {
  statement: { type: 'string', description: 'Carrier commission statement under --root (CSV, Excel, JSON; PDF statements pasted or exported to CSV) with policy number, transaction, premium and commission' },
  policies: { type: 'string', description: 'Policy list exported from your agency system (Applied Epic, AMS360, Sagitta, HawkSoft, EZLynx, QQCatalyst or any CSV) with policy number, carrier, line and premium' },
  schedule: { type: 'string', description: 'Commission schedule JSON: expected rate by carrier, line and new or renewal, plus a tolerance' },
};
const run = (a, ctx) => {
  const schedule = ctx.readJson(a.schedule, 'commission_schedule');
  const aliases = { ...(schedule.carrier_aliases || {}) };
  for (const f of ctx.memoryFacts('carrier_alias')) aliases[f.value.alias] = f.value.carrier;
  return checkStatement(ctx.records(a.statement, 'statement'), ctx.records(a.policies, 'policies'), { ...schedule, carrier_aliases: aliases });
};

export const manifest = fresnelAgent({
  name: 'eddystone-of-commissions', version: pkg.version, prefix: 'eddystone', key: 'policy_number', keyKind: 'policy', noun: 'line',
  description: 'Checks every line of a carrier commission statement against the commission you expect on that policy (your schedule by carrier, line and new or renewal, or the rate booked in your agency system) and lists underpaid, overpaid, duplicate and unmatched lines, with totals by carrier. Drafts a commission inquiry for one named person to send; never posts, pays or sends.',
  files, statuses: STATUSES,
  sources: {
    statement: { label: 'Carrier commission statement', args: ['statement'], fields: COMMISSION_FIELDS, profiles: COMMISSION_PROFILES },
    policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES },
  },
  configSchemas: { commission_schedule: SCHEDULE_SCHEMA },
  memory: MEMORY_KINDS,
  run, summary: summaryLine,
  check: { title: 'Check a commission statement', description: 'For each statement line: the policy it belongs to, the expected rate and where it came from, expected and paid commission, the difference and a status (underpaid, possible_duplicate, overpaid, no_policy, no_rate, not_checked, ok). Totals by carrier.' },
  explain: { title: 'Explain one statement line', description: 'One statement line in full: the policy it matched, the rate used and its source, and the arithmetic.' },
  report: {
    base: 'eddystone-commissions', titleShort: 'Write the commission worklist',
    title: { en: 'Commission statement check', de: 'Prüfung der Courtageabrechnung', fr: 'Contrôle du bordereau de commissions', es: 'Revisión de la liquidación de comisiones', pt: 'Conferência do extrato de comissões', it: 'Verifica dell’estratto provvigioni', ja: '手数料精算書の確認', zh: '佣金结算单核对', ko: '수수료 정산서 점검' },
    columns: ['status', 'statement_id', 'carrier', 'policy_number', 'client', 'line', 'transaction_type', 'effective_date', 'premium', 'expected_rate', 'paid_rate', 'expected', 'paid', 'difference', 'producer', 'detail', 'next_step'],
    htmlColumns: ['status', 'carrier', 'policy_number', 'transaction_type', 'premium', 'expected_rate', 'expected', 'paid', 'difference', 'detail'],
    sections: (o) => [{ title: sectionTitle('by_carrier'), rows: o.by_carrier, columns: ['carrier', 'count', 'paid', 'expected', 'short', 'over'] }],
    limits: ['Expected commission is your schedule\'s rate (or the rate booked on the policy) times the premium on the line. Carriers\' contingent, bonus and override payments are not on a policy line and are not checked here.', 'Endorsement, cancellation and audit lines use the policy\'s new or renewal rate when your agency system says which; otherwise the renewal rate.'],
  },
  draft: {
    noun: 'inquiry', verb: 'send', category: 'binding_send', actor: 'a person at your agency',
    title: 'Draft a commission inquiry',
    description: 'Write drafts/inquiry-<carrier>.md asking one carrier about its underpaid statement lines, with the agreed rate, expected and paid amounts and the total short. Marked DRAFT. Sending goes through eddystone_request_send (one click).',
    required: ['carrier'],
    args: { carrier: { type: 'string', description: 'Carrier as named on the statement' }, from: { type: 'string', description: 'Your name and agency' }, contact: { type: 'string', description: 'Carrier accounting or commission contact' } },
    build: (a, ctx, o) => {
      const items = o.rows.filter((r) => r.status === 'underpaid' && sameCarrier(r.carrier, a.carrier));
      if (!items.length) throw new Error(`no underpaid lines for "${a.carrier}"`);
      const d = inquiryText(items, a);
      return { id: items[0].carrier, to: a.contact, text: d.text, amount: d.total, extra: { lines: items.length } };
    },
  },
  refused: [
    { name: 'ams_post_commission', category: 'move_money', description: 'Eddystone never posts receipts or commission entries in your agency system; your accounting staff do.' },
    { name: 'email_send', category: 'binding_send', description: 'Eddystone never sends e-mail; a person sends the approved inquiry.' },
  ],
  argDocs: { tolerance: 'Differences this small are ok' },
  prompts: [{
    name: 'commission_statement_check', title: 'Check this month\'s commission statement',
    description: 'Walks the host model through a commission statement check with Eddystone.',
    arguments: [{ name: 'statement', description: 'Commission statement file', required: true }, { name: 'policies', description: 'Policy list export', required: true }, { name: 'schedule', description: 'Commission schedule JSON', required: true }],
    text: `You are helping an agency accounting lead check a carrier commission statement with eddystone-of-commissions. Statement: {{statement}}. Policies: {{policies}}. Schedule: {{schedule}}.

Rules: Eddystone never posts, pays or sends. Client names are pseudonyms; never ask for real names in chat. Rates come from the agency's schedule, not from you.

1. Call eddystone_check. Report the total short and over, then the lines by status.
2. For no_rate lines, say which carrier and line the schedule is missing.
3. Call eddystone_write_report so accounting has the worklist with real names.
4. Only when the person asks, call eddystone_draft_inquiry for one carrier, then eddystone_request_send after they review it.`,
  }],
});
