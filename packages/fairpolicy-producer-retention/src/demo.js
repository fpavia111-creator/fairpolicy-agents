import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Producer Retention', args: { policies: 'policy-terms.csv', as_of: '2026-11-18' },
  checkLabel: 'Measure retention for each producer', columns: ['producer', 'due', 'renewed', 'retention_pct'],
  explain: { producer: 'Jordan Lee' }, explainLabel: 'Explain one producer',
});
