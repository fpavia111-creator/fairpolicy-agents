# Fairpolicy Carrier Payables (`fairpolicy-carrier-payables`)

Reconciles a carrier's agency-bill account current with the payables in your agency system, item by item: net amounts that differ, items the carrier bills that you do not have, items you owe that the carrier has not billed, and items past the statement due date. Drafts a reconciliation note; never pays the carrier.

**It never pays a carrier statement; a person pays after review. It never changes payables in your agency system.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-carrier-payables demo
npx -y fairpolicy-carrier-payables mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-carrier-payables demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Carrier Payables demo (fictional agency, carriers and clients)

▶ Reconcile the account current item by item
  status: executed  decision: allow
  6 item(s): the carriers bill 16820, your agency system shows 18870. 1 differ (net -360), 1 billed but not in your system, 1 in your system but not billed, 1 past due (5400).
    WC-1102          new          8100         8460         amount_differs
    CA-1103          endorsement  520          -            not_in_agency_system
    CGL-1104         new          -            2210         not_on_carrier_statement
    PKG-1105         renewal      5400         5400         past_due
    BOP-1101         new          3630         3630         ok
    CA-1106          cancellation -830         -830         ok

▶ Explain the item that differs
  status: executed  decision: allow
  WC-1102: amount_differs. Carrier net 8100 (premium 9000, commission 900); your system 8460 (premium 9000, commission 540). Next: The net due differs from your agency system: check the premium and commission rate with the carrier before paying.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Carrier account current reconciliation written: 6 item(s): the carriers bill 16820, your agency system shows 18870. 1 differ (net -360), 1 billed but not in your system, 1 in your system but not billed, 1 past due (5400). Files: fairpolicy-out/payables/carrier-payables.csv, fairpolicy-out/payables/carrier-payables.html.

▶ Draft a reconciliation note to the carrier
  status: executed  decision: allow  (auto)
  reconciliation Sample Casualty drafted with 2 open marker(s) ([TO CONFIRM carrier agency-bill accounting contact], [CHECK the commission rates against the agency agreement.]). Nothing was sent.

▶ Approve it: waits for a named person even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the click (recorded; a person sends it)
  status: executed  decision: ask  approved by: Casey Park (fictional)
  reconciliation 9d7eb8935775 approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries carrier_payment itself
  status: blocked  decision: block
  reason: It never pays a carrier statement; a person pays after review.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `payables_check` | Each policy and transaction on either side: the carrier's net, your net, the difference and a status (amount_differs, not_in_agency_system, not_on_carrier_statement, past_due, ok). | runs |
| `payables_explain` | Show one item from payables_check in full: its status, every finding and the figures behind it. | runs |
| `payables_write_report` | Write carrier-payables.csv (every item with its status and the figures behind it, plus blank owner and notes columns) and carrier-payables.html into out_dir (default fairpolicy-out/payables). | runs |
| `payables_draft_reconciliation` | Write drafts/reconciliation-<carrier>.md listing one carrier's items that differ or are not in your records. | asks first (Auto can be opted in) |
| `payables_request_send` | After one named human click (even in Auto), record that the reviewed reconciliation draft is approved in reconciliation-requests.csv. | one named click, even in Auto (`binding_send`) |
| `carrier_payment` | It never pays a carrier statement; a person pays after review. | refused |
| `ams_post_payable` | It never changes payables in your agency system. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Carrier account current (`carrier_statement`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Insured Name, Named Insured, Customer Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Writing Company, Billing Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `transaction_type` | text | Transaction Type, Trans Type, Transaction, Type, Trans Code | Buchungsart, Type de mouvement, 取引区分, 交易类型 |
| `effective_date` | date | Effective Date, Eff Date, Transaction Effective | Beginn, Date d'effet, 始期, 生效日期 |
| `gross_premium` | amount | Gross Premium, Premium, Gross, Written Premium | Beitrag, Prime, 保険料, 保费 |
| `commission` | amount | Commission, Commission Amount, Agency Commission | Courtage, Commission, 手数料, 佣金 |
| `net_due` | amount | Net Due, Net Amount, Net Premium, Amount Due, Net Payable | - |
| `due_date` | date | Due Date, Statement Due, Payment Due | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |

### Agency payables (`agency_payables`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Insured Name, Named Insured, Customer Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `carrier` | text | Carrier, Company, Writing Company, Billing Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `transaction_type` | text | Transaction Type, Trans Type, Transaction, Type, Trans Code | Buchungsart, Type de mouvement, 取引区分, 交易类型 |
| `effective_date` | date | Effective Date, Eff Date, Transaction Effective | Beginn, Date d'effet, 始期, 生效日期 |
| `gross_premium` | amount | Gross Premium, Premium, Gross, Written Premium | Beitrag, Prime, 保険料, 保费 |
| `commission` | amount | Commission, Commission Amount, Agency Commission | Courtage, Commission, 手数料, 佣金 |
| `net_due` | amount | Net Due, Net Amount, Net Premium, Amount Due, Net Payable | - |
| `due_date` | date | Due Date, Statement Due, Payment Due | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-carrier-payables inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-carrier-payables demo
npx -y fairpolicy-carrier-payables mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-carrier-payables": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-carrier-payables",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-carrier-payables -- npx -y fairpolicy-carrier-payables mcp --root .`, or install the `fairpolicy-carrier-payables` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-carrier-payables approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-carrier-payables approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-carrier-payables kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-carrier-payables tools                 # every tool, its policy and arguments
fairpolicy-carrier-payables sources               # the columns each input is read from
fairpolicy-carrier-payables inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-carrier-payables call payables_check '{"carrier_statement":"<carrier_statement>","agency_payables":"<agency_payables>"}'
fairpolicy-carrier-payables eval                  # the private eval cases on the fictional fixtures
fairpolicy-carrier-payables demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
