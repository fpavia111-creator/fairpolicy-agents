#!/usr/bin/env node
// Developer helper: for one or more agents, rebuild evals/cases.json (domain cases plus the
// standard safety cases), run the evals and the package tests, and print one line each.
//   node scripts/finish-agent.mjs <agent> [...]
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let bad = 0;
for (const n of process.argv.slice(2)) {
  const s = spawnSync(process.execPath, [join(ROOT, 'scripts', 'eval-safety.mjs'), n], { cwd: ROOT, encoding: 'utf8' });
  if (s.status) { console.log(s.stdout + s.stderr); bad++; continue; }
  const e = spawnSync(process.execPath, [join(ROOT, 'scripts', 'run-all-evals.mjs'), n], { cwd: ROOT, encoding: 'utf8' });
  const t = spawnSync(process.execPath, ['scripts/run-tests.cjs'], { cwd: join(ROOT, 'packages', n), encoding: 'utf8', timeout: 300000 });
  const out = (t.stdout || '') + (t.stderr || '');
  const num = (k) => (new RegExp(`ℹ ${k} (\\d+)`).exec(out) || [])[1];
  const evalLine = (e.stdout.split('\n').find((l) => l.includes(n)) || '').trim();
  console.log(`${n}: evals ${evalLine.split(/\s+/).pop()}  tests ${num('pass')}/${num('tests')}`);
  if (e.status) { bad++; console.log(e.stdout.split('\n').filter((l) => /^\s{7}/.test(l)).join('\n')); }
  if (t.status) { bad++; console.log(out.split('\n').filter((l) => /✖|AssertionError|Error:|expected|actual|\+ |- /.test(l)).slice(0, 30).join('\n')); }
}
process.exit(bad ? 1 : 0);
