import { fairpolicyAgent } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { findDuplicates, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const CLIENT_FIELDS = {
  client_id: { aliases: ['Customer #', 'Client Code', 'Lookup Code', 'Client Number', 'Client ID', 'Customer ID'] },
  client: { aliases: ['Customer Name', 'Client Name', 'Account Name', 'Name', 'Insured', 'Applicant'], required: true },
  address: { aliases: ['Address', 'Mailing Address', 'Address 1', 'Street', 'Address Line 1'] },
  zip: { aliases: ['Zip', 'ZIP', 'Zip Code', 'Postal Code'] },
  phone: { aliases: ['Phone', 'Phone Number', 'Home Phone', 'Mobile', 'Cell Phone'] },
  email: { type: 'email', aliases: ['Email', 'E-mail', 'Email Address'] },
};
const files = { clients: { type: 'string', description: 'Client list exported from your agency system: client code, name, address, ZIP, phone, e-mail' } };
const args = { threshold: { type: 'number', minimum: 0.8, maximum: 1, description: 'How alike two names must be to count as similar, 0.8 to 1 (default 0.92)' } };
const run = (a, ctx) => findDuplicates(ctx.records(a.clients, 'clients'), { threshold: a.threshold ?? 0.92 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-duplicate-clients', version: pkg.version, prefix: 'duplicates', key: 'pair', keyKind: 'pair', noun: 'pair',
  role: 'an agency operations manager',
  description: 'Finds client records that are the same person or business: exact duplicates (same name with the same e-mail, phone or address), likely duplicates (similar names sharing a contact), possible duplicates (similar names only), and different people sharing an address or contact (a household, not a merge). Never merges or deletes a record.',
  files, args, required: ['clients'], statuses: STATUSES,
  sources: { clients: { label: 'Client list', args: ['clients'], fields: CLIENT_FIELDS } },
  run, summary: summaryLine,
  check: { title: 'Find duplicate clients', description: 'Each pair of records that look like one client, with what they share and a status (exact_duplicate, likely_duplicate, possible_duplicate, same_household).' },
  explain: { title: 'Explain one pair', description: 'One pair (D-001 ...) with what the two records share.' },
  report: {
    base: 'duplicate-clients', titleShort: 'Write the merge review list',
    title: { en: 'Duplicate client records', de: 'Doppelte Kundendatensätze', fr: 'Fiches clients en double', es: 'Registros de clientes duplicados', pt: 'Cadastros de clientes duplicados', it: 'Anagrafiche clienti duplicate', ja: '重複した顧客レコード', zh: '重复的客户记录', ko: '중복 고객 레코드' },
    columns: ['status', 'pair', 'client_id', 'client', 'other_client_id', 'other_client', 'name_similarity', 'shared', 'detail', 'next_step'],
    htmlColumns: ['status', 'pair', 'client_id', 'other_client_id', 'name_similarity', 'shared'],
    limits: ['Pairs are compared within shared e-mails, phones, addresses and the first letters of the name, so two records that share nothing and are spelled very differently are not compared.', 'Merging moves policies, notes and attachments in your agency system; a person does it there.'],
  },
  refused: [
    { name: 'client_merge', category: 'production_deploy', description: 'It never merges client records.' },
    { name: 'client_delete', category: 'delete_personal_data', description: 'It never deletes a client record.' },
  ],
});
