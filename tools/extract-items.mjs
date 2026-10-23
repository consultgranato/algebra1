// Load every unit page in headless Chrome and dump its content data exactly as
// the browser sees it (UNIT, TOPICS, BANKS, T, VQB, DESCS), plus the rendered
// HTML of each problem's equation. Output: audit/raw/items.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, UNIT_PAGES, serve, browser, localOnly } from './lib/site.mjs';

const { server, base } = await serve();
const b = await browser();
const out = {};
try {
  for (const file of UNIT_PAGES) {
    const page = await b.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await localOnly(page, base);
    await page.goto(base + file, { waitUntil: 'load' });
    out[file] = await page.evaluate(() => {
      const g = n => { try { return eval(n); } catch (e) { return undefined; } };
      const items = [];
      const add = (kind, group, p, idx) => items.push({
        kind, group, idx, t: p.t || null, u: p.u || null, q: p.q, eq: p.eq, a: p.a, fmt: p.fmt, h: p.h, svg: p.svg || null, graphIt: p.graphIt || null, extra: Object.keys(p).filter(k => !["t","u","q","eq","a","fmt","h","svg","graphIt"].includes(k)),
        eqHtml: (typeof formatEq === 'function') ? formatEq(p.eq) : null,
        aHtml: (typeof formatEq === 'function') ? formatEq(p.a) : null
      });
      const BANKS_ = g('BANKS'), T_ = g('T');
      Object.keys(BANKS_ || {}).forEach(k => BANKS_[k].forEach((p, i) => add('bank', k, p, i)));
      (T_ || []).forEach((p, i) => add('test', p.t || p.u, p, i));
      const TOPICS_ = g('TOPICS');
      return {
        unit: g('UNIT'),
        topicTags: g('TOPIC_TAGS') || (TOPICS_ || []).map(t => t.tag),
        topics: (TOPICS_ || []).map(t => ({ tag: t.tag, title: t.title, videos: t.videos, htmlLength: (t.html || '').length })),
        descs: g('DESCS'),
        practiceButtons: [...document.querySelectorAll('.tpbtns .tpbtn')].map(b => (b.getAttribute('onclick') || '').match(/'([^']*)'/)?.[1]),
        vqFilters: [...document.querySelectorAll('.pqf-btn')].map(b => (b.getAttribute('onclick') || '').match(/'([^']*)'/)?.[1]),
        vqb: g('VQB'),
        items
      };
    });
    out[file].pageErrors = errors;
    await page.close();
  }
} finally {
  await b.close();
  server.close();
}
fs.mkdirSync(path.join(ROOT, 'audit/raw'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audit/raw/items.json'), JSON.stringify(out, null, 1));
for (const [f, d] of Object.entries(out)) {
  console.log(f.padEnd(14), 'bank', d.items.filter(i => i.kind === 'bank').length, 'test', d.items.filter(i => i.kind === 'test').length,
    'vqb', (d.vqb || []).length, 'errors', d.pageErrors.length);
}
