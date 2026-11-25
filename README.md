# Fairpolicy insurance agency agents

[Deutsch](README.de.md) · [Français](README.fr.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Italiano](README.it.md) · [日本語](README.ja.md) · [简体中文](README.zh-Hans.md) · [한국어](README.ko.md)

Thirty small MCP agents for the back office of independent insurance agencies and brokerages. Each one owns **one job**, such as checking a carrier commission statement against the commission you expect, reconciling the premium trust account, or finding renewals with no review logged, and cannot act outside it. They read the files your agency already exports: policy and expiration lists from Applied Epic, Vertafore AMS360 and Sagitta, HawkSoft, EZLynx or QQCatalyst, carrier commission statements, download logs, certificate logs and spreadsheets.

Part of Fair Agents by Mythos Machines. MIT licence · Node 20 or newer · local files only · no credentials · no runtime dependencies. The software is free; the paid part is a fixed-price setup on your own files.

## Try one

```bash
npx -y fairpolicy-commission-statements demo   # a commission statement against expected commission, fictional data
npx -y fairpolicy-trust-account demo           # the premium trust account against premiums owed to carriers
```

Every agent has a `demo` on fictional files, an `eval` with its own test cases and an MCP server (`npx -y <agent> mcp --root <folder>`) for Claude Desktop, Claude Code, Cursor and other MCP hosts.

## The agents

**Commissions (5):** `fairpolicy-commission-statements` (each statement line against the expected commission), `fairpolicy-missing-commissions` (policies that never reached a statement), `fairpolicy-commission-chargebacks` (chargebacks on cancellations, pro rata or short rate), `fairpolicy-producer-splits` (producer shares against producer pay), `fairpolicy-contingency-bonus` (carrier profit-sharing tiers and the premium to the next tier).

**Agency bill, trust and premium money (6):** `fairpolicy-trust-account` (premium trust account against premiums owed), `fairpolicy-receivables-aging` (agency-bill receivables, premium fronted to carriers), `fairpolicy-direct-agency-bill` (clients who may be billed twice), `fairpolicy-premium-finance` (notices of intent to cancel, funding not passed on), `fairpolicy-carrier-payables` (carrier account current against your payables), `fairpolicy-return-premiums` (return premiums not refunded, uncashed checks).

**Renewals, retention and the book (6):** `fairpolicy-renewal-remarket` (renewals with no review or remarket logged), `fairpolicy-commercial-renewals` (commercial renewal milestones), `fairpolicy-lapsed-policies` (cancellations and lapses with no replacement), `fairpolicy-cross-sell` (one-line accounts and line gaps, as a review list), `fairpolicy-producer-retention` (retention by producer, line and carrier), `fairpolicy-book-valuation` (book of business figures for a valuation conversation, not an appraisal).

**Service (6):** `fairpolicy-certificate-limits` (certificates against the policies behind them), `fairpolicy-additional-insureds` (additional insured, waiver and primary/non-contributory requests), `fairpolicy-pending-endorsements` (changes not sent, not confirmed or not billed), `fairpolicy-policy-checking` (issued policies against binders), `fairpolicy-open-claims` (open claims with no update or near renewal), `fairpolicy-loss-runs` (loss runs by account and year).

**Licensing, E&O files and data (7):** `fairpolicy-license-renewals` (licences and continuing education by state, against settings your agency confirms), `fairpolicy-carrier-appointments` (business written without an active appointment), `fairpolicy-signed-declinations` (signed applications, UM/UIM rejections, flood offers and declinations on file), `fairpolicy-workers-comp-audits` (premium audits), `fairpolicy-data-quality` (dates, VINs, contacts and staff fields), `fairpolicy-duplicate-clients` (duplicate client records), `fairpolicy-carrier-feed-errors` (failed and unmatched carrier downloads).

## How they stay safe

- **One job each.** Every agent has its own tool allowlist; any other tool name, including ones a model invents, is blocked.
- **Nothing binding happens on its own.** No agent binds, cancels, endorses, places or recommends coverage, pays a carrier, moves trust money, issues a certificate or sends a message. Those tools are refused outright, or (for the few drafts: a commission inquiry, a missing-commission request, a chargeback recalculation, a reconciliation note, a balance reminder) a DRAFT is written and waits for one named person's click, even in Auto mode.
- **Client data is masked.** Client and insured names, client codes, birth dates, driver licence numbers, addresses, phones, e-mails and SSNs are replaced with stable pseudonyms such as `CL-3f9a1c2e` in everything returned to the AI model (`--phi strict` also hides policy and claim numbers and VINs). The report and draft files written on your computer keep the real values, so keep them in a secure folder.
- **Local files only.** No network calls, no telemetry, no credentials. Every call goes to a hash-chained audit log under `.fairpolicy/`.
- **Your rules, not ours.** Commission schedules, split percents, bonus grids, state continuing-education hours, deadlines and thresholds are settings in your own files. Licensing, appointment, trust-account and unclaimed-property rules differ by state; the values are settings your agency confirms, never legal advice.

## Use with Claude Code

```bash
claude mcp add fairpolicy-commission-statements -- npx -y fairpolicy-commission-statements mcp --root .
```

or add this repository as a plugin marketplace and install the agents you want (`.claude-plugin/marketplace.json`).

## Develop

```bash
npm install
npm test                      # every package (core and 30 agents)
npm run evals                 # every agent's private eval cases
npm run hostile               # planted formulas, HTML, path tricks and AI-directed text
npm run hostile:args          # broken arguments to every tool
npm run bench                 # 1,000 and 10,000 rows per input file
npm run intl                  # every spreadsheet eval case as a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export
npm run release:check:offline # metadata, honest copy, secrets, one-click policy, npm pack
node scripts/new-agent.mjs fairpolicy-<job words> "<description>"   # scaffold a new agent
```

The checks, their numbers and what is not checked yet are in [REVIEW-ver1.md](REVIEW-ver1.md).

## Limits

- Export layouts were written from knowledge of each system and were not tested against a live account; `inspect` shows how a file was read, and `fairpolicy-sources.json` names columns by hand.
- The agents are not legal, tax, accounting or coverage advice and make no claim that an agency complies with any law. A licensed person decides what to offer, bind, change or send.

MIT © 2026 Kurt Francisco
