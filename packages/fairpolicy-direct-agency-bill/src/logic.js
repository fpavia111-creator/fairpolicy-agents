// Direct bill against agency bill: is each policy billed the way your agency system says?
import { str, num, sum, policyIndex, normPolicy, normStatementLine, countBy } from 'fairpolicy-core';

export const STATUSES = ['double_billed', 'coded_agency_paid_direct', 'coded_direct_invoiced', 'bill_type_missing', 'ok'];
const NEXT = {
  double_billed: 'The client may be billed twice: the agency invoiced it and the carrier pays commission as direct bill. Stop collection and confirm the billing with the carrier today.',
  coded_agency_paid_direct: 'The carrier treats it as direct bill: change the bill type in your agency system (a person does it) and check no agency invoice goes out.',
  coded_direct_invoiced: 'Coded direct bill but the agency invoiced the client: confirm which is right before the client pays twice.',
  bill_type_missing: 'Set the bill type on the policy in your agency system.',
  ok: '',
};

export function checkBilling(policyRows, statementRows, invoiceRows = []) {
  const sIdx = policyIndex(statementRows.map(normStatementLine).filter((l) => l.policy_key && l.commission !== null));
  const iIdx = policyIndex(invoiceRows.map((r) => ({ ...r, amount: num(r.amount) })).filter((r) => str(r.policy_number)));
  const rows = [];
  for (const p of policyRows.map((r) => normPolicy(r))) {
    if (!p.policy_key || ['cancelled', 'expired', 'non_renewed', 'lapsed'].includes(p.status_code)) continue;
    const onStatement = sIdx.find(p.policy_number).length > 0;
    const invoices = iIdx.find(p.policy_number);
    const invoiced = sum(invoices, (r) => r.amount);
    let status;
    if (onStatement && invoices.length) status = 'double_billed';
    else if (!p.bill) status = 'bill_type_missing';
    else if (p.bill === 'agency' && onStatement) status = 'coded_agency_paid_direct';
    else if (p.bill === 'direct' && invoices.length) status = 'coded_direct_invoiced';
    else status = 'ok';
    const detail = [p.bill ? `Coded ${p.bill} bill.` : 'No bill type.', onStatement ? 'On the carrier\'s direct-bill commission statement.' : '', invoices.length ? `Agency invoiced ${invoiced}.` : ''].filter(Boolean).join(' ');
    rows.push({ status, policy_number: p.policy_number, client: p.client, carrier: p.carrier, line: p.line_code, coded_bill_type: p.bill || '', on_direct_statement: onStatement, agency_invoiced: invoiced, premium: p.premium, producer: p.producer, csr: p.csr, detail, next_step: NEXT[status] });
  }
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.policy_number.localeCompare(b.policy_number));
  const risk = rows.filter((r) => r.status === 'double_billed' || r.status === 'coded_direct_invoiced');
  return { policies: rows.length, mismatches: rows.filter((r) => r.status !== 'ok').length, invoiced_at_risk: sum(risk, (r) => r.agency_invoiced), by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.policies} active policy(ies): ${o.mismatches} billed differently from how they are coded (${o.by_status.double_billed || 0} possibly billed twice, ${o.by_status.coded_agency_paid_direct || 0} coded agency bill but paid as direct, ${o.by_status.coded_direct_invoiced || 0} coded direct but invoiced, ${o.by_status.bill_type_missing || 0} with no bill type); ${o.invoiced_at_risk} invoiced to clients on policies the carrier may also bill.`;
