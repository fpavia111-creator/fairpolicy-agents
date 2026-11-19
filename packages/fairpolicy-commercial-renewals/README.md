# Fairpolicy Commercial Renewals (`fairpolicy-commercial-renewals`)

Builds a renewal timeline for every commercial policy expiring in the next 150 days, counted back from expiration (loss runs, exposures, submissions, quotes, proposal, client decision, or your own schedule), and lists the renewals with overdue milestones, milestones due this week, and those on track. Never sends a submission or binds.

**It never sends a submission to a carrier. It never binds or renews a policy.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-commercial-renewals demo
npx -y fairpolicy-commercial-renewals mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-commercial-renewals demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Commercial Renewals demo (fictional agency, carriers and clients)

▶ Build the timeline for every commercial renewal
  status: executed  decision: allow
  5 commercial renewal(s) in the next 150 days: 2 with overdue milestones (4 in all), 1 with a milestone due this week, 1 on track, 1 complete.
    PKG-1705         2027-01-05   loss_runs, exposures,  2026-12-06   overdue
    BOP-1701         2027-01-15   submissions  2026-12-16   overdue
    CA-1703          2027-02-20                2026-11-22   due_this_week
    WC-1702          2027-03-01                2026-12-01   on_track
    CGL-1704         2026-12-20                             complete

▶ Explain the renewal furthest behind
  status: executed  decision: allow
  PKG-1705: overdue. Overdue: Loss runs requested (due 2026-09-07); Updated exposures and applications received (due 2026-10-07); Submissions sent to markets (due 2026-10-22). Next: One or more milestones are past due: the account manager updates the plan with the producer this week.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Commercial renewal timelines written: 5 commercial renewal(s) in the next 150 days: 2 with overdue milestones (4 in all), 1 with a milestone due this week, 1 on track, 1 complete. Files: fairpolicy-out/timeline/commercial-renewals.csv, fairpolicy-out/timeline/commercial-renewals.html.

▶ The agent tries carrier_submission_send itself
  status: blocked  decision: block
  reason: It never sends a submission to a carrier.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `timeline_check` | Each commercial renewal: days left, milestones done, overdue milestones, the next milestone and its date, and a status (overdue, due_this_week, on_track, complete). | runs |
| `timeline_explain` | Show one renewal from timeline_check in full: its status, every finding and the figures behind it. | runs |
| `timeline_write_report` | Write commercial-renewals.csv (every renewal with its status and the figures behind it, plus blank owner and notes columns) and commercial-renewals.html into out_dir (default fairpolicy-out/timeline). | runs |
| `carrier_submission_send` | It never sends a submission to a carrier. | refused |
| `policy_bind` | It never binds or renews a policy. | refused |

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

### Renewal milestones (`milestones`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `milestone` (required) | text | Milestone, Step, Task, Activity Code, Activity | - |
| `completed_date` | date | Completed Date, Completed, Date Completed, Done, Date | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-commercial-renewals inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-commercial-renewals demo
npx -y fairpolicy-commercial-renewals mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-commercial-renewals": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-commercial-renewals",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-commercial-renewals -- npx -y fairpolicy-commercial-renewals mcp --root .`, or install the `fairpolicy-commercial-renewals` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-commercial-renewals approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-commercial-renewals approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-commercial-renewals kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-commercial-renewals tools                 # every tool, its policy and arguments
fairpolicy-commercial-renewals sources               # the columns each input is read from
fairpolicy-commercial-renewals inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-commercial-renewals call timeline_check '{"policies":"<policies>","milestones":"<milestones>"}'
fairpolicy-commercial-renewals eval                  # the private eval cases on the fictional fixtures
fairpolicy-commercial-renewals demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
