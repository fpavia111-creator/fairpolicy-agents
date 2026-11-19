import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Commercial Renewals', args: { policies: 'policies.csv', milestones: 'milestones.csv', as_of: '2026-11-18' },
  checkLabel: 'Build the timeline for every commercial renewal', columns: ['policy_number', 'expiration_date', 'overdue', 'next_due'],
  explain: { policy_number: 'PKG-1705' }, explainLabel: 'Explain the renewal furthest behind',
});
