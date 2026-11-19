import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Producer Splits', args: { received: 'received-2026-10.csv', policies: 'policies.csv', producer_pay: 'producer-pay-2026-10.csv', splits: 'splits.json' },
  checkLabel: 'Check every producer share', columns: ['policy_number', 'producer', 'expected', 'paid'],
  explain: { policy_number: 'BOP-4003' }, explainLabel: 'Explain the business owners split',
});
