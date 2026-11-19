# Fairpolicy Carrier Appointments (`fairpolicy-carrier-appointments`)

Matches each producer's business to their carrier appointments by state: business written with a carrier where the producer has no appointment, business after an appointment was terminated or while it is pending, and appointments with no business for a year. It never applies for, renews or ends an appointment; state rules are your agency's to confirm.

**It never applies for or renews an appointment. It never ends an appointment.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-carrier-appointments demo
npx -y fairpolicy-carrier-appointments mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-carrier-appointments demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Carrier Appointments demo (fictional agency, carriers and clients)

▶ Match business to appointments
  status: executed  decision: allow
  7 producer, carrier and state combination(s), 6 appointment(s) on file: 1 with business and no appointment, 1 with business after termination, 1 with business while pending, 1 appointment(s) unused for a year.
    Riley Chen       Example Mutual TX           1            not_appointed
    Sam Ortiz        Demo Indemnity TX           1            terminated_with_business
    Jordan Lee       Sample Casualty TX           1            pending_with_business
    Sam Ortiz        Test Fire & Marine TX           0            unused
    Jordan Lee       Example Mutual TX           1            ok
    Riley Chen       Example Mutual OK           1            ok
    Sam Ortiz        Sample Casualty TX           1            ok

▶ Explain the business written without an appointment
  status: executed  decision: allow
  Riley Chen|Example Mutual|TX: not_appointed. 1 policy(ies) with Example Mutual in TX; no appointment on file. Next: Business written with a carrier in a state where this producer has no appointment: the agency principal reviews it with the carrier today.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Carrier appointments against business written written: 7 producer, carrier and state combination(s), 6 appointment(s) on file: 1 with business and no appointment, 1 with business after termination, 1 with business while pending, 1 appointment(s) unused for a year. Files: fairpolicy-out/appointments/carrier-appointments.csv, fairpolicy-out/appointments/carrier-appointments.html.

▶ The agent tries appointment_request itself
  status: blocked  decision: block
  reason: It never applies for or renews an appointment.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `appointments_check` | Each producer, carrier and state: the appointment on file, policies written, and a status (not_appointed, terminated_with_business, pending_with_business, unused, ok). | runs |
| `appointments_explain` | One producer\|carrier\|state combination with its appointment and policies. | runs |
| `appointments_write_report` | Write carrier-appointments.csv (every combination with its status and the figures behind it, plus blank owner and notes columns) and carrier-appointments.html into out_dir (default fairpolicy-out/appointments). | runs |
| `appointment_request` | It never applies for or renews an appointment. | refused |
| `appointment_terminate` | It never ends an appointment. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Appointments (`appointments`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `producer` (required) | text | Producer, Name, Agent, Licensee, Individual | - |
| `carrier` (required) | text | Carrier, Company, Insurer, Appointing Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `state` | text | State, Appointment State, Jurisdiction | Bundesland, Région, 都道府県, 省份 |
| `status` | text | Status, Appointment Status | Status, Statut, ステータス, 状态 |
| `effective_date` | date | Effective Date, Appointed Date, Appointment Date | Beginn, Date d'effet, 始期, 生效日期 |
| `termination_date` | date | Termination Date, Terminated, End Date | Austrittsdatum, Date de sortie, 退職日, 离职日期 |

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

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-carrier-appointments inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-carrier-appointments demo
npx -y fairpolicy-carrier-appointments mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-carrier-appointments": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-carrier-appointments",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-carrier-appointments -- npx -y fairpolicy-carrier-appointments mcp --root .`, or install the `fairpolicy-carrier-appointments` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-carrier-appointments approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-carrier-appointments approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-carrier-appointments kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-carrier-appointments tools                 # every tool, its policy and arguments
fairpolicy-carrier-appointments sources               # the columns each input is read from
fairpolicy-carrier-appointments inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-carrier-appointments call appointments_check '{"appointments":"<appointments>","policies":"<policies>"}'
fairpolicy-carrier-appointments eval                  # the private eval cases on the fictional fixtures
fairpolicy-carrier-appointments demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
