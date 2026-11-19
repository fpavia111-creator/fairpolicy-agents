import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Carrier Payables', args: { carrier_statement: 'carrier-account-current.csv', agency_payables: 'agency-payables.csv', as_of: '2026-11-18' },
  checkLabel: 'Reconcile the account current item by item', columns: ['policy_number', 'transaction_type', 'carrier_net', 'agency_net'],
  explain: { policy_number: 'WC-1102' }, explainLabel: 'Explain the item that differs',
  draft: { args: { carrier: 'Sample Casualty', from: 'Casey Park, Example Agency (fictional)' }, label: 'Draft a reconciliation note to the carrier' },
});
