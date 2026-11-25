// Accuracy specs, one per agent, read by scripts/accuracy.mjs.
//   args      the demo's check arguments (files are in the agent's fixtures/ folder)
//   ok        statuses that are not findings: on time, waiting inside its time, done or matching
//   planted   [key, status] pairs: the problems each fixtures/README.md lists (a key can appear twice)
//   id        fields joined with '+' when the agent's own key is not unique enough (default: the explain key)
//   clean     edits that remove every planted problem and change nothing else; scripts/accuracy.mjs --write
//             writes the result to fixtures/clean/ and the check must find nothing there
//   mutations one edit to the clean set (one field, one row added or one row dropped) and the finding it must raise
// Edits: ['set', file, where, { column: value }], ['drop', file, where], ['dropLast', file, where],
//        ['add', file, { column: value }], ['json', file, [path...], value] (value undefined deletes).
// Everything here is fictional, like the fixtures.

const AS_OF = '2026-11-18';

// A valid VIN check digit (position 9) for a fictional VIN that starts with 0, as in the fixtures.
const VAL = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const WEIGHT = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
export function vin(s16) {
  const v = s16.slice(0, 8) + '0' + s16.slice(8);
  const sum = [...v].reduce((t, c, i) => t + (/\d/.test(c) ? Number(c) : VAL[c]) * WEIGHT[i], 0);
  const d = sum % 11 === 10 ? 'X' : String(sum % 11);
  return v.slice(0, 8) + d + v.slice(9);
}

// Book valuation: a clean book needs many accounts of similar size, so the clean set replaces the 14 demo rows
// with 48 fictional one-policy accounts across four carriers.
const CARRIERS = ['Example Mutual', 'Sample Casualty', 'Demo Indemnity', 'Test Fire & Marine'];
const bookRows = Array.from({ length: 48 }, (_, i) => ({
  'Client Name': `Clean Book Client ${String(i + 1).padStart(2, '0')}`, 'Policy Number': `BOP-60${String(i + 1).padStart(2, '0')}`,
  'Line of Business': 'Business Owners', Carrier: CARRIERS[i % 4], 'Effective Date': '06/01/2026', 'Expiration Date': '06/01/2027',
  Premium: '1000.00', 'Commission Rate': '15', Commission: '150.00', Producer: 'Sam Ortiz', 'Policy Status': 'Active',
}));

export const SPECS = {
  'fairpolicy-additional-insureds': {
    args: { requests: 'requests.csv', coverage: 'endorsements.csv', as_of: AS_OF },
    ok: ['awaiting_carrier', 'complete'],
    planted: [['R-3', 'needs_endorsement'], ['R-4', 'endorsement_pending'], ['R-2', 'open_overdue'], ['R-1', 'ready_to_issue']],
    clean: [
      ['set', 'requests.csv', { 'Request ID': 'R-1' }, { 'Completed Date': '11/17/2026' }],
      ['set', 'requests.csv', { 'Request ID': 'R-2' }, { 'Completed Date': '11/03/2026' }],
      ['set', 'endorsements.csv', { 'Policy Number': 'CGL-1901' }, { PNC: 'Y' }],
      ['set', 'requests.csv', { 'Request ID': 'R-3' }, { 'Completed Date': '11/04/2026' }],
      ['set', 'requests.csv', { 'Request ID': 'R-4' }, { 'Endorsement Received': '11/05/2026', 'Completed Date': '11/06/2026' }],
    ],
    mutations: [
      { id: 'blanket AI request still open', op: ['set', 'requests.csv', { 'Request ID': 'R-1' }, { 'Completed Date': '' }], expect: ['R-1', 'ready_to_issue'] },
      { id: 'request open 16 days', op: ['set', 'requests.csv', { 'Request ID': 'R-2' }, { 'Completed Date': '' }], expect: ['R-2', 'open_overdue'] },
      { id: 'endorsement asked 29 days ago', op: ['set', 'requests.csv', { 'Request ID': 'R-5' }, { 'Endorsement Requested': '10/20/2026' }], expect: ['R-5', 'endorsement_pending'] },
    ],
  },

  'fairpolicy-book-valuation': {
    args: { policies: 'book.csv', settings: 'book-settings.json' },
    ok: ['info', 'ok'],
    planted: [['top_carrier_share_pct', 'watch'], ['largest_client_share_pct', 'watch'], ['top_10_clients_share_pct', 'watch'], ['missing_commission_pct', 'watch']],
    clean: [['drop', 'book.csv', {}], ...bookRows.map((r) => ['add', 'book.csv', r])],
    mutations: [
      { id: 'one account pays 20 times the others', op: ['set', 'book.csv', { 'Policy Number': 'BOP-6001' }, { Commission: '3000.00' }], expect: ['largest_client_share_pct', 'watch'] },
    ],
  },

  'fairpolicy-carrier-appointments': {
    args: { appointments: 'appointments.csv', policies: 'policies.csv', as_of: AS_OF },
    ok: ['ok'],
    planted: [['Riley Chen|Example Mutual|TX', 'not_appointed'], ['Sam Ortiz|Demo Indemnity|TX', 'terminated_with_business'], ['Jordan Lee|Sample Casualty|TX', 'pending_with_business'], ['Sam Ortiz|Test Fire & Marine|TX', 'unused']],
    clean: [
      ['add', 'appointments.csv', { Producer: 'Riley Chen', Carrier: 'Example Mutual', State: 'TX', Status: 'Active', 'Effective Date': '07/01/2025' }],
      ['set', 'appointments.csv', { Producer: 'Sam Ortiz', Carrier: 'Demo Indemnity' }, { Status: 'Active', 'Termination Date': '' }],
      ['set', 'appointments.csv', { Producer: 'Jordan Lee', Carrier: 'Sample Casualty' }, { Status: 'Active' }],
      ['drop', 'appointments.csv', { Producer: 'Sam Ortiz', Carrier: 'Test Fire & Marine' }],
    ],
    mutations: [
      { id: 'appointment back to pending', op: ['set', 'appointments.csv', { Producer: 'Jordan Lee', Carrier: 'Example Mutual' }, { Status: 'Pending' }], expect: ['Jordan Lee|Example Mutual|TX', 'pending_with_business'] },
      { id: 'appointment ended before the policy', op: ['set', 'appointments.csv', { Producer: 'Sam Ortiz', Carrier: 'Sample Casualty' }, { Status: 'Terminated', 'Termination Date': '03/31/2026' }], expect: ['Sam Ortiz|Sample Casualty|TX', 'terminated_with_business'] },
    ],
  },

  'fairpolicy-carrier-payables': {
    args: { carrier_statement: 'carrier-account-current.csv', agency_payables: 'agency-payables.csv', as_of: AS_OF },
    ok: ['ok'],
    planted: [['WC-1102', 'amount_differs'], ['CA-1103', 'not_in_agency_system'], ['CGL-1104', 'not_on_carrier_statement'], ['PKG-1105', 'past_due']],
    clean: [
      ['set', 'agency-payables.csv', { 'Policy Number': 'WC-1102' }, { Commission: '900.00', 'Net Due': '8100.00' }],
      ['add', 'agency-payables.csv', { Carrier: 'Sample Casualty', 'Policy Number': 'CA-1103', 'Insured Name': 'Fennimore Optics LLC', 'Transaction Type': 'Endorsement', 'Effective Date': '10/28/2026', 'Gross Premium': '600.00', Commission: '80.00', 'Net Due': '520.00' }],
      ['add', 'carrier-account-current.csv', { Carrier: 'Sample Casualty', 'Policy Number': 'CGL-1104', 'Insured Name': 'Gwendolyn Ashcombe', 'Transaction Type': 'NEW', 'Effective Date': '10/25/2026', 'Gross Premium': '2600.00', Commission: '390.00', 'Net Due': '2210.00', 'Due Date': '12/15/2026' }],
      ['set', 'carrier-account-current.csv', { 'Policy Number': 'PKG-1105' }, { 'Due Date': '12/15/2026' }],
    ],
    mutations: [
      { id: 'agency net 100 lower', op: ['set', 'agency-payables.csv', { 'Policy Number': 'BOP-1101-01' }, { 'Net Due': '3530.00' }], expect: ['BOP-1101', 'amount_differs'] },
      { id: 'due date passed', op: ['set', 'carrier-account-current.csv', { 'Policy Number': 'BOP-1101' }, { 'Due Date': '11/01/2026' }], expect: ['BOP-1101', 'past_due'] },
      { id: 'carrier line the agency never booked', op: ['drop', 'agency-payables.csv', { 'Policy Number': 'WC-1102' }], expect: ['WC-1102', 'not_in_agency_system'] },
    ],
  },

  'fairpolicy-certificate-limits': {
    args: { certificates: 'certificates.csv', coverage: 'coverage.csv' },
    ok: ['ok'],
    planted: [['C-9004/CGL-1804', 'policy_not_in_force'], ['C-9002/CGL-1801', 'limit_overstated'], ['C-9003/CA-1803', 'ai_not_on_policy'], ['C-9001/WC-1802', 'waiver_not_on_policy'], ['C-9005/XS-1805', 'dates_wrong'], ['C-9006/BOP-1899', 'policy_unknown']],
    clean: [
      ['set', 'coverage.csv', { 'Policy Number': 'CGL-1804' }, { Status: 'Active', 'Cancel Date': '' }],
      ['set', 'certificates.csv', { 'Certificate #': 'C-9002' }, { 'Each Occurrence': '1000000' }],
      ['set', 'certificates.csv', { 'Certificate #': 'C-9003' }, { 'Additional Insured': 'N' }],
      ['set', 'certificates.csv', { 'Certificate #': 'C-9001', 'Policy Number': 'WC-1802' }, { 'Waiver of Subrogation': 'N' }],
      ['set', 'certificates.csv', { 'Certificate #': 'C-9005' }, { 'Policy Effective': '04/01/2026', 'Policy Expiration': '04/01/2027' }],
      ['add', 'coverage.csv', { 'Policy Number': 'BOP-1899', Insured: 'Brannock Fence Co', 'Line of Business': 'Business Owners', 'Each Occurrence': '1000000', Aggregate: '2000000', 'Effective Date': '01/01/2026', 'Expiration Date': '01/01/2027', Status: 'Active', 'AI Endorsement': 'No', 'Waiver Endorsement': 'No' }],
    ],
    mutations: [
      { id: 'aggregate overstated', op: ['set', 'certificates.csv', { 'Certificate #': 'C-9001', 'Policy Number': 'CGL-1801' }, { Aggregate: '3000000' }], expect: ['C-9001/CGL-1801', 'limit_overstated'] },
      { id: 'waiver shown on the auto policy', op: ['set', 'certificates.csv', { 'Certificate #': 'C-9003' }, { 'Waiver of Subrogation': 'Y' }], expect: ['C-9003/CA-1803', 'waiver_not_on_policy'] },
      { id: 'expiration date wrong', op: ['set', 'certificates.csv', { 'Certificate #': 'C-9006' }, { 'Policy Expiration': '01/01/2028' }], expect: ['C-9006/BOP-1899', 'dates_wrong'] },
    ],
  },

  'fairpolicy-commercial-renewals': {
    args: { policies: 'policies.csv', milestones: 'milestones.csv', as_of: AS_OF },
    ok: ['on_track', 'complete'],
    planted: [['PKG-1705', 'overdue'], ['BOP-1701', 'overdue'], ['CA-1703', 'due_this_week']],
    clean: [
      ['add', 'milestones.csv', { 'Policy Number': 'PKG-1705', Milestone: 'Loss runs', 'Completed Date': '09/01/2026' }],
      ['add', 'milestones.csv', { 'Policy Number': 'PKG-1705', Milestone: 'Exposures', 'Completed Date': '10/01/2026' }],
      ['add', 'milestones.csv', { 'Policy Number': 'PKG-1705', Milestone: 'Submissions', 'Completed Date': '10/20/2026' }],
      ['add', 'milestones.csv', { 'Policy Number': 'BOP-1701', Milestone: 'Submissions', 'Completed Date': '10/30/2026' }],
      ['add', 'milestones.csv', { 'Policy Number': 'CA-1703', Milestone: 'Exposures', 'Completed Date': '11/15/2026' }],
    ],
    mutations: [
      { id: 'exposures record removed', op: ['drop', 'milestones.csv', { 'Policy Number': 'BOP-1701', Milestone: 'Exposures' }], expect: ['BOP-1701', 'overdue'] },
      { id: 'loss runs record removed', op: ['drop', 'milestones.csv', { 'Policy Number': 'WC-1702' }], expect: ['WC-1702', 'overdue'] },
    ],
  },

  'fairpolicy-commission-chargebacks': {
    args: { policies: 'policies.csv', statements: 'statements.csv', producer_pay: 'producer-pay.csv', as_of: AS_OF },
    ok: ['charged_ok'],
    planted: [['HO-3002', 'overcharged'], ['HO-3999', 'chargeback_without_cancel'], ['PA-3004', 'producer_not_reversed'], ['BOP-3003', 'pending_chargeback']],
    clean: [
      ['set', 'statements.csv', { 'Policy Number': 'HO-3002' }, { Premium: '-1190.14', 'Commission Amount': '-178.52' }],
      ['set', 'producer-pay.csv', { 'Policy Number': 'HO-3002', Type: 'Chargeback' }, { Amount: '-44.63' }],
      ['drop', 'statements.csv', { 'Policy Number': 'HO-3999' }],
      ['add', 'producer-pay.csv', { Producer: 'Jordan Lee', 'Policy Number': 'PA-3004', Amount: '-27.00', Type: 'Chargeback' }],
      ['add', 'statements.csv', { 'Statement #': 'S-1015', Carrier: 'Sample Casualty', 'Policy Number': 'BOP-3003', 'Insured Name': 'Somerby Tile Works LLC', 'Transaction Type': 'CAN', 'Effective Date': '10/15/2026', Premium: '-1493.15', 'Commission Rate': '17.5', 'Commission Amount': '-261.30' }],
    ],
    mutations: [
      { id: 'carrier takes back too much', op: ['set', 'statements.csv', { 'Policy Number': 'PA-3001' }, { 'Commission Amount': '-120.00' }], expect: ['PA-3001', 'overcharged'] },
      { id: 'producer chargeback removed', op: ['drop', 'producer-pay.csv', { 'Policy Number': 'PA-3001', Type: 'Chargeback' }], expect: ['PA-3001', 'producer_not_reversed'] },
    ],
  },

  'fairpolicy-commission-statements': {
    args: { statement: 'statement-2026-10.csv', policies: 'policies.csv', schedule: 'schedule.json' },
    ok: ['ok'],
    planted: [['PA-5521800', 'underpaid'], ['WC-88120', 'underpaid'], ['UMB-9002', 'overpaid'], ['HO-7730288', 'possible_duplicate'], ['HO-7730288', 'possible_duplicate'], ['PA-5599999', 'no_policy'], ['CA-20441', 'no_rate'], ['WC-88120', 'not_checked']],
    clean: [
      ['set', 'statement-2026-10.csv', { 'Policy Number': 'PA-5521800' }, { 'Commission Rate': '15.0', 'Commission Amount': '276.00' }],
      ['set', 'statement-2026-10.csv', { 'Policy Number': 'WC-88120', 'Transaction Type': 'NEW' }, { 'Commission Rate': '10.0', 'Commission Amount': '1260.00' }],
      ['set', 'statement-2026-10.csv', { 'Policy Number': 'WC-88120', 'Transaction Type': 'AUDIT' }, { Premium: '960.00', 'Commission Rate': '10.0' }],
      ['set', 'statement-2026-10.csv', { 'Policy Number': 'UMB-9002' }, { 'Commission Rate': '15.0', 'Commission Amount': '61.50' }],
      ['dropLast', 'statement-2026-10.csv', { 'Policy Number': 'HO-7730288' }],
      ['drop', 'statement-2026-10.csv', { 'Policy Number': 'PA-5599999' }],
      ['json', 'schedule.json', ['rates', 8], { carrier: 'Test Fire & Marine', rate: 12 }],
    ],
    mutations: [
      { id: 'renewal paid short', op: ['set', 'statement-2026-10.csv', { 'Policy Number': 'HO-7730141' }, { 'Commission Amount': '300.00' }], expect: ['HO-7730141', 'underpaid'] },
      { id: 'renewal paid over', op: ['set', 'statement-2026-10.csv', { 'Policy Number': 'BOP104455' }, { 'Commission Amount': '900.00' }], expect: ['BOP104455', 'overpaid'] },
      { id: 'policy not in the list', op: ['set', 'statement-2026-10.csv', { 'Policy Number': 'CA-20441' }, { 'Policy Number': 'CA-20999' }], expect: ['CA-20999', 'no_policy'] },
    ],
  },

  'fairpolicy-contingency-bonus': {
    args: { experience: 'experience.csv', grid: 'grid.json', year: 2026 },
    ok: ['qualifies'],
    planted: [['Placeholder Specialty', 'received_less'], ['Sample Casualty', 'loss_ratio_too_high'], ['Example Mutual', 'close_to_next'], ['Demo Indemnity', 'below_minimum'], ['Test Fire & Marine', 'no_grid']],
    clean: [
      ['json', 'grid.json', ['carriers', 3, 'received'], 6600],
      ['set', 'experience.csv', { Carrier: 'Sample Casualty', Year: '2026' }, { 'Written Premium': '480000', 'Incurred Losses': '250000' }],
      ['set', 'experience.csv', { Carrier: 'Example Mutual', Year: '2026' }, { 'Written Premium': '1000000' }],
      ['set', 'experience.csv', { Carrier: 'Demo Indemnity', Year: '2026' }, { 'Written Premium': '300000' }],
      ['json', 'grid.json', ['carriers', 5], { carrier: 'Test Fire & Marine', tiers: [{ name: 'Base', min_premium: 100000, max_loss_ratio: 50, min_growth_pct: 0, bonus_pct: 1 }] }],
    ],
    mutations: [
      { id: 'surety losses double', op: ['set', 'experience.csv', { Carrier: 'Sample Surety', Year: '2026' }, { 'Incurred Losses': '50000' }], expect: ['Sample Surety', 'loss_ratio_too_high'] },
      { id: 'written falls under the minimum', op: ['set', 'experience.csv', { Carrier: 'Demo Indemnity', Year: '2026' }, { 'Written Premium': '200000' }], expect: ['Demo Indemnity', 'below_minimum'] },
      { id: 'bonus received short', op: ['json', 'grid.json', ['carriers', 4, 'received'], 1000], expect: ['Sample Surety', 'received_less'] },
    ],
  },

  'fairpolicy-cross-sell': {
    args: { policies: 'policies.csv' },
    ok: ['rounded'],
    planted: [['Rowena Castellane', 'monoline'], ['Imelda Fawkner', 'monoline'], ['Castellane Ceramics LLC', 'monoline'], ['Desmond Achterberg', 'gaps'], ['Vantongeren Freight Inc', 'gaps']],
    clean: [
      ...[['Rowena Castellane', 'HO-1416', 'Homeowners', '2400.00'], ['Rowena Castellane', 'UMB-1417', 'Personal Umbrella', '450.00'], ['Imelda Fawkner', 'PA-1418', 'Personal Auto', '1500.00'], ['Imelda Fawkner', 'UMB-1419', 'Personal Umbrella', '420.00'], ['Desmond Achterberg', 'UMB-1422', 'Personal Umbrella', '460.00']]
        .map(([c, p, l, prem]) => ['add', 'policies.csv', { Applicant: c, 'Policy Number': p, 'Line of Business': l, Carrier: 'Example Mutual', 'Policy Status': 'Active', 'Effective Date': '03/01/2026', 'Expiration Date': '03/01/2027', Premium: prem, Producer: 'Jordan Lee', CSR: 'Casey Park' }]),
      ...[['Castellane Ceramics LLC', 'WC-1420', 'Workers Compensation', 'Sample Casualty', '5200.00'], ['Castellane Ceramics LLC', 'XS-1421', 'Commercial Umbrella', 'Demo Indemnity', '1100.00'], ['Vantongeren Freight Inc', 'XS-1423', 'Commercial Umbrella', 'Demo Indemnity', '3900.00']]
        .map(([c, p, l, car, prem]) => ['add', 'policies.csv', { Applicant: c, 'Policy Number': p, 'Line of Business': l, Carrier: car, 'Policy Status': 'Active', 'Effective Date': '06/01/2026', 'Expiration Date': '06/01/2027', Premium: prem, Producer: 'Sam Ortiz', CSR: 'Drew Kim' }]),
    ],
    mutations: [
      { id: 'umbrella cancelled', op: ['set', 'policies.csv', { 'Policy Number': 'UMB-1407' }, { 'Policy Status': 'Cancelled' }], expect: ['Aurelio Vantongeren', 'gaps'] },
      { id: 'workers comp dropped', op: ['drop', 'policies.csv', { 'Policy Number': 'WC-1413' }], expect: ['Achterberg Bakery LLC', 'gaps'] },
    ],
  },

  'fairpolicy-data-quality': {
    args: { policies: 'policies.csv', vehicles: 'vehicles.csv' },
    ok: ['clean'],
    planted: [['CGL-2605', 'critical'], ['WC-2607', 'critical'], ['PA-2602', 'vehicle_data'], ['PA-2603', 'vehicle_data'], ['HO-2604', 'contact_data'], ['BOP-2606', 'staff_data']],
    clean: [
      ['set', 'policies.csv', { 'Policy Number': 'CGL-2605' }, { 'Expiration Date': '10/01/2027', Phone: '555-0101' }],
      ['set', 'policies.csv', { 'Policy Number': 'WC-2607' }, { Premium: '9100.00', Phone: '555-0102' }],
      ['set', 'vehicles.csv', { 'Policy Number': 'PA-2602' }, { VIN: vin('0EXAM7802D000404') }],
      ['set', 'vehicles.csv', { 'Policy Number': 'PA-2603' }, { VIN: vin('0EXAM5602C000303') }],
      ['set', 'policies.csv', { 'Policy Number': 'HO-2604' }, { 'Zip Code': '78211', Phone: '555-0103' }],
      ['set', 'policies.csv', { 'Policy Number': 'BOP-2606' }, { Producer: 'Sam Ortiz', Phone: '555-0102' }],
    ],
    mutations: [
      { id: 'premium missing', op: ['set', 'policies.csv', { 'Policy Number': 'PA-2601' }, { Premium: '' }], expect: ['PA-2601', 'critical'] },
      { id: 'producer missing', op: ['set', 'policies.csv', { 'Policy Number': 'HO-2608' }, { Producer: '' }], expect: ['HO-2608', 'staff_data'] },
      { id: 'one VIN character changed', op: ['set', 'vehicles.csv', { VIN: '0EXAM1203A0001011' }, { VIN: '0EXAM1203A0001012' }], expect: ['PA-2601', 'vehicle_data'] },
    ],
  },

  'fairpolicy-direct-agency-bill': {
    args: { policies: 'policies.csv', statements: 'direct-bill-statement.csv', invoices: 'agency-invoices.csv' },
    ok: ['ok'],
    planted: [['CGL-8005', 'double_billed'], ['BOP-8003', 'coded_agency_paid_direct'], ['WC-8004', 'coded_direct_invoiced'], ['UMB-8006', 'bill_type_missing']],
    clean: [
      ['drop', 'direct-bill-statement.csv', { 'Policy Number': 'CGL-8005' }],
      ['set', 'policies.csv', { 'Policy #': 'BOP-8003' }, { 'Bill Method': 'Direct Bill' }],
      ['drop', 'agency-invoices.csv', { 'Policy Number': 'WC-8004' }],
      ['set', 'policies.csv', { 'Policy #': 'UMB-8006' }, { 'Bill Method': 'Direct Bill' }],
    ],
    mutations: [
      { id: 'direct-bill policy coded agency bill', op: ['set', 'policies.csv', { 'Policy #': 'PA-8001' }, { 'Bill Method': 'Agency Bill' }], expect: ['PA-8001', 'coded_agency_paid_direct'] },
      { id: 'bill type blank', op: ['set', 'policies.csv', { 'Policy #': 'CA-8007' }, { 'Bill Method': '' }], expect: ['CA-8007', 'bill_type_missing'] },
    ],
  },

  'fairpolicy-carrier-feed-errors': {
    args: { log: 'download-log.csv', as_of: AS_OF },
    ok: ['ok', 'unmatched_new'],
    planted: [['DL-4', 'download_error'], ['DL-2', 'unmatched_old'], ['carrier:Demo Indemnity', 'carrier_stale']],
    clean: [
      ['set', 'download-log.csv', { 'Download ID': 'DL-4' }, { 'Download Status': 'Posted', Message: '' }],
      ['set', 'download-log.csv', { 'Download ID': 'DL-2' }, { 'Download Status': 'Posted', Message: '' }],
      ['set', 'download-log.csv', { 'Download ID': 'DL-3' }, { 'Download Status': 'Posted', Message: '' }],
      ['set', 'download-log.csv', { 'Download ID': 'DL-6' }, { 'Download Date': '11/16/2026' }],
    ],
    mutations: [
      { id: 'download failed', op: ['set', 'download-log.csv', { 'Download ID': 'DL-5' }, { 'Download Status': 'Error' }], expect: ['DL-5', 'download_error'] },
      { id: 'carrier quiet 13 days', op: ['set', 'download-log.csv', { 'Download ID': 'DL-7' }, { 'Download Date': '11/05/2026' }], expect: ['carrier:Test Fire & Marine', 'carrier_stale'] },
      { id: 'unmatched for 8 days', op: ['set', 'download-log.csv', { 'Download ID': 'DL-1' }, { 'Download Date': '11/10/2026', 'Download Status': 'Unmatched' }], expect: ['DL-1', 'unmatched_old'] },
    ],
  },

  'fairpolicy-duplicate-clients': {
    args: { clients: 'clients.csv' },
    id: ['client_id', 'other_client_id'],
    ok: [],
    planted: [['C3001+C3002', 'exact_duplicate'], ['C3003+C3004', 'likely_duplicate'], ['C3006+C3007', 'possible_duplicate'], ['C3006+C3008', 'same_household']],
    clean: [
      ['drop', 'clients.csv', { 'Customer #': 'C3002' }],
      ['drop', 'clients.csv', { 'Customer #': 'C3004' }],
      ['drop', 'clients.csv', { 'Customer #': 'C3007' }],
      ['set', 'clients.csv', { 'Customer #': 'C3008' }, { Address: '26 Demo Ct' }],
    ],
    mutations: [
      { id: 'same name, nothing else shared', op: ['set', 'clients.csv', { 'Customer #': 'C3010' }, { 'Customer Name': 'Rosalind Pyke' }], expect: ['C3005+C3010', 'possible_duplicate'] },
      { id: 'same name and ZIP', op: ['set', 'clients.csv', { 'Customer #': 'C3010' }, { 'Customer Name': 'Rosalind Pyke', 'Zip Code': '78214' }], expect: ['C3005+C3010', 'likely_duplicate'] },
      { id: 'same e-mail, different names', op: ['set', 'clients.csv', { 'Customer #': 'C3010' }, { Email: 'rp@example.test' }], expect: ['C3005+C3010', 'same_household'] },
      { id: 'same address', op: ['set', 'clients.csv', { 'Customer #': 'C3010' }, { Address: '30 Lantern Way', 'Zip Code': '78214' }], expect: ['C3005+C3010', 'same_household'] },
    ],
  },

  'fairpolicy-lapsed-policies': {
    args: { policies: 'policies.csv', as_of: AS_OF },
    ok: ['replaced'],
    planted: [['PA-1301', 'reinstatement_window'], ['HO-1302', 'not_replaced'], ['BOP-1304', 'not_replaced'], ['WC-1305', 'expired_no_renewal_record']],
    clean: [
      ['set', 'policies.csv', { 'Policy Number': 'PA-1301' }, { 'Policy Status': 'Active', 'Cancel Date': '', 'Cancel Reason': '' }],
      ['set', 'policies.csv', { 'Policy Number': 'HO-1302' }, { 'Policy Status': 'Active', 'Cancel Date': '', 'Cancel Reason': '' }],
      ['add', 'policies.csv', { 'Client Number': '1304', 'Client Name': 'Iredale Joinery LLC', 'Policy Number': 'BOP-1304', 'Line of Business': 'Business Owners', Carrier: 'Sample Casualty', 'Effective Date': '10/15/2026', 'Expiration Date': '10/15/2027', Premium: '4850.00', Producer: 'Sam Ortiz', CSR: 'Drew Kim', 'Policy Status': 'Active' }],
      ['add', 'policies.csv', { 'Client Number': '1305', 'Client Name': 'Strachan Logistics Inc', 'Policy Number': 'WC-1305', 'Line of Business': 'Workers Compensation', Carrier: 'Sample Casualty', 'Effective Date': '10/31/2026', 'Expiration Date': '10/31/2027', Premium: '9100.00', Producer: 'Sam Ortiz', CSR: 'Drew Kim', 'Policy Status': 'Active' }],
    ],
    mutations: [
      { id: 'replacement written for another line', op: ['set', 'policies.csv', { 'Policy Number': 'PA-1309' }, { 'Line of Business': 'Homeowners' }], expect: ['PA-1303', 'not_replaced'] },
      { id: 'renewal term missing', op: ['drop', 'policies.csv', { 'Policy Number': 'CGL-1306', 'Effective Date': '09/30/2026' }], expect: ['CGL-1306', 'expired_no_renewal_record'] },
      { id: 'cancelled for non-payment 8 days ago', op: ['set', 'policies.csv', { 'Policy Number': 'PA-1309' }, { 'Policy Status': 'Cancelled', 'Cancel Date': '11/10/2026', 'Cancel Reason': 'Non-Pay' }], expect: ['PA-1309', 'reinstatement_window'] },
    ],
  },

  'fairpolicy-license-renewals': {
    args: { licenses: 'licenses.csv', states: 'state-settings.json', as_of: AS_OF },
    ok: ['current'],
    planted: [['OK-55102', 'expired'], ['TX-90001', 'ce_short'], ['TX-90002', 'renewal_due'], ['LA-31003', 'no_state_rule']],
    clean: [
      ['set', 'licenses.csv', { 'License Number': 'OK-55102' }, { 'Expiration Date': '10/31/2028', 'CE Hours': '24', 'Ethics Hours': '3' }],
      ['set', 'licenses.csv', { 'License Number': 'TX-90001' }, { 'Expiration Date': '01/10/2028' }],
      ['set', 'licenses.csv', { 'License Number': 'TX-90002' }, { 'Expiration Date': '01/05/2028' }],
      ['json', 'state-settings.json', ['states', 'LA'], { ce_hours: 24, ethics_hours: 3, period_months: 24, confirmed_by: 'Example Agency office manager (fictional)', confirmed_on: '2026-11-01' }],
    ],
    mutations: [
      { id: 'licence expired', op: ['set', 'licenses.csv', { 'License Number': 'TX-90003' }, { 'Expiration Date': '11/01/2026' }], expect: ['TX-90003', 'expired'] },
      { id: 'hours short close to renewal', op: ['set', 'licenses.csv', { 'License Number': 'FL-77004' }, { 'CE Hours': '20' }], expect: ['FL-77004', 'ce_short'] },
      { id: 'state removed from settings', op: ['json', 'state-settings.json', ['states', 'FL'], undefined], expect: ['FL-77004', 'no_state_rule'] },
    ],
  },

  'fairpolicy-loss-runs': {
    args: { loss_runs: 'loss-runs.csv', premiums: 'premiums.csv' },
    ok: ['normal', 'clean'],
    planted: [['Wexford Plating LLC', 'high_loss_ratio'], ['Penrose Florist LLC', 'large_loss'], ['Ruskin Mill Apartments LLC', 'frequency']],
    clean: [
      ['drop', 'loss-runs.csv', { 'Claim Number': 'LR-1002' }],
      ['set', 'loss-runs.csv', { 'Claim Number': 'LR-1004' }, { Paid: '5000.00', Reserve: '2000.00' }],
      ['set', 'loss-runs.csv', { 'Claim Number': 'LR-1012' }, { Paid: '8000.00', Reserve: '2000.00' }],
      ['drop', 'loss-runs.csv', { 'Claim Number': 'LR-1010' }],
      ['drop', 'loss-runs.csv', { 'Claim Number': 'LR-1011' }],
    ],
    mutations: [
      { id: 'one claim grows to 30,000', op: ['set', 'loss-runs.csv', { 'Claim Number': 'LR-1006' }, { Paid: '30000.00' }], expect: ['Calder Lane Daycare Inc', 'large_loss'] },
      { id: 'a third claim in one year', op: ['add', 'loss-runs.csv', { Insured: 'Ruskin Mill Apartments LLC', 'Policy Number': 'CPP-2205', 'Line of Business': 'Commercial Package', Carrier: 'Sample Casualty', 'Policy Year': '2026', 'Date of Loss': '10/30/2026', 'Claim Number': 'LR-1013', 'Claim Status': 'Open', Paid: '0', Reserve: '1500.00' }], expect: ['Ruskin Mill Apartments LLC', 'frequency'] },
      { id: 'losses over the limit', op: ['set', 'loss-runs.csv', { 'Claim Number': 'LR-1005' }, { Paid: '200000.00' }], expect: ['Wexford Plating LLC', 'high_loss_ratio'] },
    ],
  },

  'fairpolicy-missing-commissions': {
    args: { policies: 'policies.csv', statements: 'statements-2026.csv', as_of: AS_OF },
    ok: ['not_yet_due', 'agency_bill', 'cancelled_flat', 'received'],
    planted: [['BOP-2003', 'missing'], ['HO-2010', 'missing'], ['PA-2002', 'missing'], ['UMB-2008', 'partial']],
    clean: [
      ['add', 'statements-2026.csv', { 'Statement #': 'S-0815', Carrier: 'Example Mutual', 'Policy Number': 'PA-2002', 'Insured Name': 'Bastian Ruehl', 'Transaction Type': 'NEW', 'Effective Date': '07/15/2026', Premium: '1500.00', 'Commission Rate': '15', 'Commission Amount': '225.00' }],
      ['add', 'statements-2026.csv', { 'Statement #': 'S-0915', Carrier: 'Sample Casualty', 'Policy Number': 'BOP-2003', 'Insured Name': 'Fenwright Masonry LLC', 'Transaction Type': 'NEW', 'Effective Date': '09/01/2026', Premium: '5200.00', 'Commission Rate': '17.5', 'Commission Amount': '910.00' }],
      ['add', 'statements-2026.csv', { 'Statement #': 'S-0715', Carrier: 'Example Mutual', 'Policy Number': 'HO-2010', 'Insured Name': 'Oriel Banfield', 'Transaction Type': 'NEW', 'Effective Date': '07/01/2026', Premium: '1600.00', 'Commission Rate': '15', 'Commission Amount': '240.00' }],
      ['add', 'statements-2026.csv', { 'Statement #': 'S-0915', Carrier: 'Example Mutual', 'Policy Number': 'UMB-2008', 'Insured Name': 'Imogen Tallow', 'Transaction Type': 'NEW', 'Effective Date': '09/05/2026', Premium: '450.00', 'Commission Rate': '15', 'Commission Amount': '67.50' }],
    ],
    mutations: [
      { id: 'statement line missing', op: ['drop', 'statements-2026.csv', { 'Policy Number': 'HO-2001' }], expect: ['HO-2001', 'missing'] },
      { id: 'only an endorsement paid', op: ['set', 'statements-2026.csv', { 'Policy Number': 'PA-2002' }, { 'Transaction Type': 'PCH' }], expect: ['PA-2002', 'partial'] },
    ],
  },

  'fairpolicy-open-claims': {
    args: { claims: 'claims.csv', as_of: AS_OF },
    ok: ['active'],
    planted: [['AC-1', 'not_reported'], ['AC-2', 'no_update'], ['AC-3', 'renewal_soon'], ['AC-4', 'open_long']],
    clean: [
      ['set', 'claims.csv', { 'Agency Claim ID': 'AC-1' }, { 'Carrier Claim Number': 'CLM-88006' }],
      ['set', 'claims.csv', { 'Agency Claim ID': 'AC-2' }, { 'Last Activity': '11/16/2026' }],
      ['set', 'claims.csv', { 'Agency Claim ID': 'AC-3' }, { 'Claim Status': 'Closed' }],
      ['set', 'claims.csv', { 'Agency Claim ID': 'AC-4' }, { 'Claim Status': 'Closed' }],
    ],
    mutations: [
      { id: 'no activity for 39 days', op: ['set', 'claims.csv', { 'Agency Claim ID': 'AC-2' }, { 'Last Activity': '10/10/2026' }], expect: ['AC-2', 'no_update'] },
      { id: 'carrier claim number missing', op: ['set', 'claims.csv', { 'Agency Claim ID': 'AC-5' }, { 'Carrier Claim Number': '' }], expect: ['AC-5', 'not_reported'] },
      { id: 'claim reopened before renewal', op: ['set', 'claims.csv', { 'Agency Claim ID': 'AC-3' }, { 'Claim Status': 'Open' }], expect: ['AC-3', 'renewal_soon'] },
    ],
  },

  'fairpolicy-pending-endorsements': {
    args: { changes: 'change-requests.csv', as_of: AS_OF },
    ok: ['waiting', 'done'],
    planted: [['E-1', 'not_submitted'], ['E-2', 'unconfirmed'], ['E-4', 'premium_change_not_billed']],
    clean: [
      ['set', 'change-requests.csv', { 'Request ID': 'E-1' }, { 'Submitted Date': '11/11/2026' }],
      ['set', 'change-requests.csv', { 'Request ID': 'E-2' }, { 'Confirmed Date': '10/28/2026' }],
      ['set', 'change-requests.csv', { 'Request ID': 'E-4' }, { Invoiced: 'INV-9040' }],
    ],
    mutations: [
      { id: 'never sent to the carrier', op: ['set', 'change-requests.csv', { 'Request ID': 'E-3' }, { 'Submitted Date': '' }], expect: ['E-3', 'not_submitted'] },
      { id: 'agency-bill premium change not invoiced', op: ['set', 'change-requests.csv', { 'Request ID': 'E-6' }, { 'Premium Change': '150.00' }], expect: ['E-6', 'premium_change_not_billed'] },
      { id: 'no confirmation after 23 days', op: ['set', 'change-requests.csv', { 'Request ID': 'E-3' }, { 'Submitted Date': '10/26/2026' }], expect: ['E-3', 'unconfirmed'] },
    ],
  },

  'fairpolicy-policy-checking': {
    args: { bound: 'bound.csv', issued: 'issued.csv', as_of: AS_OF },
    ok: ['matches'],
    planted: [['WC-2904', 'not_issued'], ['HO-2901', 'coverage_reduced'], ['PA-2902', 'premium_differs'], ['CGL-2903', 'dates_differ']],
    clean: [
      ['add', 'issued.csv', { 'Policy Number': 'WC-2904', Insured: 'Wexley Ceramics LLC', Carrier: 'Sample Casualty', 'Line of Business': 'Workers Compensation', Coverage: 'Employers Liability', Limit: '1000000', Premium: '8800.00', 'Effective Date': '10/01/2026', 'Expiration Date': '10/01/2027' }],
      ['set', 'issued.csv', { 'Policy Number': 'HO-2901', Coverage: 'Dwelling' }, { Limit: '400000' }],
      ['set', 'issued.csv', { 'Policy Number': 'PA-2902', Coverage: 'Bodily Injury' }, { Premium: '900.00' }],
      ['set', 'issued.csv', { 'Policy Number': 'CGL-2903' }, { 'Effective Date': '10/01/2026', 'Expiration Date': '10/01/2027' }],
    ],
    mutations: [
      { id: 'limit lower on issue', op: ['set', 'issued.csv', { 'Policy Number': 'BOP-2905', Coverage: 'Building' }, { Limit: '200000' }], expect: ['BOP-2905', 'coverage_reduced'] },
      { id: 'premium 100 higher on issue', op: ['set', 'issued.csv', { 'Policy Number': 'BOP-2905', Coverage: 'Business Personal Property' }, { Premium: '1000.00' }], expect: ['BOP-2905', 'premium_differs'] },
      { id: 'coverage left off the issued policy', op: ['drop', 'issued.csv', { 'Policy Number': 'HO-2901', Coverage: 'Personal Liability' }], expect: ['HO-2901', 'coverage_reduced'] },
    ],
  },

  'fairpolicy-premium-finance': {
    args: { agreements: 'finance-agreements.csv', as_of: AS_OF },
    ok: ['due_soon', 'current', 'paid_off'],
    planted: [['PF-9002', 'notice_of_intent'], ['PF-9003', 'past_due'], ['PF-9004', 'not_funded'], ['PF-9005', 'funded_not_remitted']],
    clean: [
      ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9002' }, { 'Next Due Date': '12/01/2026', 'Last Paid Date': '11/01/2026', 'NOIC Date': '', 'Cancel Date': '' }],
      ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9003' }, { 'Next Due Date': '12/05/2026', 'Last Paid Date': '11/05/2026' }],
      ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9004' }, { 'Funded Date': '10/27/2026', 'Funded Amount': '3800.00', 'Remitted To Carrier': '10/29/2026' }],
      ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9005' }, { 'Remitted To Carrier': '11/04/2026' }],
    ],
    mutations: [
      { id: 'installment missed', op: ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9001' }, { 'Next Due Date': '11/10/2026' }], expect: ['PF-9001', 'past_due'] },
      { id: 'funded money not passed on', op: ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9006' }, { 'Remitted To Carrier': '' }], expect: ['PF-9006', 'funded_not_remitted'] },
      { id: 'notice of intent received', op: ['set', 'finance-agreements.csv', { 'Agreement Number': 'PF-9001' }, { 'NOIC Date': '11/15/2026' }], expect: ['PF-9001', 'notice_of_intent'] },
    ],
  },

  'fairpolicy-producer-retention': {
    args: { policies: 'policy-terms.csv', as_of: AS_OF },
    ok: ['at_target', 'too_few'],
    planted: [['Jordan Lee', 'below_target']],
    clean: [
      ['set', 'policy-terms.csv', { 'Policy Number': 'HO-1506' }, { 'Policy Status': 'Expired', 'Cancel Reason': '' }],
      ['add', 'policy-terms.csv', { 'Client Name': 'Marisela Hodgkin', 'Policy Number': 'HO-1506', 'Line of Business': 'Homeowners', Carrier: 'Example Mutual', 'Effective Date': '10/01/2026', 'Expiration Date': '10/01/2027', Premium: '2450.00', Producer: 'Jordan Lee', 'Policy Status': 'Active' }],
    ],
    mutations: [
      { id: 'one renewal term missing', op: ['drop', 'policy-terms.csv', { 'Policy Number': 'BOP-1515', 'Effective Date': '07/01/2026' }], expect: ['Sam Ortiz', 'below_target'] },
    ],
  },

  'fairpolicy-producer-splits': {
    args: { received: 'received-2026-10.csv', policies: 'policies.csv', producer_pay: 'producer-pay-2026-10.csv', splits: 'splits.json' },
    ok: ['ok'],
    planted: [['BOP-4003', 'underpaid'], ['WC-4004', 'not_paid'], ['CGL-4005', 'wrong_producer'], ['HO-4002', 'overpaid'], ['PA-4006', 'no_split_rate']],
    clean: [
      ['set', 'producer-pay-2026-10.csv', { 'Policy Number': 'BOP-4003' }, { Amount: '420.00' }],
      ['add', 'producer-pay-2026-10.csv', { Producer: 'Riley Chen', 'Policy Number': 'WC-4004', Amount: '126.00' }],
      ['set', 'producer-pay-2026-10.csv', { 'Policy Number': 'HO-4002' }, { Amount: '82.50' }],
      ['drop', 'producer-pay-2026-10.csv', { 'Policy Number': 'CGL-4005' }],
      ['json', 'splits.json', ['producers', 3], { name: 'Avery Stone', new_pct: 40, renewal_pct: 25 }],
    ],
    mutations: [
      { id: 'producer paid short', op: ['set', 'producer-pay-2026-10.csv', { 'Policy Number': 'PA-4001' }, { Amount: '100.00' }], expect: ['PA-4001', 'underpaid'] },
      { id: 'producer paid over', op: ['set', 'producer-pay-2026-10.csv', { 'Policy Number': 'HO-4002' }, { Amount: '120.00' }], expect: ['HO-4002', 'overpaid'] },
      { id: 'producer not paid', op: ['drop', 'producer-pay-2026-10.csv', { 'Policy Number': 'PA-4006' }], expect: ['PA-4006', 'not_paid'] },
    ],
  },

  'fairpolicy-receivables-aging': {
    args: { receivables: 'receivables.csv', as_of: AS_OF },
    ok: ['current', 'not_due'],
    planted: [['INV-7001', 'fronted_premium'], ['INV-7002', 'over_90'], ['INV-7007', 'credit_balance'], ['INV-7003', 'over_60'], ['INV-7004', 'over_30']],
    clean: ['INV-7001', 'INV-7002', 'INV-7003', 'INV-7004', 'INV-7007'].map((i) => ['set', 'receivables.csv', { 'Item Number': i }, { Balance: '0.00' }]),
    mutations: [
      { id: '48 days late', op: ['set', 'receivables.csv', { 'Item Number': 'INV-7005' }, { 'Due Date': '10/01/2026' }], expect: ['INV-7005', 'over_30'] },
      { id: 'paid-off item reopened', op: ['set', 'receivables.csv', { 'Item Number': 'INV-7008' }, { Balance: '4100.00' }], expect: ['INV-7008', 'fronted_premium'] },
      { id: 'credit owed to the client', op: ['set', 'receivables.csv', { 'Item Number': 'INV-7006' }, { Balance: '-80.00' }], expect: ['INV-7006', 'credit_balance'] },
    ],
  },

  'fairpolicy-renewal-remarket': {
    args: { policies: 'expiration-list.csv', activities: 'activities.csv', as_of: AS_OF },
    ok: ['reviewed'],
    planted: [['HO-1201', 'urgent_no_review'], ['BOP-1203', 'increase_not_remarketed'], ['WC-1204', 'no_review']],
    clean: [
      ['add', 'activities.csv', { Date: '11/05/2026', 'Policy Number': 'HO-1201', 'Client Name': 'Hollis Fairweather', 'Activity Type': 'Renewal review', Description: 'Reviewed renewal with client' }],
      ['add', 'activities.csv', { Date: '11/06/2026', 'Policy Number': 'BOP-1203', 'Client Name': 'Fairweather Kilnworks LLC', 'Activity Type': 'Remarket', Description: 'Quotes requested from two carriers' }],
      ['add', 'activities.csv', { Date: '11/07/2026', 'Policy Number': 'WC-1204', 'Client Name': 'Saoirse Penhallow', 'Activity Type': 'Renewal review', Description: 'Renewal review call' }],
    ],
    mutations: [
      { id: 'renewal up 21% with no remarket', op: ['set', 'expiration-list.csv', { 'Policy Number': 'PA-1202' }, { 'Renewal Premium': '1700.00' }], expect: ['PA-1202', 'increase_not_remarketed'] },
      { id: 'client meeting removed', op: ['drop', 'activities.csv', { 'Activity Type': 'Meeting' }], expect: ['CA-1208', 'urgent_no_review'] },
    ],
  },

  'fairpolicy-return-premiums': {
    args: { returns: 'return-premiums.csv', as_of: AS_OF },
    ok: ['refund_due', 'carrier_refunds', 'refunded'],
    planted: [['PA-2801', 'refund_overdue'], ['BOP-2803', 'check_uncashed']],
    clean: [
      ['set', 'return-premiums.csv', { 'Policy Number': 'PA-2801' }, { 'Refunded Date': '09/20/2026', 'Check Number': '1199', 'Cleared Date': '09/28/2026' }],
      ['set', 'return-premiums.csv', { 'Policy Number': 'BOP-2803' }, { 'Cleared Date': '06/20/2026' }],
    ],
    mutations: [
      { id: 'credit 48 days old', op: ['set', 'return-premiums.csv', { 'Policy Number': 'HO-2802' }, { 'Credited Date': '10/01/2026' }], expect: ['HO-2802', 'refund_overdue'] },
      { id: 'check never cleared', op: ['set', 'return-premiums.csv', { 'Policy Number': 'BOP-2803' }, { 'Cleared Date': '' }], expect: ['BOP-2803', 'check_uncashed'] },
    ],
  },

  'fairpolicy-signed-declinations': {
    args: { policies: 'policies.csv', documents: 'documents.csv' },
    ok: ['complete'],
    planted: [['CGL-2405', 'missing'], ['WC-2406', 'missing'], ['PA-2401', 'missing'], ['HO-2403', 'unsigned']],
    clean: [
      ['add', 'documents.csv', { 'Policy Number': 'PA-2401', 'Document Type': 'UM/UIM Rejection Form', Signed: 'Yes', Date: '09/01/2026' }],
      ['add', 'documents.csv', { 'Policy Number': 'CGL-2405', 'Document Type': 'Declination of Coverage - Cyber and EPLI', Signed: 'Yes', Date: '07/01/2026' }],
      ['add', 'documents.csv', { 'Policy Number': 'WC-2406', 'Document Type': 'Signed Application', Signed: 'Yes', Date: '07/01/2026' }],
      ['set', 'documents.csv', { 'Policy Number': 'HO-2403', 'Document Type': 'Flood Offer and Rejection' }, { Signed: 'Yes' }],
    ],
    mutations: [
      { id: 'flood form not signed', op: ['set', 'documents.csv', { 'Policy Number': 'HO-2404', 'Document Type': 'Flood Offer' }, { Signed: 'No' }], expect: ['HO-2404', 'unsigned'] },
      { id: 'UM rejected, no form', op: ['set', 'policies.csv', { 'Policy Number': 'PA-2402' }, { 'UM Selection': 'Rejected' }], expect: ['PA-2402', 'missing'] },
      { id: 'application missing', op: ['drop', 'documents.csv', { 'Policy Number': 'PA-2402' }], expect: ['PA-2402', 'missing'] },
    ],
  },

  'fairpolicy-trust-account': {
    args: { payables: 'payables.csv', bank: 'trust-bank-2026-11.csv', settings: 'trust-settings.json', as_of: AS_OF },
    ok: ['due_soon', 'not_due', 'remitted', 'covered'],
    planted: [['balance', 'shortfall'], ['2026-11-16 Check 1043 Example Office Leasing rent', 'unexpected_withdrawal'], ['commission-transfers', 'commission_overdraw'], ['PA-5002', 'overdue_remittance']],
    clean: [
      ['set', 'payables.csv', { 'Policy #': 'PA-5002' }, { 'Paid Date': '11/09/2026' }],
      ['set', 'trust-bank-2026-11.csv', { Date: '10/20/2026' }, { Amount: '-690.00', Balance: '3410.00' }],
      ['set', 'trust-bank-2026-11.csv', { Date: '10/28/2026' }, { Balance: '4610.00' }],
      ['set', 'trust-bank-2026-11.csv', { Date: '10/30/2026' }, { Balance: '2400.00' }],
      ['set', 'trust-bank-2026-11.csv', { Date: '11/03/2026' }, { Amount: '-180.00', Balance: '2220.00' }],
      ['add', 'trust-bank-2026-11.csv', { Date: '11/09/2026', Description: 'ACH Example Mutual premium remittance', Amount: '-1020.00', Balance: '1200.00' }],
      ['set', 'trust-bank-2026-11.csv', { Date: '11/10/2026' }, { Balance: '1080.00' }],
      ['set', 'trust-bank-2026-11.csv', { Date: '11/14/2026' }, { Balance: '5880.00' }],
      ['drop', 'trust-bank-2026-11.csv', { Date: '11/16/2026' }],
    ],
    mutations: [
      { id: 'remittance not recorded', op: ['set', 'payables.csv', { 'Policy #': 'PA-5002' }, { 'Paid Date': '' }], expect: ['PA-5002', 'overdue_remittance'] },
      { id: 'second commission transfer too large', op: ['set', 'trust-bank-2026-11.csv', { Date: '11/03/2026' }, { Amount: '-1500.00' }], expect: ['commission-transfers', 'commission_overdraw'] },
      { id: 'payment to a supplier', op: ['add', 'trust-bank-2026-11.csv', { Date: '11/15/2026', Description: 'Check 1044 Example Office Supplies', Amount: '-60.00', Balance: '5820.00' }], expect: ['2026-11-15 Check 1044 Example Office Supplies', 'unexpected_withdrawal'] },
    ],
  },

  'fairpolicy-workers-comp-audits': {
    args: { audits: 'audits.csv', as_of: AS_OF },
    ok: ['pending', 'ok'],
    planted: [['WC-2501', 'audit_not_started'], ['WC-2502', 'large_additional_premium'], ['WC-2503', 'return_due'], ['WC-2504', 'update_estimate']],
    clean: [
      ['set', 'audits.csv', { 'Policy Number': 'WC-2501' }, { 'Audit Status': 'Scheduled', 'Scheduled Date': '11/30/2026' }],
      ['set', 'audits.csv', { 'Policy Number': 'WC-2502' }, { 'Audited Payroll': '410000', 'Audit Premium': '300' }],
      ['set', 'audits.csv', { 'Policy Number': 'WC-2503' }, { 'Audited Payroll': '300000', 'Audit Premium': '0' }],
      ['set', 'audits.csv', { 'Policy Number': 'WC-2504' }, { 'Audited Payroll': '205000', 'Audit Premium': '150' }],
    ],
    mutations: [
      { id: 'payroll 30% over the estimate', op: ['set', 'audits.csv', { 'Policy Number': 'WC-2506' }, { 'Audited Payroll': '130000' }], expect: ['WC-2506', 'update_estimate'] },
      { id: 'audit returns premium', op: ['set', 'audits.csv', { 'Policy Number': 'WC-2506' }, { 'Audit Premium': '-500' }], expect: ['WC-2506', 'return_due'] },
      { id: 'audit status cleared', op: ['set', 'audits.csv', { 'Policy Number': 'GL-2505' }, { 'Audit Status': '', 'Scheduled Date': '' }], expect: ['GL-2505', 'audit_not_started'] },
    ],
  },
};
