# Fairpolicy Workers Comp Audits fixtures

Everything here is fictional: agency, carriers, insureds, payrolls and premiums.

- `audits.csv`: seven auditable policies (one not yet expired, left out).

Planted, as of 2026-11-18 (30 days to start, 10% additional premium, 20% payroll change):
- WC-2501: ended 1 September (78 days), nothing recorded: audit not started.
- WC-2502: audited payroll 520,000 against 400,000; 3,600 additional (30%): large additional premium.
- WC-2503: payroll down; 1,800 return premium: return due.
- WC-2504: payroll up 25%, 450 additional (7.5%): update the estimate.
- GL-2505: audit scheduled for 25 November: pending. WC-2506: close to the estimate: ok.

Expected: 6 audits, 4,170 additional premium, 1,800 returned.
