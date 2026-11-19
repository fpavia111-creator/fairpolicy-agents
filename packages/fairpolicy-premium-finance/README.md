# Fairpolicy Premium Finance (`fairpolicy-premium-finance`)

Watches premium finance agreements: notices of intent to cancel (with days left), installments past due or due soon, agreements signed but not funded, and funding the agency received but has not passed on to the carrier. Never signs, pays, reinstates or cancels.

**It never makes a payment for a client or the agency. It never asks a finance company or carrier to reinstate or cancel.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-premium-finance demo
npx -y fairpolicy-premium-finance mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-premium-finance demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Premium Finance demo (fictional agency, carriers and clients)

▶ Check every finance agreement
  status: executed  decision: allow
  7 finance agreement(s) as of 2026-11-18: 1 notice(s) of intent to cancel, 1 installment(s) past due (742), 1 not funded (3800), 1 funded but not passed to the carrier (5100), 1 due soon.
    PF-9002          CA-9002      2026-11-01   notice_of_intent
    PF-9003          WC-9003      2026-11-05   past_due
    PF-9004          BOP-9004     2026-12-20   not_funded
    PF-9005          CGL-9005     2026-12-25   funded_not_remitted
    PF-9006          CA-9006      2026-11-25   due_soon
    PF-9001          CGL-9001     2026-12-01   current
    PF-9007          PKG-9007                  paid_off

▶ Explain the notice of intent to cancel
  status: executed  decision: allow
  PF-9002: notice_of_intent. Notice 2026-11-12; cancellation 2026-11-27 (9 days). Next: The finance company sent a notice of intent to cancel: call the client before the cancellation date.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Premium finance agreements written: 7 finance agreement(s) as of 2026-11-18: 1 notice(s) of intent to cancel, 1 installment(s) past due (742), 1 not funded (3800), 1 funded but not passed to the carrier (5100), 1 due soon. Files: fairpolicy-out/finance/premium-finance.csv, fairpolicy-out/finance/premium-finance.html.

▶ The agent tries finance_payment_make itself
  status: blocked  decision: block
  reason: It never makes a payment for a client or the agency.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `finance_check` | Each agreement with a status (notice_of_intent, past_due, not_funded, funded_not_remitted, due_soon, current, paid_off), the dates behind it and what to do. | runs |
| `finance_explain` | Show one agreement from finance_check in full: its status, every finding and the figures behind it. | runs |
| `finance_write_report` | Write premium-finance.csv (every agreement with its status and the figures behind it, plus blank owner and notes columns) and premium-finance.html into out_dir (default fairpolicy-out/finance). | runs |
| `finance_payment_make` | It never makes a payment for a client or the agency. | refused |
| `reinstatement_request` | It never asks a finance company or carrier to reinstate or cancel. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Premium finance agreements (`agreements`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `agreement` (required) | text | Agreement Number, Agreement #, Loan Number, Account Number PFA, Contract Number, PFA Number | - |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Insured Name, Borrower, Client Name, Customer Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `finance_company` | text | Finance Company, Premium Finance Company, Lender, PFC | - |
| `signed_date` | date | Signed Date, Agreement Date, Contract Date, Date Signed | - |
| `amount_financed` | amount | Amount Financed, Financed Amount, Principal | - |
| `funded_date` | date | Funded Date, Funding Date, Date Funded, Disbursed Date | - |
| `funded_amount` | amount | Funded Amount, Funding Amount, Disbursed Amount | - |
| `remitted_date` | date | Remitted To Carrier, Remitted Date, Carrier Paid Date, Date Remitted | - |
| `installment` | amount | Installment, Installment Amount, Payment Amount, Monthly Payment | - |
| `next_due_date` | date | Next Due Date, Next Payment Due, Due Date, Next Due | - |
| `last_paid_date` | date | Last Paid Date, Last Payment Date, Last Paid, Date Last Paid | - |
| `notice_date` | date | NOIC Date, Notice Date, Notice of Intent Date, Intent to Cancel Date | - |
| `cancel_date` | date | Cancel Date, Cancellation Date, Cancel Effective Date | Stornodatum, Date de résiliation, 解約日, 退保日期 |
| `balance` | amount | Balance, Unpaid Balance, Payoff, Balance Due | Saldo, Solde, 残高, 余额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-premium-finance inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-premium-finance demo
npx -y fairpolicy-premium-finance mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-premium-finance": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-premium-finance",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-premium-finance -- npx -y fairpolicy-premium-finance mcp --root .`, or install the `fairpolicy-premium-finance` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-premium-finance approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-premium-finance approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-premium-finance kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-premium-finance tools                 # every tool, its policy and arguments
fairpolicy-premium-finance sources               # the columns each input is read from
fairpolicy-premium-finance inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-premium-finance call finance_check '{"agreements":"<agreements>"}'
fairpolicy-premium-finance eval                  # the private eval cases on the fictional fixtures
fairpolicy-premium-finance demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
