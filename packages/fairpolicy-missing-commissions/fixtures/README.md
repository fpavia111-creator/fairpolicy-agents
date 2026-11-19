# Fairpolicy Missing Commissions fixtures

Everything here is fictional: the agency, carriers (Example Mutual, Sample Casualty, Demo Indemnity, Test Fire & Marine), clients, policy numbers and amounts.

- `policies.csv`: ten policies in a HawkSoft-style export (Client Number, Policy Status), with the commission rate and bill type.
- `statements-2026.csv`: the commission statement lines received since June 2026.

Planted, as of 2026-11-18 with a 45-day wait and a one-year window:
- PA-2002 (Example Mutual, 225 expected) and BOP-2003 (Sample Casualty, 910 expected): missing.
- HO-2010: missing, with no premium or rate to estimate.
- UMB-2008: only an endorsement line was paid (partial, 67.50 expected).
- WC-2004: effective 2026-11-01, still inside the wait (not_yet_due).
- CGL-2005: agency bill. HO-2006: flat cancelled on its effective date.
- HO-2001 and PA-2007 (statement shows PA-2007-01): received.
- CA-2009: effective October 2025, outside the window.
