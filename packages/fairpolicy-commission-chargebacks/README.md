# Fairpolicy Commission Chargebacks (`fairpolicy-commission-chargebacks`)

For every cancelled policy, works out the commission chargeback on the unearned premium (pro rata or short rate), compares it with what the carrier took back, and flags overcharges, chargebacks still to come (a reserve), chargebacks with no cancellation in your system, and producer shares not reversed. Drafts a recalculation request; never posts, pays or sends.

**It never changes producer pay; your accounting staff reverse a share after review. It never sends e-mail; a person sends the approved request.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-commission-chargebacks demo
npx -y fairpolicy-commission-chargebacks mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-commission-chargebacks demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Commission Chargebacks demo (fictional agency, carriers and clients)

▶ Check every cancellation's chargeback
  status: executed  decision: allow
  5 cancellation(s) since 2026-05-22: 644.07 in chargebacks expected (pro rata), 639.25 taken; 1 overcharged by 181.48, 1 still to come (reserve 261.3), 1 chargeback(s) with no cancellation, 1 not reversed on producer pay.
    HO-3002          2026-09-01   178.52       360          overcharged
    HO-3999                       -            75           chargeback_without_cancel
    PA-3004          2026-08-01   54           54           producer_not_reversed
    BOP-3003         2026-10-15   261.3        0            pending_chargeback
    PA-3001          2026-07-02   90.25        90.25        charged_ok
    UMB-3005         2026-08-15   60           60           charged_ok

▶ Explain the homeowners chargeback
  status: executed  decision: allow
  HO-3002: overcharged. Charged back 360; 15% of the unearned premium 1190.14 is 178.52, so 181.48 too much. Next: Ask the carrier to recalculate: the chargeback is more than the commission on the unearned premium.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Cancellation chargebacks written: 5 cancellation(s) since 2026-05-22: 644.07 in chargebacks expected (pro rata), 639.25 taken; 1 overcharged by 181.48, 1 still to come (reserve 261.3), 1 chargeback(s) with no cancellation, 1 not reversed on producer pay. Files: fairpolicy-out/chargebacks/commission-chargebacks.csv, fairpolicy-out/chargebacks/commission-chargebacks.html.

▶ Draft a recalculation request to the carrier
  status: executed  decision: allow  (auto)
  recalculation Example Mutual drafted for 181.48 with 2 open marker(s) ([TO CONFIRM carrier commission contact], [CHECK whether the carrier used short-rate cancellation; our figures are pro rata.]). Nothing was sent.

▶ Approve it: waits for a named person even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the click (recorded; a person sends it)
  status: executed  decision: ask  approved by: Casey Park (fictional)
  recalculation 3ea1f6fef2dd approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries producer_pay_adjust itself
  status: blocked  decision: block
  reason: It never changes producer pay; your accounting staff reverse a share after review.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `chargebacks_check` | Each cancelled policy: unearned premium, expected chargeback, what was taken and a status (overcharged, chargeback_without_cancel, producer_not_reversed, pending_chargeback, charged_ok). | runs |
| `chargebacks_explain` | Show one policy from chargebacks_check in full: its status, every finding and the figures behind it. | runs |
| `chargebacks_write_report` | Write commission-chargebacks.csv (every policy with its status and the figures behind it, plus blank owner and notes columns) and commission-chargebacks.html into out_dir (default fairpolicy-out/chargebacks). | runs |
| `chargebacks_draft_recalculation` | Write drafts/recalculation-<carrier>.md listing one carrier's overcharged chargebacks with the unearned premium and the difference. | asks first (Auto can be opted in) |
| `chargebacks_request_send` | After one named human click (even in Auto), record that the reviewed recalculation draft is approved in recalculation-requests.csv. | one named click, even in Auto (`binding_send`) |
| `producer_pay_adjust` | It never changes producer pay; your accounting staff reverse a share after review. | refused |
| `email_send` | It never sends e-mail; a person sends the approved request. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

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

### Commission statement lines (`statements`)

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

### Producer commission file (`producer_pay`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `producer` | text | Producer, Producer Name, Agent | Vermittler, Producteur, 募集人, 业务员 |
| `amount` | amount | Amount, Commission, Producer Commission, Paid, Split Amount | Betrag, Montant, 金額, 金额 |
| `type` | text | Type, Transaction, Entry Type | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-commission-chargebacks inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-commission-chargebacks demo
npx -y fairpolicy-commission-chargebacks mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-commission-chargebacks": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-commission-chargebacks",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-commission-chargebacks -- npx -y fairpolicy-commission-chargebacks mcp --root .`, or install the `fairpolicy-commission-chargebacks` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-commission-chargebacks approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-commission-chargebacks approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-commission-chargebacks kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-commission-chargebacks tools                 # every tool, its policy and arguments
fairpolicy-commission-chargebacks sources               # the columns each input is read from
fairpolicy-commission-chargebacks inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-commission-chargebacks call chargebacks_check '{"policies":"<policies>","statements":"<statements>"}'
fairpolicy-commission-chargebacks eval                  # the private eval cases on the fictional fixtures
fairpolicy-commission-chargebacks demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
