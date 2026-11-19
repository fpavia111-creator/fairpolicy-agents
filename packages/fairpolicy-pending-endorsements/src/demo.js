import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Pending Endorsements', args: { changes: 'change-requests.csv', as_of: '2026-11-18' },
  checkLabel: 'Follow every change request', columns: ['request_id', 'policy_number', 'requested_date', 'premium_change'],
  explain: { request_id: 'E-1' }, explainLabel: 'Explain the change never sent to the carrier',
});
