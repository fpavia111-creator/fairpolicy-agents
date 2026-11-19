// Licence renewals and continuing education by person and state, against the state settings the agency confirms.
import { str, num, daysBetween, countBy, groupBy } from 'fairpolicy-core';

export const STATUSES = ['expired', 'ce_short', 'renewal_due', 'no_state_rule', 'current'];
const NEXT = {
  expired: 'The licence has expired in this state: the person must not sell, solicit or negotiate there until it is reinstated. The agency principal decides what happens with their accounts.',
  ce_short: 'Continuing education hours are short of the state setting before expiration: book the courses now.',
  renewal_due: 'Renew before the expiration date.',
  no_state_rule: 'No setting for this state: add its continuing education rule, as your agency confirms it, to the settings file.',
  current: '',
};
const yes = (v) => /^(y|yes|true|1|x|resident|r)$/i.test(str(v));

export function checkLicenses(rows, settings = {}, { asOf, dueDays = 60, ceDays = 90 } = {}) {
  const states = Object.fromEntries(Object.entries(settings.states || {}).map(([k, v]) => [k.toUpperCase(), v]));
  const out = rows.filter((r) => str(r.person) && str(r.state)).map((r) => {
    const st = str(r.state).toUpperCase(); const rule = states[st] || null;
    const exp = str(r.expiration_date); const days = exp ? daysBetween(asOf, exp) : null;
    const resident = r.resident === undefined || str(r.resident) === '' ? true : yes(r.resident);
    const hours = num(r.ce_hours) ?? 0, ethics = num(r.ethics_hours) ?? 0;
    const needH = rule ? num(rule.ce_hours) ?? 0 : null, needE = rule ? num(rule.ethics_hours) ?? 0 : null;
    const short = resident && rule && (hours < needH || ethics < needE);
    let status;
    if (days !== null && days < 0) status = 'expired';
    else if (resident && !rule) status = 'no_state_rule';
    else if (short && days !== null && days <= ceDays) status = 'ce_short';
    else if (days !== null && days <= dueDays) status = 'renewal_due';
    else status = 'current';
    const detail = status === 'expired' ? `Expired ${exp} (${-days} days ago).` : status === 'ce_short' ? `Expires ${exp} (${days} days); ${hours} of ${needH} hours, ${ethics} of ${needE} ethics hours.` : status === 'renewal_due' ? `Expires ${exp} (${days} days).` : status === 'no_state_rule' ? `No settings for ${st}.` : resident ? '' : 'Non-resident: continuing education usually follows the home state; confirm.';
    return { status, person: str(r.person), role: str(r.role), state: st, license_number: str(r.license_number), license_type: str(r.license_type), resident, expiration_date: exp, days_left: days, ce_hours: hours, ce_required: resident ? needH : null, ethics_hours: ethics, ethics_required: resident ? needE : null, detail, next_step: NEXT[status] };
  });
  out.sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || (a.days_left ?? 99999) - (b.days_left ?? 99999) || a.person.localeCompare(b.person) || a.state.localeCompare(b.state));
  const byPerson = [...groupBy(out, (r) => r.person).values()].map((g) => ({ person: g[0].person, role: g[0].role, licenses: g.length, needing_attention: g.filter((r) => r.status !== 'current').length, next_expiration: g.map((r) => r.expiration_date).filter((d) => d && d >= asOf).sort()[0] || '' })).sort((a, b) => b.needing_attention - a.needing_attention || a.person.localeCompare(b.person));
  return { as_of: asOf, licenses: out.length, people: byPerson.length, needing_attention: out.filter((r) => r.status !== 'current').length, by_status: countBy(out, STATUSES), by_person: byPerson, rows: out };
}

export const summaryLine = (o) => `${o.licenses} licence(s) for ${o.people} person(s) as of ${o.as_of}: ${o.by_status.expired || 0} expired, ${o.by_status.ce_short || 0} short of continuing education before expiration, ${o.by_status.renewal_due || 0} due for renewal, ${o.by_status.no_state_rule || 0} in states with no settings. State rules are the settings your agency confirmed, not legal advice.`;
