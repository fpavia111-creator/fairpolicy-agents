import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Return Premiums', args: { returns: 'return-premiums.csv', as_of: '2026-11-18' },
  checkLabel: 'Follow every return premium to the client', columns: ['policy_number', 'return_amount', 'credited_date', 'days_since_credit'],
  explain: { policy_number: 'PA-2801' }, explainLabel: 'Explain the overdue refund',
});
