# Fairpolicy ver 1: review

18 Nov 2026. Fairpolicy is the Fair Agents family for independent insurance agencies and brokerages (Mythos Machines). Built in one day without Kurt's input, as BUILD-BRIEF.md asked; every decision is written down below. Nothing was published, pushed, uploaded, e-mailed or sent to Stripe or the websites.

## Scope
30 agents and `fairpolicy-core`, version 0.1.0 of every package, in five groups:

| Group | Agents |
|---|---|
| Commissions (5) | commission-statements, missing-commissions, commission-chargebacks, producer-splits, contingency-bonus |
| Agency bill, trust and premium money (6) | trust-account, receivables-aging, direct-agency-bill, premium-finance, carrier-payables, return-premiums |
| Renewals, retention and the book (6) | renewal-remarket, commercial-renewals, lapsed-policies, cross-sell, producer-retention, book-valuation |
| Service (6) | certificate-limits, additional-insureds, pending-endorsements, policy-checking, open-claims, loss-runs |
| Compliance and data (7) | license-renewals, carrier-appointments, signed-declinations, workers-comp-audits, data-quality, duplicate-clients, download-errors |

Every package name is `fairpolicy-<what it does>` (bin = package name, `mcpName` = `io.github.fpavia111-creator/<name>`), with a one-word tool prefix (`commissions_check`, `trust_check`, `crosssell_check` ...). All 31 names were free on npm on 18 Nov (`docs/npm-names-2026-11-18.md`).

Every agent is read-and-report. None binds, cancels, endorses, places or recommends coverage, pays a carrier or producer, moves trust money, issues a certificate, files anything or sends a message. Those tools are listed and refused. Five agents write a DRAFT for one named person (commission inquiry, missing-commission request, chargeback recalculation, account current reconciliation, client balance reminder); approving it is a `binding_send` one-click action, even in Auto, and the agent never sends it.

## Checks run, and results (Windows 10, Node 24.20.0)
| Check | Result |
|---|---|
| `npm test` (all workspaces) | 792 tests, 792 pass (131 in fairpolicy-core; 21 to 25 per agent) |
| `npm run evals` | 530 eval cases across 30 agents, all pass (16 to 27 per agent) |
| `npm run hostile` (formulas, HTML, `../` ids, AI-aimed text planted in every fixture, every eval case) | 2,650 calls, 681 planted values, 0 findings |
| `npm run hostile:args` (null, numbers, arrays, a 200,000-character string, `../` and absolute paths in every argument of every tool) | 12,088 calls over all 30 agents (data and argument passes, run in six batches of five agents), 0 findings |
| `npm run intl` (every spreadsheet eval case rewritten as a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export: local column names, `1.234,56`, day-first dates, semicolons, legacy encodings) | 417 cases x 8 languages, every case that passes in English passes in every language; 338 of 448 column names translated (German count) |
| `npm run bench` (1,000 and 10,000 rows per input file, every read and report tool with an eval case) | 90 tool runs at 10,000 rows, 0 need attention after two fixes (below); median 1.2 s, slowest 5.5 s, peak memory under 340 MB |
| `npm run release:check:offline` | ready to publish (dry run): 31 packages, metadata, honest copy (94 files), secret scan (834 files), one-click categories and policy, no paid tier, tests, evals, hostile data pass and `npm pack` (516 KB) all pass; npm names skipped offline (checked by hand, see above) |
| Masking canaries | every agent lists at least 3 fictional client identifiers; a test runs every eval case and none reaches a result |
| MCP stdio smoke test | every agent: initialize, list tools, refuse an unknown tool, write the audit log |
| `plugin:check`, MCP Registry step | 61 plugin files current; `add-mcp-registry.cjs` added `mcpName` and `server.json` to all 30 agents (page fairpolicy.html) |

## How it was built (decisions)
- **Core:** copied from `remedy-core`, which is the Lodestar core pattern with the 18 Nov Windows fixes plus patient-data masking. Insurance agencies hold personal data (names, birth dates, driver licence numbers, addresses), so masking was the deciding reason. The medical-billing modules (X12, code tables, billing sources, denials) were removed. Renamed `fairpolicy-core` (state folder `.fairpolicy/`, environment variables `FAIRPOLICY_*`, licence prefix `FAIRPOLICY1`).
- **Masking for insurance:** client and insured names and client codes become pseudonyms (`CL-`, `CID-`), birth dates the birth year, driver licence numbers, addresses, phones, e-mails and SSNs are removed. Policy numbers, claim numbers and VINs stay visible in the default mode because staff and the model need them to match records; `--phi strict` hides them. Producers, account managers and carriers are not masked. Commercial insureds are masked too, because an export does not say which clients are people. The option keeps the core's name `--phi`.
- **Taken from other sessions' notes:** the Evergreen fix (a value with punctuation in front is still found in text), the Fairmake fix (headers that match a field only by letter case were left un-renamed, so the field read as blank), Lodestar's extra contract tests (column order, extra column, BOM and CRLF, padded values, blank lines, row order, header-only files, report language), and Fairclinic's safety-eval generator (invented tool, file outside the root, Review mode, unknown and missing arguments, every refused tool, memory, drafts, masking).
- **Family builder:** `fairpolicyAgent(spec)` builds each agent's check, explain, report, optional draft and one-click request, memory and refused tools and their policy, so every agent has the same shape; `familyDemo` runs the same demo for each.
- **Insurance helpers in the core:** carrier matching ("Example Ins Co" = "Example Insurance Company", writing companies such as "Casualty" and "Indemnity" kept apart), policy numbers with or without a term suffix (`BOP 104455-02` = `BOP104455`, only for numbers of five characters or more so `PA-1` and `PA-2` stay apart), lines of business, transaction, status and bill-type words, pro-rata and short-rate unearned premium, shared column vocabularies for policy lists and commission statements, and an export catalogue for Applied Epic, AMS360, Sagitta, HawkSoft, EZLynx, QQCatalyst, carrier statements and a German Courtageabrechnung.
- **Column names in eight languages** for policy number, client, carrier, line, effective and expiration dates, premium, commission and rate, producer, account manager, transaction, billing, cancellation date, claim number, date of loss, reserve, VIN, paid and licence number. "Estado" is left out of state (it means status in Spanish and Portuguese exports).
- **State rules are settings.** Continuing-education hours, trust-account allowances, reinstatement windows, appointment rules and unclaimed-property timing are values the agency writes and confirms; the fixtures' state settings say they are example values for a fictional agency. No agent states a law.
- **Book valuation** gives figures, never a price. A range appears only if the agency sets both multiples, and says "Not an appraisal".
- **Cross-sell** is a review list for licensed staff: it says what is not written here, not what a client should buy.
- **Fixtures** are fictional throughout: carriers are named Example Mutual, Sample Casualty, Demo Indemnity, Test Fire & Marine and similar; clients have invented names; VINs start with 0 (no manufacturer uses it) and carry a valid check digit.

## Found and fixed during the build
- **Long paths (shared core):** the first full argument pass ran past 25 minutes. A 200,000-character `out_dir` makes a recursive mkdir loop on Windows; the Fairtable session had found the same. `safePath` now refuses paths over 1,024 characters (test added).
- **Speed, renewal-remarket:** 52 s at 10,000 rows. Every policy re-read every activity of its client and normalised the text again for each review word. Each activity is now read once and only the latest review, remarket and activity dates are kept per client: 2.7 s.
- **Speed, lapsed-policies:** 9.3 s at 10,000 rows. The replacement search worked out a date and filtered the whole client-and-line group for every policy. Active policies are now grouped and sorted once: 2.2 s.
- **Policy numbers:** the term-suffix rule first treated `PA-1` and `PA-2` as the same policy (both "PA" without the suffix). Base matching now needs five characters or more.
- **Result fields:** a count named `items` collided with the paged list the family builder returns (carrier-payables). Renamed `lines`; noted for every agent.
- **Safety evals:** the generator found a refused tool whose name contained `_request_` and treated it as the one-click approval tool. Draft and request tools are now found by the agent's own prefix, in the generator, the default prompt and the demo.
- **Renewal remarket:** a remarket activity did not also count as a review, so a remarketed renewal could show "no review". Fixed.
- **Contingency bonus:** with no prior year in the file, a tier asking for growth of 0% was not met. Growth is now only required when the tier asks for more than zero.
- **Trust account:** receipts, remittances and bank lines dated after the check date were counted. Everything is now as of the date given.
- **Pending endorsements:** requests made after the check date were listed as waiting. Left out now.
- **Duplicate clients:** one typo in a long name ("Bartholemew Example") fell under the similarity threshold. Names of two words or more are now compared word by word.
- **Direct and agency bill, lapses, claims, retention, splits:** test fixtures that shared a client by accident; fixed in the tests, logic unchanged.
- **README generator:** demo output on Windows kept the temporary folder path; the generator now strips Windows temp paths, and compares README files ignoring CRLF.

## Not checked yet (say this out loud)
- **Export layouts:** column names for Applied Epic, AMS360, Sagitta, HawkSoft, EZLynx, QQCatalyst, carrier statements, download logs, certificate logs, premium finance portals and licensing exports come from general knowledge. No real export was read. The first setup confirms them with `inspect` and `fairpolicy-sources.json`.
- **ACORD AL3** download files are not parsed; the download agent reads the log your system exports.
- **Rules:** no state rule (licensing, continuing education, appointments, trust accounts, unclaimed property, surplus lines) was checked; the defaults are settings. An agency principal, its E&O carrier and, where needed, a lawyer should read them before relying on the lists.
- **Node 20 and 22, Linux and macOS:** only Node 24 on Windows was run here.
- **`npm run mcp:check`** (the official MCP SDK client) was not run: the SDK is not installed in this repo.
- **Translations** (READMEs and report headings in eight languages) were written by Claude; no native speaker has read them. Rows' reason sentences stay in English.
- **Surplus lines** (filings and taxes by state) was planned as a 31st agent and left out to finish today; it is the first candidate for ver 2.
- No agency principal, CSR, producer, E&O carrier or lawyer has reviewed the agents yet.

## Decisions left for Kurt
Product name Fairpolicy and the family list; prices (`sales/pricing-page-ver1.md`, written as plain numbers as approved); publishing order (fairpolicy-core first, then the 30 agents); the site page `fairpolicy.html` from `sales/site.json`; whether to add the surplus-lines agent before launch.
