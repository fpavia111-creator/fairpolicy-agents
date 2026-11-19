import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Renewal Remarket', args: { policies: 'expiration-list.csv', activities: 'activities.csv', as_of: '2026-11-18' },
  checkLabel: 'Check every renewal in the next 120 days', columns: ['policy_number', 'expiration_date', 'days_left', 'change_pct'],
  explain: { policy_number: 'BOP-1203' }, explainLabel: 'Explain the renewal that went up with no remarket',
});
