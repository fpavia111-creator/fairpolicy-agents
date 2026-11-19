# Fairpolicy Open Claims (`fairpolicy-open-claims`)

Ages the open claims your agency tracks: losses logged with no carrier claim number, claims with no update for 30 days, claims open on policies renewing within 60 days, and claims open longer than 180 days, with incurred amounts by carrier. It never files, settles or comments on a claim; the carrier's adjuster decides.

**It never reports or files a claim with a carrier. It never accepts, negotiates or comments on a settlement.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-open-claims demo
npx -y fairpolicy-open-claims mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-open-claims demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Open Claims demo (fictional agency, carriers and clients)

▶ Age every open claim
  status: executed  decision: allow
  5 open claim(s) as of 2026-11-18 (64200 incurred): 1 with no carrier claim number, 1 with no update for weeks, 1 on policies renewing soon, 1 open a long time.
    AC-1             Example Mutual 8            8            not_reported
    AC-2             Example Mutual 78           59           no_update
    AC-3             Sample Casualty 47           6            renewal_soon
    AC-4             Sample Casualty 262          17           open_long
    AC-5             Example Mutual 15           3            active

▶ Explain the loss with no carrier claim number
  status: executed  decision: allow
  AC-1: not_reported. Reported to the agency 2026-11-10 (8 days); no carrier claim number. Next: The agency logged this loss but there is no carrier claim number: confirm today that the carrier has it.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Open claims follow-up written: 5 open claim(s) as of 2026-11-18 (64200 incurred): 1 with no carrier claim number, 1 with no update for weeks, 1 on policies renewing soon, 1 open a long time. Files: fairpolicy-out/claims/open-claims.csv, fairpolicy-out/claims/open-claims.html.

▶ The agent tries claim_file itself
  status: blocked  decision: block
  reason: It never reports or files a claim with a carrier.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `claims_check` | Each open claim: days open, days since the last activity, renewal date, paid, reserve, and a status (not_reported, no_update, renewal_soon, open_long, active). | runs |
| `claims_explain` | Show one claim from claims_check in full: its status, every finding and the figures behind it. | runs |
| `claims_write_report` | Write open-claims.csv (every claim with its status and the figures behind it, plus blank owner and notes columns) and open-claims.html into out_dir (default fairpolicy-out/claims). | runs |
| `claim_file` | It never reports or files a claim with a carrier. | refused |
| `claim_settlement_accept` | It never accepts, negotiates or comments on a settlement. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Claims (`claims`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `agency_claim_id` | text | Agency Claim ID, Claim ID, Loss ID, Agency Claim # | - |
| `claim_number` | text | Carrier Claim Number, Claim Number, Claim #, Company Claim Number | Schadennummer, N° de sinistre, 事故番号, 理赔号 |
| `client` | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `carrier` | text | Carrier, Company, Insurer | Versicherer, Assureur, 保険会社, 保险公司 |
| `line` | text | Line of Business, Line, Coverage | Sparte, Branche, 保険種目, 险种 |
| `loss_date` | date | Date of Loss, Loss Date, Accident Date | Schadendatum, Date de sinistre, 事故日, 出险日期 |
| `reported_date` | date | Reported Date, Date Reported, Reported To Agency, First Notice | - |
| `status` | text | Claim Status, Status | Status, Statut, ステータス, 状态 |
| `last_activity_date` | date | Last Activity, Last Activity Date, Last Contact, Last Update, Last Note | - |
| `adjuster` | text | Adjuster, Adjuster Name, Claim Rep | - |
| `paid` | amount | Paid, Total Paid, Paid to Date, Indemnity Paid | Bezahlt, Payé, 支払額, 已付 |
| `reserve` | amount | Reserve, Outstanding Reserve, Open Reserve, Reserves | Reserve, Provision pour sinistre, 支払備金, 未决赔款 |
| `policy_expiration` | date | Policy Expiration, Expiration Date, Renewal Date, X-Date | - |
| `csr` | text | CSR, Account Manager, Claims Contact | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-open-claims inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-open-claims demo
npx -y fairpolicy-open-claims mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-open-claims": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-open-claims",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-open-claims -- npx -y fairpolicy-open-claims mcp --root .`, or install the `fairpolicy-open-claims` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-open-claims approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-open-claims approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-open-claims kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-open-claims tools                 # every tool, its policy and arguments
fairpolicy-open-claims sources               # the columns each input is read from
fairpolicy-open-claims inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-open-claims call claims_check '{"claims":"<claims>"}'
fairpolicy-open-claims eval                  # the private eval cases on the fictional fixtures
fairpolicy-open-claims demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
