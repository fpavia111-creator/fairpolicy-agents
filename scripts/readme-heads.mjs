#!/usr/bin/env node
// Writes the hand-editable top of an agent README (title, what it does, what it never
// does, quick start, limits) when the package has no README yet. The generated middle
// part comes from scripts/readme-sections.mjs. Existing READMEs are left alone.
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PK = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages');
const UP = { ar: 'A/R', dme: 'DME', kpis: 'KPIs', edi: 'EDI' };
export const titleOf = (n) => n.split('-').map((w, i) => UP[w] || (i === 1 ? 'of' : w[0].toUpperCase() + w.slice(1))).join(' ');

for (const n of readdirSync(PK).filter((x) => /-of-/.test(x)).sort()) {
  const f = join(PK, n, 'README.md'); if (existsSync(f)) continue;
  const { manifest: m } = await import(pathToFileURL(join(PK, n, 'src', 'index.js')).href);
  const refused = m.tools.filter((t) => (m.policy.rules.find((r) => r.tool === t.name) || {}).decision === 'block').map((t) => t.description.replace(/^Listed so agents can see it is refused\.\s*/, ''));
  const never = refused.length ? `\n\n**${refused.join(' ')}**` : '';
  const txt = `# ${titleOf(n)} (\`${n}\`)

${m.description}${never}

MIT · Node 20 or newer · local files only · patient identifiers masked before results reach the model · built on [\`fresnel-core\`](../fresnel-core)

\`\`\`bash
npx -y ${n} demo
npx -y ${n} mcp --root ./billing-files
\`\`\`

## Limits

- It checks only what is in the files and config you load. Code tables, fee schedules, payer rules and limits are as current as what you give it; the built-in tables and example rules are starting points, not any payer's policy.
- It is not coding, legal, compliance or medical advice. A person reviews every result before a claim, appeal, refund or message goes anywhere; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; \`inspect\` shows how a file was read.
- Patient masking keeps identifiers away from the model; it does not replace your HIPAA program (business associate agreements, access control, retention).
`;
  writeFileSync(f, txt); console.log(`${n}: README head written`);
}
