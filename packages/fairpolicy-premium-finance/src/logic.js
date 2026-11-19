// Premium finance: notices of intent to cancel, late installments, funding not received, funding not passed on to the carrier.
import { str, num, sum, daysBetween, countBy } from 'fairpolicy-core';

export const STATUSES = ['notice_of_intent', 'past_due', 'not_funded', 'funded_not_remitted', 'due_soon', 'current', 'paid_off'];
const NEXT = {
  notice_of_intent: 'The finance company sent a notice of intent to cancel: call the client before the cancellation date.',
  past_due: 'An installment is late: remind the client before the finance company sends a notice.',
  not_funded: 'The agreement was signed but the finance company has not funded it: call the finance company.',
  funded_not_remitted: 'The finance company paid the agency; the premium has not been passed on to the carrier.',
  due_soon: 'An installment is due within days.',
  current: '', paid_off: '',
};

export function checkFinance(rows, { asOf, fundDays = 14, remitDays = 5, soonDays = 10 } = {}) {
  const out = [];
  for (const r of rows) {
    const id = str(r.agreement) || str(r.policy_number); if (!id) continue;
    const f = { agreement: str(r.agreement), policy_number: str(r.policy_number), client: str(r.client), finance_company: str(r.finance_company), signed_date: str(r.signed_date), amount_financed: num(r.amount_financed), funded_date: str(r.funded_date), funded_amount: num(r.funded_amount), remitted_date: str(r.remitted_date), installment: num(r.installment), next_due_date: str(r.next_due_date), last_paid_date: str(r.last_paid_date), notice_date: str(r.notice_date), cancel_date: str(r.cancel_date), balance: num(r.balance) };
    const late = f.next_due_date ? daysBetween(f.next_due_date, asOf) : null;
    const sinceSigned = f.signed_date ? daysBetween(f.signed_date, asOf) : null;
    const sinceFunded = f.funded_date ? daysBetween(f.funded_date, asOf) : null;
    let status;
    if (f.balance !== null && f.balance <= 0) status = 'paid_off';
    else if (f.notice_date && f.notice_date <= asOf && (!f.cancel_date || f.cancel_date >= asOf)) status = 'notice_of_intent';
    else if (late !== null && late > 0 && (!f.last_paid_date || f.last_paid_date < f.next_due_date)) status = 'past_due';
    else if (!f.funded_date && sinceSigned !== null && sinceSigned > fundDays) status = 'not_funded';
    else if (f.funded_date && !f.remitted_date && sinceFunded > remitDays) status = 'funded_not_remitted';
    else if (late !== null && late <= 0 && -late <= soonDays) status = 'due_soon';
    else status = 'current';
    const detail = status === 'notice_of_intent' ? `Notice ${f.notice_date}; cancellation ${f.cancel_date || 'date not in the file'}${f.cancel_date ? ` (${daysBetween(asOf, f.cancel_date)} days)` : ''}.`
      : status === 'past_due' ? `Installment ${f.installment ?? ''} was due ${f.next_due_date} (${late} days ago).`
      : status === 'not_funded' ? `Signed ${f.signed_date} (${sinceSigned} days ago); no funding received.`
      : status === 'funded_not_remitted' ? `${f.funded_amount ?? ''} funded ${f.funded_date} (${sinceFunded} days ago); not remitted to the carrier.`
      : status === 'due_soon' ? `Installment ${f.installment ?? ''} due ${f.next_due_date}.` : '';
    out.push({ status, ...f, days_past_due: late !== null && late > 0 ? late : 0, detail, next_step: NEXT[status] });
  }
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || String(a.cancel_date || a.next_due_date).localeCompare(String(b.cancel_date || b.next_due_date)) || a.agreement.localeCompare(b.agreement));
  return {
    as_of: asOf, agreements: out.length, notices: out.filter((r) => r.status === 'notice_of_intent').length,
    not_funded_amount: sum(out.filter((r) => r.status === 'not_funded'), (r) => r.amount_financed ?? 0),
    funded_not_remitted_amount: sum(out.filter((r) => r.status === 'funded_not_remitted'), (r) => r.funded_amount ?? 0),
    past_due_installments: sum(out.filter((r) => r.status === 'past_due'), (r) => r.installment ?? 0), by_status: countBy(out, STATUSES), rows: out,
  };
}

export const summaryLine = (o) => `${o.agreements} finance agreement(s) as of ${o.as_of}: ${o.notices} notice(s) of intent to cancel, ${o.by_status.past_due || 0} installment(s) past due (${o.past_due_installments}), ${o.by_status.not_funded || 0} not funded (${o.not_funded_amount}), ${o.by_status.funded_not_remitted || 0} funded but not passed to the carrier (${o.funded_not_remitted_amount}), ${o.by_status.due_soon || 0} due soon.`;
