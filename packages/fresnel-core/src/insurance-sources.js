// Column vocabularies shared by the Fresnel agents, so a policy list, a carrier
// commission statement or a client list reads the same way in every agent.
// Each field lists the header names it is also called. The names were written
// from knowledge of common agency-management exports (Applied Epic, Vertafore
// AMS360 and Sagitta, HawkSoft, EZLynx, QQCatalyst) and carrier statements;
// none was checked against a live account. An agency can name columns by hand
// in fresnel-sources.json, and `inspect` shows how a file would be read.
import { exportProfile } from './exports.js';
import { str, num, lineOf, isPersonal, statusOf, billTypeOf, transactionOf, policyKey, asPercent } from './insurance.js';

const t = (aliases, extra = {}) => ({ aliases, ...extra });

export const POLICY_FIELDS = Object.freeze({
  policy_number: t(['Policy Number', 'Policy #', 'Policy No', 'Policy', 'Pol #', 'Policy Num', 'Pol Number', 'Policy No.'], { required: true }),
  client: t(['Client Name', 'Insured', 'Insured Name', 'Named Insured', 'Account Name', 'Customer Name', 'Applicant', 'Contact Name', 'Client', 'Customer', 'Policyholder', 'Name']),
  client_id: t(['Client Code', 'Lookup Code', 'Account Lookup Code', 'Customer #', 'Client Number', 'Client ID', 'Customer ID', 'Customer Number', 'Account Code', 'Client #']),
  carrier: t(['Carrier', 'Company', 'Writing Company', 'Insurer', 'Issuing Company', 'Carrier Name', 'Insurance Company', 'Writing Carrier', 'Parent Company']),
  line: t(['Line of Business', 'LOB', 'Policy Type', 'Line Type', 'Coverage', 'Line', 'Type of Business', 'Policy Line', 'Product']),
  effective_date: t(['Effective Date', 'Eff Date', 'Effective', 'Policy Effective Date', 'Inception Date', 'Term Effective', 'Eff'], { type: 'date' }),
  expiration_date: t(['Expiration Date', 'Exp Date', 'Expiration', 'Policy Expiration Date', 'X-Date', 'Xdate', 'Term Expiration', 'Renewal Date', 'Exp'], { type: 'date' }),
  premium: t(['Premium', 'Annualized Premium', 'Annual Premium', 'Written Premium', 'Full Term Premium', 'Estimated Premium', 'Total Premium', 'Policy Premium', 'Term Premium'], { type: 'money' }),
  commission_rate: t(['Commission Rate', 'Comm Rate', 'Commission %', 'Comm %', 'Agency Commission %', 'Commission Percent'], { type: 'number' }),
  commission: t(['Commission', 'Agency Commission', 'Estimated Commission', 'Commission Amount', 'Annualized Commission', 'Revenue'], { type: 'money' }),
  producer: t(['Producer', 'Producer Name', 'Exec', 'Account Executive', 'Agent', 'Producer 1', 'Primary Producer', 'Sales Executive']),
  csr: t(['CSR', 'Rep', 'Account Manager', 'Service Rep', 'Customer Service Rep', 'Servicer', 'CSR Name']),
  status: t(['Status', 'Policy Status', 'Current Status']),
  bill_type: t(['Bill Type', 'Billing Method', 'Bill Method', 'Billing Type', 'Agency/Direct', 'Bill Plan']),
  business_type: t(['New/Renewal', 'New or Renewal', 'NB/RN', 'Business Type', 'New Business/Renewal']),
  segment: t(['Department', 'Division', 'Personal/Commercial', 'Book', 'Line Group', 'PL/CL'], { translate: false }),
  state: t(['State', 'Policy State', 'Risk State', 'Base State', 'Garaging State']),
  cancel_date: t(['Cancel Date', 'Cancellation Date', 'Cancelled Date', 'Cancellation Effective Date', 'Cancel Effective Date'], { type: 'date' }),
  cancel_reason: t(['Cancel Reason', 'Cancellation Reason', 'Lost Reason', 'Reason Lost'], { translate: false }),
});

/** Named agency-system policy exports (see exports.js). Written from knowledge of the exports; none checked. */
export const POLICY_PROFILES = Object.freeze([
  exportProfile('applied_epic_policies', { policy_number: 'Policy Number', client: 'Account Name', client_id: 'Lookup Code', line: ['Line Type', 'Policy Type'], carrier: ['Issuing Company', 'Company'], effective_date: ['Effective Date', 'Policy Effective'], expiration_date: ['Expiration Date', 'Policy Expiration'], premium: ['Annualized Premium', 'Estimated Premium'], commission: ['Annualized Commission', 'Estimated Commission'], producer: ['Producer', 'Account Executive'], csr: ['Account Manager', 'CSR'], status: ['Policy Status', 'Status'] }),
  exportProfile('ams360_policies', { policy_number: 'Policy #', client: 'Customer Name', client_id: 'Customer #', line: ['Line of Business', 'LOB', 'Policy Type'], carrier: ['Writing Company', 'Company'], effective_date: ['Eff Date', 'Effective Date'], expiration_date: ['Exp Date', 'Expiration Date'], premium: ['Full Term Premium', 'Premium'], producer: 'Exec', csr: 'Rep', status: ['Policy Status', 'Status'], bill_type: ['Bill Method', 'Billing Method'] }),
  exportProfile('sagitta_policies', { policy_number: 'Policy Number', client: 'Client Name', client_id: 'Client Code', line: 'Coverage', carrier: 'Insurer', effective_date: ['Eff Date', 'Effective Date'], expiration_date: ['Exp Date', 'Expiration Date'], premium: ['Annual Premium', 'Premium'], producer: ['Producer', 'Producer 1'], csr: ['Servicer', 'CSR'] }),
  exportProfile('hawksoft_policies', { policy_number: 'Policy Number', client: 'Client Name', client_id: 'Client Number', line: 'Line of Business', carrier: 'Carrier', effective_date: 'Effective Date', expiration_date: 'Expiration Date', premium: 'Premium', producer: 'Producer', csr: 'CSR', status: 'Policy Status' }),
  exportProfile('ezlynx_policies', { policy_number: 'Policy Number', client: 'Applicant', line: 'Line of Business', carrier: 'Carrier', effective_date: 'Effective Date', expiration_date: 'Expiration Date', premium: 'Premium', producer: ['Producer', 'Agent'], csr: ['CSR', 'Account Manager'], status: 'Policy Status' }),
  exportProfile('qqcatalyst_policies', { policy_number: 'Policy Number', client: 'Contact Name', line: 'Line of Business', carrier: 'Carrier', effective_date: 'Effective Date', expiration_date: 'Expiration Date', premium: ['Premium', 'Written Premium'], producer: ['Agent', 'Producer'], csr: ['CSR', 'Servicer'], status: 'Status' }),
]);

export const COMMISSION_FIELDS = Object.freeze({
  policy_number: t(['Policy Number', 'Policy #', 'Policy No', 'Policy', 'Pol #', 'Policy Num'], { required: true }),
  client: t(['Insured Name', 'Insured', 'Named Insured', 'Client Name', 'Customer Name', 'Name', 'Policyholder']),
  carrier: t(['Carrier', 'Company', 'Insurer', 'Writing Company', 'Carrier Name']),
  line: t(['Line of Business', 'LOB', 'Policy Type', 'Line', 'Coverage', 'Product']),
  transaction_type: t(['Transaction Type', 'Trans Type', 'Transaction', 'Type', 'Activity', 'Trans Code', 'Transaction Code']),
  effective_date: t(['Effective Date', 'Eff Date', 'Transaction Effective Date', 'Trans Eff Date', 'Policy Effective Date'], { type: 'date' }),
  statement_date: t(['Statement Date', 'Process Date', 'Accounting Date', 'Transaction Date', 'Posted Date', 'Period', 'Statement Period', 'Pay Date'], { type: 'date' }),
  premium: t(['Premium', 'Written Premium', 'Gross Premium', 'Transaction Premium', 'Premium Amount', 'Premium Basis'], { type: 'money' }),
  commission_rate: t(['Commission Rate', 'Comm Rate', 'Rate', 'Comm %', 'Commission %', 'Comm Pct'], { type: 'number' }),
  commission: t(['Commission', 'Commission Amount', 'Comm Amount', 'Agency Commission', 'Commission Paid', 'Net Commission', 'Comm Amt'], { type: 'money', required: true }),
  statement_id: t(['Statement Number', 'Statement #', 'Statement ID', 'Statement', 'Statement No'], { translate: false }),
  producer: t(['Producer', 'Agent', 'Producer Code', 'Sub Producer']),
});
export const COMMISSION_PROFILES = Object.freeze([
  exportProfile('carrier_commission_statement', { policy_number: 'Policy Number', client: 'Insured Name', commission_rate: 'Commission Rate', commission: 'Commission Amount', premium: ['Premium', 'Written Premium'], transaction_type: ['Transaction Type', 'Trans Type'], effective_date: ['Effective Date', 'Eff Date'], statement_date: ['Statement Date', 'Process Date'] }),
  exportProfile('courtage_abrechnung_de', { policy_number: 'Vertragsnummer', client: 'Versicherungsnehmer', commission_rate: 'Courtagesatz', commission: 'Courtage', premium: ['Beitrag', 'Nettobeitrag'], transaction_type: ['Buchungsart', 'Vorgangsart'], effective_date: ['Beginn', 'Wirksam ab'], statement_date: ['Abrechnungsdatum', 'Buchungsdatum'], carrier: ['Versicherer', 'Gesellschaft'], line: ['Sparte'] }),
]);

/**
 * Normalise a policy row read with POLICY_FIELDS: adds policy_key, line_code,
 * personal (true/false/null), status_code, bill, kind (new/renewal) and numbers.
 * The original values stay on the row.
 */
export function normPolicy(r, { lineAliases = {} } = {}) {
  const line_code = lineOf(r.line, lineAliases);
  const bt = str(r.business_type).toLowerCase();
  return {
    ...r,
    policy_number: str(r.policy_number),
    policy_key: policyKey(r.policy_number),
    client: str(r.client),
    carrier: str(r.carrier),
    line_code,
    personal: isPersonal(line_code, r.segment),
    status_code: r.status === undefined || r.status === '' ? 'unknown' : statusOf(r.status),
    bill: billTypeOf(r.bill_type),
    kind: /^(n|nb|new)/.test(bt) ? 'new' : /^(r|rn|ren)/.test(bt) ? 'renewal' : null,
    premium: num(r.premium),
    commission: num(r.commission),
    commission_rate: asPercent(r.commission_rate),
    producer: str(r.producer),
    csr: str(r.csr),
  };
}

/** Normalise a commission statement line read with COMMISSION_FIELDS. */
export function normStatementLine(r) {
  return { ...r, policy_number: str(r.policy_number), policy_key: policyKey(r.policy_number), client: str(r.client), carrier: str(r.carrier), tx: transactionOf(r.transaction_type), premium: num(r.premium), commission: num(r.commission), commission_rate: asPercent(r.commission_rate) };
}
