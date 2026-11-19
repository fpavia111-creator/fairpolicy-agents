import { fairpolicyAgent, exportProfile, AS_OF_ARG, asOf } from 'fairpolicy-core';
import { readFileSync } from 'node:fs';
import { checkDownloads, summaryLine, STATUSES } from './logic.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const LOG_FIELDS = {
  download_id: { aliases: ['Download ID', 'Transaction ID', 'ID', 'Sequence'], translate: false },
  date: { type: 'date', aliases: ['Download Date', 'Date', 'Received Date', 'Processed Date'], required: true },
  carrier: { aliases: ['Carrier', 'Company', 'Carrier Name'], required: true },
  policy_number: { aliases: ['Policy Number', 'Policy #', 'Policy'] },
  transaction_type: { aliases: ['Transaction Type', 'Trans Type', 'Transaction', 'Type'] },
  status: { aliases: ['Download Status', 'Status', 'Result'], required: true },
  message: { aliases: ['Message', 'Error', 'Error Message', 'Reason', 'Description'], translate: false },
};
const PROFILES = [exportProfile('ivans_download_log', { carrier: 'Carrier', policy_number: 'Policy Number', date: 'Download Date', status: 'Download Status' })];
const files = { log: { type: 'string', description: 'Download activity or suspense report from your agency system or download service: date, carrier, policy, transaction, status, message' } };
const args = { as_of: AS_OF_ARG, unmatched_days: { type: 'integer', minimum: 0, maximum: 60, description: 'Unmatched transactions older than this are flagged (default 3)' }, stale_days: { type: 'integer', minimum: 1, maximum: 90, description: 'A carrier with no successful download for longer than this is flagged (default 7)' } };
const run = (a, ctx) => checkDownloads(ctx.records(a.log, 'log'), { asOf: asOf(a), unmatchedDays: a.unmatched_days ?? 3, staleDays: a.stale_days ?? 7 });

export const manifest = fairpolicyAgent({
  name: 'fairpolicy-download-errors', version: pkg.version, prefix: 'downloads', key: 'ref', keyKind: 'ref', noun: 'item',
  role: 'an agency operations or download administrator',
  description: 'Reads your carrier download log: transactions that failed, transactions sitting unmatched in suspense for more than a few days, and carriers with no successful download for a week, so changes from carriers are not lost. It reads the log only; it never re-runs a download or edits a policy.',
  files, args, required: ['log'], statuses: STATUSES,
  sources: { log: { label: 'Download log', args: ['log'], fields: LOG_FIELDS, profiles: PROFILES } },
  run, summary: summaryLine,
  check: { title: 'Check carrier downloads', description: 'Each failed or unmatched transaction and each carrier\'s last successful download, with a status (download_error, unmatched_old, carrier_stale, unmatched_new, ok).' },
  report: {
    base: 'download-errors', titleShort: 'Write the download worklist',
    title: { en: 'Carrier download errors', de: 'Fehler beim Datenabruf der Versicherer', fr: 'Erreurs de téléchargement assureurs', es: 'Errores de descarga de aseguradoras', pt: 'Erros de download das seguradoras', it: 'Errori di download dalle compagnie', ja: '保険会社ダウンロードのエラー', zh: '保险公司下载错误', ko: '보험사 다운로드 오류' },
    columns: ['status', 'ref', 'carrier', 'policy_number', 'transaction_type', 'date', 'days', 'message', 'detail', 'next_step'],
    htmlColumns: ['status', 'ref', 'carrier', 'policy_number', 'transaction_type', 'date', 'days', 'message'],
    limits: ['The agent reads the log you export; ACORD AL3 files themselves are not parsed. A carrier that sends nothing at all does not appear in the log, so keep a list of carriers you expect.'],
  },
  refused: [
    { name: 'download_rerun', category: 'production_deploy', description: 'It never re-runs or requests a download.' },
    { name: 'ams_update_policy', category: 'production_deploy', description: 'It never matches, posts or edits anything in your agency system.' },
  ],
});
