import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkFiles, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const DOC_LIST = { type: 'array', maxItems: 20, items: { type: 'string', pattern: '^[a-z][a-z0-9_]{1,40}$' } };
export const CHECKLIST_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    required: { type: 'object', description: 'Documents required on file for each line code, replacing the defaults for that line', additionalProperties: DOC_LIST },
    document_aliases: { type: 'object', description: 'Your document names and the type each one is, e.g. {"PIP-REJ": "pip_rejection"}', additionalProperties: { type: 'string', pattern: '^[a-z][a-z0-9_]{1,40}$' } },
  },
};
const E_O_POLICY_FIELDS = {
  ...POLICY_FIELDS,
  um_selection: { aliases: ['UM Selection', 'UM/UIM Selection', 'UM Option', 'Uninsured Motorist Selection'], translate: false },
  declined_coverages: { aliases: ['Declined Coverages', 'Coverages Declined', 'Declined', 'Offered and Declined'], translate: false },
};
const DOC_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy', 'Attached To'], required: true },
  document_type: { aliases: ['Document Type', 'Attachment Type', 'Description', 'Document', 'Form'], required: true, translate: false },
  signed: { aliases: ['Signed', 'Signature', 'E-Signed', 'Status'], translate: false },
  date: { type: 'date', aliases: ['Date', 'Attached Date', 'Signed Date', 'Received'] },
};
const files = {
  policies: { type: 'string', description: 'Policy list with line, status, the UM/UIM selection and any coverages offered and declined' },
  documents: { type: 'string', description: 'Attachment or document list from your agency system: policy, document type, signed or not' },
};
const args = { checklist: { type: 'string', description: 'Optional checklist JSON: the documents your agency requires on file by line, and your document names' } };
const run = (a, ctx) => checkFiles(ctx.records(a.policies, 'policies'), ctx.records(a.documents, 'documents'), a.checklist ? ctx.readJson(a.checklist, 'eo_checklist') : {});

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-signed-declinations', version: pkg.version, prefix: 'declinations', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency principal or E&O contact',
  description: 'Checks each active policy file for the signed documents your agency requires: signed applications, UM/UIM rejection forms when UM was rejected or reduced, flood offers on homeowners, and signed declinations when coverage was offered and declined. Lists what is missing or unsigned. It never decides what to offer and never sends forms to a client.',
  files, args, required: ['policies', 'documents'], statuses: STATUSES,
  sources: { policies: { label: 'Policy list', args: ['policies'], fields: E_O_POLICY_FIELDS, profiles: POLICY_PROFILES }, documents: { label: 'Documents on file', args: ['documents'], fields: DOC_FIELDS } },
  configSchemas: { eo_checklist: CHECKLIST_SCHEMA },
  run, summary: summaryLine,
  check: { title: 'Check signed forms on file', description: 'Each active policy: the documents required, those missing and those unsigned, and a status (missing, unsigned, complete). Totals by document type.' },
  report: {
    base: 'signed-declinations', titleShort: 'Write the E&O file worklist',
    title: { en: 'Signed forms and declinations on file', de: 'Unterschriebene Formulare und Verzichtserklärungen', fr: 'Formulaires signés et refus de garantie au dossier', es: 'Formularios firmados y renuncias en el expediente', pt: 'Formulários assinados e recusas no arquivo', it: 'Moduli firmati e rinunce in archivio', ja: '署名済み書類と補償辞退書の保管状況', zh: '已签署表格与拒保声明存档', ko: '서명 서류와 담보 거절서 보관 현황' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'effective_date', 'required', 'missing', 'unsigned', 'um_selection', 'declined_coverages', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'line', 'effective_date', 'missing', 'unsigned', 'um_selection', 'declined_coverages'],
    sections: (o) => [{ title: { en: 'By document', de: 'Nach Unterlage', fr: 'Par document', es: 'Por documento', pt: 'Por documento', it: 'Per documento', ja: '書類別', zh: '按文件', ko: '서류별' }, rows: o.by_document, columns: ['document', 'count'] }],
    limits: ['The required documents come from your checklist (or the defaults); state forms and their wording differ. A missing document here is a filing gap, not a finding about coverage.', 'Documents are matched by type words (application, UM/UIM, flood, declination) or your aliases; a scan named oddly may be missed.'],
  },
  refused: [
    { name: 'esign_request_send', category: 'binding_send', description: 'It never sends a form for signature.' },
    { name: 'coverage_recommend', category: 'binding_send', description: 'It never recommends or declines coverage for a client.' },
  ],
});
