// Liveness and title of every YouTube link on the site, via YouTube's public oEmbed
// endpoint (no key, no cookies). Output: audit/raw/videos.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/site.mjs';

const notes = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/raw/notes.json'), 'utf8'));
const out = [];
for (const n of notes) {
  for (const v of n.videos) {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(v.url));
    let body = null;
    try { body = r.ok ? await r.json() : null; } catch (e) { }
    out.push({ file: n.file, tag: n.tag, topicTitle: n.title, label: v.label, url: v.url, status: r.status, live: r.ok,
      videoTitle: body && body.title, channel: body && body.author_name });
    await new Promise(res => setTimeout(res, 150));
  }
}
fs.writeFileSync(path.join(ROOT, 'audit/raw/videos.json'), JSON.stringify(out, null, 1));
for (const o of out) console.log(`${o.status} ${o.tag.padEnd(5)} ${String(o.topicTitle).replace(/&amp;/g, '&').slice(0, 34).padEnd(34)} | ${o.videoTitle || '(none)'} — ${o.channel || ''}`);
