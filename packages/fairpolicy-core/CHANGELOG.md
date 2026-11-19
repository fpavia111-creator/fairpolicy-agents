# Changelog

## 0.1.0 (unreleased, Fairpolicy ver 1, 2026-11-18)

First version, for the Fairpolicy insurance agency agents. Built from the Remedy core (the Lodestar core pattern with the Windows fixes of 18 Nov 2026 and patient-data masking), with:

- Client-data masking for insurance exports (client and insured names, client codes, birth dates, driver licence numbers, addresses, phones, e-mails, SSNs; strict mode adds policy and claim numbers and VINs). Includes the Evergreen fix for values with punctuation in front.
- Insurance helpers (carrier and policy matching, lines of business, transaction, status and bill-type words, unearned premium, commission), shared policy and commission-statement column vocabularies, and an agency-system export catalogue.
- Insurance column names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean; report glossary in nine languages.
- Lodestar's extra contract tests (column order, BOM and CRLF, padded values, row order, header-only files, report language).
- The Fairmake fix for headers that match a field only by letter case.
- The family builder (fairpolicyAgent, familyDemo, countBy, byPriority).
- Medical-billing modules (X12, code tables, billing sources, denials) removed.
- Final pass (19 Nov 2026): carrier keys keep Assurance, Underwriters, Group, Corp and Inc. On the Texas Department of Insurance list of 1,417 insurers these words were the only difference between 8 pairs of different companies; "Example Inc" still finds "Example Insurance Company" through the loose match when no other carrier fits.
- Final pass: `safePath` refuses paths over 1,024 characters (a 200,000-character path made a recursive mkdir loop on Windows); a short GBK header that is also valid UTF-8 is read as GBK.
