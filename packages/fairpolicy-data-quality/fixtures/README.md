# Fairpolicy Data Quality fixtures

Everything here is fictional: agency, carriers, clients, addresses and VINs (the VINs start with 0, which no manufacturer uses, and carry a valid check digit).

- `policies.csv`: nine policies with contact fields (one expired, left out).
- `vehicles.csv`: vehicles on the auto policies.

Planted:
- CGL-2605: expiration before effective (critical). WC-2607: no premium (critical).
- PA-2602: VIN missing. PA-2603: VIN has the letter O and 16 characters (vehicle data).
- HO-2604: no ZIP and no e-mail or phone (contact data).
- BOP-2606: no producer (staff data).
- PA-2601 and HO-2608: clean.
