import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Data Quality', args: { policies: 'policies.csv', vehicles: 'vehicles.csv' },
  checkLabel: 'Check every active policy for broken or empty data', columns: ['policy_number', 'line', 'issues'],
  explain: { policy_number: 'PA-2603' }, explainLabel: 'Explain the auto policy with a bad VIN',
});
