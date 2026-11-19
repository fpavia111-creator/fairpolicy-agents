# Fairpolicy Data Quality (`fairpolicy-data-quality`)

Checks every active policy in your agency system for the data that breaks downloads, renewals and certificates: expiration before effective, no carrier or premium, VINs missing or failing the check digit, missing address, bad ZIP, no e-mail or phone on personal lines, and no producer or account manager. Counts by issue and account manager. Never edits your agency system.

**It never edits a policy or client in your agency system. It never contacts a client for missing data.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-data-quality demo
npx -y fairpolicy-data-quality mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-data-quality demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Data Quality demo (fictional agency, carriers and clients)

▶ Check every active policy for broken or empty data
  status: executed  decision: allow
  8 active policy(ies): 2 clean (25%), 7 issue(s) in all; 2 with critical problems (dates, carrier, premium), 2 with vehicle data problems, 1 with contact gaps, 1 without a producer or account manager.
    CGL-2605         cgl          expiration_before_effe critical
    WC-2607          wc           no_premium   critical
    PA-2602          pauto        vin_missing  vehicle_data
    PA-2603          pauto        vin_invalid  vehicle_data
    HO-2604          home         no_email_or_phone, zip contact_data
    BOP-2606         bop          no_producer  staff_data
    HO-2608          home                      clean
    PA-2601          pauto                     clean

▶ Explain the auto policy with a bad VIN
  status: executed  decision: allow
  PA-2603: vehicle_data. 1 issue(s): vin_invalid. Next: Get the VIN from the client or the carrier and correct the vehicle.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Policy data quality written: 8 active policy(ies): 2 clean (25%), 7 issue(s) in all; 2 with critical problems (dates, carrier, premium), 2 with vehicle data problems, 1 with contact gaps, 1 without a producer or account manager. Files: fairpolicy-out/quality/data-quality.csv, fairpolicy-out/quality/data-quality.html.

▶ The agent tries ams_update_policy itself
  status: blocked  decision: block
  reason: It never edits a policy or client in your agency system.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `quality_check` | Each active policy: every issue found and a status (critical, vehicle_data, contact_data, staff_data, clean). | runs |
| `quality_explain` | Show one policy from quality_check in full: its status, every finding and the figures behind it. | runs |
| `quality_write_report` | Write data-quality.csv (every policy with its status and the figures behind it, plus blank owner and notes columns) and data-quality.html into out_dir (default fairpolicy-out/quality). | runs |
| `ams_update_policy` | It never edits a policy or client in your agency system. | refused |
| `client_message_send` | It never contacts a client for missing data. | refused |

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
| `address` | text (masked) | Address, Mailing Address, Address 1, Street, Address Line 1 | Adresse, Adresse, 住所, 地址 |
| `zip` | text | ZIP, Zip Code, Postal Code, Mailing Zip | - |
| `email` | email (masked) | Email, E-mail, Email Address | E-Mail, E-mail, メールアドレス, 邮箱 |
| `phone` | text (masked) | Phone, Phone Number, Home Phone, Mobile | Telefon, Téléphone, 電話番号, 电话 |

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

### Vehicles (`vehicles`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `vin` | text | VIN, Vehicle VIN, VIN Number, Serial Number | FIN, VIN, 車台番号, 车架号 |
| `year` | number | Year, Model Year, Vehicle Year | - |
| `make` | text | Make, Vehicle Make | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-data-quality inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-data-quality demo
npx -y fairpolicy-data-quality mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-data-quality": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-data-quality",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-data-quality -- npx -y fairpolicy-data-quality mcp --root .`, or install the `fairpolicy-data-quality` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-data-quality approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-data-quality approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-data-quality kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-data-quality tools                 # every tool, its policy and arguments
fairpolicy-data-quality sources               # the columns each input is read from
fairpolicy-data-quality inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-data-quality call quality_check '{"policies":"<policies>"}'
fairpolicy-data-quality eval                  # the private eval cases on the fictional fixtures
fairpolicy-data-quality demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
