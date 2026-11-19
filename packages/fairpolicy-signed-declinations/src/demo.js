import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Signed Declinations', args: { policies: 'policies.csv', documents: 'documents.csv' },
  checkLabel: 'Check every policy file for its signed forms', columns: ['policy_number', 'line', 'missing', 'unsigned'],
  explain: { policy_number: 'PA-2401' }, explainLabel: 'Explain the auto policy with UM rejected',
});
