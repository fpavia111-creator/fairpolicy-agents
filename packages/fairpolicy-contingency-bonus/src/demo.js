import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Contingency Bonus', args: { experience: 'experience.csv', grid: 'grid.json', year: 2026 },
  checkLabel: 'Check each carrier against its bonus grid', columns: ['carrier', 'loss_ratio', 'tier', 'estimated_bonus'],
  explain: { carrier: 'Example Mutual' }, explainLabel: 'Explain the carrier closest to its next tier',
});
