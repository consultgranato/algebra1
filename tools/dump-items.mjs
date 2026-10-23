// Print items compactly for review: node tools/dump-items.mjs unit5.html
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(new URL('../audit/raw/items.json', import.meta.url)));
for (const f of process.argv.slice(2)) for (const it of d[f].items)
  console.log(`${it.kind[0]}|${it.group}|${it.idx}|${it.svg?"SVG":""}${it.graphIt?" G["+it.graphIt+"]":""}| ${it.q} ‖ ${it.eq} ‖ ${it.a} ‖ ${it.fmt}`);
