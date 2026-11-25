# Fairpolicy Download Errors (`fairpolicy-carrier-feed-errors`)

Reads your carrier download log: transactions that failed, transactions sitting unmatched in suspense for more than a few days, and carriers with no successful download for a week, so changes from carriers are not lost. It reads the log only; it never re-runs a download or edits a policy.

**It never re-runs or requests a download. It never matches, posts or edits anything in your agency system.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-carrier-feed-errors demo
npx -y fairpolicy-carrier-feed-errors mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-carrier-feed-errors demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Download Errors demo (fictional agency, carriers and clients)

▶ Check the carrier download log
  status: executed  decision: allow
  7 downloaded transaction(s) to 2026-11-18: 4 posted, 1 failed, 1 unmatched for more than a few days, 1 unmatched recently; 1 of 4 carrier(s) with no successful download for a week.
    DL-4             Sample Casualty 2026-11-16   2            download_error
    DL-2             Example Mutual 2026-11-10   8            unmatched_old
    carrier:Demo Indemnity Demo Indemnity 2026-11-01   17           carrier_stale
    DL-3             Example Mutual 2026-11-17   1            unmatched_new
    carrier:Test Fire & Ma Test Fire & Marine 2026-11-12   6            ok
    carrier:Sample Casualt Sample Casualty 2026-11-16   2            ok
    carrier:Example Mutual Example Mutual 2026-11-17   1            ok

▶ Explain the failed download
  status: executed  decision: allow
  DL-4: download_error. RWL for WC-2704 on 2026-11-16: Invalid line of business code. Next: The download failed for this transaction: check the message, fix the policy or code in your agency system, and ask the carrier to resend if needed.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Carrier download errors written: 7 downloaded transaction(s) to 2026-11-18: 4 posted, 1 failed, 1 unmatched for more than a few days, 1 unmatched recently; 1 of 4 carrier(s) with no successful download for a week. Files: fairpolicy-out/downloads/download-errors.csv, fairpolicy-out/downloads/download-errors.html.

▶ The agent tries download_rerun itself
  status: blocked  decision: block
  reason: It never re-runs or requests a download.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `downloads_check` | Each failed or unmatched transaction and each carrier's last successful download, with a status (download_error, unmatched_old, carrier_stale, unmatched_new, ok). | runs |
| `downloads_explain` | Show one item from downloads_check in full: its status, every finding and the figures behind it. | runs |
| `downloads_write_report` | Write download-errors.csv (every item with its status and the figures behind it, plus blank owner and notes columns) and download-errors.html into out_dir (default fairpolicy-out/downloads). | runs |
| `download_rerun` | It never re-runs or requests a download. | refused |
| `ams_update_policy` | It never matches, posts or edits anything in your agency system. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Download log (`log`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `download_id` | text | Download ID, Transaction ID, ID, Sequence | - |
| `date` (required) | date | Download Date, Date, Received Date, Processed Date | Datum, Date, 日付, 日期 |
| `carrier` (required) | text | Carrier, Company, Carrier Name | Versicherer, Assureur, 保険会社, 保险公司 |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `transaction_type` | text | Transaction Type, Trans Type, Transaction, Type | Buchungsart, Type de mouvement, 取引区分, 交易类型 |
| `status` (required) | text | Download Status, Status, Result | Status, Statut, ステータス, 状态 |
| `message` | text | Message, Error, Error Message, Reason, Description | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| IVANS / AMS download log | Download activity or suspense report exported to CSV | Carrier, Policy Number, Download Date, Download Status | no |

Every layout here was written from knowledge of the export ("recalled") and was not checked against vendor documentation or a live account. Agency systems let each agency choose report columns, so the first setup confirms them with inspect.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-carrier-feed-errors inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-carrier-feed-errors demo
npx -y fairpolicy-carrier-feed-errors mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-carrier-feed-errors": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-carrier-feed-errors",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-carrier-feed-errors -- npx -y fairpolicy-carrier-feed-errors mcp --root .`, or install the `fairpolicy-carrier-feed-errors` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-carrier-feed-errors approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-carrier-feed-errors approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-carrier-feed-errors kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-carrier-feed-errors tools                 # every tool, its policy and arguments
fairpolicy-carrier-feed-errors sources               # the columns each input is read from
fairpolicy-carrier-feed-errors inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-carrier-feed-errors call downloads_check '{"log":"<log>"}'
fairpolicy-carrier-feed-errors eval                  # the private eval cases on the fictional fixtures
fairpolicy-carrier-feed-errors demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
