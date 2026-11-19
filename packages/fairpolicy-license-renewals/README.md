# Fairpolicy License Renewals (`fairpolicy-license-renewals`)

Tracks producer and staff licences by state: expired licences, continuing education and ethics hours short of the state setting before expiration, renewals due in the next 60 days, and states with no setting yet, by person. State rules are settings your agency confirms; the agent gives no legal advice and never files a renewal.

**It never files a licence renewal or pays a state fee. It never buys a course.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-license-renewals demo
npx -y fairpolicy-license-renewals mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-license-renewals demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy License Renewals demo (fictional agency, carriers and clients)

▶ Check every licence and its continuing education
  status: executed  decision: allow
  7 licence(s) for 5 person(s) as of 2026-11-18: 1 expired, 1 short of continuing education before expiration, 1 due for renewal, 1 in states with no settings. State rules are the settings your agency confirmed, not legal advice.
    Jordan Lee       OK           2026-10-31   0            expired
    Jordan Lee       TX           2027-01-10   18           ce_short
    Sam Ortiz        TX           2027-01-05   24           renewal_due
    Sam Ortiz        LA           2027-08-01   24           no_state_rule
    Riley Chen       FL           2027-01-20   24           current
    Drew Kim         TX           2027-06-01   10           current
    Casey Park       TX           2028-03-01   4            current

▶ Explain the licence short of CE hours
  status: executed  decision: allow
  TX-90001: ce_short. Expires 2027-01-10 (53 days); 18 of 24 hours, 3 of 3 ethics hours. Next: Continuing education hours are short of the state setting before expiration: book the courses now.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Licence renewals and continuing education written: 7 licence(s) for 5 person(s) as of 2026-11-18: 1 expired, 1 short of continuing education before expiration, 1 due for renewal, 1 in states with no settings. State rules are the settings your agency confirmed, not legal advice. Files: fairpolicy-out/licenses/license-renewals.csv, fairpolicy-out/licenses/license-renewals.html.

▶ The agent tries license_renewal_file itself
  status: blocked  decision: block
  reason: It never files a licence renewal or pays a state fee.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `licenses_check` | Each licence: days to expiration, CE and ethics hours against the state setting, and a status (expired, ce_short, renewal_due, no_state_rule, current). | runs |
| `licenses_explain` | Show one license from licenses_check in full: its status, every finding and the figures behind it. | runs |
| `licenses_write_report` | Write license-renewals.csv (every license with its status and the figures behind it, plus blank owner and notes columns) and license-renewals.html into out_dir (default fairpolicy-out/licenses). | runs |
| `license_renewal_file` | It never files a licence renewal or pays a state fee. | refused |
| `ce_course_purchase` | It never buys a course. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Licences (`licenses`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `person` (required) | text | Name, Producer, Licensee, Employee, Agent Name, Individual | - |
| `role` | text | Role, Title, Position | Rolle, Rôle, ロール, 角色 |
| `state` (required) | text | State, License State, Jurisdiction | Bundesland, Région, 都道府県, 省份 |
| `license_number` | text | License Number, License #, License No, NPN | Registernummer, N° ORIAS, 登録番号, 执业证号 |
| `license_type` | text | License Type, Class, Lines of Authority, Type | - |
| `resident` | text | Resident, Resident State, Residency, Resident/Non-Resident | - |
| `expiration_date` | date | Expiration Date, Expires, License Expiration, Exp Date | Ablauf, Date d'échéance, 満期, 到期日期 |
| `ce_hours` | number | CE Hours, CE Hours Completed, Hours Completed, Credits | - |
| `ethics_hours` | number | Ethics Hours, Ethics Completed, Ethics Credits | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-license-renewals inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-license-renewals demo
npx -y fairpolicy-license-renewals mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-license-renewals": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-license-renewals",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-license-renewals -- npx -y fairpolicy-license-renewals mcp --root .`, or install the `fairpolicy-license-renewals` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-license-renewals approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-license-renewals approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-license-renewals kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-license-renewals tools                 # every tool, its policy and arguments
fairpolicy-license-renewals sources               # the columns each input is read from
fairpolicy-license-renewals inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-license-renewals call licenses_check '{"licenses":"<licenses>","states":"<states>"}'
fairpolicy-license-renewals eval                  # the private eval cases on the fictional fixtures
fairpolicy-license-renewals demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
