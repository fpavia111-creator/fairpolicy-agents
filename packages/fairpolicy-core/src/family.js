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
export function fairpolicyAgent(spec) {
  const { prefix, key, noun = 'row' } = spec;
  const OUT = `fairpolicy-out/${prefix}`;
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
    prompts: spec.prompts || [defaultPrompt(spec, required, tools)],
    tools,
    policy: { rules },
  });
}

/** The walkthrough prompt an agent ships when it does not write its own. */
function defaultPrompt(spec, required, tools) {
  const { prefix } = spec;
  const never = (spec.refused || []).map((r) => r.description).join(' ');
  const draft = tools.find((t) => /_draft_/.test(t.name)); const req = tools.find((t) => /_request_/.test(t.name));
  return {
    name: `${prefix}_walkthrough`, title: spec.check.title,
    description: `Walks the host model through ${spec.name}: check, explain, write the worklist${draft ? ', and a draft only when asked' : ''}.`,
    arguments: required.map((k) => ({ name: k, description: (spec.files[k] && spec.files[k].description ? spec.files[k].description.split(' (')[0] : k).slice(0, 120), required: true })),
    text: `You are helping ${spec.role || 'an insurance agency\'s staff'} with ${spec.name}. ${required.map((k) => `${k}: {{${k}}}`).join('. ')}.

Rules: ${never} Client names are pseudonyms: never ask for real names in chat. Rates, deadlines and state rules come from the agency's own files and settings, not from you; say so when a result depends on them. Never advise a client on coverage.

1. Call ${prefix}_check. Report the summary, then the rows that need a person, by status.
2. For any row the person asks about, call ${prefix}_explain.
3. Call ${prefix}_write_report so staff have the worklist with real names on their own computer.${draft ? `\n4. Only when the person asks, call ${draft.name}; then ${req.name} after they have read it. A named person clicks; you never send.` : ''}`,
  };
}

/**
 * A demo on the agent's fixtures in a temporary folder: check (one line per row),
 * explain one row, write the report, optionally draft and the one-click approval,
 * then an attempt at a refused tool. d: { title, args, columns: [field...], explain: { key: value },
 * draft: { args, as } }
 */
export async function familyDemo(manifest, fixturesDir, d) {
  const { demoRuntime, printStep } = await import('./demo.js');
  const tools = manifest.tools.map((t) => t.name);
  const prefix = tools[0].split('_')[0];
  const draftTool = tools.find((t) => /_draft_/.test(t)); const reqTool = tools.find((t) => /_request_/.test(t));
  const rt = demoRuntime(manifest, fixturesDir, { mode: 'auto', autoActions: draftTool ? [draftTool] : [] });
  process.stdout.write(`${d.title} demo (fictional agency, carriers and clients) in ${rt.root}\n`);
  const c = await rt.call(`${prefix}_check`, d.args);
  printStep(d.checkLabel || 'Check every row', c);
  if (c.status === 'executed') for (const i of c.result.items || []) process.stdout.write(`    ${(d.columns || []).map((k, n) => String(i[k] ?? '-').slice(0, 22).padEnd(n === 0 ? 16 : 12)).join(' ')} ${i.status}\n`);
  if (d.explain) printStep(d.explainLabel || 'Explain one row', await rt.call(`${prefix}_explain`, { ...d.args, ...d.explain }));
  printStep('Write the worklist (CSV and HTML, real names stay on this computer)', await rt.call(`${prefix}_write_report`, d.args));
  if (draftTool && d.draft) {
    const dr = await rt.call(draftTool, { ...d.args, ...d.draft.args });
    printStep(d.draft.label || 'Write a DRAFT for a person to review', dr);
    if (dr.status === 'executed') {
      const args = { draft: dr.result.draft, draft_sha256: dr.result.draft_sha256, accept_open_issues: true, note: 'Checked by the account manager' };
      const p = await rt.call(reqTool, args);
      printStep('Approve it: waits for a named person even in Auto', p);
      if (p.approval_id) { rt.approvals.approve(p.approval_id, d.draft.as || 'Casey Park (fictional)'); printStep('Same call after the click (recorded; a person sends it)', await rt.call(reqTool, args)); }
    }
  }
  const refused = manifest.tools.find((t) => t.description.startsWith('Listed so agents can see it is refused.'));
  if (refused) printStep(`The agent tries ${refused.name} itself`, await rt.call(refused.name, {}));
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
