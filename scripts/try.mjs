// Developer helper: run one tool of one agent on its fixtures and print the result compactly.
//   node scripts/try.mjs <agent> <tool> '<json args>' [--mode auto --auto tool]
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const [agent, tool, json = '{}'] = process.argv.slice(2);
const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const { manifest } = await import(pathToFileURL(join(PK, agent, 'src', 'index.js')).href);
const { AgentRuntime } = await import(pathToFileURL(join(PK, 'fairpolicy-core', 'src', 'index.js')).href);
const mi = process.argv.indexOf('--mode'); const ai = process.argv.indexOf('--auto');
const rt = new AgentRuntime(manifest, { root: join(PK, agent), stateDir: null, audit: false, mode: mi > 0 ? process.argv[mi + 1] : 'assist', autoActions: ai > 0 ? process.argv[ai + 1].split(',') : [] });
const r = await rt.call(tool, JSON.parse(json));
if (r.status !== 'executed') { console.log(JSON.stringify(r, null, 1).slice(0, 3000)); process.exit(0); }
const { items, ...rest } = r.result;
console.log(JSON.stringify(rest).slice(0, 2500));
for (const i of items || []) console.log(' ', JSON.stringify(Object.fromEntries(Object.entries(i).filter(([k]) => !['detail', 'next_step'].includes(k)))).slice(0, 300));
