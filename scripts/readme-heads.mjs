#!/usr/bin/env node
// Writes the hand-editable top of an agent README (title, what it does, what it never
// does, quick start, limits) when the package has no README yet. The generated middle
// part comes from scripts/readme-sections.mjs. Existing READMEs are left alone.
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const UP = { eo: 'E&O', coi: 'COI', wc: 'WC' };
export const titleOf = (n) => n.split('-').map((w) => UP[w] || w[0].toUpperCase() + w.slice(1)).join(' ');

for (const n of readdirSync(PK).filter((x) => /^fairpolicy-(?!core$)/.test(x)).sort()) {
  const f = join(PK, n, 'README.md'); if (existsSync(f)) continue;
  const { manifest: m } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const refused = m.tools.filter((t) => (m.policy.rules.find((r) => r.tool === t.name) || {}).decision === 'block').map((t) => t.description.replace(/^Listed so agents can see it is refused\.\s*/, ''));
  const never = refused.length ? `\n\n**${refused.join(' ')}**` : '';
  const txt = `# ${titleOf(n)} (\`${n}\`)

${m.description}${never}

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [\`fairpolicy-core\`](../fairpolicy-core)

\`\`\`bash
npx -y ${n} demo
npx -y ${n} mcp --root ./agency-exports
\`\`\`

## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; \`inspect\` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
`;
  writeFileSync(f, txt); console.log(`${n}: README head written`);
}
