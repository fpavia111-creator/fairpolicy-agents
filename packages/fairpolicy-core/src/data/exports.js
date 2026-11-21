// Catalogue of export files from real systems that the Fairpolicy agents recognise.
// ACORD AL3 download files are not parsed; agents read the download or suspense log your system exports.
//
// Each entry says how to recognise the file (column names that must be there).
// An agent turns an entry into a profile by adding its own column map:
//
//   exportProfile('slack_members', { user: 'fullname', email: 'email' })
//
// basis:
//   'documented'  the column names were checked against the vendor's own
//                 documentation (source and date given);
//   'recalled'    the layout was written from knowledge of the export and was
//                 not checked against documentation or a live account.
// Neither kind was tested against a live account. When a header differs, the
// file still maps by each column's "also called" list, `inspect` shows what was
// matched, and fairpolicy-sources.json names the columns by hand.

const e = (id, system, label, signature, extra = {}) => Object.freeze({ id, system, label, signature, basis: 'recalled', ...extra });

export const EXPORTS = Object.freeze(Object.fromEntries([
  // Agency management systems: book of business, policy and expiration lists (column names as recalled)
  e('applied_epic_policies', 'Applied Epic', 'Policy list report exported to Excel or CSV', ['Lookup Code', 'Account Name', 'Policy Number', 'Line Type'], { note: 'Applied Epic list reports let each agency choose its columns; the names here are common defaults, not a fixed layout.' }),
  e('applied_epic_transactions', 'Applied Epic', 'Transaction or receivables detail export (CSV)', ['Lookup Code', 'Item Number', 'Transaction Code', 'Balance']),
  e('ams360_policies', 'Vertafore AMS360', 'Policy or expiration list exported to CSV', ['Customer #', 'Customer Name', 'Policy #', 'Exec', 'Rep'], { note: 'AMS360 calls the producer "Exec" and the service person "Rep".' }),
  e('ams360_invoices', 'Vertafore AMS360', 'Agency bill invoice / receivables report (CSV)', ['Customer #', 'Invoice #', 'Policy #', 'Due Date', 'Balance Due']),
  e('sagitta_policies', 'Vertafore Sagitta', 'Policy list report (CSV)', ['Client Code', 'Client Name', 'Policy Number', 'Coverage', 'Insurer']),
  e('hawksoft_policies', 'HawkSoft', 'Client/policy export (CSV)', ['Client Number', 'Client Name', 'Policy Number', 'Line of Business', 'Carrier', 'Policy Status']),
  e('ezlynx_policies', 'EZLynx', 'Policy report export (CSV)', ['Applicant', 'Policy Number', 'Line of Business', 'Carrier', 'Policy Status']),
  e('qqcatalyst_policies', 'QQCatalyst', 'Policy list export (CSV)', ['Contact Name', 'Policy Number', 'Line of Business', 'Carrier', 'Effective Date', 'Expiration Date']),
  // Carrier statements and downloads
  e('carrier_commission_statement', 'Carrier commission statement', 'Direct bill commission statement saved as CSV (or PDF text pasted into CSV)', ['Policy Number', 'Insured Name', 'Commission Rate', 'Commission Amount'], { note: 'Each carrier lays its statement out differently; this is the common shape. Map a carrier\'s own columns in fairpolicy-sources.json.' }),
  e('ivans_download_log', 'IVANS / AMS download log', 'Download activity or suspense report exported to CSV', ['Carrier', 'Policy Number', 'Download Date', 'Download Status']),
  // A German broker's commission statement (Courtageabrechnung), for agencies outside the US
  e('courtage_abrechnung_de', 'Maklerabrechnung (DE)', 'Courtageabrechnung eines Versicherers (CSV)', ['Vertragsnummer', 'Versicherungsnehmer', 'Courtagesatz', 'Courtage'], { note: 'German labels, dates day-first, comma decimals.' }),
].map((x) => [x.id, x])));

export const EXPORTS_BASIS_NOTE = 'Every layout here was written from knowledge of the export ("recalled") and was not checked against vendor documentation or a live account. Agency systems let each agency choose report columns, so the first setup confirms them with inspect.';
