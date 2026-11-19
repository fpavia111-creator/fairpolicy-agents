# Fairpolicy Return Premiums (`fairpolicy-return-premiums`)

Follows return premiums on agency-bill policies from the carrier's credit to the client: returns not refunded after 30 days, refunds due, refund checks not cleared after 90 days, and direct-bill returns the carrier pays itself. Never writes a check, moves money or files an unclaimed property report.

**It never writes a refund check or sends money. It never files an unclaimed property report.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-return-premiums demo
npx -y fairpolicy-return-premiums mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-return-premiums demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Return Premiums demo (fictional agency, carriers and clients)

▶ Follow every return premium to the client
  status: executed  decision: allow
  6 return premium(s) credited by 2026-11-18: 592.5 still owed to clients (1 overdue, 1 due), 1 refund check(s) not cleared (960), 1 refunded by the carrier directly.
    PA-2801          412.5        2026-09-15   64           refund_overdue
    BOP-2803         960          2026-06-01   170          check_uncashed
    HO-2802          180          2026-11-10   8            refund_due
    WC-2804          1500         2026-10-05   44           carrier_refunds
    CGL-2805         275          2026-10-01   48           refunded
    PA-2806          140          2026-10-20   29           refunded

▶ Explain the overdue refund
  status: executed  decision: allow
  PA-2801: refund_overdue. 412.5 credited by the carrier 2026-09-15 (64 days ago); not refunded. Next: The carrier credited this return premium to the agency and the client has not received it: refund or apply it now.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Return premiums owed to clients written: 6 return premium(s) credited by 2026-11-18: 592.5 still owed to clients (1 overdue, 1 due), 1 refund check(s) not cleared (960), 1 refunded by the carrier directly. Files: fairpolicy-out/refunds/return-premiums.csv, fairpolicy-out/refunds/return-premiums.html.

▶ The agent tries refund_check_issue itself
  status: blocked  decision: block
  reason: It never writes a refund check or sends money.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `refunds_check` | Each return premium: amount, days since the carrier credited it, refund or application, and a status (refund_overdue, check_uncashed, refund_due, carrier_refunds, refunded). | runs |
| `refunds_explain` | Show one return from refunds_check in full: its status, every finding and the figures behind it. | runs |
| `refunds_write_report` | Write return-premiums.csv (every return with its status and the figures behind it, plus blank owner and notes columns) and return-premiums.html into out_dir (default fairpolicy-out/refunds). | runs |
| `refund_check_issue` | It never writes a refund check or sends money. | refused |
| `unclaimed_property_file` | It never files an unclaimed property report. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Return premiums (`returns`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name, Customer Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `bill_type` | text | Bill Type, Billing Method, Bill Method | Inkassoart, Mode d’encaissement, 集金方法, 收费方式 |
| `return_amount` (required) | amount | Return Premium, Return Amount, Credit Amount, Refund Amount | - |
| `credited_date` | date | Credited Date, Carrier Credit Date, Statement Date, Date Credited | - |
| `refunded_date` | date | Refunded Date, Refund Date, Check Date, Date Refunded | - |
| `check_number` | text | Check Number, Check #, Refund Reference | - |
| `cleared_date` | date | Cleared Date, Check Cleared, Cashed Date | - |
| `applied_to` | text | Applied To, Applied To Invoice, Credit Applied | - |
| `csr` | text | CSR, Account Manager | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-return-premiums inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-return-premiums demo
npx -y fairpolicy-return-premiums mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-return-premiums": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-return-premiums",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-return-premiums -- npx -y fairpolicy-return-premiums mcp --root .`, or install the `fairpolicy-return-premiums` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-return-premiums approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-return-premiums approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-return-premiums kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-return-premiums tools                 # every tool, its policy and arguments
fairpolicy-return-premiums sources               # the columns each input is read from
fairpolicy-return-premiums inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-return-premiums call refunds_check '{"returns":"<returns>"}'
fairpolicy-return-premiums eval                  # the private eval cases on the fictional fixtures
fairpolicy-return-premiums demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
