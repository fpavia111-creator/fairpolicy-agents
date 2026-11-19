# Fairpolicy Certificate Limits fixtures

Everything here is fictional: agency, carriers, insureds, certificate holders and limits.

- `coverage.csv`: five policies with limits, terms, status and endorsements.
- `certificates.csv`: seven certificate lines (certificate C-9001 lists two policies).

Planted:
- C-9004 was issued on 15 October for CGL-1804, cancelled 30 September: not in force.
- C-9002 shows a 2,000,000 occurrence limit; the policy has 1,000,000.
- C-9003 shows additional insured on the auto policy, which has no AI endorsement.
- C-9001 shows a waiver of subrogation on WC-1802, which has none (its GL line is right).
- C-9005 shows the umbrella dates as 1 March; the policy runs from 1 April.
- C-9006 names BOP-1899, not in the coverage file.

Expected: 6 certificates, 7 lines, 6 certificates with an issue.
