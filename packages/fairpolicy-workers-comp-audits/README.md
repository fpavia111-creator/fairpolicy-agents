# Fairpolicy Workers Comp Audits (`fairpolicy-workers-comp-audits`)

Follows premium audits on workers compensation and other auditable policies: policies ended a month ago with no audit started, audits that add large additional premium, audits returning premium, payroll far from the estimate (so the renewal estimate can be updated), and audits in progress. Never disputes an audit or contacts the carrier.

**It never files an audit dispute. It never sends payroll records to a carrier.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-workers-comp-audits demo
npx -y fairpolicy-workers-comp-audits mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-workers-comp-audits demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Workers Comp Audits demo (fictional agency, carriers and clients)

▶ Follow every premium audit
  status: executed  decision: allow
  6 auditable policy(ies) ended by 2026-11-18: 1 with no audit started, 1 with large additional premium, 1 returning premium (1800), 1 with payroll far from the estimate, 1 in progress. Audits added 4170 in all.
    WC-2501                       -            -            audit_not_started
    WC-2502          Completed    30           3600         large_additional_premium
    WC-2503          Completed    -20          -1800        return_due
    WC-2504          Completed    25           450          update_estimate
    GL-2505          Scheduled    -            -            pending
    WC-2506          Completed    4            120          ok

▶ Explain the audit with large additional premium
  status: executed  decision: allow
  WC-2502: large_additional_premium. Payroll 400000 estimated, 520000 audited (30%); audit premium 3600 (30% of the estimated premium). Next: The audit adds a lot of premium: review the audit with the client promptly; the carrier's dispute process and deadline apply.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Premium audits written: 6 auditable policy(ies) ended by 2026-11-18: 1 with no audit started, 1 with large additional premium, 1 returning premium (1800), 1 with payroll far from the estimate, 1 in progress. Audits added 4170 in all. Files: fairpolicy-out/audits/workers-comp-audits.csv, fairpolicy-out/audits/workers-comp-audits.html.

▶ The agent tries audit_dispute_file itself
  status: blocked  decision: block
  reason: It never files an audit dispute.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `audits_check` | Each auditable policy that has ended: audit status, payroll change, audit premium, and a status (audit_not_started, large_additional_premium, return_due, update_estimate, pending, ok). | runs |
| `audits_explain` | Show one audit from audits_check in full: its status, every finding and the figures behind it. | runs |
| `audits_write_report` | Write workers-comp-audits.csv (every audit with its status and the figures behind it, plus blank owner and notes columns) and workers-comp-audits.html into out_dir (default fairpolicy-out/audits). | runs |
| `audit_dispute_file` | It never files an audit dispute. | refused |
| `payroll_report_send` | It never sends payroll records to a carrier. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Premium audits (`audits`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Insurer | Versicherer, Assureur, 保険会社, 保险公司 |
| `line` | text | Line of Business, Line, Coverage | Sparte, Branche, 保険種目, 险种 |
| `expiration_date` | date | Expiration Date, Policy Expiration, Exp Date, Period End | Ablauf, Date d'échéance, 満期, 到期日期 |
| `audit_status` | text | Audit Status, Status | - |
| `scheduled_date` | date | Scheduled Date, Audit Date, Appointment | - |
| `completed_date` | date | Completed Date, Audit Completed, Billed Date | - |
| `estimated_payroll` | amount | Estimated Payroll, Estimated Exposure, Est Payroll | - |
| `audited_payroll` | amount | Audited Payroll, Audited Exposure, Actual Payroll | - |
| `estimated_premium` | amount | Estimated Premium, Deposit Premium, Est Premium | - |
| `audit_premium` | amount | Audit Premium, Additional Premium, Audit Adjustment, Return Premium | - |
| `csr` | text | CSR, Account Manager | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-workers-comp-audits inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-workers-comp-audits demo
npx -y fairpolicy-workers-comp-audits mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-workers-comp-audits": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-workers-comp-audits",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-workers-comp-audits -- npx -y fairpolicy-workers-comp-audits mcp --root .`, or install the `fairpolicy-workers-comp-audits` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-workers-comp-audits approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-workers-comp-audits approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-workers-comp-audits kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-workers-comp-audits tools                 # every tool, its policy and arguments
fairpolicy-workers-comp-audits sources               # the columns each input is read from
fairpolicy-workers-comp-audits inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-workers-comp-audits call audits_check '{"audits":"<audits>"}'
fairpolicy-workers-comp-audits eval                  # the private eval cases on the fictional fixtures
fairpolicy-workers-comp-audits demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
