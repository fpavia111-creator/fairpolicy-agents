# Fairpolicy Open Claims fixtures

Everything here is fictional: agency, carriers, adjusters, clients and amounts.

- `claims.csv`: six claims from an agency claim log, one closed.

Planted, as of 2026-11-18 (3 days to report, 30 quiet days, 180 days long, 60 days to renewal):
- AC-1: logged 10 November, no carrier claim number: not reported.
- AC-2: last activity 20 September (59 days): no update.
- AC-3: open on BOP-2103, which renews 20 December: renewal soon.
- AC-4: open since 1 March (262 days): open long.
- AC-5: recent activity: active. AC-6: closed, counted but not listed.

Expected: 5 open claims, 64,200 incurred, 4 needing attention.
