# Fairpolicy Renewal Remarket fixtures

Everything here is fictional: agency, carriers, clients and amounts.

- `expiration-list.csv`: eight policies in a HawkSoft-style export with the renewal premium where the carrier has sent it.
- `activities.csv`: the activity log for the last few months.

Planted, as of 2026-11-18 (120-day window, 45 days urgent, 10% increase):
- HO-1201: expires 10 December with nothing logged: urgent.
- BOP-1203: renewal up 24% (5,000 to 6,200); a review is logged but no remarket.
- WC-1204: renewal up 3.3%; only a certificate activity: no review.
- PA-1202 (review call), CGL-1205 (up 20%, remarketed) and CA-1208 (a renewal meeting on the client with no policy named): reviewed.
- UMB-1206 expires in June (outside the window); PA-1207 is cancelled.

Expected: 6 renewals, 26,600 premium expiring, 3 need attention (16,100).
