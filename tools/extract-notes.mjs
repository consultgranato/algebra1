// Dump every topic's notes HTML and video list, as the notes modal would show it.
// Output: audit/raw/notes.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, UNIT_PAGES, serve, browser, localOnly } from './lib/site.mjs';

const { server, base } = await serve();
const b = await browser();
const out = [];
for (const f of UNIT_PAGES) {
  const page = await b.newPage();
  await localOnly(page, base);
  await page.goto(base + f, { waitUntil: 'load' });
  const notes = await page.evaluate(() => {
    const g = n => { try { return eval(n); } catch (e) { return undefined; } };
    const T = g('TOPICS');
    if (T) return T.map(t => ({ tag: t.tag, title: t.title, html: t.html, videos: (t.videos || []).map(v => ({ label: v.label, url: v.url })) }));
    const tags = g('TOPIC_TAGS'), titles = g('TOPIC_TITLES') || [], vids = g('TOPIC_VIDEOS') || [];
    const bodies = document.querySelectorAll('#notes-data .tbody');
    return tags.map((tag, i) => ({ tag, title: titles[i], html: bodies[i] ? bodies[i].innerHTML : '', videos: (vids[i] || []).map(v => ({ label: v.label, url: v.url })) }));
  });
  notes.forEach(n => out.push({ file: f, ...n }));
  await page.close();
}
await b.close();
server.close();
fs.writeFileSync(path.join(ROOT, 'audit/raw/notes.json'), JSON.stringify(out, null, 1));
console.log(out.length, 'topics;', out.reduce((a, n) => a + n.videos.length, 0), 'video links');
