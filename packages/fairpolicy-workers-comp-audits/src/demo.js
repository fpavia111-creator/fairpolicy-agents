import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Workers Comp Audits', args: { audits: 'audits.csv', as_of: '2026-11-18' },
  checkLabel: 'Follow every premium audit', columns: ['policy_number', 'audit_status', 'payroll_change_pct', 'audit_premium'],
  explain: { policy_number: 'WC-2502' }, explainLabel: 'Explain the audit with large additional premium',
});
