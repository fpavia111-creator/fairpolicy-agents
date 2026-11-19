import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Missing Commissions', args: { policies: 'policies.csv', statements: 'statements-2026.csv', as_of: '2026-11-18' },
  checkLabel: 'Find policies with no commission on any statement', columns: ['policy_number', 'carrier', 'effective_date', 'expected'],
  explain: { policy_number: 'BOP-2003' }, explainLabel: 'Explain the business owners policy',
  draft: { args: { carrier: 'Sample Casualty', from: 'Casey Park, Example Agency (fictional)' }, label: 'Draft a request to the carrier' },
});
