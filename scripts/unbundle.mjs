#!/usr/bin/env node
// Developer helper: writes several files of one agent from a bundle file.
// A bundle is plain text with a line "=== relative/path ===" before each file's content.
//   node scripts/unbundle.mjs <agent> <bundle-file>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const [agent, bundle] = process.argv.slice(2);
if (!agent || !bundle) { console.error('usage: unbundle.mjs <agent> <bundle-file>'); process.exit(2); }
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages', agent);
const text = readFileSync(bundle, 'utf8').replace(/\r\n/g, '\n');
const parts = text.split(/^=== (.+?) ===\n/m);
let n = 0;
for (let i = 1; i < parts.length; i += 2) {
  const rel = parts[i].trim(); const f = resolve(root, rel);
  const r = relative(root, f); if (r.startsWith('..') || isAbsolute(r)) throw new Error(`${rel} leaves the package`);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, parts[i + 1].replace(/\n+$/, '\n'));
  n++;
}
console.log(`${agent}: ${n} file(s) written`);
