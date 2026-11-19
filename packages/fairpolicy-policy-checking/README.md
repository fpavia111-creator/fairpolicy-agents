# Fairpolicy Policy Checking (`fairpolicy-policy-checking`)

Checks each policy the carrier issued against what was bound, coverage by coverage: coverages missing, limits lower or deductibles higher than bound, premium different, dates different, and policies bound with nothing issued after 30 days. It compares documents; it never binds, endorses or tells a client what coverage they have.

**It never asks a carrier for a correction. It never binds or endorses a policy.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-policy-checking demo
npx -y fairpolicy-policy-checking mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-policy-checking demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Policy Checking demo (fictional agency, carriers and clients)

▶ Check every issued policy against its binder
  status: executed  decision: allow
  5 bound policy(ies) checked against what was issued: 1 not issued yet, 1 with a coverage, limit or deductible worse than bound, 1 with a different premium, 1 with different dates, 1 matching.
    WC-2904          8800         -            not_issued   not_issued
    HO-2901          2000         2000         coverage_reduced coverage_reduced
    PA-2902          1400         1520         premium_differs premium_differs
    CGL-2903         3200         3200         dates_differ dates_differ
    BOP-2905         3500         3500                      matches

▶ Explain the homeowners policy issued with a lower limit
  status: executed  decision: allow
  HO-2901: coverage_reduced. Dwelling limit 350000 issued, 400000 bound. Next: The issued policy has a lower limit, a higher deductible or a missing coverage compared with what was bound: ask the carrier to correct it, and tell the client only what a licensed person has confirmed.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Policy checking: issued against bound written: 5 bound policy(ies) checked against what was issued: 1 not issued yet, 1 with a coverage, limit or deductible worse than bound, 1 with a different premium, 1 with different dates, 1 matching. Files: fairpolicy-out/checking/policy-checking.csv, fairpolicy-out/checking/policy-checking.html.

▶ The agent tries carrier_correction_send itself
  status: blocked  decision: block
  reason: It never asks a carrier for a correction.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `checking_check` | Each bound policy: coverages compared, premiums, dates, every difference, and a status (not_issued, coverage_reduced, premium_differs, dates_differ, matches). | runs |
| `checking_explain` | Show one policy from checking_check in full: its status, every finding and the figures behind it. | runs |
| `checking_write_report` | Write policy-checking.csv (every policy with its status and the figures behind it, plus blank owner and notes columns) and policy-checking.html into out_dir (default fairpolicy-out/checking). | runs |
| `carrier_correction_send` | It never asks a carrier for a correction. | refused |
| `policy_bind` | It never binds or endorses a policy. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Bound coverages (`bound`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy, Binder Number | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Insurer | Versicherer, Assureur, 保険会社, 保险公司 |
| `line` | text | Line of Business, Line, Policy Type | Sparte, Branche, 保険種目, 险种 |
| `coverage` (required) | text | Coverage, Coverage Name, Coverage Code | - |
| `limit` | amount | Limit, Coverage Limit, Amount of Insurance | - |
| `deductible` | amount | Deductible, Ded | - |
| `premium` | amount | Premium, Coverage Premium | Beitrag, Prime, 保険料, 保费 |
| `effective_date` | date | Effective Date, Eff Date | Beginn, Date d'effet, 始期, 生效日期 |
| `expiration_date` | date | Expiration Date, Exp Date | Ablauf, Date d'échéance, 満期, 到期日期 |
| `bound_date` | date | Bound Date, Binder Date, Date Bound | - |

### Issued coverages (`issued`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy, Binder Number | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Insurer | Versicherer, Assureur, 保険会社, 保险公司 |
| `line` | text | Line of Business, Line, Policy Type | Sparte, Branche, 保険種目, 险种 |
| `coverage` (required) | text | Coverage, Coverage Name, Coverage Code | - |
| `limit` | amount | Limit, Coverage Limit, Amount of Insurance | - |
| `deductible` | amount | Deductible, Ded | - |
| `premium` | amount | Premium, Coverage Premium | Beitrag, Prime, 保険料, 保费 |
| `effective_date` | date | Effective Date, Eff Date | Beginn, Date d'effet, 始期, 生效日期 |
| `expiration_date` | date | Expiration Date, Exp Date | Ablauf, Date d'échéance, 満期, 到期日期 |
| `bound_date` | date | Bound Date, Binder Date, Date Bound | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-policy-checking inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-policy-checking demo
npx -y fairpolicy-policy-checking mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-policy-checking": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-policy-checking",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-policy-checking -- npx -y fairpolicy-policy-checking mcp --root .`, or install the `fairpolicy-policy-checking` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-policy-checking approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-policy-checking approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-policy-checking kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-policy-checking tools                 # every tool, its policy and arguments
fairpolicy-policy-checking sources               # the columns each input is read from
fairpolicy-policy-checking inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-policy-checking call checking_check '{"bound":"<bound>","issued":"<issued>"}'
fairpolicy-policy-checking eval                  # the private eval cases on the fictional fixtures
fairpolicy-policy-checking demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
