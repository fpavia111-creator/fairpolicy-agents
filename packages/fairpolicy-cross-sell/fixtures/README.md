# Fairpolicy Cross Sell fixtures

Everything here is fictional: agency, carriers, clients and amounts.

- `policies.csv`: fifteen policies for seven clients in an EZLynx-style export (one cancelled).
- `rules.json`: an agency's own rules, used in one eval case instead of the defaults.

Planted (default rules):
- Rowena Castellane: personal auto only (one line; auto without home).
- Imelda Fawkner: condo only (one line; home without auto).
- Castellane Ceramics LLC: BOP only (one line; GL or BOP without workers comp).
- Desmond Achterberg: home and auto, no umbrella (the cancelled boat policy does not count).
- Vantongeren Freight Inc: commercial auto, GL and WC, no commercial umbrella.
- Aurelio Vantongeren and Achterberg Bakery LLC: rounded.

Expected: 7 accounts, 14 active policies, 3 one-line accounts, 2 with gaps.
