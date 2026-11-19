import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Trust Account', args: { payables: 'payables.csv', bank: 'trust-bank-2026-11.csv', settings: 'trust-settings.json', as_of: '2026-11-18' },
  checkLabel: 'Reconcile the premium trust account', columns: ['ref', 'date', 'amount'],
  explain: { ref: 'balance' }, explainLabel: 'Explain the balance test',
});
