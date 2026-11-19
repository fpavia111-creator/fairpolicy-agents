# Fairpolicy Loss Runs fixtures

Everything here is fictional: agency, carriers, insureds, claims and amounts.

- `loss-runs.csv`: thirteen claims from carrier loss runs (one from 2020, outside the five years 2022-2026).
- `premiums.csv`: earned premium by insured and policy year.

Planted (five policy years, 70% limit, 25,000 large loss, 3 claims a year):
- Wexford Plating LLC: 5 claims, 210,000 incurred on 240,000 premium: 87.5%, high loss ratio (and a 120,000 loss).
- Penrose Florist LLC: one 40,000 loss in 2025 on 150,000 premium (26.67%): large loss. The 2020 claim is outside the window.
- Ruskin Mill Apartments LLC: four claims in 2026, 22,000 incurred: frequency.
- Calder Lane Daycare Inc: two small claims: normal. Tamsin Ebury Studio: premium and no claims: clean.

Expected: 5 accounts, 12 claims, 280,000 incurred on 564,000 premium.
