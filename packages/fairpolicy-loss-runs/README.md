# Fairpolicy Loss Runs (`fairpolicy-loss-runs`)

Summarises loss runs by account over the last five policy years: claims, paid, reserved and incurred, loss ratio against premium, large losses and years with several claims, with a year-by-year line for each account. It reads the loss runs you have; it does not request them from carriers or judge a claim.

**It never requests loss runs from a carrier. It never sends a renewal submission.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-loss-runs demo
npx -y fairpolicy-loss-runs mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-loss-runs demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Loss Runs demo (fictional agency, carriers and clients)

▶ Summarise five years of loss runs by account
  status: executed  decision: allow
  5 account(s), policy years 2022-2026: 12 claim(s), 280000 incurred on 564000 premium (49.65%). 1 with a high loss ratio, 1 with a large loss, 1 with several claims in a year, 1 claim-free.
    5                210000       87.5         high_loss_ratio
    1                40000        26.67        large_loss
    4                22000        24.44        frequency
    2                8000         13.33        normal
    0                0            0            clean

▶ Explain the account with the highest loss ratio
  status: executed  decision: allow
  CL-cd892e56: high_loss_ratio. 5 claim(s), 210000 incurred (190000 paid, 20000 reserved); on 240000 premium: loss ratio 87.5%; largest 120000 (LR-1002, 2025). Next: Losses are high against premium: prepare the renewal early and gather what the client has done since the losses.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Loss run summary written: 5 account(s), policy years 2022-2026: 12 claim(s), 280000 incurred on 564000 premium (49.65%). 1 with a high loss ratio, 1 with a large loss, 1 with several claims in a year, 1 claim-free. Files: fairpolicy-out/losses/loss-runs.csv, fairpolicy-out/losses/loss-runs.html.

▶ The agent tries loss_run_request_send itself
  status: blocked  decision: block
  reason: It never requests loss runs from a carrier.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `losses_check` | Each account: claims, open claims, paid, reserve, incurred, premium, loss ratio, large losses, most claims in a year, by year, and a status (high_loss_ratio, large_loss, frequency, normal, clean). | runs |
| `losses_explain` | One account's loss summary with the year-by-year line. | runs |
| `losses_write_report` | Write loss-runs.csv (every account with its status and the figures behind it, plus blank owner and notes columns) and loss-runs.html into out_dir (default fairpolicy-out/losses). | runs |
| `loss_run_request_send` | It never requests loss runs from a carrier. | refused |
| `submission_send` | It never sends a renewal submission. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Loss runs (`loss_runs`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `client` (required) | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `line` | text | Line of Business, Line, Coverage | Sparte, Branche, 保険種目, 险种 |
| `carrier` | text | Carrier, Company, Insurer | Versicherer, Assureur, 保険会社, 保险公司 |
| `policy_year` | number | Policy Year, Year, Term Year, Policy Period Year | - |
| `loss_date` | date | Date of Loss, Loss Date, Accident Date | Schadendatum, Date de sinistre, 事故日, 出险日期 |
| `claim_number` | text | Claim Number, Claim #, Carrier Claim Number | Schadennummer, N° de sinistre, 事故番号, 理赔号 |
| `status` | text | Claim Status, Status, Open/Closed | Status, Statut, ステータス, 状态 |
| `paid` | amount | Paid, Total Paid, Paid to Date, Indemnity Paid | Bezahlt, Payé, 支払額, 已付 |
| `reserve` | amount | Reserve, Outstanding Reserve, Open Reserve | Reserve, Provision pour sinistre, 支払備金, 未决赔款 |

### Premium by year (`premiums`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `client` (required) | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `policy_year` | number | Policy Year, Year, Term Year | - |
| `premium` | amount | Earned Premium, Premium, Written Premium, Annual Premium | Beitrag, Prime, 保険料, 保费 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-loss-runs inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-loss-runs demo
npx -y fairpolicy-loss-runs mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-loss-runs": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-loss-runs",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-loss-runs -- npx -y fairpolicy-loss-runs mcp --root .`, or install the `fairpolicy-loss-runs` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-loss-runs approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-loss-runs approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-loss-runs kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-loss-runs tools                 # every tool, its policy and arguments
fairpolicy-loss-runs sources               # the columns each input is read from
fairpolicy-loss-runs inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-loss-runs call losses_check '{"loss_runs":"<loss_runs>","premiums":"<premiums>"}'
fairpolicy-loss-runs eval                  # the private eval cases on the fictional fixtures
fairpolicy-loss-runs demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
