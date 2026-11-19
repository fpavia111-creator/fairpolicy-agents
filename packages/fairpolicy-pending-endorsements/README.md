# Fairpolicy Pending Endorsements (`fairpolicy-pending-endorsements`)

Follows every policy change a client asked for: not yet sent to the carrier, sent with no confirmation after 14 days, or confirmed with a premium change on an agency-bill policy that was never invoiced or credited. Never sends a change to a carrier or tells a client a change is made.

**It never sends a policy change to a carrier. It never tells a client that a change is done.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-pending-endorsements demo
npx -y fairpolicy-pending-endorsements mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-pending-endorsements demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Pending Endorsements demo (fictional agency, carriers and clients)

▶ Follow every change request
  status: executed  decision: allow
  7 change request(s), 4 open as of 2026-11-18: 1 not sent to the carrier, 1 sent and not confirmed, 1 confirmed and not billed (420), 1 waiting.
    E-1              PA-2001      2026-11-10   0            not_submitted
    E-2              HO-2002      2026-10-20   0            unconfirmed
    E-4              BOP-2004     2026-10-28   420          premium_change_not_billed
    E-3              CA-2003      2026-11-12   0            waiting
    E-5              PA-2005      2026-10-25   -180         done
    E-7              WC-2007      2026-10-25   950          done
    E-6              CGL-2006     2026-10-27   0            done

▶ Explain the change never sent to the carrier
  status: executed  decision: allow
  E-1: not_submitted. Asked for 2026-11-10 (8 days ago); not sent to the carrier. Next: The client asked for this change and it has not gone to the carrier: a person submits it today and tells the client it is not done until confirmed.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Pending policy changes written: 7 change request(s), 4 open as of 2026-11-18: 1 not sent to the carrier, 1 sent and not confirmed, 1 confirmed and not billed (420), 1 waiting. Files: fairpolicy-out/endorsements/pending-endorsements.csv, fairpolicy-out/endorsements/pending-endorsements.html.

▶ The agent tries carrier_change_submit itself
  status: blocked  decision: block
  reason: It never sends a policy change to a carrier.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `endorsements_check` | Each change request with its dates and a status (not_submitted, unconfirmed, premium_change_not_billed, waiting, done). | runs |
| `endorsements_explain` | Show one change from endorsements_check in full: its status, every finding and the figures behind it. | runs |
| `endorsements_write_report` | Write pending-endorsements.csv (every change with its status and the figures behind it, plus blank owner and notes columns) and pending-endorsements.html into out_dir (default fairpolicy-out/endorsements). | runs |
| `carrier_change_submit` | It never sends a policy change to a carrier. | refused |
| `client_confirmation_send` | It never tells a client that a change is done. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Change requests (`changes`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `request_id` (required) | text | Request ID, Change ID, Activity ID, Request #, Ticket | - |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Writing Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `change` | text | Change, Change Type, Description, Endorsement | - |
| `requested_date` | date | Requested Date, Received Date, Date Requested, Created | - |
| `submitted_date` | date | Submitted Date, Sent To Carrier, Date Submitted | - |
| `confirmed_date` | date | Confirmed Date, Processed Date, Carrier Confirmed, Endorsement Issued | - |
| `premium_change` | amount | Premium Change, Additional Premium, Return Premium, Change in Premium | - |
| `bill_type` | text | Bill Type, Billing Method, Bill Method | Inkassoart, Mode d’encaissement, 集金方法, 收费方式 |
| `invoiced` | text | Invoiced, Invoice Number, Invoice #, Billed | - |
| `csr` | text | CSR, Account Manager, Assigned To | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-pending-endorsements inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-pending-endorsements demo
npx -y fairpolicy-pending-endorsements mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-pending-endorsements": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-pending-endorsements",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-pending-endorsements -- npx -y fairpolicy-pending-endorsements mcp --root .`, or install the `fairpolicy-pending-endorsements` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-pending-endorsements approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-pending-endorsements approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-pending-endorsements kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-pending-endorsements tools                 # every tool, its policy and arguments
fairpolicy-pending-endorsements sources               # the columns each input is read from
fairpolicy-pending-endorsements inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-pending-endorsements call endorsements_check '{"changes":"<changes>"}'
fairpolicy-pending-endorsements eval                  # the private eval cases on the fictional fixtures
fairpolicy-pending-endorsements demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
