// Certificates of insurance against the policies behind them: limits, dates, policy in force, endorsements shown.
import { str, num, policyIndex, statusOf, countBy } from 'fairpolicy-core';

export const STATUSES = ['policy_not_in_force', 'limit_overstated', 'ai_not_on_policy', 'waiver_not_on_policy', 'dates_wrong', 'policy_unknown', 'ok'];
const NEXT = {
  policy_not_in_force: 'The certificate was issued on a policy that was not in force that day: the account manager reviews it with the agency principal today.',
  limit_overstated: 'The certificate shows a higher limit than the policy: correct and reissue after a person checks the policy.',
  ai_not_on_policy: 'The certificate shows additional insured status the policy does not have: request the endorsement from the carrier or correct the certificate.',
  waiver_not_on_policy: 'The certificate shows a waiver of subrogation the policy does not have: request the endorsement or correct the certificate.',
  dates_wrong: 'The policy dates on the certificate do not match the policy: correct and reissue.',
  policy_unknown: 'The policy number on the certificate is not in your coverage file: check it.',
  ok: '',
};
const yes = (v) => /^(y|yes|true|1|x|blanket|scheduled)$/i.test(str(v));

export function checkCertificates(certRows, coverageRows) {
  const idx = policyIndex(coverageRows.map((r) => ({ policy_number: str(r.policy_number), client: str(r.client), line: str(r.line), each_occurrence: num(r.each_occurrence), aggregate: num(r.aggregate), effective_date: str(r.effective_date), expiration_date: str(r.expiration_date), status: statusOf(r.status), cancel_date: str(r.cancel_date), ai: yes(r.ai_endorsement), waiver: yes(r.waiver_endorsement) })));
  const rows = certRows.filter((c) => str(c.certificate) && str(c.policy_number)).map((c) => {
    const p = idx.find(c.policy_number)[0] || null;
    const issued = str(c.issued_date);
    const issues = [];
    if (!p) issues.push('policy_unknown');
    else {
      const ended = (p.status === 'cancelled' && p.cancel_date && issued >= p.cancel_date) || (p.expiration_date && issued > p.expiration_date);
      if (ended) issues.push('policy_not_in_force');
      const occ = num(c.each_occurrence), agg = num(c.aggregate);
      if ((occ !== null && p.each_occurrence !== null && occ > p.each_occurrence) || (agg !== null && p.aggregate !== null && agg > p.aggregate)) issues.push('limit_overstated');
      if (yes(c.additional_insured) && !p.ai) issues.push('ai_not_on_policy');
      if (yes(c.waiver) && !p.waiver) issues.push('waiver_not_on_policy');
      if ((str(c.effective_date) && str(c.effective_date) !== p.effective_date) || (str(c.expiration_date) && str(c.expiration_date) !== p.expiration_date)) issues.push('dates_wrong');
    }
    issues.sort((a, b) => STATUSES.indexOf(a) - STATUSES.indexOf(b));
    const status = issues[0] || 'ok';
    const detail = issues.map((i) => ({
      policy_unknown: `${str(c.policy_number)} is not in the coverage file.`,
      policy_not_in_force: `Issued ${issued}; the policy ${p && p.status === 'cancelled' ? `was cancelled ${p.cancel_date}` : `expired ${p && p.expiration_date}`}.`,
      limit_overstated: `Certificate shows ${num(c.each_occurrence) ?? '-'} / ${num(c.aggregate) ?? '-'}; the policy has ${p && p.each_occurrence} / ${p && p.aggregate}.`,
      ai_not_on_policy: 'Additional insured shown; no additional insured endorsement on the policy.',
      waiver_not_on_policy: 'Waiver of subrogation shown; no waiver endorsement on the policy.',
      dates_wrong: `Certificate dates ${str(c.effective_date)} to ${str(c.expiration_date)}; policy ${p && p.effective_date} to ${p && p.expiration_date}.`,
    })[i]).join(' ');
    return { status, ref: `${str(c.certificate)}/${str(c.policy_number)}`, certificate: str(c.certificate), holder: str(c.holder), client: str(c.client) || (p ? p.client : ''), policy_number: str(c.policy_number), issued_date: issued, issues: issues.join(', '), issued_by: str(c.issued_by), detail, next_step: NEXT[status] };
  });
  rows.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.ref.localeCompare(b.ref));
  return { certificates: new Set(rows.map((r) => r.certificate)).size, lines_checked: rows.length, with_issues: new Set(rows.filter((r) => r.status !== 'ok').map((r) => r.certificate)).size, by_status: countBy(rows, STATUSES), rows };
}

export const summaryLine = (o) => `${o.certificates} certificate(s), ${o.lines_checked} policy line(s) checked: ${o.with_issues} certificate(s) with something the policy does not support (${o.by_status.policy_not_in_force || 0} not in force, ${o.by_status.limit_overstated || 0} limits overstated, ${o.by_status.ai_not_on_policy || 0} additional insured not on the policy, ${o.by_status.waiver_not_on_policy || 0} waiver not on the policy, ${o.by_status.dates_wrong || 0} wrong dates, ${o.by_status.policy_unknown || 0} unknown policy).`;
