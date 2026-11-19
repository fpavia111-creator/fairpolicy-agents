import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Lapsed Policies', args: { policies: 'policies.csv', as_of: '2026-11-18' },
  checkLabel: 'Sort every policy that ended in the last 90 days', columns: ['policy_number', 'policy_status', 'end_date', 'replacement'],
  explain: { policy_number: 'PA-1301' }, explainLabel: 'Explain the non-payment cancellation',
});
