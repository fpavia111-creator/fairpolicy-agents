import { fairpolicyAgent } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkCertificates, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const d = (aliases) => ({ type: 'date', aliases });
const money = (aliases) => ({ type: 'money', aliases, translate: false });
export const CERT_FIELDS = {
  certificate: { aliases: ['Certificate', 'Certificate #', 'Certificate Number', 'Certificate ID', 'COI Number'], required: true, translate: false },
  holder: { aliases: ['Holder', 'Certificate Holder', 'Holder Name'], translate: false },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'] },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  issued_date: d(['Issued Date', 'Issue Date', 'Date Issued', 'Created']),
  each_occurrence: money(['Each Occurrence', 'Occurrence Limit', 'Each Occurrence Limit', 'Limit', 'Each Accident', 'CSL']),
  aggregate: money(['Aggregate', 'General Aggregate', 'Aggregate Limit']),
  effective_date: d(['Policy Effective', 'Effective Date', 'Policy Eff']),
  expiration_date: d(['Policy Expiration', 'Expiration Date', 'Policy Exp']),
  additional_insured: { type: 'bool', aliases: ['Additional Insured', 'AI', 'Addl Insd', 'Additional Insured Shown'] },
  waiver: { type: 'bool', aliases: ['Waiver of Subrogation', 'Waiver', 'WOS', 'Subr Wvd'] },
  issued_by: { aliases: ['Issued By', 'User', 'Created By'] },
};
export const COVERAGE_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  client: { aliases: ['Insured', 'Named Insured', 'Client Name', 'Account Name'] },
  line: { aliases: ['Line of Business', 'Line', 'Coverage', 'Policy Type'] },
  each_occurrence: money(['Each Occurrence', 'Occurrence Limit', 'Each Occurrence Limit', 'Limit', 'Each Accident', 'CSL']),
  aggregate: money(['Aggregate', 'General Aggregate', 'Aggregate Limit']),
  effective_date: d(['Effective Date', 'Eff Date']),
  expiration_date: d(['Expiration Date', 'Exp Date']),
  status: { aliases: ['Status', 'Policy Status'] },
  cancel_date: d(['Cancel Date', 'Cancellation Date']),
  ai_endorsement: { aliases: ['AI Endorsement', 'Additional Insured Endorsement', 'Blanket AI', 'Additional Insured'], translate: false },
  waiver_endorsement: { aliases: ['Waiver Endorsement', 'Waiver of Subrogation', 'Blanket Waiver', 'Waiver'], translate: false },
};
const files = {
  certificates: { type: 'string', description: 'Certificate log exported from your agency system or certificate tool: certificate, holder, policy, issued date, limits and endorsements shown' },
  coverage: { type: 'string', description: 'Coverage schedule of the policies: policy, limits, term, status, and whether additional insured and waiver endorsements are on the policy' },
};
const run = (a, ctx) => checkCertificates(ctx.records(a.certificates, 'certificates'), ctx.records(a.coverage, 'coverage'));

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-certificate-limits', version: pkg.version, prefix: 'certificates', key: 'ref', keyKind: 'ref', noun: 'line',
  role: 'an agency account manager who issues certificates',
  description: 'Checks every certificate of insurance you issued against the policy behind it: issued on a policy not in force, limits higher than the policy, additional insured or waiver of subrogation shown without the endorsement, wrong policy dates, or an unknown policy number. Never issues, changes or sends a certificate.',
  files, statuses: STATUSES,
  sources: { certificates: { label: 'Certificate log', args: ['certificates'], fields: CERT_FIELDS }, coverage: { label: 'Coverage schedule', args: ['coverage'], fields: COVERAGE_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Check certificates against policies', description: 'Each certificate and policy line: every issue found and a status (policy_not_in_force, limit_overstated, ai_not_on_policy, waiver_not_on_policy, dates_wrong, policy_unknown, ok).' },
  explain: { title: 'Explain one certificate line', description: 'One certificate line (certificate/policy) with each issue and the policy figures behind it.' },
  report: {
    base: 'certificate-limits', titleShort: 'Write the certificate worklist',
    title: { en: 'Certificates checked against policies', de: 'Versicherungsbestätigungen gegen Verträge geprüft', fr: 'Attestations contrôlées contre les polices', es: 'Certificados revisados contra las pólizas', pt: 'Certificados conferidos com as apólices', it: 'Certificati verificati sulle polizze', ja: '保険証明書と契約内容の照合', zh: '保险凭证与保单核对', ko: '보험 증명서와 계약 대조' },
    columns: ['status', 'ref', 'certificate', 'holder', 'client', 'policy_number', 'issued_date', 'issues', 'issued_by', 'detail', 'next_step'],
    htmlColumns: ['status', 'certificate', 'holder', 'policy_number', 'issued_date', 'issues', 'detail'],
    limits: ['A certificate is information only and does not change the policy; this check compares what was shown with your coverage file, which must be current.', 'Whether an endorsement is blanket or must name the holder is in the policy wording; the coverage file says yes or no only.'],
  },
  refused: [
    { name: 'certificate_issue', category: 'binding_send', description: 'It never issues or reissues a certificate.' },
    { name: 'certificate_send', category: 'binding_send', description: 'It never sends a certificate to a holder.' },
  ],
});
