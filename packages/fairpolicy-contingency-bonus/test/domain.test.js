// Contingency bonus: tiers, growth, loss ratio, the next tier, received against the estimate, carriers without a grid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkContingency } from '../src/index.js';

const exp = (carrier, year, written, earned, incurred) => ({ carrier, year: String(year), written_premium: String(written), earned_premium: String(earned), incurred_losses: undefined, incurred: String(incurred) });
const grid = (tiers, extra = {}) => ({ carriers: [{ carrier: 'Example Mutual', tiers, ...extra }] });
const T1 = { name: 'T1', min_premium: 100000, max_loss_ratio: 60, min_growth_pct: 0, bonus_pct: 1 };
const T2 = { name: 'T2', min_premium: 200000, max_loss_ratio: 50, min_growth_pct: 5, bonus_pct: 2 };

test('the highest tier met gives the estimate; growth and loss ratio are worked out from the report', () => {
  const r = checkContingency([exp('Example Mutual', 2025, 180000, 180000, 0), exp('Example Mutual', 2026, 210000, 200000, 90000)], grid([T1, T2]));
  const c = r.rows[0];
  assert.deepEqual([c.tier, c.estimated_bonus, c.growth_pct, c.loss_ratio, c.status], ['T2', 4200, 16.67, 45, 'qualifies']);
});

test('the next tier names what is short; close when only premium is short and within the band', () => {
  const r = checkContingency([exp('Example Mutual', 2025, 150000, 150000, 0), exp('Example Mutual', 2026, 190000, 190000, 50000)], grid([T1, T2]));
  assert.equal(r.rows[0].status, 'close_to_next'); assert.equal(r.rows[0].premium_to_next, 10000);
  const far = checkContingency([exp('Example Mutual', 2025, 100000, 100000, 0), exp('Example Mutual', 2026, 120000, 120000, 50000)], grid([T1, T2]));
  assert.equal(far.rows[0].status, 'qualifies'); assert.equal(far.rows[0].premium_to_next, 80000);
});

test('no tier met for loss ratio is loss_ratio_too_high with the incurred over the line', () => {
  const r = checkContingency([exp('Example Mutual', 2026, 150000, 100000, 70000)], grid([T1]));
  assert.equal(r.rows[0].status, 'loss_ratio_too_high'); assert.equal(r.rows[0].incurred_room, -10000);
});

test('no tier met for premium is below_minimum; a received bonus under the estimate is received_less', () => {
  assert.equal(checkContingency([exp('Example Mutual', 2026, 50000, 50000, 0)], grid([T1])).rows[0].status, 'below_minimum');
  const r = checkContingency([exp('Example Mutual', 2026, 150000, 150000, 0)], grid([T1], { received: 1000 }));
  assert.equal(r.rows[0].status, 'received_less'); assert.equal(r.rows[0].estimated_bonus, 1500);
});

test('a carrier with no grid is listed, and carrier names match without "Insurance Company"', () => {
  const r = checkContingency([exp('Example Mutual Insurance Company', 2026, 150000, 150000, 0), exp('Other Carrier', 2026, 1000, 1000, 0)], grid([T1]));
  assert.deepEqual(r.rows.map((x) => [x.carrier, x.status]), [['Example Mutual Insurance Company', 'qualifies'], ['Other Carrier', 'no_grid']]);
});

test('with no prior year growth is unknown, and a tier that needs growth is not met', () => {
  const r = checkContingency([exp('Example Mutual', 2026, 250000, 200000, 10000)], grid([T1, T2]));
  assert.equal(r.rows[0].growth_pct, null); assert.equal(r.rows[0].tier, 'T1');
});

test('the year defaults to the latest in the file; another year can be asked for', () => {
  const rows = [exp('Example Mutual', 2025, 150000, 150000, 0), exp('Example Mutual', 2026, 50000, 50000, 0)];
  assert.equal(checkContingency(rows, grid([T1])).year, 2026);
  assert.equal(checkContingency(rows, grid([T1]), { year: 2025 }).rows[0].status, 'qualifies');
});
