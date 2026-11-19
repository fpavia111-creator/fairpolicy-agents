import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Direct Agency Bill', args: { policies: 'policies.csv', statements: 'direct-bill-statement.csv', invoices: 'agency-invoices.csv' },
  checkLabel: 'Compare the coded bill type with how each policy is billed', columns: ['policy_number', 'coded_bill_type', 'agency_invoiced'],
  explain: { policy_number: 'CGL-8005' }, explainLabel: 'Explain the policy that may be billed twice',
});
