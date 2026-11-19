import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Duplicate Clients', args: { clients: 'clients.csv' },
  checkLabel: 'Find client records that look like one client', columns: ['pair', 'shared', 'name_similarity'],
  explain: { pair: 'D-001' }, explainLabel: 'Explain the first pair',
});
