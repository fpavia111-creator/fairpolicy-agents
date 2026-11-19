#!/usr/bin/env node
// What reaches the AI model when an assistant calls each agent's check tool (Kurt's review question 2).
// Each check runs twice on its fictional fixtures, with masking on (the default) and off. A result field whose
// values differ between the two runs is masked; a text field that is the same in both is sent in clear.
// Numbers, dates, statuses and the agent's own sentences (detail, next_step) are listed separately.
// Report and draft files on disk are not counted: they stay on the machine and keep the real values.
//
//   node scripts/model-view.mjs     print the table and write docs/model-view-2026-11-19.json and .md
import { readdirSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime } from '../packages/fairpolicy-core/src/index.js';
import { SPECS } from './accuracy-specs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages'); const DATE = '2026-11-19';
// Text a person types into the agency system: it is sent as typed, so a name written into it reaches the model.
const FREE_TEXT = new Set(['reason', 'description', 'message', 'change', 'requirement', 'holder', 'cancel_reason', 'declined_coverages', 'um_selection', 'milestone', 'note', 'notes', 'adjuster', 'document', 'documents', 'type', 'activity', 'last_activity_text']);
const PARTLY_FREE = { 'fairpolicy-trust-account': { ref: 'ref (the bank line description, as the bank printed it)' } };
const GENERATED = new Set(['detail', 'next_step', 'summary', 'gaps', 'missing', 'unsigned', 'required', 'suggestions', 'label']);
const isNumberish = (v) => typeof v === 'number' || typeof v === 'boolean' || v === null || /^-?[\d.,]+%?$/.test(String(v)) || /^\d{4}-\d\d-\d\d/.test(String(v));

async function run(manifest, prefix, dir, args, phi) {
  const root = mkdtempSync(join(tmpdir(), 'fp-mv-')); cpSync(dir, root, { recursive: true });
  let r; try { r = await new AgentRuntime(manifest, { root, audit: false, memory: false, phi }).call(`${prefix}_check`, { ...args, limit: 5000 }); } finally { rmSync(root, { recursive: true, force: true }); }
  if (r.status !== 'executed') throw new Error(`${prefix}_check ${phi}: ${r.status} ${r.error || ''}`);
  return r.result;
}

const out = [];
for (const n of readdirSync(PK).filter((x) => /^fairpolicy-(?!core$)/.test(x)).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const prefix = manifest.tools.find((t) => t.name.endsWith('_check')).name.replace(/_check$/, '');
  const dir = join(PK, n, 'fixtures');
  const row = { agent: n, masked: new Set(), masked_strict: new Set(), clear_text: new Set(), free_text: new Set(), numbers_dates: new Set(), generated: new Set() };
  for (const mode of ['mask', 'strict']) {
    const a = await run(manifest, prefix, dir, SPECS[n].args, mode); const b = await run(manifest, prefix, dir, SPECS[n].args, 'off');
    a.items.forEach((x, i) => {
      for (const [k, v] of Object.entries(x)) {
        const w = b.items[i] ? b.items[i][k] : undefined;
        if (v === '' || v === undefined || (Array.isArray(v) && !v.length)) continue;
        if (GENERATED.has(k)) { if (mode === 'mask') row.generated.add(k); continue; }
        if (JSON.stringify(v) !== JSON.stringify(w)) { (mode === 'mask' ? row.masked : row.masked_strict).add(k); continue; }
        if (mode !== 'mask') continue;
        if (k === 'status') continue;
        if (isNumberish(v)) row.numbers_dates.add(k); else { row.clear_text.add(k); if (FREE_TEXT.has(k)) row.free_text.add(k); }
      }
    });
  }
  for (const k of row.masked) { row.masked_strict.delete(k); row.clear_text.delete(k); row.free_text.delete(k); row.numbers_dates.delete(k); }
  for (const k of row.masked_strict) { row.clear_text.delete(k); row.numbers_dates.delete(k); }
  // Text that the comparison cannot see as free text because strict mode changes part of it (a policy number inside it).
  for (const [k, label] of Object.entries(PARTLY_FREE[n] || {})) { row.free_text.add(label); row.clear_text.add(label); row.masked_strict.delete(k); row.masked_strict.add(`${k} (policy numbers inside it)`); }
  const o = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Set ? [...v].sort() : v]));
  out.push(o);
  console.log(`${n}\n  masked: ${o.masked.join(', ') || '-'}\n  also masked with --phi strict: ${o.masked_strict.join(', ') || '-'}\n  text in clear: ${o.clear_text.join(', ') || '-'}\n  free text among them: ${o.free_text.join(', ') || '-'}`);
}
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', `model-view-${DATE}.json`), JSON.stringify(out, null, 2) + '\n');
const L = [`# What reaches the AI model (${DATE})`, '',
  'Made by `node scripts/model-view.mjs` (`npm run model-view`). Each check runs on its fictional fixtures with masking on (the default) and off, and the two results are compared field by field.', '',
  '- **Masked** (default `--phi mask`): client and insured names become `CL-` pseudonyms and client numbers `CID-` pseudonyms (the same value always gives the same pseudonym on one machine, so the model can still group by it); birth dates become the birth year; driver licence numbers, SSNs, street addresses, phone numbers and e-mail addresses are removed. A client name written inside another text field is replaced too, when the same name appears in a name column of the file.',
  '- **Also masked with `--phi strict`**: policy numbers (`POL-`), claim numbers (`CLM-`) and VINs (`VIN-`); ZIP codes are cut to three digits.',
  '- **Sent in clear**: amounts, rates, percentages, counts, dates and statuses; carrier, producer, account manager and CSR names; lines of business; and the text fields listed below. Free-text fields are sent as typed: if someone types a person\'s name into a cancellation reason or an activity note, the model sees it.',
  '- `detail` and `next_step` are the agent\'s own sentences built from the fields above (masked values stay masked in them).', '',
  'Results go to whatever model the user\'s assistant uses. For client data, use a model covered by your own agreements (or a local model) and keep masking on. This is not a claim of compliance with any law or standard.', '',
  '| Agent | Masked (default) | Also masked with --phi strict | Text in clear | Free text in clear |', '|---|---|---|---|---|',
  ...out.map((o) => `| ${o.agent} | ${o.masked.join(', ') || '-'} | ${o.masked_strict.join(', ') || '-'} | ${o.clear_text.join(', ') || '-'} | ${o.free_text.join(', ') || '-'} |`), ''];
writeFileSync(join(ROOT, 'docs', `model-view-${DATE}.md`), L.join('\n'));
console.log(`Wrote docs/model-view-${DATE}.json and .md`);
