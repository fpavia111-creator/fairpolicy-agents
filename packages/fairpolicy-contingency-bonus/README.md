# Fairpolicy Contingency Bonus (`fairpolicy-contingency-bonus`)

Reads the experience reports carriers send (written and earned premium, incurred losses, by year) against each carrier's contingency or profit-sharing grid: which tier is met, the estimated bonus, the premium needed for the next tier, how much more loss the tier can take, and bonuses received below the estimate. An estimate from your files, not the carrier's calculation; never moves business.

**It never submits anything to a carrier. It never moves policies between carriers.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-contingency-bonus demo
npx -y fairpolicy-contingency-bonus mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-contingency-bonus demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Contingency Bonus demo (fictional agency, carriers and clients)

▶ Check each carrier against its bonus grid
  status: executed  decision: allow
  6 carrier(s) for 2026: 3 meet a bonus tier, about 27850 estimated, 4500 received so far; 1 close to the next tier, 1 over the loss ratio, 1 paid less than the estimate. Estimates use each carrier's grid as written in your settings.
    Placeholder Specialty 40           Profit share 6600         received_less
    Sample Casualty  64                        0            loss_ratio_too_high
    Example Mutual   45           Tier 2       18100        close_to_next
    Demo Indemnity   25                        0            below_minimum
    Sample Surety    20           Surety bonus 3150         qualifies
    Test Fire & Marine 27.27                     -            no_grid

▶ Explain the carrier closest to its next tier
  status: executed  decision: allow
  Example Mutual: close_to_next. Meets Tier 2 (2%): about 18100. Next: Tier 3 (premium 905000 below 1000000). Next: Close to the next tier: the premium needed is shown. A person decides whether and where to place business; this is not a reason to move a client.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Contingency bonus tracker written: 6 carrier(s) for 2026: 3 meet a bonus tier, about 27850 estimated, 4500 received so far; 1 close to the next tier, 1 over the loss ratio, 1 paid less than the estimate. Estimates use each carrier's grid as written in your settings. Files: fairpolicy-out/contingency/contingency-bonus.csv, fairpolicy-out/contingency/contingency-bonus.html.

▶ The agent tries carrier_portal_submit itself
  status: blocked  decision: block
  reason: It never submits anything to a carrier.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `contingency_check` | Each carrier for the year: written premium, growth, loss ratio, the tier met, the estimated bonus, the next tier and what it needs, and a status (received_less, loss_ratio_too_high, close_to_next, below_minimum, quali… | runs |
| `contingency_explain` | Show one carrier from contingency_check in full: its status, every finding and the figures behind it. | runs |
| `contingency_write_report` | Write contingency-bonus.csv (every carrier with its status and the figures behind it, plus blank owner and notes columns) and contingency-bonus.html into out_dir (default fairpolicy-out/contingency). | runs |
| `carrier_portal_submit` | It never submits anything to a carrier. | refused |
| `book_transfer` | It never moves policies between carriers. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Carrier experience (`experience`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `carrier` (required) | text | Carrier, Company, Insurer, Carrier Name | Versicherer, Assureur, 保険会社, 保险公司 |
| `year` | number | Year, Report Year, Calendar Year, Contract Year | - |
| `written_premium` | amount | Written Premium, WP, Direct Written Premium, Written | Beitrag, Prime, 保険料, 保费 |
| `earned_premium` | amount | Earned Premium, EP, Direct Earned Premium, Earned | - |
| `incurred` | amount | Incurred Losses, Incurred, Losses Incurred, Incurred Loss, Total Incurred | - |
| `loss_ratio` | number | Loss Ratio, LR, Loss Ratio %, Incurred Loss Ratio | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-contingency-bonus inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-contingency-bonus demo
npx -y fairpolicy-contingency-bonus mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-contingency-bonus": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-contingency-bonus",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-contingency-bonus -- npx -y fairpolicy-contingency-bonus mcp --root .`, or install the `fairpolicy-contingency-bonus` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-contingency-bonus approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-contingency-bonus approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-contingency-bonus kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-contingency-bonus tools                 # every tool, its policy and arguments
fairpolicy-contingency-bonus sources               # the columns each input is read from
fairpolicy-contingency-bonus inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-contingency-bonus call contingency_check '{"experience":"<experience>","grid":"<grid>"}'
fairpolicy-contingency-bonus eval                  # the private eval cases on the fictional fixtures
fairpolicy-contingency-bonus demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
