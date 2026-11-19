# Fairpolicy Policy Checking fixtures

Everything here is fictional: agency, carriers, clients, limits and premiums.

- `bound.csv`: what was bound for six policies, one row per coverage.
- `issued.csv`: what the carriers issued, one row per coverage.

Planted, as of 2026-11-18 (30 days to issue, 25.00 premium tolerance):
- WC-2904: bound 1 October, nothing issued after 48 days: not issued.
- HO-2901: dwelling issued at 350,000; bound at 400,000: coverage reduced.
- PA-2902: issued premium 1,520.00 against 1,400.00 bound: premium differs.
- CGL-2903: issued from 15 October; bound from 1 October: dates differ.
- BOP-2905: matches. UMB-2906: bound 8 November, not issued yet but within the 30 days (not listed).
