// Duplicate clients: records that are the same person or business, found by e-mail, phone, address and near names.
import { str, normalizeName, normalizeAddress, jaroWinkler, countBy } from 'fairpolicy-core';

export const STATUSES = ['exact_duplicate', 'likely_duplicate', 'possible_duplicate', 'same_household'];
const NEXT = {
  exact_duplicate: 'The same client twice: a person merges the records in your agency system (policies, notes and attachments move with them).',
  likely_duplicate: 'Probably the same client spelled differently: check and merge.',
  possible_duplicate: 'Similar names only: check before merging.',
  same_household: 'Different people at the same address or contact: link them as a household if your system supports it; do not merge.',
};
const digits = (v) => str(v).replace(/\D/g, '').slice(-10);

/** Name likeness: Jaro-Winkler on the whole name, or, for names of two words or more, how well each word of the shorter name finds its match in the longer one (one typo in a long name still counts). */
export function nameLikeness(x, y) {
  if (!x || !y) return 0;
  const whole = jaroWinkler(x, y);
  const [s1, s2] = [x.split(' '), y.split(' ')].sort((p, q) => p.length - q.length);
  if (s1.length < 2) return whole;
  const words = s1.reduce((n, w) => n + Math.max(...s2.map((v) => jaroWinkler(w, v))), 0) / s1.length;
  return Math.max(whole, words);
}

export function findDuplicates(rows, { threshold = 0.92 } = {}) {
  const cs = rows.filter((r) => str(r.client) || str(r.client_id)).map((r) => ({ id: str(r.client_id) || str(r.client), client: str(r.client), name: normalizeName(str(r.client)), email: str(r.email).toLowerCase(), phone: digits(r.phone), addr: normalizeAddress(str(r.address)), zip: str(r.zip).slice(0, 5) }))
    .sort((a, b) => a.id.localeCompare(b.id) || a.client.localeCompare(b.client));
  const blocks = new Map();
  const put = (k, i) => { if (!k) return; if (!blocks.has(k)) blocks.set(k, []); blocks.get(k).push(i); };
  cs.forEach((c, i) => { put(c.email && `e:${c.email}`, i); put(c.phone.length >= 7 && `p:${c.phone}`, i); put(c.addr && `a:${c.addr}|${c.zip}`, i); put(c.name && `n:${c.name.slice(0, 4)}`, i); });
  const seen = new Set(); const pairs = [];
  for (const list of blocks.values()) {
    if (list.length > 200) continue; // a block this big is a shared placeholder (a test e-mail, the agency's own phone), not one client
    for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
      const [i, j] = list[x] < list[y] ? [list[x], list[y]] : [list[y], list[x]]; const key = `${i}|${j}`; if (seen.has(key)) continue; seen.add(key);
      const a = cs[i], b = cs[j]; if (a.id === b.id) continue;
      const same = a.name && a.name === b.name; const sim = nameLikeness(a.name, b.name); const near = same || sim >= threshold;
      const email = a.email && a.email === b.email, phone = a.phone.length >= 7 && a.phone === b.phone, addr = a.addr && a.addr === b.addr && a.zip === b.zip, zip = a.zip && a.zip === b.zip;
      let status = null;
      if (same && (email || phone || addr)) status = 'exact_duplicate';
      else if (near && (email || phone || addr)) status = 'likely_duplicate';
      else if (same && zip) status = 'likely_duplicate';
      else if (near) status = 'possible_duplicate';
      else if (email || phone || addr) status = 'same_household';
      if (!status) continue;
      const shared = [same ? 'name' : near ? `similar name (${Math.round(sim * 100)}%)` : '', email ? 'e-mail' : '', phone ? 'phone' : '', addr ? 'address' : ''].filter(Boolean);
      pairs.push({ status, client_id: a.id, client: a.client, other_client_id: b.id, other_client: b.client, name_similarity: Math.round(sim * 100) / 100, shared: shared.join(', '), detail: `Shared: ${shared.join(', ')}.`, next_step: NEXT[status] });
    }
  }
  pairs.sort((p, q) => STATUSES.indexOf(p.status) - STATUSES.indexOf(q.status) || p.client_id.localeCompare(q.client_id) || p.other_client_id.localeCompare(q.other_client_id));
  pairs.forEach((p, n) => { p.pair = `D-${String(n + 1).padStart(3, '0')}`; });
  const rows2 = pairs.map(({ pair, ...rest }) => ({ status: rest.status, pair, ...rest }));
  return { clients: cs.length, pairs: rows2.length, clients_in_duplicates: new Set(pairs.filter((p) => p.status !== 'same_household').flatMap((p) => [p.client_id, p.other_client_id])).size, by_status: countBy(rows2, STATUSES), rows: rows2 };
}

export const summaryLine = (o) => `${o.clients} client record(s): ${o.by_status.exact_duplicate || 0} exact duplicate pair(s), ${o.by_status.likely_duplicate || 0} likely, ${o.by_status.possible_duplicate || 0} possible (${o.clients_in_duplicates} records involved), and ${o.by_status.same_household || 0} pair(s) that share an address or contact but are different people.`;
