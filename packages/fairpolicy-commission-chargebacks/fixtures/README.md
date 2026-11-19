# Fairpolicy Commission Chargebacks fixtures

Everything here is fictional: agency, carriers, clients, policy numbers and amounts.

- `policies.csv`: seven policies in an EZLynx-style export; five cancelled since May 2026, one active, one cancelled in March (outside the 180-day window as of 2026-11-18).
- `statements.csv`: carrier statement lines with the chargebacks taken.
- `producer-pay.csv`: the producer's commission and reversals.

Planted (pro rata, as of 2026-11-18):
- HO-3002: the carrier took back 360.00, the full commission; 15% of the unearned 1190.14 is 178.52, so 181.48 too much.
- BOP-3003: cancelled 2026-10-15, no chargeback yet: reserve 261.30.
- PA-3004: the carrier took back 54.00 (right); the producer's 27.00 was never reversed.
- HO-3999: a 75.00 chargeback for a policy not in the policy list.
- PA-3001 (90.25) and UMB-3005 (flat cancel, 60.00): right.

Expected: 5 cancellations, 644.07 expected, 639.25 taken (including the stray 75.00).
