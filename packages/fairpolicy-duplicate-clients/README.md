# Fairpolicy Duplicate Clients (`fairpolicy-duplicate-clients`)

Finds client records that are the same person or business: exact duplicates (same name with the same e-mail, phone or address), likely duplicates (similar names sharing a contact), possible duplicates (similar names only), and different people sharing an address or contact (a household, not a merge). Never merges or deletes a record.

**It never merges client records. It never deletes a client record.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-duplicate-clients demo
npx -y fairpolicy-duplicate-clients mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-duplicate-clients demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Duplicate Clients demo (fictional agency, carriers and clients)

▶ Find client records that look like one client
  status: executed  decision: allow
  10 client record(s): 1 exact duplicate pair(s), 1 likely, 1 possible (6 records involved), and 1 pair(s) that share an address or contact but are different people.
    D-001            name, e-mail, address 1            exact_duplicate
    D-002            similar name (97%), ph 0.97         likely_duplicate
    D-003            similar name (100%) 1            possible_duplicate
    D-004            address      0.76         same_household

▶ Explain the first pair
  status: executed  decision: allow
  D-001: exact_duplicate. Shared: name, e-mail, address. Next: The same client twice: a person merges the records in your agency system (policies, notes and attachments move with them).

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Duplicate client records written: 10 client record(s): 1 exact duplicate pair(s), 1 likely, 1 possible (6 records involved), and 1 pair(s) that share an address or contact but are different people. Files: fairpolicy-out/duplicates/duplicate-clients.csv, fairpolicy-out/duplicates/duplicate-clients.html.

▶ The agent tries client_merge itself
  status: blocked  decision: block
  reason: It never merges client records.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `duplicates_check` | Each pair of records that look like one client, with what they share and a status (exact_duplicate, likely_duplicate, possible_duplicate, same_household). | runs |
| `duplicates_explain` | One pair (D-001 ...) with what the two records share. | runs |
| `duplicates_write_report` | Write duplicate-clients.csv (every pair with its status and the figures behind it, plus blank owner and notes columns) and duplicate-clients.html into out_dir (default fairpolicy-out/duplicates). | runs |
| `client_merge` | It never merges client records. | refused |
| `client_delete` | It never deletes a client record. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Client list (`clients`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `client_id` | text (masked) | Customer #, Client Code, Lookup Code, Client Number, Client ID, Customer ID | Kundennummer, Code client, 顧客コード, 客户编号 |
| `client` (required) | text (masked) | Customer Name, Client Name, Account Name, Name, Insured, Applicant | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `address` | text (masked) | Address, Mailing Address, Address 1, Street, Address Line 1 | Adresse, Adresse, 住所, 地址 |
| `zip` | text | Zip, ZIP, Zip Code, Postal Code | - |
| `phone` | text (masked) | Phone, Phone Number, Home Phone, Mobile, Cell Phone | Telefon, Téléphone, 電話番号, 电话 |
| `email` | email (masked) | Email, E-mail, Email Address | E-Mail, E-mail, メールアドレス, 邮箱 |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-duplicate-clients inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-duplicate-clients demo
npx -y fairpolicy-duplicate-clients mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-duplicate-clients": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-duplicate-clients",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-duplicate-clients -- npx -y fairpolicy-duplicate-clients mcp --root .`, or install the `fairpolicy-duplicate-clients` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-duplicate-clients approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-duplicate-clients approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-duplicate-clients kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-duplicate-clients tools                 # every tool, its policy and arguments
fairpolicy-duplicate-clients sources               # the columns each input is read from
fairpolicy-duplicate-clients inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-duplicate-clients call duplicates_check '{"clients":"<clients>"}'
fairpolicy-duplicate-clients eval                  # the private eval cases on the fictional fixtures
fairpolicy-duplicate-clients demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
