# Fairpolicy Producer Splits fixtures

Everything here is fictional: agency, producers, carriers, clients and amounts.

- `policies.csv`: seven policies in a Sagitta-style list (Client Code, Coverage, Insurer) with the producer of record and new or renewal.
- `received-2026-10.csv`: commission the agency received in October 2026.
- `producer-pay-2026-10.csv`: what the October producer statement paid.
- `splits.json`: Jordan Lee 40% new / 25% renewal, Sam Ortiz 50/30, Riley Chen 45/25; WC-4004 shared 60/40 between Sam Ortiz and Riley Chen; "House" is a house account.

Planted:
- BOP-4003: Sam Ortiz paid 336.00 (40%) instead of 420.00 (50% new): underpaid 84.00.
- WC-4004: Riley Chen has a 40% share (126.00 due) and was not paid.
- HO-4002: Jordan Lee paid 99.00 (30%) instead of 82.50 (25% renewal): overpaid 16.50.
- CGL-4005: a house account, but Jordan Lee was paid 117.00 (wrong producer).
- PA-4006: Avery Stone is not in the split schedule.
- PA-4001, WC-4004 (Sam Ortiz) and the UMB-4007 chargeback (-15.00): right.

Expected: 960.30 due, 921.60 paid.
