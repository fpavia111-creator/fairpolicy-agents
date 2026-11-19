// Additional insured requests: requirement words, blanket and scheduled wording, carrier endorsements, overdue.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRequests, requirementOf } from '../src/index.js';

const cov = (o) => ({ policy_number: 'G-1', client: 'Fictional Co', blanket_ai: 'Y', blanket_waiver: 'N', primary_noncontributory: 'N', scheduled_holders: '', ...o });
const req = (o) => ({ request_id: 'R-1', client: 'Fictional Co', policy_number: 'G-1', holder: 'Example Holder', requirement: 'Additional Insured', requested_date: '2026-11-15', endorsement_requested_date: '', endorsement_received_date: '', completed_date: '', ...o });
const st = (r, c = {}, o = {}) => checkRequests([req(r)], [cov(c)], { asOf: '2026-11-18', ...o }).rows[0].status;

test('requirement words map to AI, waiver and primary/non-contributory', () => {
  assert.deepEqual(['Additional Insured', 'AI', 'WOS', 'Waiver of Subrogation', 'Primary & Non-Contributory', 'PNC', 'Loss payee'].map(requirementOf), ['ai', 'ai', 'waiver', 'waiver', 'pnc', 'pnc', 'other']);
});

test('blanket wording makes a request ready, and overdue after the days', () => {
  assert.equal(st({}), 'ready_to_issue');
  assert.equal(st({ requested_date: '2026-11-01' }), 'open_overdue');
});

test('a holder scheduled by name counts, in any letter case', () => {
  assert.equal(st({ requirement: 'Waiver' }, { scheduled_holders: 'Other; EXAMPLE HOLDER' }), 'ready_to_issue');
});

test('without wording: needs an endorsement; once asked, waiting, then pending after the days', () => {
  assert.equal(st({ requirement: 'Waiver' }), 'needs_endorsement');
  assert.equal(st({ requirement: 'Waiver', endorsement_requested_date: '2026-11-10' }), 'awaiting_carrier');
  assert.equal(st({ requirement: 'Waiver', endorsement_requested_date: '2026-10-01' }), 'endorsement_pending');
});

test('an endorsement received or a completed request clears it', () => {
  assert.equal(st({ requirement: 'Waiver', endorsement_received_date: '2026-11-16' }), 'ready_to_issue');
  assert.equal(st({ completed_date: '2026-11-17' }), 'complete');
  assert.equal(st({ completed_date: '2026-11-20' }), 'ready_to_issue');
});

test('a request on a policy missing from the coverage file needs an endorsement and says why', () => {
  const r = checkRequests([req({ policy_number: 'X-9' })], [cov({})], { asOf: '2026-11-18' }).rows[0];
  assert.equal(r.status, 'needs_endorsement'); assert.equal(r.covered_by, 'policy not in the coverage file');
});
