import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Download Errors', args: { log: 'download-log.csv', as_of: '2026-11-18' },
  checkLabel: 'Check the carrier download log', columns: ['ref', 'carrier', 'date', 'days'],
  explain: { ref: 'DL-4' }, explainLabel: 'Explain the failed download',
});
