# Fairpolicy Carrier Payables fixtures

Everything here is fictional: agency, carrier, clients and amounts.

- `carrier-account-current.csv`: Sample Casualty's agency-bill account current for November 2026.
- `agency-payables.csv`: the same carrier's payables in the agency system (one policy number with a term suffix).

Planted, as of 2026-11-18:
- WC-1102: the carrier nets 8,100.00 (10% commission); the agency system has 8,460.00 (6%): differs by -360.00.
- CA-1103: an endorsement the carrier bills (520.00) that is not in the agency system.
- CGL-1104: 2,210.00 owed in the agency system, not billed by the carrier yet.
- PKG-1105: 5,400.00 agreed, due 15 November: past due.
- BOP-1101 and the CA-1106 return: agree.

Expected: carrier 16,820.00, agency 18,870.00.
