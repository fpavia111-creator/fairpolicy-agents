import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Carrier Appointments', args: { appointments: 'appointments.csv', policies: 'policies.csv', as_of: '2026-11-18' },
  checkLabel: 'Match business to appointments', columns: ['producer', 'carrier', 'state', 'policies'],
  explain: { ref: 'Riley Chen|Example Mutual|TX' }, explainLabel: 'Explain the business written without an appointment',
});
