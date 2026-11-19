#!/usr/bin/env node
// Accuracy on the fictional fixtures, per agent and for the family (Kurt's review question 1).
//   1. planted set: the demo fixtures. Recall = planted (key, status) pairs found / planted pairs listed in
//      scripts/accuracy-specs.mjs (taken from each fixtures/README.md). Any other finding is "unplanned".
//      A finding is a row whose status is not one of the agent's ok statuses (on time, waiting, done, matching).
//   2. clean set: the same files with every planted problem removed (fixtures/clean/). Every finding there is a
//      false positive.
//   3. mutation cases: one edit to the clean set (one row changed, added or dropped) that must raise one named finding.
// Masking is off here so the keys can be compared with the fixtures; masking itself is checked by the tests.
//
//   node scripts/accuracy.mjs --write [agent ...]   regenerate fixtures/clean/ from the specs, then measure
//   node scripts/accuracy.mjs [agent ...]           measure (exit code 1 when a clean set is stale or a number is off)
//   node scripts/accuracy.mjs --record              also write docs/accuracy-2026-11-19.json and .md
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, parseCsvRows } from '../packages/fairpolicy-core/src/index.js';
import { SPECS } from './accuracy-specs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages');
const argv = process.argv.slice(2);
const write = argv.includes('--write'); const record = argv.includes('--record');
const only = argv.filter((a) => !a.startsWith('--'));
const DATE = '2026-11-19';

// ------------------------------------------------------------------ files ----
const readTable = (file) => { const rows = parseCsvRows(readFileSync(file, 'utf8').replace(/^﻿/, '')).filter((r) => r.some((c) => String(c).trim() !== '')); const head = rows[0]; return { head, rows: rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? '']))) }; };
const cell = (v) => { const s = String(v ?? ''); return /[",\n\r]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const tableText = (t) => [t.head.map(cell).join(','), ...t.rows.map((r) => t.head.map((h) => cell(r[h])).join(','))].join('\n') + '\n';
const fileText = (f, v) => (f.endsWith('.json') ? JSON.stringify(v, null, 2) + '\n' : tableText(v));
const hits = (r, where) => Object.entries(where).every(([k, v]) => String(r[k] ?? '').trim() === String(v));
function apply(files, op, label) {
  const [kind, file] = op; const t = files[file];
  if (!t) throw new Error(`${label}: no file ${file}`);
  if (kind === 'json') {
    const path = op[2]; let o = t;
    for (const k of path.slice(0, -1)) { if (o[k] === undefined) throw new Error(`${label}: ${file} has no ${path.join('.')}`); o = o[k]; }
    if (op.length < 4 || op[3] === undefined) delete o[path.at(-1)]; else o[path.at(-1)] = op[3];
    return;
  }
  if (kind === 'add') {
    for (const k of Object.keys(op[2])) if (!t.head.includes(k)) throw new Error(`${label}: ${file} has no column ${k}`);
    t.rows.push(Object.fromEntries(t.head.map((h) => [h, op[2][h] ?? '']))); return;
  }
  const idx = t.rows.map((r, i) => (hits(r, op[2]) ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) throw new Error(`${label}: ${JSON.stringify(op[2])} matches no row of ${file}`);
  if (kind === 'drop') t.rows = t.rows.filter((_, i) => !idx.includes(i));
  else if (kind === 'dropLast') t.rows.splice(idx.at(-1), 1);
  else if (kind === 'set') for (const i of idx) for (const [k, v] of Object.entries(op[3])) {
    if (!t.head.includes(k)) throw new Error(`${label}: ${file} has no column ${k}`);
    t.rows[i][k] = v;
  } else throw new Error(`${label}: unknown edit ${kind}`);
}
const touched = (ops) => [...new Set(ops.map((o) => o[1]))];
const load = (dir, names) => Object.fromEntries(names.map((f) => [f, f.endsWith('.json') ? JSON.parse(readFileSync(join(dir, f), 'utf8')) : readTable(join(dir, f))]));
const rowCount = (files) => Object.values(files).reduce((t, x) => t + (x.rows ? x.rows.length : 0), 0);

// ------------------------------------------------------------------ checks ----
async function runCheck(manifest, prefix, args, dir, files) {
  const root = mkdtempSync(join(tmpdir(), 'fp-acc-'));
  try {
    cpSync(dir, root, { recursive: true, filter: (p) => !/[\\/](clean)$/.test(p) });
    for (const [f, v] of Object.entries(files || {})) writeFileSync(join(root, f), fileText(f, v));
    const r = await new AgentRuntime(manifest, { root, audit: false, memory: false, phi: 'off' }).call(`${prefix}_check`, { ...args, limit: 5000 });
    if (r.status !== 'executed') throw new Error(`${prefix}_check: ${r.status} ${r.error || ''}`);
    return r.result.items;
  } finally { rmSync(root, { recursive: true, force: true }); }
}

const results = []; let problems = 0;
const agents = readdirSync(PK).filter((n) => /^fairpolicy-(?!core$)/.test(n) && (!only.length || only.includes(n))).sort();
for (const n of agents) {
  const spec = SPECS[n];
  if (!spec) { console.log(`${n}: NO SPEC`); problems++; continue; }
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const check = manifest.tools.find((t) => t.name.endsWith('_check')); const prefix = check.name.replace(/_check$/, '');
  const explain = manifest.tools.find((t) => t.name === `${prefix}_explain`);
  const key = explain.inputSchema.required.find((k) => !(k in check.inputSchema.properties));
  const idOf = (r) => (spec.id ? spec.id.map((f) => r[f]).join('+') : String(r[key] ?? ''));
  const findings = (items) => items.filter((r) => !spec.ok.includes(r.status)).map((r) => ({ id: idOf(r), status: r.status }));
  const dir = join(PK, n, 'fixtures');
  const r = { agent: n, planted_total: spec.planted.length, planted_found: 0, missed: [], unplanned: [], clean_rows: 0, clean_findings: [], mutation_cases: spec.mutations.length, mutation_caught: 0, mutation_missed: [], mutation_side_findings: 0 };

  // 1. planted set
  const got = findings(await runCheck(manifest, prefix, spec.args, dir));
  const claimed = new Set();
  for (const [id, status] of spec.planted) {
    const i = got.findIndex((f, j) => !claimed.has(j) && f.id === id && f.status === status);
    if (i >= 0) { claimed.add(i); r.planted_found++; } else r.missed.push(`${id}: ${status}`);
  }
  r.unplanned = got.filter((_, j) => !claimed.has(j)).map((f) => `${f.id}: ${f.status}`);

  // 2. clean set: every file the edits touch, written to fixtures/clean/ (the others are used as they are)
  const names = touched(spec.clean);
  const clean = load(dir, names);
  for (const op of spec.clean) apply(clean, op, `${n} clean`);
  const cdir = join(dir, 'clean');
  for (const [f, v] of Object.entries(clean)) {
    const want = fileText(f, v); const p = join(cdir, f);
    if (write) { mkdirSync(cdir, { recursive: true }); writeFileSync(p, want); }
    else if (!existsSync(p) || readFileSync(p, 'utf8').replace(/\r\n/g, '\n') !== want) { console.log(`${n}: fixtures/clean/${f} is out of date (run with --write)`); problems++; }
  }
  if (write) writeFileSync(join(cdir, 'README.md'), `# Clean set\n\nThe demo files with every planted problem in [../README.md](../README.md) removed, made by \`scripts/accuracy.mjs --write\` from \`scripts/accuracy-specs.mjs\` in the repository. Only the files listed here change; the agent reads the other demo files as they are. The check must report nothing that needs a person on these files. Fictional data.\n\nFiles: ${names.map((f) => `\`${f}\``).join(', ')}.\n`);
  const allNames = readdirSync(dir).filter((f) => /\.(csv|json)$/i.test(f) && f !== 'phi-canaries.json');
  r.clean_rows = rowCount({ ...load(dir, allNames.filter((f) => f.endsWith('.csv'))), ...clean });
  r.clean_findings = findings(await runCheck(manifest, prefix, spec.args, dir, clean)).map((f) => `${f.id}: ${f.status}`);

  // 3. mutation cases on the clean set
  for (const m of spec.mutations) {
    const files = JSON.parse(JSON.stringify({ ...clean, ...load(dir, touched([m.op]).filter((f) => !(f in clean))) }));
    apply(files, m.op, `${n} mutation ${m.id}`);
    const f = findings(await runCheck(manifest, prefix, spec.args, dir, files));
    const hit = f.findIndex((x) => x.id === m.expect[0] && x.status === m.expect[1]);
    if (hit >= 0) r.mutation_caught++; else r.mutation_missed.push(`${m.id}: expected ${m.expect[0]}: ${m.expect[1]}; got ${f.map((x) => `${x.id}: ${x.status}`).join(', ') || 'nothing'}`);
    r.mutation_side_findings += f.length - (hit >= 0 ? 1 : 0);
  }

  const ok = r.planted_found === r.planted_total && !r.unplanned.length && !r.clean_findings.length && r.mutation_caught === r.mutation_cases;
  if (!ok) problems++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: planted ${r.planted_found}/${r.planted_total}, unplanned ${r.unplanned.length}, clean ${r.clean_findings.length} finding(s) on ${r.clean_rows} rows, mutations ${r.mutation_caught}/${r.mutation_cases}${r.mutation_side_findings ? ` (${r.mutation_side_findings} other finding(s))` : ''}`);
  for (const x of r.missed) console.log(`       missed      ${x}`);
  for (const x of r.unplanned) console.log(`       unplanned   ${x}`);
  for (const x of r.clean_findings) console.log(`       clean FP    ${x}`);
  for (const x of r.mutation_missed) console.log(`       not caught  ${x}`);
  results.push(r);
}

const sum = (k) => results.reduce((t, r) => t + (r[k] || 0), 0);
const fam = {
  date: DATE, agents: results.length,
  planted_total: sum('planted_total'), planted_found: sum('planted_found'), unplanned: results.reduce((t, r) => t + r.unplanned.length, 0),
  clean_rows: sum('clean_rows'), clean_false_positives: results.reduce((t, r) => t + r.clean_findings.length, 0),
  mutation_cases: sum('mutation_cases'), mutation_caught: sum('mutation_caught'), mutation_side_findings: sum('mutation_side_findings'),
};
console.log(`\n${fam.agents} agent(s): planted ${fam.planted_found}/${fam.planted_total} found, ${fam.unplanned} unplanned finding(s); clean set ${fam.clean_false_positives} false positive(s) on ${fam.clean_rows} rows; mutations ${fam.mutation_caught}/${fam.mutation_cases} caught (${fam.mutation_side_findings} other finding(s) raised by them).`);

if (record) {
  mkdirSync(join(ROOT, 'docs'), { recursive: true });
  writeFileSync(join(ROOT, 'docs', `accuracy-${DATE}.json`), JSON.stringify({ family: fam, agents: results }, null, 2) + '\n');
  const L = [`# Accuracy on the fictional fixtures (${DATE})`, '',
    'Made by `node scripts/accuracy.mjs --record` (`npm run accuracy`). Planted problems are the ones each `fixtures/README.md` lists; the clean set is `fixtures/clean/` (the same files with those problems removed); a mutation case makes one edit to the clean set (one row changed, added or dropped) and expects one named finding. A finding is a row whose status asks a person to act; rows that are on time, waiting inside their time, done or matching are not findings.', '',
    'All data is fictional. These numbers say the rules do what they are written to do on data built to test them, not how they will do on a real agency\'s exports.', '',
    `**Family:** ${fam.planted_found} of ${fam.planted_total} planted problems found, ${fam.unplanned} unplanned findings on the planted set, ${fam.clean_false_positives} findings on ${fam.clean_rows} clean rows, ${fam.mutation_caught} of ${fam.mutation_cases} mutation cases caught.`, '',
    '| Agent | Planted found | Unplanned | Clean rows | Findings on clean | Mutations caught |', '|---|---|---|---|---|---|',
    ...results.map((r) => `| ${r.agent} | ${r.planted_found}/${r.planted_total} | ${r.unplanned.length} | ${r.clean_rows} | ${r.clean_findings.length} | ${r.mutation_caught}/${r.mutation_cases} |`), ''];
  writeFileSync(join(ROOT, 'docs', `accuracy-${DATE}.md`), L.join('\n') + '\n');
  console.log(`Wrote docs/accuracy-${DATE}.json and .md`);
}
process.exitCode = problems ? 1 : 0;
