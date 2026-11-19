import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Receivables Aging', args: { receivables: 'receivables.csv', as_of: '2026-11-18' },
  checkLabel: 'Age every open item', columns: ['invoice', 'due_date', 'days_past_due', 'balance'],
  explain: { invoice: 'INV-7001' }, explainLabel: 'Explain the item the agency already paid the carrier',
  draft: { args: { client: 'Haverleigh Farms LLC', from: 'Casey Park, Example Agency (fictional)' }, label: 'Draft a balance reminder for one client' },
});
