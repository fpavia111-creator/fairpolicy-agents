# Fairpolicy Certificate Limits (`fairpolicy-certificate-limits`)

Checks every certificate of insurance you issued against the policy behind it: issued on a policy not in force, limits higher than the policy, additional insured or waiver of subrogation shown without the endorsement, wrong policy dates, or an unknown policy number. Never issues, changes or sends a certificate.

**It never issues or reissues a certificate. It never sends a certificate to a holder.**

MIT · Node 20 or newer · local files only · client identifiers masked before results reach the model · built on [`fairpolicy-core`](../fairpolicy-core)

```bash
npx -y fairpolicy-certificate-limits demo
npx -y fairpolicy-certificate-limits mcp --root ./agency-exports
```

<!-- generated:start -->

## A demo run

`npx -y fairpolicy-certificate-limits demo` runs the agent on the fictional files in [`fixtures/`](fixtures) in a temporary folder. Captured output:

```text
Fairpolicy Certificate Limits demo (fictional agency, carriers and clients)

▶ Check every certificate against its policy
  status: executed  decision: allow
  6 certificate(s), 7 policy line(s) checked: 6 certificate(s) with something the policy does not support (1 not in force, 1 limits overstated, 1 additional insured not on the policy, 1 waiver not on the policy, 1 wrong dates, 1 unknown policy).
    C-9004/CGL-1804  2026-10-15   policy_not_in_force policy_not_in_force
    C-9002/CGL-1801  2026-10-20   limit_overstated limit_overstated
    C-9003/CA-1803   2026-11-03   ai_not_on_policy ai_not_on_policy
    C-9001/WC-1802   2026-10-02   waiver_not_on_policy waiver_not_on_policy
    C-9005/XS-1805   2026-11-10   dates_wrong  dates_wrong
    C-9006/BOP-1899  2026-11-12   policy_unknown policy_unknown
    C-9001/CGL-1801  2026-10-02                ok

▶ Explain the certificate issued after cancellation
  status: executed  decision: allow
  C-9004/CGL-1804: policy_not_in_force. Issued 2026-10-15; the policy was cancelled 2026-09-30. Next: The certificate was issued on a policy that was not in force that day: the account manager reviews it with the agency principal today.

▶ Write the worklist (CSV and HTML, real names stay on this computer)
  status: executed  decision: allow
  Certificates checked against policies written: 6 certificate(s), 7 policy line(s) checked: 6 certificate(s) with something the policy does not support (1 not in force, 1 limits overstated, 1 additional insured not on the policy, 1 waiver not on the policy, 1 wrong dates, 1 unknown policy). Files: fairpolicy-out/certificates/certificate-limits.csv, fairpolicy-out/certificates/certificate-limits.html.

▶ The agent tries certificate_issue itself
  status: blocked  decision: block
  reason: It never issues or reissues a certificate.
```

## Tools

| Tool | What it does | Policy |
|---|---|---|
| `certificates_check` | Each certificate and policy line: every issue found and a status (policy_not_in_force, limit_overstated, ai_not_on_policy, waiver_not_on_policy, dates_wrong, policy_unknown, ok). | runs |
| `certificates_explain` | One certificate line (certificate/policy) with each issue and the policy figures behind it. | runs |
| `certificates_write_report` | Write certificate-limits.csv (every line with its status and the figures behind it, plus blank owner and notes columns) and certificate-limits.html into out_dir (default fairpolicy-out/certificates). | runs |
| `certificate_issue` | It never issues or reissues a certificate. | refused |
| `certificate_send` | It never sends a certificate to a holder. | refused |

Any tool name not in this table is blocked, including names a model invents. `refused` tools are listed so a model can see they exist and are refused.

## Columns it reads

Table inputs can be CSV, TSV, semicolon- or pipe-separated text, Excel `.xlsx`, JSON or JSONL. Columns are matched by the agent's own name, then by the English names below, then by their names in German, French, Spanish, Portuguese, Italian, Japanese, Chinese and Korean. Dates become `YYYY-MM-DD`; amounts are read with either decimal mark. Every result lists under `sources` how each file was read. Columns marked *masked* hold patient identifiers: the model sees a pseudonym, a birth year or nothing (see Patient data).

### Certificate log (`certificates`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `certificate` (required) | text | Certificate, Certificate #, Certificate Number, Certificate ID, COI Number | - |
| `holder` | text | Holder, Certificate Holder, Holder Name | - |
| `client` | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `issued_date` | date | Issued Date, Issue Date, Date Issued, Created | - |
| `each_occurrence` | amount | Each Occurrence, Occurrence Limit, Each Occurrence Limit, Limit, Each Accident, CSL | - |
| `aggregate` | amount | Aggregate, General Aggregate, Aggregate Limit | - |
| `effective_date` | date | Policy Effective, Effective Date, Policy Eff | Beginn, Date d'effet, 始期, 生效日期 |
| `expiration_date` | date | Policy Expiration, Expiration Date, Policy Exp | Ablauf, Date d'échéance, 満期, 到期日期 |
| `additional_insured` | yes/no | Additional Insured, AI, Addl Insd, Additional Insured Shown | - |
| `waiver` | yes/no | Waiver of Subrogation, Waiver, WOS, Subr Wvd | - |
| `issued_by` | text | Issued By, User, Created By | - |

### Coverage schedule (`coverage`)

| Column | Type | Also read as | For example, in other languages |
|---|---|---|---|
| `policy_number` (required) | text | Policy Number, Policy #, Policy | Vertragsnummer, N° de police, 証券番号, 保单号 |
| `client` | text (masked) | Insured, Named Insured, Client Name, Account Name | Versicherungsnehmer, Assuré, 契約者, 投保人 |
| `line` | text | Line of Business, Line, Coverage, Policy Type | Sparte, Branche, 保険種目, 险种 |
| `each_occurrence` | amount | Each Occurrence, Occurrence Limit, Each Occurrence Limit, Limit, Each Accident, CSL | - |
| `aggregate` | amount | Aggregate, General Aggregate, Aggregate Limit | - |
| `effective_date` | date | Effective Date, Eff Date | Beginn, Date d'effet, 始期, 生效日期 |
| `expiration_date` | date | Expiration Date, Exp Date | Ablauf, Date d'échéance, 満期, 到期日期 |
| `status` | text | Status, Policy Status | Status, Statut, ステータス, 状态 |
| `cancel_date` | date | Cancel Date, Cancellation Date | Stornodatum, Date de résiliation, 解約日, 退保日期 |
| `ai_endorsement` | text | AI Endorsement, Additional Insured Endorsement, Blanket AI, Additional Insured | - |
| `waiver_endorsement` | text | Waiver Endorsement, Waiver of Subrogation, Blanket Waiver, Waiver | - |

### Files from other countries

A German export in Windows-1252 with semicolons, `1.234,56` and `03.11.2026`, or a Japanese one in Shift_JIS with `2026/11/03`, is read the same way as the English file: `npm run intl` in the repository rewrites every eval fixture the way a German, French, Spanish, Brazilian, Italian, Japanese, Chinese and Korean export would write it and requires the same results. Columns named differently? Run `npx fairpolicy-certificate-limits inspect <file>` (names and shapes only, never values) and name them in `fairpolicy-sources.json`:

```json
{ "files": { "exports/claims.csv": { "columns": { "claim_id": "Fallnummer" }, "date_order": "dmy" } } }
```

## Install

Node 20 or newer. No other dependencies.

```bash
npx -y fairpolicy-certificate-limits demo
npx -y fairpolicy-certificate-limits mcp --root /path/to/your/files
```

Claude Desktop, Cursor and other MCP hosts:

```json
{
  "mcpServers": {
    "fairpolicy-certificate-limits": {
      "command": "npx",
      "args": [
        "-y",
        "fairpolicy-certificate-limits",
        "mcp",
        "--root",
        "/path/to/your/files"
      ]
    }
  }
}
```

Claude Code: `claude mcp add fairpolicy-certificate-limits -- npx -y fairpolicy-certificate-limits mcp --root .`, or install the `fairpolicy-certificate-limits` plugin from this repository's marketplace (`fairpolicy-medical-billing`).

## Modes and approvals

- **Review** (`--mode review`): reads and reports only.
- **Assist** (default): the policy above. A tool that asks returns an `approval_id`; a person approves it once with `fairpolicy-certificate-limits approve <id> --as "Your Name"` (or on the local approvals page, `fairpolicy-certificate-limits approvals`), and the same call is repeated.
- **Auto** (`--mode auto --auto <tool,...>`): opt-in per tool, with step caps and a kill switch (`fairpolicy-certificate-limits kill`). Sending, moving money, going live and accepting a learned fact stay **one named click even in Auto**; an approval is tied to the sha256 of the reviewed draft, so a changed draft needs a new click.

## CLI

```bash
fairpolicy-certificate-limits tools                 # every tool, its policy and arguments
fairpolicy-certificate-limits sources               # the columns each input is read from
fairpolicy-certificate-limits inspect <file>        # how a file would be read (names and shapes, never values)
fairpolicy-certificate-limits call certificates_check '{"certificates":"<certificates>","coverage":"<coverage>"}'
fairpolicy-certificate-limits eval                  # the private eval cases on the fictional fixtures
fairpolicy-certificate-limits demo
```

## Client data

Results go to an AI model, so client identifiers are masked before they leave the agent (`--phi mask`, the default; the flag name comes from the shared core): client and insured names and client codes become stable pseudonyms such as `CL-3f9a1c2e`; birth dates become the birth year; driver licence numbers, addresses, phones, e-mails and SSNs are removed, also inside free text. `--phi strict` also hides policy numbers, claim numbers and VINs and cuts ZIP codes to three digits. Producers, account managers and carriers are not masked. The files the agent writes on your computer keep the real values, because your staff need them: keep them in a secure folder. Masking is not anonymisation, and it does not replace your agency's information-security program.


## Limits

- It checks only what is in the files and settings you load. Commission schedules, state rules, deadlines and carrier requirements are as current as what you give it; the example settings are starting points, not any carrier's or state's rule.
- It is not legal, tax, accounting or coverage advice. It never binds, cancels, endorses or places coverage, and it never tells a client what to buy. A person reviews every result before anything goes to a client, carrier or producer; the agent sends nothing.
- Export layouts named in "Columns it reads" were written from knowledge of each system and not tested against a live account; `inspect` shows how a file was read.
- Client-data masking keeps identifiers away from the model; it does not replace your agency's privacy and information-security program (state insurance data security rules, access control, retention).
