import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Commission Chargebacks', args: { policies: 'policies.csv', statements: 'statements.csv', producer_pay: 'producer-pay.csv', as_of: '2026-11-18' },
  checkLabel: 'Check every cancellation\'s chargeback', columns: ['policy_number', 'cancel_date', 'expected', 'taken'],
  explain: { policy_number: 'HO-3002' }, explainLabel: 'Explain the homeowners chargeback',
  draft: { args: { carrier: 'Example Mutual', from: 'Casey Park, Example Agency (fictional)' }, label: 'Draft a recalculation request to the carrier' },
});
