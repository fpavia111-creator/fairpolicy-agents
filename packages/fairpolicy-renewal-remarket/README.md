# Fairpolicy Renewal Remarket (`fairpolicy-renewal-remarket`)

Lists the policies renewing in the next 120 days that have no renewal review in your activity log, the ones expiring within 45 days with nothing logged, and renewals whose premium goes up 10% or more with no remarket logged, by account manager. It never quotes, binds or recommends a carrier; a licensed person decides.

**It never sends a submission or quote request to a carrier. It never binds, renews or non-renews a policy.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-renewal-remarket demo
npx -y fairpolicy-renewal-remarket mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-renewal-remarket demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Renewal Remarket demo (fictional agency, carriers and clients)

▶ Check every renewal in the next 120 days
  status: executed  decision: allow
  6 policy(ies) renew in the next 120 days (26600 premium): 1 expire soon with no review, 1 go up with no remarket, 1 have no review yet; 3 reviewed.
    HO-1201          2026-12-10   22           -            urgent_no_review
    BOP-1203         2027-02-01   75           24           increase_not_remarketed
    WC-1204          2027-02-20   94           3.33         no_review
    CA-1208          2026-12-01   13           -            reviewed
    CGL-1205         2027-01-05   48           20           reviewed
    PA-1202          2027-01-15   58           3.57         reviewed

▶ Explain the renewal that went up with no remarket
  status: executed  decision: allow
  BOP-1203: increase_not_remarketed. Expires 2027-02-01 (75 days). Renewal premium 6200 (+24%). Last renewal activity 2026-10-20. Reviewed, but no remarket logged. Next: The renewal premium is up and no remarket is logged: the account manager decides whether to shop it and records the decision.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Renewals without a review or remarket written: 6 policy(ies) renew in the next 120 days (26600 premium): 1 expire soon with no review, 1 go up with no remarket, 1 have no review yet; 3 reviewed. Files: fairpolicy-out/renewals/renewal-remarket.csv, fairpolicy-out/renewals/renewal-remarket.html.

▶ The agent tries carrier_submission_send itself
  status: blocked  decision: block
  reason: It never sends a submission or quote request to a carrier.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `renewals_check` | Each policy renewing in the window: days left, premium change, last renewal activity and a status (urgent_no_review, increase_not_remarketed, no_review, reviewed). | runs |
| `renewals_explain` | Show one policy from renewals_check in full: its status, every finding and the figures behind it. | runs |
| `renewals_write_report` | Write renewal-remarket.csv (every policy with its status and the figures behind it, plus blank owner and notes columns) and renewal-remarket.html into out_dir (default fairpolicy-out/renewals). | runs |
| `carrier_submission_send` | It never sends a submission or quote request to a carrier. | refused |
| `policy_bind` | It never binds, renews or non-renews a policy. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Policy or expiration list (`policies`)

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
| `renewal_premium` | amount | Renewal Premium, Renewal Prem, New Term Premium, Renewal Offer, Proposed Premium | - |

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

### Activity log (`activities`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Account Name, Client Name, Customer Name, Insured, Regarding | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `date` (required) | date | Date, Activity Date, Created, Created Date, Completed Date, Due Date | Datum, Date, 日付, 日期 |
| `type` | text | Activity Type, Activity Code, Type, Category, Action | Typ, Type, 種類, 类型 |
| `description` | text | Description, Subject, Notes, Summary, Note | Beschreibung, Description, 摘要, 摘要 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-renewal-remarket inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-renewal-remarket demo
npx -y fairpolicy-renewal-remarket mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-renewal-remarket": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-renewal-remarket",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-renewal-remarket -- npx -y fairpolicy-renewal-remarket mcp --root .`, or install the `fairpolicy-renewal-remarket` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-renewal-remarket approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-renewal-remarket approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-renewal-remarket kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-renewal-remarket tools                 # every tool, its policy and arguments
fairpolicy-renewal-remarket sources               # the columns each input is read from
fairpolicy-renewal-remarket inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-renewal-remarket call renewals_check '{"policies":"<policies>","activities":"<activities>"}'
fairpolicy-renewal-remarket eval                  # the private eval cases on the fictional fixtures
fairpolicy-renewal-remarket demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
