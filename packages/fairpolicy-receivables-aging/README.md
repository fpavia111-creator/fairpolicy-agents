# Fairpolicy Receivables Aging (`fairpolicy-receivables-aging`)

Ages agency-bill receivables: what each client owes, how many days past due (not due, 1-30, 31-60, 61-90, over 90), premiums the agency already paid the carrier but has not collected, and credit balances owed back to clients, by client and producer. Drafts a balance reminder for one client; never sends, charges or cancels.

**It never asks a carrier to cancel a policy for non-payment. It never charges a client's card or bank account.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-receivables-aging demo
npx -y fairpolicy-receivables-aging mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-receivables-aging demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Receivables Aging demo (fictional agency, carriers and clients)

▶ Age every open item
  status: executed  decision: allow
  7 open item(s) as of 2026-11-18: 14550 owed by clients (1200 not due, 650 1-30 days, 3000 31-60, 6400 61-90, 3300 over 90); 2400 already paid to carriers and not collected; 220 in credit balances owed to clients.
    INV-7001         2026-08-01   109          2400         fronted_premium
    INV-7002         2026-08-10   100          900          over_90
    INV-7007         2026-10-01   48           -220         credit_balance
    INV-7003         2026-09-15   64           6400         over_60
    INV-7004         2026-10-10   39           3000         over_30
    INV-7005         2026-11-05   13           650          current
    INV-7006         2026-12-01   0            1200         not_due

▶ Explain the item the agency already paid the carrier
  status: executed  decision: allow
  INV-7001: fronted_premium. 2400 open, 109 days past due; the agency already paid the carrier. Next: The agency has already paid the carrier and the client has not paid it: call the client this week.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Agency-bill receivables aging written: 7 open item(s) as of 2026-11-18: 14550 owed by clients (1200 not due, 650 1-30 days, 3000 31-60, 6400 61-90, 3300 over 90); 2400 already paid to carriers and not collected; 220 in credit balances owed to clients. Files: fairpolicy-out/receivables/receivables-aging.csv, fairpolicy-out/receivables/receivables-aging.html.

▶ Draft a balance reminder for one client
  status: executed  decision: allow  (auto)
  reminder CID-1739af6c drafted for 8800 with 1 open marker(s) ([TO CONFIRM agency phone]). Nothing was sent.

▶ Approve it: waits for a named person even in Auto
  status: needs_approval  decision: ask
  reason: binding_send stays one-click, even in Auto

▶ Same call after the click (recorded; a person sends it)
  status: executed  decision: ask  approved by: Casey Park (fictional)
  reminder 970fc82998eb approved and recorded. Nothing was sent or paid by the agent.

▶ The agent tries carrier_cancel_request itself
  status: blocked  decision: block
  reason: It never asks a carrier to cancel a policy for non-payment.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `receivables_check` | Every open item with days past due and a status (fronted_premium, over_90, credit_balance, over_60, over_30, current, not_due), bucket totals, and totals by client and producer. | runs |
| `receivables_explain` | Show one item from receivables_check in full: its status, every finding and the figures behind it. | runs |
| `receivables_write_report` | Write receivables-aging.csv (every item with its status and the figures behind it, plus blank owner and notes columns) and receivables-aging.html into out_dir (default fairpolicy-out/receivables). | runs |
| `receivables_draft_reminder` | Write drafts/reminder-<client>.md: a polite reminder of one client's past-due items over 30 days. | asks first (Auto can be opted in) |
| `receivables_request_send` | After one named human click (even in Auto), record that the reviewed reminder draft is approved in reminder-requests.csv. | one named click, even in Auto (`binding_send`) |
| `carrier_cancel_request` | It never asks a carrier to cancel a policy for non-payment. | refused |
| `card_charge` | It never charges a client's card or bank account. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Agency-bill receivables (`receivables`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `client` | text (masked) | Account Name, Customer Name, Client Name, Insured, Insured Name, Bill To | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `client_id` | text (masked) | Lookup Code, Customer #, Client Code, Account Code, Client Number | Kundennummer, Code client, 顧客コード, 客户编号 |
| `invoice` | text | Invoice #, Invoice Number, Item Number, Invoice, Item # | - |
| `policy_number` | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `carrier` | text | Carrier, Company, Issuing Company, Writing Company | Versicherer, Assureur, 保険会社, 保险公司 |
| `due_date` | date | Due Date, Invoice Due Date, Payment Due | Fälligkeitsdatum, Date d'échéance, 期日, 截止日期 |
| `amount` | amount | Amount, Invoice Amount, Original Amount, Billed | Betrag, Montant, 金額, 金额 |
| `balance` | amount | Balance, Balance Due, Open Balance, Amount Due, Outstanding | Saldo, Solde, 残高, 余额 |
| `producer` | text | Producer, Exec, Account Executive | Vermittler, Producteur, 募集人, 业务员 |
| `csr` | text | Account Manager, CSR, Rep, Servicer | Sachbearbeiter, Gestionnaire, 事務担当, 客服 |
| `remitted` | yes/no | Remitted To Carrier, Paid To Carrier, Carrier Paid, Remitted | - |

Named exports recognised by their column names:

| System | Export | Recognised by | Layout checked against vendor docs |
|---|---|---|---|
| Applied Epic | Transaction or receivables detail export (CSV) | Lookup Code, Item Number, Transaction Code, Balance | no |
| Vertafore AMS360 | Agency bill invoice / receivables report (CSV) | Customer #, Invoice #, Policy #, Due Date, Balance Due | no |

Every layout here was written from knowledge of the export ("recalled") and was not checked against vendor documentation or a live account. Agency systems let each agency choose report columns, so the first setup confirms them with inspect.

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-receivables-aging inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-receivables-aging demo
npx -y fairpolicy-receivables-aging mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-receivables-aging": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-receivables-aging",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-receivables-aging -- npx -y fairpolicy-receivables-aging mcp --root .`, or install the `fairpolicy-receivables-aging` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-receivables-aging approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-receivables-aging approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-receivables-aging kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-receivables-aging tools                 # every tool, its policy and arguments
fairpolicy-receivables-aging sources               # the columns each input is read from
fairpolicy-receivables-aging inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-receivables-aging call receivables_check '{"receivables":"<receivables>"}'
fairpolicy-receivables-aging eval                  # the private eval cases on the fictional fixtures
fairpolicy-receivables-aging demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
