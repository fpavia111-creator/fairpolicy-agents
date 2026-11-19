# Fairpolicy Commission Statements (`fairpolicy-commission-statements`)

Checks every line of a carrier commission statement against the commission you expect on that policy (your schedule by carrier, line and new or renewal, or the rate booked in your agency system) and lists underpaid, overpaid, duplicate and unmatched lines, with totals by carrier. Drafts a commission inquiry for one named person to send; never posts, pays or sends.

**It never posts receipts or commission entries in your agency system; your accounting staff do. It never sends e-mail; a person sends the approved inquiry.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-commission-statements mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-commission-statements demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Commission Statements demo (fictional agency, carriers and clients, October 2026)

▶ Check every statement line against the expected commission
  status: executed  decision: allow
  13 statement line(s), 3892 paid against 3089.7 expected: 2 underpaid by 307.2, 1 overpaid by 20.5; 2 possible duplicate(s), 1 not in your policy list, 1 with no expected rate.
    PA-5521800   new           expected      276  paid    220.8  underpaid
    WC-88120     new           expected     1260  paid     1008  underpaid
    HO-7730288   endorsement   expected       36  paid       36  possible_duplicate
    HO-7730288   endorsement   expected       36  paid       36  possible_duplicate
    UMB-9002     renewal       expected     61.5  paid       82  overpaid
    PA-5599999   new           expected        -  paid      225  no_policy
    CA-20441     new           expected        -  paid      768  no_rate
    WC-88120     audit         expected        -  paid       96  not_checked
    BOP104455    renewal       expected      840  paid      840  ok
    CGL-330017   cancellation  expected   -487.5  paid   -487.5  ok
    CGL-330017   new           expected      585  paid      585  ok
    HO-7730141   renewal       expected    331.5  paid    331.5  ok
    PA-5521911   renewal       expected    151.2  paid    151.2  ok

▶ Explain the workers comp line
  status: executed  decision: allow
  WC-88120: underpaid. Paid 1008 on premium 12600; 10% (schedule: Sample Casualty Workers Compensation new) is 1260, so 252 short (the statement shows 8%). Next: Ask the carrier for the missing commission (draft an inquiry), or correct the schedule if the rate really changed.

▶ Write the commission worklist
  status: executed  decision: allow
  Commission statement check written: 13 statement line(s), 3892 paid against 3089.7 expected: 2 underpaid by 307.2, 1 overpaid by 20.5; 2 possible duplicate(s), 1 not in your policy list, 1 with no expected rate. Files: fairpolicy-out/commissions/commission-statements.csv, fairpolicy-out/commissions/commission-statements.html.

▶ Draft a commission inquiry to the carrier that paid the renewal rate on new business
  status: executed  decision: allow  (auto)
  inquiry Sample Casualty drafted for 252 with 1 open marker(s) ([CHECK the agreed rates against your current agency agreement before sending.]). Nothing was sent.

▶ Approve sending: waits for a named person even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the click (recorded; a person sends it)
  status: executed  decision: ask  approved by: Casey Park (fictional)
  inquiry 9d7eb8935775 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries to post the commission in the agency system itself
  status: blocked  decision: block
  reason: It never posts receipts or commission entries in your agency system; your accounting staff do.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `commissions_check` | For each statement line: the policy it belongs to, the expected rate and where it came from, expected and paid commission, the difference and a status (underpaid, possible_duplicate, overpaid, no_policy, no_rate, not_… | runs |
| `commissions_explain` | One statement line in full: the policy it matched, the rate used and its source, and the arithmetic. | runs |
| `commissions_write_report` | Write commission-statements.csv (every line with its status and the figures behind it, plus blank owner and notes columns) and commission-statements.html into out_dir (default fairpolicy-out/commissions). | runs |
| `commissions_draft_inquiry` | Write drafts/inquiry-<carrier>.md asking one carrier about its underpaid statement lines, with the agreed rate, expected and paid amounts and the total short. | asks first (Auto can be opted in) |
| `commissions_request_send` | After one named human click (even in Auto), record that the reviewed inquiry draft is approved in inquiry-requests.csv. | one named click, even in Auto (`binding_send`) |
| `commissions_recall` | Search this agent's own memory of the customer's setup: accepted facts (in use) and facts waiting for a person. | runs |
| `commissions_learn` | Propose one fact about the customer's setup for this agent to remember. | runs |
| `commissions_accept_learning` | A named person accepts or rejects a fact waiting in this agent's memory. | one named click, even in Auto (`accept_learning`) |
| `commissions_retire_memory` | A named person stops an accepted fact from applying. | one named click, even in Auto (`accept_learning`) |
| `ams_post_commission` | It never posts receipts or commission entries in your agency system; your accounting staff do. | refused |
| `email_send` | It never sends e-mail; a person sends the approved inquiry. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Carrier commission statement (`statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy No, Policy, Pol #, Policy Num | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured Name, Insured, Named Insured, Client Name, Customer Name, Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Insurer, Writing Company, Carrier Name | Versicherer, Assureur, 保険会社, 保险公司 |
| `line` | text | Line of Business, LOB, Policy Type, Line, Coverage, Product | Sparte, Branche, 保険種目, 险种 |
| `transaction_type` | text | Transaction Type, Trans Type, Transaction, Type, Activity, Trans Code | Buchungsart, Type de mouvement, 取引区分, 交易类型 |
| `effective_date` | date | Effective Date, Eff Date, Transaction Effective Date, Trans Eff Date, Policy Effective Date | Beginn, Date d'effet, 始期, 生效日期 |
| `statement_date` | date | Statement Date, Process Date, Accounting Date, Transaction Date, Posted Date, Period | - |
| `premium` | amount | Premium, Written Premium, Gross Premium, Transaction Premium, Premium Amount, Premium Basis | Beitrag, Prime, 保険料, 保费 |
| `commission_rate` | number | Commission Rate, Comm Rate, Rate, Comm %, Commission %, Comm Pct | Courtagesatz, Taux de commission, 手数料率, 佣金率 |
| `commission` (required) | amount | Commission, Commission Amount, Comm Amount, Agency Commission, Commission Paid, Net Commission | Courtage, Commission, 手数料, 佣金 |
| `statement_id` | text | Statement Number, Statement #, Statement ID, Statement, Statement No | - |
| `producer` | text | Producer, Agent, Producer Code, Sub Producer | Vermittler, Producteur, 募集人, 业务员 |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Carrier commission statement | Direct bill commission statement saved as CSV (or PDF text pasted into CSV) | Policy Number, Insured Name, Commission Rate, Commission Amount | no; Each carrier lays its statement out differently; this is the common shape. Map a carrier's own columns in fairpolicy-sources.json. |
| Maklerabrechnung (DE) | Courtageabrechnung eines Versicherers (CSV) | Vertragsnummer, Versicherungsnehmer, Courtagesatz, Courtage | no; German labels, dates day-first, comma decimals. |

Every layout here was written from knowledge of the export ("recalled") and was not checked against vendor documentation or a live account. Agency systems let each agency choose report columns, so the first setup confirms them with inspect.

### Policy list (`policies`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy No, Policy, Pol #, Policy Num | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Client Name, Insured, Insured Name, Named Insured, Account Name, Customer Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `client_id` | text (masked) | Client Code, Lookup Code, Account Lookup Code, Customer #, Client Number, Client ID | Kundennummer, Code client, 顧客コード, 客户编号 |
| `carrier` | text | Carrier, Company, Writing Company, Insurer, Issuing Company, Carrier Name | Versicherer, Assureur, 保険会社, 保险公司 |
| `line` | text | Line of Business, LOB, Policy Type, Line Type, Coverage, Line | Sparte, Branche, 保険種目, 险种 |
| `effective_date` | date | Effective Date, Eff Date, Effective, Policy Effective Date, Inception Date, Term Effective | Beginn, Date d'effet, 始期, 生效日期 |
| `expiration_date` | date | Expiration Date, Exp Date, Expiration, Policy Expiration Date, X-Date, Xdate | Ablauf, Date d'échéance, 満期, 到期日期 |
| `premium` | amount | Premium, Annualized Premium, Annual Premium, Written Premium, Full Term Premium, Estimated Premium | Beitrag, Prime, 保険料, 保费 |
| `commission_rate` | number | Commission Rate, Comm Rate, Commission %, Comm %, Agency Commission %, Commission Percent | Courtagesatz, Taux de commission, 手数料率, 佣金率 |
| `commission` | amount | Commission, Agency Commission, Estimated Commission, Commission Amount, Annualized Commission, Revenue | Courtage, Commission, 手数料, 佣金 |
| `producer` | text | Producer, Producer Name, Exec, Account Executive, Agent, Producer 1 | Vermittler, Producteur, 募集人, 业务员 |
| `csr` | text | CSR, Rep, Account Manager, Service Rep, Customer Service Rep, Servicer | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |
| `status` | text | Status, Policy Status, Current Status | Status, Statut, ステータス, 状态 |
| `bill_type` | text | Bill Type, Billing Method, Bill Method, Billing Type, Agency/Direct, Bill Plan | Inkassoart, Mode d’encaissement, 集金方法, 收费方式 |
| `business_type` | text | New/Renewal, New or Renewal, NB/RN, Business Type, New Business/Renewal | - |
| `segment` | text | Department, Division, Personal/Commercial, Book, Line Group, PL/CL | - |
| `state` | text | State, Policy State, Risk State, Base State, Garaging State | Bundesland, Région, 都道府県, 省份 |
| `cancel_date` | date | Cancel Date, Cancellation Date, Cancelled Date, Cancellation Effective Date, Cancel Effective Date | Stornodatum, Date de résiliation, 解約日, 退保日期 |
| `cancel_reason` | text | Cancel Reason, Cancellation Reason, Lost Reason, Reason Lost | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Applied Epic | Policy list report exported to Excel or CSV | Lookup Code, Account Name, Policy Number, Line Type | no; Applied Epic list reports let each agency choose its columns; the names here are common defaults, not a fixed layout. |
| Vertafore AMS360 | Policy or expiration list exported to CSV | Customer #, Customer Name, Policy #, Exec, Rep | no; AMS360 calls the producer "Exec" and the service person "Rep". |
| Vertafore Sagitta | Policy list report (CSV) | Client Code, Client Name, Policy Number, Coverage, Insurer | no |
| HawkSoft | Client/policy export (CSV) | Client Number, Client Name, Policy Number, Line of Business, Carrier, Policy Status | no |
| EZLynx | Policy report export (CSV) | Applicant, Policy Number, Line of Business, Carrier, Policy Status | no |
| QQCatalyst | Policy list export (CSV) | Contact Name, Policy Number, Line of Business, Carrier, Effective Date, Expiration Date | no |

Every layout here was written from knowledge of the export ("recalled") and was not checked against vendor documentation or a live account. Agency systems let each agency choose report columns, so the first setup confirms them with inspect.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-commission-statements inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Memory

fairpolicy-commission-statements can remember facts about your setup so the next run does not have to be told again. `commissions_learn` only proposes a fact; it changes nothing until a named person accepts it with `commissions_accept_learning`, which is one click even in Auto. Facts live in one hash-chained file per agent under `.fairpolicy/memory/`; if the chain does not verify, no fact is used. Credentials, personal identifiers and text that reads like instructions to an AI are refused. Run without memory with `--no-memory`.

| Kind | What an accepted fact changes |
|---|---|
| `carrier_alias` | matches statement lines under that name to the carrier's rates. It changes matching only; every line is still checked. |
| `note` | nothing (shown by recall only) |

```bash
fairpolicy-commission-statements memory list
fairpolicy-commission-statements memory accept MEM-1a2b3c4d5e6f --as "Your Name"
fairpolicy-commission-statements memory retire MEM-1a2b3c4d5e6f --as "Your Name" --reason "carrier renamed"
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-commission-statements mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-commission-statements": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-commission-statements",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-commission-statements -- npx -y fairpolicy-commission-statements mcp --root .`, or install the `fairpolicy-commission-statements` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-commission-statements approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-commission-statements approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-commission-statements kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-commission-statements tools                 # every tool, its policy and arguments
fairpolicy-commission-statements sources               # the columns each input is read from
fairpolicy-commission-statements inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-commission-statements call commissions_check '{"statement":"<statement>","policies":"<policies>","schedule":"<schedule>"}'
fairpolicy-commission-statements eval                  # the private eval cases on the fictional fixtures
fairpolicy-commission-statements demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
