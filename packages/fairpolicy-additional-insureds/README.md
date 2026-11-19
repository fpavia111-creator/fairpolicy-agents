# Fairpolicy Additional Insureds (`fairpolicy-additional-insureds`)

Sorts additional insured, waiver of subrogation and primary/non-contributory requests: which the policy already covers (blanket wording or a scheduled holder) and can be issued, which need an endorsement from the carrier, endorsements the carrier has not sent, and requests left open too long. Never issues a certificate or asks a carrier for an endorsement itself.

**It never issues a certificate. It never asks a carrier for an endorsement.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-additional-insureds demo
npx -y fairpolicy-additional-insureds mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-additional-insureds demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Additional Insureds demo (fictional agency, carriers and clients)

▶ Sort every additional insured and waiver request
  status: executed  decision: allow
  7 request(s), 5 open as of 2026-11-18: 1 need an endorsement from the carrier, 1 endorsement(s) overdue from the carrier, 1 covered but still open, 1 ready to issue, 1 waiting on the carrier.
    R-3              pnc          16           not on the policy needs_endorsement
    R-4              waiver       29           not on the policy endorsement_pending
    R-2              ai           16           blanket wording on the open_overdue
    R-1              ai           2            blanket wording on the ready_to_issue
    R-5              waiver       8            not on the policy awaiting_carrier
    R-6              ai           0            holder scheduled on th complete
    R-7              ai           0            endorsement received complete

▶ Explain the request that needs an endorsement
  status: executed  decision: allow
  R-3: needs_endorsement. PNC for Demo Hospital: not on the policy. Next: The policy has no blanket wording and does not schedule this holder: ask the carrier for the endorsement before a certificate shows it.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Additional insured and waiver requests written: 7 request(s), 5 open as of 2026-11-18: 1 need an endorsement from the carrier, 1 endorsement(s) overdue from the carrier, 1 covered but still open, 1 ready to issue, 1 waiting on the carrier. Files: fairpolicy-out/insureds/additional-insureds.csv, fairpolicy-out/insureds/additional-insureds.html.

▶ The agent tries certificate_issue itself
  status: blocked  decision: block
  reason: It never issues a certificate.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `insureds_check` | Each request: what it asks for, whether the policy covers it and how, days open, and a status (needs_endorsement, endorsement_pending, open_overdue, ready_to_issue, awaiting_carrier, complete). | runs |
| `insureds_explain` | Show one request from insureds_check in full: its status, every finding and the figures behind it. | runs |
| `insureds_write_report` | Write additional-insureds.csv (every request with its status and the figures behind it, plus blank owner and notes columns) and additional-insureds.html into out_dir (default fairpolicy-out/insureds). | runs |
| `certificate_issue` | It never issues a certificate. | refused |
| `endorsement_request_send` | It never asks a carrier for an endorsement. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Requests (`requests`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `request_id` (required) | text | Request ID, Request #, Request, Ticket, Activity ID | - |
| `client` | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `holder` | text | Holder, Certificate Holder, Additional Insured Name, Requested For | - |
| `requirement` | text | Requirement, Request Type, Type, Wording Requested | - |
| `requested_date` | date | Requested Date, Request Date, Received Date, Date Requested | - |
| `endorsement_requested_date` | date | Endorsement Requested, Sent To Carrier, Carrier Requested Date | - |
| `endorsement_received_date` | date | Endorsement Received, Received From Carrier, Endorsement Date | - |
| `completed_date` | date | Completed Date, Completed, Closed Date, Certificate Issued | - |
| `csr` | text | CSR, Account Manager, Assigned To | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |

### Policy endorsements (`coverage`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `blanket_ai` | text | Blanket AI, Blanket Additional Insured, AI Endorsement | - |
| `blanket_waiver` | text | Blanket Waiver, Waiver Endorsement, Blanket Waiver of Subrogation | - |
| `primary_noncontributory` | text | Primary Non-Contributory, Primary Noncontributory, PNC | - |
| `scheduled_holders` | text | Scheduled Holders, Scheduled Additional Insureds, Scheduled AI | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-additional-insureds inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-additional-insureds demo
npx -y fairpolicy-additional-insureds mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-additional-insureds": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-additional-insureds",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-additional-insureds -- npx -y fairpolicy-additional-insureds mcp --root .`, or install the `fairpolicy-additional-insureds` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-additional-insureds approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-additional-insureds approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-additional-insureds kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-additional-insureds tools                 # every tool, its policy and arguments
fairpolicy-additional-insureds sources               # the columns each input is read from
fairpolicy-additional-insureds inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-additional-insureds call insureds_check '{"requests":"<requests>","coverage":"<coverage>"}'
fairpolicy-additional-insureds eval                  # the private eval cases on the fictional fixtures
fairpolicy-additional-insureds demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
