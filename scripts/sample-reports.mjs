#!/usr/bin/env node
// Writes sample-reports/: every agent's report (HTML page and CSV worklist) on its own
// fictional fixtures, in English, plus an index page. The arguments come from the agent's
// "report-written" eval case, so the samples are the same runs the evals check.
//   node scripts/sample-reports.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AgentRuntime, htmlPage, escapeHtml } from '../packages/fairpolicy-core/src/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'packages'); const OUT = join(ROOT, 'sample-reports');
mkdirSync(OUT, { recursive: true });
const rows = [];
for (const n of readdirSync(PK).filter((x) => /^fairpolicy-(?!core$)/.test(x)).sort()) {
  const { manifest } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const prefix = manifest.tools[0].name.split('_')[0];
  const cases = JSON.parse(readFileSync(join(PK, n, 'evals', 'domain-cases.json'), 'utf8')).cases;
  const c = cases.find((x) => x.tool === `${prefix}_write_report` && !x.mode);
  if (!c) { console.error(`${n}: no report case`); process.exitCode = 1; continue; }
  const root = mkdtempSync(join(tmpdir(), `${n}-sample-`)); cpSync(join(PK, n, 'fixtures'), join(root, 'fixtures'), { recursive: true });
  const r = await new AgentRuntime(manifest, { root, audit: false, memory: false, stateDir: null }).call(c.tool, c.args);
  if (r.status !== 'executed') { console.error(`${n}: ${r.reason}`); process.exitCode = 1; continue; }
  const short = n.replace(/^fairpolicy-/, '');
  for (const f of r.result.files) { const ext = f.split('.').pop(); writeFileSync(join(OUT, `${short}.${ext}`), readFileSync(join(root, f))); }
  rmSync(root, { recursive: true, force: true });
  rows.push({ n, short, summary: r.result.summary.replace(/ Files: .*$/, '').replace(/^.*? written: /, '') });
  console.log(`${n}: sample report written`);
}
const body = `<h1>Fairpolicy sample reports</h1><p class="mut">Every report below was written by the agent on its own fictional fixtures (no real agency, carrier, client or person). Client names in the files are made up; the agents mask them only in what they return to an AI model, so the reports show them as written.</p><table><thead><tr><th>Agent</th><th>Summary</th><th>Files</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${escapeHtml(x.n)}</td><td>${escapeHtml(x.summary)}</td><td><a href="${x.short}.html">HTML</a> · <a href="${x.short}.csv">CSV</a></td></tr>`).join('')}</tbody></table>`;
writeFileSync(join(OUT, 'index.html'), htmlPage({ title: 'Fairpolicy sample reports', bodyHtml: body, footer: 'Fictional data. Written by the Fairpolicy agents; nothing was bound, sent or paid.', lang: 'en' }));
console.log(`${rows.length} sample report(s) in sample-reports/`);
