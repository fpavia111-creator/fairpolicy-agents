import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Loss Runs', args: { loss_runs: 'loss-runs.csv', premiums: 'premiums.csv' },
  checkLabel: 'Summarise five years of loss runs by account', columns: ['claims', 'incurred', 'loss_ratio'],
  explain: { client: 'Wexford Plating LLC' }, explainLabel: 'Explain the account with the highest loss ratio',
});
