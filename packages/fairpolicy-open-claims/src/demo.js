import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Open Claims', args: { claims: 'claims.csv', as_of: '2026-11-18' },
  checkLabel: 'Age every open claim', columns: ['claim_ref', 'carrier', 'days_open', 'days_quiet'],
  explain: { claim_ref: 'AC-1' }, explainLabel: 'Explain the loss with no carrier claim number',
});
