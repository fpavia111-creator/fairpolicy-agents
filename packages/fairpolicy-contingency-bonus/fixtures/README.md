# Fairpolicy Contingency Bonus fixtures

Everything here is fictional: the carriers, their grids and the figures. The file holds carrier totals only, no client data.

- `experience.csv`: written and earned premium and incurred losses by carrier for 2025 and 2026, as a carrier experience report gives them.
- `grid.json`: each carrier's bonus tiers as the agency typed them from its contingency agreements.

Planted for 2026:
- Example Mutual: growth 10.37%, loss ratio 45.0%: meets Tier 2 (2%, about 18,100). Tier 3 needs 1,000,000 written: 95,000 short, within 10%: close_to_next.
- Sample Casualty: loss ratio 64% over the 60% limit (and growth 4% under 5%): loss_ratio_too_high; 18,200 of incurred over the line.
- Demo Indemnity: written fell to 150,000, under the 250,000 minimum: below_minimum.
- Placeholder Specialty: meets its 2% tier (about 6,600) but 4,500 was received: received_less.
- Sample Surety: meets its only tier (about 3,150): qualifies.
- Test Fire & Marine: no grid.

Expected: 27,850 estimated, 4,500 received.
