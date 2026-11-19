# Fairpolicy Direct Agency Bill fixtures

Everything here is fictional: agency, carriers, clients and amounts.

- `policies.csv`: eight policies in an AMS360-style list with the Bill Method coded; one expired.
- `direct-bill-statement.csv`: the carriers' direct-bill commission lines for October 2026.
- `agency-invoices.csv`: the agency-bill invoices the agency sent in October 2026.

Planted:
- CGL-8005: invoiced by the agency (2,800.00) and on the direct-bill statement: possibly billed twice.
- BOP-8003: coded agency bill but paid on the direct-bill statement.
- WC-8004: coded direct bill but the agency invoiced 2,400.00.
- UMB-8006: no bill type coded.
- PA-8001, HO-8002 and CA-8007: billed as coded. PA-8008 is expired and left out.

Expected: 7 active policies, 4 mismatches, 5,200.00 invoiced on policies the carrier may also bill.
