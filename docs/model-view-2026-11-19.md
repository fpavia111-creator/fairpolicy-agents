# What reaches the AI model (2026-11-19)

Made by `node scripts/model-view.mjs` (`npm run model-view`). Each check runs on its fictional fixtures with masking on (the default) and off, and the two results are compared field by field.

- **Masked** (default `--phi mask`): client and insured names become `CL-` pseudonyms and client numbers `CID-` pseudonyms (the same value always gives the same pseudonym on one machine, so the model can still group by it); birth dates become the birth year; driver licence numbers, SSNs, street addresses, phone numbers and e-mail addresses are removed. A client name written inside another text field is replaced too, when the same name appears in a name column of the file.
- **Also masked with `--phi strict`**: policy numbers (`POL-`), claim numbers (`CLM-`) and VINs (`VIN-`); ZIP codes are cut to three digits.
- **Sent in clear**: amounts, rates, percentages, counts, dates and statuses; carrier, producer, account manager and CSR names; lines of business; and the text fields listed below. Free-text fields are sent as typed: if someone types a person's name into a cancellation reason or an activity note, the model sees it.
- `detail` and `next_step` are the agent's own sentences built from the fields above (masked values stay masked in them).

Results go to whatever model the user's assistant uses. For client data, use a model covered by your own agreements (or a local model) and keep masking on. This is not a claim of compliance with any law or standard.

| Agent | Masked (default) | Also masked with --phi strict | Text in clear | Free text in clear |
|---|---|---|---|---|
| fairpolicy-additional-insureds | client | policy_number | covered_by, csr, holder, request_id, requirement | holder, requirement |
| fairpolicy-book-valuation | - | - | metric | - |
| fairpolicy-carrier-appointments | - | policy_numbers | appointment, carrier, producer, ref, state | - |
| fairpolicy-carrier-payables | client | policy_number | carrier, transaction_type | - |
| fairpolicy-certificate-limits | client | policy_number, ref | certificate, holder, issued_by, issues | holder |
| fairpolicy-commercial-renewals | client | policy_number | carrier, csr, line, next_milestone, overdue, producer | - |
| fairpolicy-commission-chargebacks | client | policy_number | carrier, line, producer | - |
| fairpolicy-commission-statements | client | policy_number | carrier, line, producer, statement_id, transaction_type | - |
| fairpolicy-contingency-bonus | - | - | carrier, next_tier, tier | - |
| fairpolicy-cross-sell | client | - | csr, lines, producer | - |
| fairpolicy-data-quality | client | policy_number | carrier, csr, issues, line, producer | - |
| fairpolicy-direct-agency-bill | client | policy_number | carrier, coded_bill_type, csr, line, producer | - |
| fairpolicy-download-errors | - | policy_number | carrier, message, ref, transaction_type | message |
| fairpolicy-duplicate-clients | client, client_id, other_client, other_client_id | - | pair, shared | - |
| fairpolicy-lapsed-policies | client | policy_number, replacement | carrier, csr, line, policy_status, producer, reason | reason |
| fairpolicy-license-renewals | - | - | license_number, license_type, person, role, state | - |
| fairpolicy-loss-runs | client | - | by_year, years | - |
| fairpolicy-missing-commissions | client | policy_number | carrier, line, producer | - |
| fairpolicy-open-claims | client | claim_number, policy_number | adjuster, carrier, claim_ref, csr, line | adjuster |
| fairpolicy-pending-endorsements | client | policy_number | bill_type, carrier, change, csr, request_id | change |
| fairpolicy-policy-checking | client | policy_number | carrier, issues, line | - |
| fairpolicy-premium-finance | client | policy_number | agreement, finance_company | - |
| fairpolicy-producer-retention | - | lost_policies | producer | - |
| fairpolicy-producer-splits | client | policy_number | carrier, kind, producer | - |
| fairpolicy-receivables-aging | client, client_id | policy_number | carrier, csr, invoice, producer | - |
| fairpolicy-renewal-remarket | client | policy_number | carrier, csr, line, producer | - |
| fairpolicy-return-premiums | client | policy_number | applied_to, bill_type, carrier, csr | - |
| fairpolicy-signed-declinations | client | policy_number | carrier, csr, declined_coverages, line, producer, um_selection | declined_coverages, um_selection |
| fairpolicy-trust-account | client | ref (policy numbers inside it) | carrier, ref (the bank line description, as the bank printed it) | ref (the bank line description, as the bank printed it) |
| fairpolicy-workers-comp-audits | client | policy_number | audit_status, carrier, csr, line | - |
