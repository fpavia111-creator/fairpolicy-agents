// The shape every Fairpolicy agent shares, so each package only writes its own job:
//
//   <prefix>_check         read    run the check on your files and return every row with a status
//   <prefix>_explain       read    one row in full, found by its key (or its pseudonym)
//   <prefix>_write_report  report  CSV + HTML worklist in the report language
//   <prefix>_draft_<noun>  write   optional: a DRAFT note for one named person (asks first)
//   <prefix>_request_<verb> action optional: one named human click records the approval, even in Auto
//   memory tools           optional: learn / accept / retire facts about this agency's setup
//   refused tools          listed so a model can see they exist and are refused
//
// The agent still owns its manifest: this only builds it from a spec, the same way
// for every agent, and the policy is always allow (reads), ask (drafts and clicks),
// block (refused tools and anything not listed).
import { defineManifest } from './manifest.js';
import { MODEL_PIN, reportTool, refusedTools, draftPair, findItem, page, LIMITS } from './kit.js';
import { memoryTools } from './memory.js';
import { sectionTitle } from './report-text.js';

const LIMIT_ARG = { type: 'integer', minimum: 1, maximum: 5000, description: 'Most rows to return (the report file always has all of them)' };

/**
 * spec: {
 *   name, version, description, prefix, noun ('policy'), key ('policy_number'), keyKind ('policy'),
 *   files: { arg: schema }, required: [arg], args: { extra arg: schema },
 *   sources, configSchemas, argDocs, prompts, memory: KINDS,
 *   run(a, ctx) → { rows: [{ [key], status, ... }], ...totals },
 *   summary(out) → string, statuses: [status],
 *   check: { title, description }, explain: { title, description },
 *   report: { base, title, description, columns, htmlColumns, labels, sections(out) → [...], limits: [...], rows(out) → rows },
 *   draft: draftPair config without prefix/outDir (build gets (a, ctx, out)),
 *   refused: [{ name, category, description }],
 * }
 */
export function fresnelAgent(spec) {
  const { prefix, key, noun = 'row' } = spec;
  const OUT = `fresnel-out/${prefix}`;
  const fileArgs = { ...spec.files, ...(spec.args || {}) };
  const required = spec.required || Object.keys(spec.files || {});
  const run = (a, ctx) => spec.run(a, ctx);
  const tools = [];
  const rules = [];
  const statusArg = spec.statuses ? { status: { type: 'string', enum: spec.statuses, description: `Only ${noun}s with this status` } } : {};
  tools.push({
    name: `${prefix}_check`, kind: 'read', title: spec.check.title, description: spec.check.description,
    inputSchema: { type: 'object', additionalProperties: false, required, properties: { ...fileArgs, ...statusArg, limit: LIMIT_ARG } },
    handler: async (a, ctx) => {
      const out = run(a, ctx); const { rows, ...rest } = out;
      return { summary: spec.summary(out), ...rest, ...page(a.status ? rows.filter((r) => r.status === a.status) : rows, a.limit || 200) };
    },
  });
  rules.push({ tool: `${prefix}_check`, decision: 'allow' });
  if (key) {
    tools.push({
      name: `${prefix}_explain`, kind: 'read', title: (spec.explain && spec.explain.title) || `Explain one ${noun}`,
      description: (spec.explain && spec.explain.description) || `Show one ${noun} from ${prefix}_check in full: its status, every finding and the figures behind it.`,
      inputSchema: { type: 'object', additionalProperties: false, required: [...required, key], properties: { ...fileArgs, [key]: { type: 'string', description: `The ${key.replace(/_/g, ' ')} from ${prefix}_check (a pseudonym is accepted)` } } },
      handler: async (a, ctx) => {
        const out = run(a, ctx);
        const r = findItem(out.rows, key, a[key], ctx, { kind: spec.keyKind || 'policy', label: noun });
        const extra = spec.explainExtra ? spec.explainExtra(r, out, a, ctx) : {};
        return { summary: `${r[key]}: ${r.status}.${r.detail ? ` ${r.detail}` : ''}${r.next_step ? ` Next: ${r.next_step}` : ''}`, [noun]: r, ...extra };
      },
    });
    rules.push({ tool: `${prefix}_explain`, decision: 'allow' });
  }
  const rep = spec.report;
  tools.push(reportTool({
    name: `${prefix}_write_report`, title: rep.titleShort || 'Write the worklist', outDir: OUT, base: rep.base,
    description: rep.description || `Write ${rep.base}.csv (every ${noun} with its status and the figures behind it, plus blank owner and notes columns) and ${rep.base}.html into out_dir (default ${OUT}). The files keep real client names for your staff.`,
    properties: fileArgs, required,
    build: (a, ctx) => {
      const out = run(a, ctx);
      const rows = (rep.rows ? rep.rows(out) : out.rows).map((r) => ({ ...r, owner: '', notes: '' }));
      const columns = [...rep.columns, 'owner', 'notes'];
      return {
        title: rep.title, intro: spec.summary(out), rows, columns, htmlColumns: rep.htmlColumns || rep.columns, labels: rep.labels || {},
        summary: `${typeof rep.title === 'object' ? rep.title.en : rep.title} written: ${spec.summary(out)}`,
        sections: [
          ...(out.by_status ? [{ title: sectionTitle('by_status'), rows: Object.entries(out.by_status).map(([k, v]) => ({ status: k, count: v })), columns: ['status', 'count'] }] : []),
          ...(rep.sections ? rep.sections(out) : []),
        ],
        limits: [LIMITS.files, ...(rep.limits || []), LIMITS.phi, LIMITS.advice],
      };
    },
  }));
  rules.push({ tool: `${prefix}_write_report`, decision: 'allow' });
  if (spec.draft) {
    const d = spec.draft;
    const pair = draftPair({ ...d, prefix, outDir: OUT, args: { ...fileArgs, ...(d.args || {}) }, required: [...required, ...(d.required || [])], build: (a, ctx) => d.build(a, ctx, run(a, ctx)) });
    tools.push(...pair.tools); rules.push(...pair.rules);
  }
  let mem = null;
  if (spec.memory) { mem = memoryTools(prefix, spec.memory); tools.push(...mem.tools); rules.push(...mem.rules); }
  const refused = refusedTools(spec.refused || []);
  tools.push(...refused.tools); rules.push(...refused.rules);
  rules.push({ tool: '*', decision: 'block', reason: `Not on the ${prefix[0].toUpperCase() + prefix.slice(1)} allowlist.` });
  return defineManifest({
    name: spec.name, version: spec.version, description: spec.description,
    model: MODEL_PIN, caps: { maxSteps: 60, maxSpendUsd: 0 },
    ...(spec.memory ? { memory: { prefix, kinds: spec.memory } } : {}),
    ...(spec.configSchemas ? { configSchemas: spec.configSchemas } : {}),
    sources: spec.sources || {},
    argDocs: spec.argDocs || {},
    prompts: spec.prompts || [],
    tools,
    policy: { rules },
  });
}

/** Count rows by status into { status: n }, in the order of `order`, leaving out zeros. */
export function countBy(rows, order = [], field = 'status') {
  const m = {}; for (const s of order) m[s] = 0;
  for (const r of rows) m[r[field]] = (m[r[field]] || 0) + 1;
  return Object.fromEntries(Object.entries(m).filter(([, v]) => v > 0));
}

/** Sort rows so the statuses that need a person come first, in the order given. */
export function byPriority(rows, order, field = 'status') {
  const rank = new Map(order.map((s, i) => [s, i]));
  return [...rows].sort((x, y) => (rank.get(x[field]) ?? 99) - (rank.get(y[field]) ?? 99));
}
