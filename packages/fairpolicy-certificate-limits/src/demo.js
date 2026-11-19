import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Certificate Limits', args: { certificates: 'certificates.csv', coverage: 'coverage.csv' },
  checkLabel: 'Check every certificate against its policy', columns: ['ref', 'issued_date', 'issues'],
  explain: { ref: 'C-9004/CGL-1804' }, explainLabel: 'Explain the certificate issued after cancellation',
});
