import { fairpolicyAgent, POLICY_FIELDS, POLICY_PROFILES, sectionTitle } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkQuality, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const DQ_POLICY_FIELDS = {
  ...POLICY_FIELDS,
  address: { aliases: ['Address', 'Mailing Address', 'Address 1', 'Street', 'Address Line 1'] },
  zip: { aliases: ['ZIP', 'Zip Code', 'Postal Code', 'Mailing Zip'] },
  email: { type: 'email', aliases: ['Email', 'E-mail', 'Email Address'] },
  phone: { aliases: ['Phone', 'Phone Number', 'Home Phone', 'Mobile'] },
};
const VEHICLE_FIELDS = {
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'], required: true },
  vin: { aliases: ['VIN', 'Vehicle VIN', 'VIN Number', 'Serial Number'] },
  year: { type: 'number', aliases: ['Year', 'Model Year', 'Vehicle Year'], translate: false },
  make: { aliases: ['Make', 'Vehicle Make'], translate: false },
};
const files = { policies: { type: 'string', description: 'Policy list from your agency system with dates, carrier, premium, producer, account manager and the client\'s address, ZIP, e-mail and phone' } };
const args = { vehicles: { type: 'string', description: 'Optional vehicle list (policy number, VIN, year, make) to check VINs on auto policies' } };
const run = (a, ctx) => checkQuality(ctx.records(a.policies, 'policies'), a.vehicles ? ctx.records(a.vehicles, 'vehicles') : null);

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-data-quality', version: pkg.version, prefix: 'quality', key: 'policy_number', keyKind: 'policy', noun: 'policy',
  role: 'an agency operations or service manager',
  description: 'Checks every active policy in your agency system for the data that breaks downloads, renewals and certificates: expiration before effective, no carrier or premium, VINs missing or failing the check digit, missing address, bad ZIP, no e-mail or phone on personal lines, and no producer or account manager. Counts by issue and account manager. Never edits your agency system.',
  files, args, required: ['policies'], statuses: STATUSES,
  sources: { policies: { label: 'Policy list', args: ['policies'], fields: DQ_POLICY_FIELDS, profiles: POLICY_PROFILES }, vehicles: { label: 'Vehicles', args: ['vehicles'], fields: VEHICLE_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Check policy data quality', description: 'Each active policy: every issue found and a status (critical, vehicle_data, contact_data, staff_data, clean). Totals by issue and account manager.' },
  report: {
    base: 'data-quality', titleShort: 'Write the data clean-up list',
    title: { en: 'Policy data quality', de: 'Datenqualität der Verträge', fr: 'Qualité des données des polices', es: 'Calidad de datos de las pólizas', pt: 'Qualidade dos dados das apólices', it: 'Qualità dei dati delle polizze', ja: '契約データの品質', zh: '保单数据质量', ko: '계약 데이터 품질' },
    columns: ['status', 'policy_number', 'client', 'carrier', 'line', 'effective_date', 'expiration_date', 'issues', 'issue_count', 'producer', 'csr', 'detail', 'next_step'],
    htmlColumns: ['status', 'policy_number', 'carrier', 'line', 'issues', 'producer', 'csr'],
    sections: (o) => [{ title: { en: 'By issue', de: 'Nach Problem', fr: 'Par problème', es: 'Por problema', pt: 'Por problema', it: 'Per problema', ja: '問題別', zh: '按问题', ko: '문제별' }, rows: o.by_issue, columns: ['issue', 'severity', 'count'] }, { title: { en: 'By account manager', de: 'Nach Sachbearbeiter', fr: 'Par gestionnaire', es: 'Por gestor', pt: 'Por atendente', it: 'Per gestore', ja: '事務担当別', zh: '按客服', ko: '사무담당별' }, rows: o.by_csr, columns: ['csr', 'policies', 'issues'] }],
    limits: ['A VIN that passes the check digit can still be the wrong vehicle; only the title or the carrier confirms it.', 'ZIP codes are checked for the US five- or nine-digit shape only.'],
  },
  refused: [
    { name: 'ams_update_policy', category: 'production_deploy', description: 'It never edits a policy or client in your agency system.' },
    { name: 'client_message_send', category: 'binding_send', description: 'It never contacts a client for missing data.' },
  ],
});
