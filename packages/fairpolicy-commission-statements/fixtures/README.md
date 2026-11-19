# Fairpolicy Commission Statements fixtures

Everything here is fictional: the agency, the carriers (Example Mutual, Sample Casualty, Demo Indemnity, Test Fire & Marine), the clients, policy numbers and amounts. Any match with a real person or business is a coincidence.

- `policies.csv`: nine policies in an AMS360-style policy list (Customer #, Exec, Rep).
- `statement-2026-10.csv`: thirteen direct-bill commission statement lines from four carriers. Planted:
  - PA-5521800, new business paid at 12% where the schedule says 15%: underpaid 55.20 (the statement prints 12%).
  - WC-88120, new workers comp paid at 8% (the renewal rate) instead of 10%: underpaid 252.00.
  - UMB-9002 paid at 20% instead of 15%: overpaid 20.50.
  - HO-7730288 endorsement listed twice: both lines are possible duplicates.
  - PA-5599999 is not in the policy list (no_policy).
  - CA-20441: Test Fire & Marine is not in the schedule and no rate is booked (no_rate).
  - WC-88120 audit line with no premium (not_checked).
  - PA-5521911 is listed under the carrier code EXM (alias in the schedule); BOP104455 matches BOP-104455-02 (term suffix); the CGL-330017 cancellation returns commission at the same 15% (ok).
- `schedule.json`: expected rates by carrier, line and new or renewal, tolerance 1.00.
- `phi-canaries.json`: client names that must never reach a result the AI model sees.

Expected: 13 lines, 3892.00 paid against 3089.70 expected (the line not in the policy list has no line of business, so no expected rate); 2 underpaid by 307.20; 1 overpaid by 20.50.
