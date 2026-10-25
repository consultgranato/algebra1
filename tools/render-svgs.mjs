// Render every item that carries a picture (number line, graph) to PNG so a
// person can read the picture independently of the key.
// Output: audit/raw/svgs/<unit>.png (contact sheet, each tile labelled with its item id)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, browser } from './lib/site.mjs';

const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/raw/items.json'), 'utf8'));
const outDir = path.join(ROOT, 'audit/raw/svgs');
fs.mkdirSync(outDir, { recursive: true });
const b = await browser();
for (const [f, u] of Object.entries(d)) {
  const its = u.items.filter(i => i.svg);
  if (!its.length) continue;
  const tiles = its.map(i => `<figure><figcaption>${f}:${i.kind}:${i.group}:${i.idx}<br><small>${i.q}</small></figcaption>${i.svg}</figure>`).join('');
  const page = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await page.setContent(`<style>body{font:13px sans-serif;display:grid;grid-template-columns:repeat(3,380px);gap:12px;margin:8px}
    figure{margin:0;border:1px solid #999;padding:6px}figcaption{margin-bottom:4px}</style>${tiles}`);
  await page.screenshot({ path: path.join(outDir, f.replace('.html', '') + '.png'), fullPage: true });
  await page.close();
  console.log(f, its.length);
}
await b.close();
