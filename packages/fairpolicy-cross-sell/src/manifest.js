import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, LINES, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { findGaps, summaryLine, STATUSES, DEFAULT_RULES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const CODES = { type: 'array', maxItems: 20, items: { type: 'string', enum: Object.keys(LINES) } };
export const RULES_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    rules: { type: 'array', maxItems: 40, items: { type: 'object', additionalProperties: false, required: ['name', 'label'], properties: { name: { type: 'string', pattern: '^[a-z][a-z0-9_]{1,40}$' }, label: { type: 'string', maxLength: 200 }, has_all: CODES, has_any: CODES, missing_all: CODES } } },
    line_aliases: { type: 'object', additionalProperties: { type: 'string', enum: Object.keys(LINES) } },
  },
};
export const MEMORY_KINDS = Object.freeze({
  line_alias: {
    description: 'A line-of-business code your agency system uses and which line it is, e.g. {"code": "PKGHO", "line": "home"}.',
    effect: 'reads policies with that code as that line, so their accounts are grouped correctly. It changes how lines are read only.',
    schema: { type: 'object', additionalProperties: false, required: ['code', 'line'], properties: { code: { type: 'string', minLength: 1, maxLength: 60 }, line: { type: 'string', enum: Object.keys(LINES) } } },
  },
});
const files = { policies: { type: 'string', description: 'Policy list from your agency system (all clients, all lines), with client name or code, line of business and status' } };
const args = { rules: { type: 'string', description: 'Optional rules JSON: the line combinations your agency wants to look for (default: auto without home, home without auto, no personal umbrella, GL or BOP without workers comp, commercial auto without umbrella)' } };
const run = (a, ctx) => {
  const cfg = a.rules ? ctx.readJson(a.rules, 'cross_sell_rules') : {};
  const lineAliases = { ...(cfg.line_aliases || {}) };
  for (const f of ctx.memoryFacts('line_alias')) lineAliases[f.value.code] = f.value.line;
  return findGaps(ctx.records(a.policies, 'policies'), { rules: cfg.rules || DEFAULT_RULES, lineAliases });
};

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-cross-sell', version: pkg.version, prefix: 'crosssell', key: 'client', keyKind: 'name', noun: 'account',
  role: 'an agency sales or service manager',
  description: 'Groups your active policies by client and lists accounts with only one line, and accounts where a line combination your agency looks for is not written (auto without home, no umbrella, GL without workers comp, and your own rules), by producer, with the next renewal date. A review list for licensed staff; it never contacts a client or recommends coverage.',
  files, args, required: ['policies'], statuses: STATUSES,
  sources: { policies: { label: 'Policy list', args: ['policies'], fields: POLICY_FIELDS, profiles: POLICY_PROFILES } },
  configSchemas: { cross_sell_rules: RULES_SCHEMA },
  memory: MEMORY_KINDS,
  run, summary: summaryLine,
  check: { title: 'Find monoline accounts and line gaps', description: 'Each active account: its lines, premium, the rules it meets, the next renewal and a status (monoline, gaps, rounded). Totals by rule and producer.' },
  explain: { title: 'Explain one account', description: 'One account in full: its lines, policies, premium and the rules it meets. The client can be given by name or pseudonym.' },
  report: {
    base: 'cross-sell', titleShort: 'Write the account review list',
    title: { en: 'Account review list: one line and line gaps', de: 'Kundenprüfliste: eine Sparte und Lücken', fr: 'Liste de revue : monoéquipés et branches manquantes', es: 'Lista de revisión: un solo ramo y ramos ausentes', pt: 'Lista de revisão: um só ramo e ramos ausentes', it: 'Elenco revisione: monoramo e rami mancanti', ja: '見直しリスト：単一種目と未付帯種目', zh: '客户复核清单：单一险种与缺口', ko: '고객 검토 목록: 단일 보종과 공백' },
    columns: ['status', 'client', 'client_id', 'lines', 'policies', 'premium', 'gaps', 'next_renewal', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'lines', 'policies', 'premium', 'gaps', 'next_renewal', 'producer'],
    sections: (o) => [{ title: sectionTitle('by_rule'), rows: o.by_rule, columns: ['rule', 'label', 'count'] }, { title: sectionTitle('by_producer'), rows: o.by_producer, columns: ['producer', 'accounts', 'monoline', 'with_gaps'] }],
    limits: ['Accounts are grouped by client name (legal forms ignored) or client code. A household under two names shows as two accounts.', 'A missing line means it is not written by your agency; the client may have it elsewhere or may not need it. Only a licensed person, talking with the client, decides what to offer.'],
  },
  refused: [
    { name: 'marketing_email_send', category: 'binding_send', description: 'It never sends marketing or contacts a client.' },
    { name: 'quote_create', category: 'binding_send', description: 'It never creates a quote or an application.' },
  ],
});
