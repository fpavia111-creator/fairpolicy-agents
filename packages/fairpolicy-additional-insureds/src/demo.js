import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Additional Insureds', args: { requests: 'requests.csv', coverage: 'endorsements.csv', as_of: '2026-11-18' },
  checkLabel: 'Sort every additional insured and waiver request', columns: ['request_id', 'requirement', 'days_open', 'covered_by'],
  explain: { request_id: 'R-3' }, explainLabel: 'Explain the request that needs an endorsement',
});
