# Fairpolicy Lapsed Policies fixtures

Everything here is fictional: agency, carriers, clients and amounts.

- `policies.csv`: nine policy terms in a HawkSoft-style export, with cancellation dates and reasons.

Planted, as of 2026-11-18 (90-day window, 30 reinstatement days):
- PA-1301: cancelled for non-payment 5 November (13 days): reinstatement window.
- HO-1302: cancelled for non-payment 20 September (59 days), no other homeowners policy: not replaced.
- BOP-1304: lapsed 15 October, nothing else for the client: not replaced.
- WC-1305: still shown active, expired 31 October, no renewal term: expired with no renewal record.
- PA-1303: cancelled at the client's request and replaced by PA-1309 with another carrier.
- CGL-1306: the 2025 term ended but the 2026 renewal term is in the file (not listed).
- HO-1307: cancelled in May, outside the window.

Expected: 5 listed, 3 not replaced or still in the reinstatement window (8,400 premium), 1 replaced.
