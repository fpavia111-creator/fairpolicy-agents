import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Cross Sell', args: { policies: 'policies.csv' },
  checkLabel: 'Group policies by client and find one-line accounts', columns: ['lines', 'policies', 'gaps'],
  explain: { client: 'Desmond Achterberg' }, explainLabel: 'Explain one account',
});
