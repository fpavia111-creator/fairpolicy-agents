import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy License Renewals', args: { licenses: 'licenses.csv', states: 'state-settings.json', as_of: '2026-11-18' },
  checkLabel: 'Check every licence and its continuing education', columns: ['person', 'state', 'expiration_date', 'ce_hours'],
  explain: { license_number: 'TX-90001' }, explainLabel: 'Explain the licence short of CE hours',
});
