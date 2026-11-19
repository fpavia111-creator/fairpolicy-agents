# Fairpolicy Receivables Aging fixtures

Everything here is fictional: agency, carriers, clients and amounts.

- `receivables.csv`: eight agency-bill items in an Applied Epic-style transaction export (Lookup Code, Item Number, Balance), one already paid off.

Planted, as of 2026-11-18:
- INV-7001: 2,400.00 open 109 days and already remitted to the carrier: fronted premium.
- INV-7002: 900.00 left, 100 days late: over 90. INV-7003: 6,400.00, 64 days: over 60. INV-7004: 3,000.00, 39 days: over 30.
- INV-7005: 650.00, 13 days: current. INV-7006: due 1 December: not due.
- INV-7007: a 220.00 return premium owed to the client: credit balance.
- INV-7008: paid off, not listed.

Expected: 14,550.00 open, 220.00 in credit balances, Haverleigh Farms owes 8,800.00, all over 30 days.
