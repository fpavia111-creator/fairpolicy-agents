import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Policy Checking', args: { bound: 'bound.csv', issued: 'issued.csv', as_of: '2026-11-18' },
  checkLabel: 'Check every issued policy against its binder', columns: ['policy_number', 'bound_premium', 'issued_premium', 'issues'],
  explain: { policy_number: 'HO-2901' }, explainLabel: 'Explain the homeowners policy issued with a lower limit',
});
