import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Premium Finance', args: { agreements: 'finance-agreements.csv', as_of: '2026-11-18' },
  checkLabel: 'Check every finance agreement', columns: ['agreement', 'policy_number', 'next_due_date'],
  explain: { agreement: 'PF-9002' }, explainLabel: 'Explain the notice of intent to cancel',
});
