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
| Licensing, E&O files and data (7) | license-renewals, carrier-appointments, signed-declinations, workers-comp-audits, data-quality, duplicate-clients, download-errors |

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
| `npm run release:check:offline` | ready to publish (dry run): 31 packages, metadata, honest copy (94 files), secret scan (834 files), one-click categories and policy, no paid tier, tests, evals, hostile data pass and `npm pack` (517 KB) all pass; npm names skipped offline (checked by hand, see above) |
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

## Final pass (19 Nov 2026)

Kurt asked every family for one final pass (`BUILD-BRIEF.md`, "Final pass", and `FINAL-PASS-REQUEST.md`). Everything below was run on Windows 10, Node 24.20.0, from a fresh `git clone` of this folder and `npm install --offline`. Nothing was published, pushed, uploaded or sent.

### Checklist
1. **Names.** Every package, bin, tool prefix, title, README and CHANGELOG uses `fairpolicy-<what it does>`. Left over and fixed: the root `package.json` description still said "31 agents named after lighthouses"; the core README named two reports (Olympus, Ladon) that belong to another family's core and said it "follows the Lodestar and Remedy core pattern". The old themed folder names (`fresnel-core`, `eddystone-of-commissions`) are only in git history. Comments that credit a fix to another session (Fairtable, Fairmake, Evergreen) are kept as history.
2. **Each agent read as a buyer.** All 30 READMEs say what the agent does (first paragraph), what it refuses (the bold line), what it reads (`Columns it reads`), its limits, and show a captured demo. Changed: the group heading "Compliance and data" (README in 9 languages, `site.json`, this review) is now "Licensing, E&O files and data", so it cannot be read as a compliance claim.
3. **Honest copy.** No compliance, certification, savings, legal or tax claim in the READMEs, `site.json`, pricing page or sample reports (searched for compliance, certified, guarantee, savings, ensure, prevent, HIPAA, GLBA, legal or tax advice). `site.json` said licence numbers were masked; it now says driver's licence numbers, and that notes people type are sent as typed (producer licence numbers in the licence agent are sent in clear).
4. **Binding actions.** Unchanged and re-checked by the evals: every bind, cancel, endorse, pay, remit, transfer, issue, file and send tool is listed and refused; the five drafts wait for one named person (`binding_send`, one click even in Auto) and are never sent by the agent.
5. **The full bar from a clean install:** see the table below.
6. **Fixtures.** Fictional throughout, including the new clean sets (`fixtures/clean/`); masking is on by default. The real-data files below are kept out of the repository.
7. **site.json and pricing page.** The partner package now has a package name like the others: "Agency network rollout", with "For agency networks and clusters" in its description (the live page showed that phrase as the name). The pricing page table uses the same name. Ten packages, prices and the 30 checks match the pricing page and the 30 agents. Sample reports and READMEs were regenerated after the logic changes (no change in their content).
8. **Packs.** No secrets, no `.fairpolicy/` or `fairpolicy-out/` state in `npm pack` (release check, below). New: `.gitattributes` (LF line endings), because a fresh Windows clone with CRLF files made `plugin:check` report every plugin file as stale; the check now also ignores CRLF.

### Results (fresh clone)
| Check | Result |
|---|---|
| `npm test` | 796 tests, 796 pass (134 in fairpolicy-core; 21 to 25 per agent) |
| `npm run evals` | 530 of 530 eval cases pass across 30 agents |
| `npm run hostile` | 2,650 calls, 1,171 planted values, 0 findings |
| `npm run hostile:args` | 12,058 calls over all 30 agents (data and argument passes, six batches of five agents), 0 findings |
| `npm run intl` | 417 cases x 8 languages: every case that passes in English passes in every language; 338 of 448 column names translated (German count) |
| `npm run bench` | 90 tool runs at 10,000 rows, 0 need attention; median 1.9 s, slowest 7.7 s, peak memory 334 MB (run while one argument batch was still running, so times are higher than on 18 Nov) |
| `npm run release:check:offline` | Dry run passed, 1 skipped (npm names, offline): clean tree, metadata, secret scan (919 files), honest copy (94 files), one-click categories and policy, no paid tier, tests, evals, hostile, pack contents (31 packages, 528 KB). Names checked by hand the same day: all 31 still free on npm |
| `readme:check`, `plugin:check` | both pass on the fresh clone |
| `npm run accuracy` | 122 of 122 planted problems found, 0 unplanned findings, 0 findings on 442 clean rows, 79 of 79 mutation cases caught |
| Masking canaries | 137 fictional client values across the 30 agents; the contract tests run every eval case and none reaches a result |
| `try_it` from the clone | the four commands, with npm offline and HTTP proxies pointed at a closed port: install in 4 s, demo exit 0, all 7 steps run |

### Kurt's five questions
**1. Accuracy (`npm run accuracy`, `docs/accuracy-2026-11-19.md`).** For each agent the planted problems are the ones its `fixtures/README.md` lists (122 in all, 1 to 8 per agent). A finding is a row whose status asks a person to act; rows that are on time, waiting inside their time, done or matching are not findings. The clean set (`fixtures/clean/`, made from `scripts/accuracy-specs.mjs`) is the demo files with every planted problem removed; the mutation cases make one edit to it (one row changed, added or dropped) and expect one named finding.

| Family | Planted found | Unplanned findings | Findings on clean rows | Mutation cases caught |
|---|---|---|---|---|
| Fairpolicy (30 agents) | 122 / 122 | 0 | 0 on 442 rows | 79 / 79 |

Per agent (planted found, findings on the clean rows, mutations caught): additional-insureds 4/4, 0 of 10, 3/3; book-valuation 4/4, 0 of 48, 1/1; carrier-appointments 4/4, 0 of 13, 2/2; carrier-payables 4/4, 0 of 12, 3/3; certificate-limits 6/6, 0 of 13, 3/3; commercial-renewals 3/3, 0 of 22, 2/2; commission-chargebacks 4/4, 0 of 19, 2/2; commission-statements 8/8, 0 of 20, 3/3; contingency-bonus 5/5, 0 of 11, 3/3; cross-sell 5/5, 0 of 23, 2/2; data-quality 6/6, 0 of 13, 3/3; direct-agency-bill 4/4, 0 of 14, 2/2; download-errors 3/3, 0 of 8, 3/3; duplicate-clients 4/4, 0 of 7, 4/4; lapsed-policies 4/4, 0 of 11, 3/3; license-renewals 4/4, 0 of 7, 3/3; loss-runs 3/3, 0 of 21, 3/3; missing-commissions 4/4, 0 of 18, 2/2; open-claims 4/4, 0 of 6, 3/3; pending-endorsements 3/3, 0 of 7, 3/3; policy-checking 4/4, 0 of 17, 3/3; premium-finance 4/4, 0 of 7, 3/3; producer-retention 1/1, 0 of 25, 1/1; producer-splits 5/5, 0 of 21, 3/3; receivables-aging 5/5, 0 of 8, 3/3; renewal-remarket 3/3, 0 of 16, 2/2; return-premiums 2/2, 0 of 6, 2/2; signed-declinations 4/4, 0 of 17, 3/3; trust-account 4/4, 0 of 15, 3/3; workers-comp-audits 4/4, 0 of 7, 3/3.

How it got there, honestly: the first run found 1 finding on the clean set and missed 3 mutation cases. All four were mistakes in the test specs, not in the agents: my clean set left 3 claims in one year, which the loss-run default flags by design ("this many claims in one policy year"); and three expectations were wrong about the written rules (cross-sell has no umbrella rule for an account without commercial auto; two different names sharing an e-mail is a household, not a duplicate; open claims count the reported date as activity). The specs were corrected; no agent logic was changed for these numbers. One fixture README was completed: in book valuation the top-10-clients limit is also exceeded (7 accounts are 100% of the book), which the agent rightly reported. The numbers say the rules do what they are written to do on data built to test them, not how often they are right on a real agency's files; the clean sets are small (442 rows) and written by the same author as the rules.

**2. Security: what reaches the model (`npm run model-view`, `docs/model-view-2026-11-19.md`, per agent).** Each check was run with masking on and off and the results compared field by field.
- Masked by default in the 24 agents whose results carry clients: client and insured names (`CL-` pseudonyms), client numbers (`CID-`), birth dates (year only); driver's licence numbers, SSNs, street addresses, phones and e-mails are removed. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits.
- Sent in clear: amounts, rates, dates, counts and statuses; carrier, producer, account manager and CSR names; lines of business; policy numbers (default mode). Agent by agent, the text in clear that could carry personal data: **license-renewals** sends staff names and their licence numbers (producer licence data is public in most states, but it is still personal data); **certificate-limits** and **additional-insureds** send certificate holder names and the requirement text; **open-claims** sends carrier adjuster names; **lapsed-policies** sends the cancellation reason; **pending-endorsements** the change description; **download-errors** the carrier's error message; **signed-declinations** the UM selection and declined-coverage text; **trust-account** the bank line description as the bank printed it (a refund line may name a client). Book valuation, carrier appointments, contingency bonus, download errors, license renewals and producer retention carry no client fields in their check results.
- Re-run: the 137 masking canaries (every eval case) and the hostile data and argument passes, table above.
- Results are sent to whatever model the user's assistant uses. For client data, use a model covered by the agency's own agreements, or a local model, and keep masking on. Fairpolicy makes no claim of compliance with GLBA, state privacy law or any other law or standard.

**3. Compatibility.** Tested against a real agency or carrier export: **0**. Written from documentation: **0**. Written from knowledge of the export and not yet checked against documentation or a real export: **all 11 catalogued layouts** (Applied Epic policy list and transaction export; AMS360 policy list and invoice report; Sagitta policy list; HawkSoft, EZLynx and QQCatalyst policy exports; carrier commission statement; download log; German Courtageabrechnung). The other inputs (certificate logs, licence lists, loss runs, audit lists, finance agreements, bank statements, producer pay) use Fairpolicy's own column names with aliases, not a vendor layout. Tested on a public sample: the Texas Department of Insurance licence list and FEMA's NFIP claims, both converted to the agents' columns by `scripts/realdata.mjs`; they test the rules and real values (dates, amounts, VINs), not a vendor's export layout. ACORD AL3 download files are not parsed.

**4. Commercial traction.** No paying customers; no checkout is live (main session's answer for the suite).

**5. Support: who maintains rules, thresholds and layouts.** No state law, carrier rule or standard is built into Fairpolicy. Every rule that can change is one of these:

| Rule | Where it lives | Source and date | How a customer updates it |
|---|---|---|---|
| CE and ethics hours, period, by state | `state-settings.json` (license-renewals `states`) | The agency; each state carries `confirmed_by` and `confirmed_on`. Fixture values are fictional examples (2026-11-01) | Edit the file; a state with no entry is listed as "no state rule" |
| Trust account: due-soon days, operating, refund and fee words, state note | `trust-settings.json` (trust-account `settings`) | The agency's reading of its state's trust rule | Edit the file |
| Commission rates by carrier, line, new and renewal; carrier aliases | `schedule.json` (commission-statements) | The agency's carrier agreements | Edit the file; add aliases with the memory tool |
| Producer split percents, house accounts, shared policies | `splits.json` (producer-splits) | The agency's producer agreements | Edit the file |
| Contingency bonus tiers and amounts received | `grid.json` (contingency-bonus) | Each carrier's bonus agreement for the year | Edit the file each year |
| Book limits and revenue multiples | `book-settings.json` (book-valuation) | The agency or its advisor | Edit the file |
| Cross-sell rules | `rules.json`, or the defaults in `fairpolicy-cross-sell/src/logic.js` (ver 1, 18 Nov 2026) | Product defaults, no outside source | Pass a rules file |
| Required signed documents by line | `checklist.json`, or the defaults in `fairpolicy-signed-declinations/src/logic.js` (18 Nov 2026) | Product defaults (signed application; flood offer on home lines); the agency's E&O carrier may require more | Pass a checklist file |
| Commercial renewal milestones (120, 90, 75, 30, 21, 7 days) | `schedule.json`, or the defaults in `fairpolicy-commercial-renewals/src/logic.js` | Product defaults | Pass a schedule file |
| Day counts and limits (reinstatement 30 days, renewal window 120 and 45 days, 10% increase, loss ratio 70%, large loss 25,000, 3 claims a year, audit 30 days, 10% and 20%, aging 30/60/90, and the others in each tool's arguments) | Tool arguments with defaults in each `manifest.js` (ver 1, 18 Nov 2026) | Product defaults, no outside source | Pass the argument on each run |
| Short-rate cancellation (10% penalty) | `fairpolicy-core/src/insurance.js` | A common convention; carriers' short-rate tables differ | Choose pro rata (default) or short rate per run |
| Export layouts, line-of-business words, transaction and status words, carrier filler words, column names in 8 languages | `fairpolicy-core/src/exports.js`, `insurance.js`, `insurance-sources.js`, `i18n/columns.js` (18 Nov 2026; carrier words changed 19 Nov) | Written from knowledge of the exports | Map columns in `fairpolicy-sources.json`, add carrier and line aliases with the memory tools; new layouts come in package releases |

Mythos Machines maintains the code, layouts and defaults through package releases (monthly support covers new export layouts and setting changes). Nobody watches state law for the customer: the agency confirms its own settings.

### Real data (`npm run realdata`, `docs/realdata-2026-11-19.md`)
Public, lawful data in its published format, downloaded on 19 Nov 2026 to `_realdata/` (git-ignored). No names were downloaded: licence rows were fetched without the name column and vehicle rows without the owner. Each test compares the agent with an independent count written in the script.

| Source (licence) | Agent | Rows | Found | Errors against the independent count |
|---|---|---|---|---|
| [TDI agent and adjuster licences](https://data.texas.gov/dataset/kxv3-diwf), General Lines Agent, first 20,000 by licence number (Texas Open Data Portal; no licence named on the dataset) | license-renewals | 20,000 | 444 expired, 702 due within 60 days, 18,854 current | 0 after a fix. **Found:** the file has no CE hours, and blank hours were read as zero, so the old code listed 1,195 licences expiring within 90 days as short of CE (measured with the old code on the same file). Blank now means "not in the file". |
| [TDI active company appointments](https://data.texas.gov/dataset/avjc-7u2m), distinct insurer and NAIC id (same terms) | core carrier matching, used by the commission, payables, bonus and appointment agents | 1,417 insurers | 1,417 distinct carrier keys | 0 after a fix. **Found:** 8 keys were shared by 16 different insurers, because Assurance, Underwriters, Group, Corp and Inc were dropped as filler words ("Great American Insurance Company" and "Great American Assurance Company"; "Aetna Health Insurance Company" and "Aetna Health Inc."). They are kept now; "Example Inc" still finds "Example Insurance Company" through the loose match when nothing else fits. |
| [NYC TLC For Hire Vehicles, active](https://data.cityofnewyork.us/Transportation/For-Hire-Vehicles-FHV-Active/8wbx-tsch), VIN and model year only (NYC Open Data terms of use) | data-quality | 105,138 | 25 VIN problems: 19 blank, 6 wrong length or letters, 0 failing the check digit | 0 (the same 25 as an independent check-digit count) |
| [FEMA NFIP redacted claims](https://www.fema.gov/openfema-data-page/fima-nfip-redacted-claims-v2), Vermont, 2019 onwards (U.S. government data, no copyright) | loss-runs, by county (FEMA removes the insured) | 1,027 claims | 922 claims in 2022-2026 in 11 counties; 10 with a loss of 25,000 or more, 1 with 3 or more claims in a year | 0 (claims, totals and status match for all 11 counties) |

Nothing public fits the other 26 agents: commission statements, agency-bill invoices, trust bank statements, producer pay, certificates, endorsements, premium finance, audits, renewals and download logs are private agency or carrier records. They are tested on fictional data only. False positives on the real files after the fixes: 0 in all four tests; the two fixes above removed 1,195 wrong licence rows and 8 wrong carrier merges.

### Changed in the final pass
- `fairpolicy-license-renewals`: blank CE hours are unknown, not zero (test added).
- `fairpolicy-core`: carrier keys keep Assurance, Underwriters, Group, Corp and Inc (test added with fictional names).
- New scripts: `accuracy.mjs` and `accuracy-specs.mjs` (with `fixtures/clean/` in every agent), `model-view.mjs`, `realdata.mjs`; npm scripts `accuracy`, `accuracy:write`, `model-view`, `realdata`, `realdata:offline`.
- Wording: root package description, core README, the "Compliance and data" group label in 9 languages, `site.json` partner package name and masking sentence, pricing page package name.
- `.gitattributes` and a CRLF-tolerant `plugin:check`, for fresh Windows clones.
- `sales/final-pass.json` for the site.

### Decisions for Kurt (final pass)
- `formats` in `sales/final-pass.json`: the 11 vendor layouts are labelled "written from knowledge of the export; not yet checked against documentation or a real export", because "written from documentation" would not be true. The site may need that fourth label.
- Staff names and producer licence numbers are sent to the model in clear (licence renewals, appointments, splits, retention). Masking them is possible in a later version; say if you want it.
- The next real test needs one friendly agency's anonymised exports (an Applied Epic or AMS360 policy list and one carrier commission statement), with written permission.
