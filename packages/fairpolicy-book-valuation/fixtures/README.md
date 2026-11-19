# Fairpolicy Book Valuation fixtures

Everything here is fictional: agency, carriers, clients and amounts.

- `book.csv`: fourteen policies for seven clients (one expired, left out).
- `book-settings.json`: concentration limits and the low and high revenue multiples a principal chose for the example.

Planted:
- Sample Casualty pays 5,005 of 8,860 commission (56.49%), over the 40% limit.
- Greaves Plumbing LLC is 3,050 (34.42%), over the 10% limit for one client.
- WC-1613 has no commission and no rate: 1 of 13 policies (7.69%), over the 5% limit.
- HO-1605 has no commission but a 15% rate: 270 is used.

Expected: 13 policies in force, 7 accounts, 8,860 commission on 75,100 premium; range 13,290 to 22,150 from the multiples set.
