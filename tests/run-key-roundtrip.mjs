// Can a student who types the answer key itself, in ordinary keyboard notation,
// get the item right? For every practice and test item we render the key the way
// a student would type it (x^2 for x<sup>2</sup>, - for −, no markup) and ask the
// site's own checker. Output: audit/raw/key-roundtrip.json
import fs from 'node:fs';
import path from 'node:path';
import { RAW, serve, browser, localOnly } from '../tools/lib/site.mjs';

const items = JSON.parse(fs.readFileSync(path.join(RAW, 'items.json'), 'utf8'));
const typed = k => String(k)
  .replace(/<sup>(.*?)<\/sup>/g, (_, e) => '^' + (/^-?\w$|^-?\d+$/.test(e) ? e : '(' + e + ')'))
  .replace(/<[^>]+>/g, '').replace(/[−–]/g, '-').replace(/&[a-z]+;/g, ' ').trim();

const { server, base } = await serve();
const b = await browser();
const page = await b.newPage();
await localOnly(page, base);
await page.goto(base + 'unit5.html', { waitUntil: 'load' });
const rows = [];
for (const [f, u] of Object.entries(items)) {
  for (const it of u.items) {
    const t = typed(it.a);
    rows.push({ id: `${f}:${it.kind}:${it.group}:${it.idx}`, key: it.a, typed: t });
  }
}
const res = await page.evaluate(rs => rs.map(r => ({ ...r, accepted: window.isMatch(r.typed, r.key) })), rows);
await b.close();
server.close();

const bad = res.filter(r => !r.accepted);
const byUnit = {};
res.forEach(r => { const u = r.id.split(':')[0]; byUnit[u] = byUnit[u] || { items: 0, keyRejected: 0 }; byUnit[u].items++; if (!r.accepted) byUnit[u].keyRejected++; });
fs.writeFileSync(path.join(RAW, 'key-roundtrip.json'), JSON.stringify({ byUnit, rejected: bad }, null, 1));
console.log(byUnit);
bad.slice(0, 60).forEach(r => console.log(r.id, '| key:', JSON.stringify(r.key), '| typed:', JSON.stringify(r.typed)));
console.log('total items whose own key, typed normally, is marked wrong:', bad.length, 'of', res.length);
