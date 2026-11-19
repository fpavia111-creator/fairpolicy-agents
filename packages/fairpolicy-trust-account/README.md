# Fairpolicy Trust Account (`fairpolicy-trust-account`)

Reconciles the premium trust account: the bank balance against agency-bill premiums collected and still owed to carriers (a shortfall is flagged first), withdrawals that are not a carrier remittance, client refund or commission transfer, commission moved out beyond what was earned, and remittances overdue or due soon. Never moves money or pays a carrier.

**It never moves money in or out of any account. It never pays a carrier; a person remits after review.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-trust-account demo
npx -y fairpolicy-trust-account mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-trust-account demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Trust Account demo (fictional agency, carriers and clients)

▶ Reconcile the premium trust account
  status: executed  decision: allow
  Trust balance 4020 as of 2026-11-18 against 4980 owed to carriers: SHORT by 960. 1 remittance(s) overdue (1020), 1 unexpected withdrawal(s) (850), commission moved 2900 against 1710 earned.
    balance          2026-11-16   960          shortfall
    2026-11-16 Check 1043  2026-11-16   850          unexpected_withdrawal
    commission-transfers 2026-11-18   1190         commission_overdraw
    PA-5002          2026-11-10   1020         overdue_remittance
    BOP-5003         2026-11-22   3960         due_soon
    WC-5004          2026-12-15   8100         not_due
    HO-5001          2026-10-15   1700         remitted
    CGL-5005         2026-11-01   2210         remitted

▶ Explain the balance test
  status: executed  decision: allow
  balance: shortfall. Balance 4020; premiums collected and still owed to carriers 4980. Next: The account holds less than the premiums owed to carriers. Tell the agency principal today; how to restore it is a decision for them and their accountant.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Premium trust account reconciliation written: Trust balance 4020 as of 2026-11-18 against 4980 owed to carriers: SHORT by 960. 1 remittance(s) overdue (1020), 1 unexpected withdrawal(s) (850), commission moved 2900 against 1710 earned. Files: fairpolicy-out/trust/trust-account.csv, fairpolicy-out/trust/trust-account.html.

▶ The agent tries bank_transfer itself
  status: blocked  decision: block
  reason: It never moves money in or out of any account.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `trust_check` | The balance against premiums owed (shortfall or covered), each unexpected withdrawal, commission overdraw, and each payable as overdue_remittance, due_soon, not_due or remitted. | runs |
| `trust_explain` | Show one item from trust_check in full: its status, every finding and the figures behind it. | runs |
| `trust_write_report` | Write trust-account.csv (every item with its status and the figures behind it, plus blank owner and notes columns) and trust-account.html into out_dir (default fairpolicy-out/trust). | runs |
| `bank_transfer` | It never moves money in or out of any account. | refused |
| `carrier_remit` | It never pays a carrier; a person remits after review. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Carrier payables (`payables`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `carrier` | text | Carrier, Company, Payee, Billing Company, Writing Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Customer Name, Client Name, Insured, Insured Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `invoice` | text | Invoice #, Invoice Number, Invoice, Item Number | - |
| `gross_premium` | amount | Gross Premium, Premium, Gross, Total Premium | Beitrag, Prime, 保険料, 保费 |
| `commission` | amount | Commission, Agency Commission, Commission Amount | Courtage, Commission, 手数料, 佣金 |
| `net_due` | amount | Net Due, Net Premium, Net Payable, Amount Due, Net Amount | - |
| `due_date` | date | Due Date, Payable Due Date, Remit By, Statement Due | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |
| `received_date` | date | Premium Received, Received Date, Date Received, Collected Date, Paid By Insured | - |
| `paid_date` | date | Paid Date, Remitted Date, Date Paid, Paid To Carrier | - |

### Trust bank account (`bank`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `date` (required) | date | Date, Posting Date, Transaction Date, Posted Date | Datum, Date, 日付, 日期 |
| `description` | text | Description, Memo, Payee, Details, Transaction Description | Beschreibung, Description, 摘要, 摘要 |
| `amount` (required) | amount | Amount, Transaction Amount, Net Amount | Betrag, Montant, 金額, 金额 |
| `balance` | amount | Balance, Running Balance, Ledger Balance, Available Balance | Saldo, Solde, 残高, 余额 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-trust-account inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-trust-account demo
npx -y fairpolicy-trust-account mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-trust-account": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-trust-account",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-trust-account -- npx -y fairpolicy-trust-account mcp --root .`, or install the `fairpolicy-trust-account` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-trust-account approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-trust-account approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-trust-account kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-trust-account tools                 # every tool, its policy and arguments
fairpolicy-trust-account sources               # the columns each input is read from
fairpolicy-trust-account inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-trust-account call trust_check '{"payables":"<payables>","bank":"<bank>","settings":"<settings>"}'
fairpolicy-trust-account eval                  # the private eval cases on the fictional fixtures
fairpolicy-trust-account demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
