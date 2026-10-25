// Item analysis over a folder of "Export my data" files.
//
//   node tools/item-analysis.mjs <folder> [--out report.md] [--min 3]
//
// Each file is one student's export (format alg1.export.v1). Files are never
// matched to people: the folder should hold anonymous filenames (S01.json, ...).
// Per item: students who tried it, % correct on the first try, hint use, median
// seconds, the most common wrong answers, and flags for items nobody or
// everybody gets right. Question text comes from audit/raw/items.json if present.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith('--'));
const outIdx = args.indexOf('--out');
const minIdx = args.indexOf('--min');
const MIN = minIdx >= 0 ? parseInt(args[minIdx + 1], 10) : 3;
if (!dir || !fs.existsSync(dir)) {
  console.error('usage: node tools/item-analysis.mjs <folder of exported .json files> [--out report.md] [--min 3]');
  process.exit(2);
}

/* Question text, keyed by the same ids the site logs */
const text = {};
for (const f of [path.join(ROOT, 'tests/out/items.json'), path.join(ROOT, 'audit/raw/items.json')]) {
  if (!fs.existsSync(f)) continue;
  const items = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const [file, u] of Object.entries(items))
    for (const it of u.items) {
      const id = `${file}:${it.kind}:${it.group}:${it.idx}`;
      if (!text[id]) text[id] = `${it.q} ${it.eq || ''}`.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
  break;
}

const per = {};
let students = 0, skippedFiles = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  let data;
  try { data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { skippedFiles++; continue; }
  if (!data || data.format !== 'alg1.export.v1' || !Array.isArray(data.attempts)) { skippedFiles++; continue; }
  students++;
  const firstSeen = new Set();
  for (const r of [...data.attempts].sort((a, b) => (a.at || 0) - (b.at || 0))) {
    if (!r || !r.item) continue;
    const s = per[r.item] || (per[r.item] = { students: 0, firstTryRight: 0, everRight: 0, hints: 0, skipped: 0, attempts: 0, seconds: [], wrong: {}, rightStudents: new Set() });
    s.attempts++;
    if (r.hint) s.hints++;
    if (r.skipped) s.skipped++;
    if (typeof r.seconds === 'number') s.seconds.push(r.seconds);
    if (r.wrong) { const w = String(r.wrong).trim().toLowerCase().replace(/\s+/g, ' '); s.wrong[w] = (s.wrong[w] || 0) + 1; }
    if (r.correct) s.rightStudents.add(f);
    if (!firstSeen.has(r.item)) {
      firstSeen.add(r.item);
      s.students++;
      if (r.correct && (r.tries || 1) === 1) s.firstTryRight++;
    }
  }
}

const median = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); const m = b.length >> 1; return b.length % 2 ? b[m] : Math.round((b[m - 1] + b[m]) / 2); };
const rows = Object.entries(per).map(([id, s]) => ({
  id, text: text[id] || '', students: s.students,
  firstTryPct: s.students ? Math.round(100 * s.firstTryRight / s.students) : 0,
  everRight: s.rightStudents.size, skipped: s.skipped, hintPct: s.attempts ? Math.round(100 * s.hints / s.attempts) : 0,
  medianSeconds: median(s.seconds),
  commonWrong: Object.entries(s.wrong).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, n]) => `${w} (${n})`)
})).sort((a, b) => a.firstTryPct - b.firstTryPct || b.students - a.students);

const enough = rows.filter(r => r.students >= MIN);
const nobody = enough.filter(r => r.everRight === 0);
const everybody = enough.filter(r => r.firstTryPct === 100);
const esc = s => String(s).replace(/\|/g, '\\|');
const md = [
  '# Item analysis', '',
  `${students} student file${students === 1 ? '' : 's'}${skippedFiles ? ` (${skippedFiles} unreadable or not an export, skipped)` : ''}; ${rows.length} items attempted. ` +
  `Flags use items tried by at least ${MIN} students.`, '',
  'A "wrong" answer that is actually right but typed differently is a checker bug, not a student error: add it to `tests/checker-corpus.json`.', '',
  `## Nobody got these right (${nobody.length})`, '',
  ...(nobody.length ? nobody.map(r => `- \`${r.id}\` ${esc(r.text)} — common wrong: ${esc(r.commonWrong.join(', ') || '—')}${r.skipped ? `; left blank ${r.skipped}×` : ''}`) : ['- none']), '',
  `## Everybody got these right first time (${everybody.length})`, '',
  ...(everybody.length ? everybody.map(r => `- \`${r.id}\` ${esc(r.text)}`) : ['- none']), '',
  '## Every item, hardest first', '',
  '| Item | Question | Students | Right 1st try | Skipped | Hint used | Median s | Most common wrong answers |',
  '|---|---|---:|---:|---:|---:|---:|---|',
  ...rows.map(r => `| \`${r.id}\` | ${esc(r.text)} | ${r.students} | ${r.firstTryPct}% | ${r.skipped} | ${r.hintPct}% | ${r.medianSeconds ?? '—'} | ${esc(r.commonWrong.join(', ') || '—')} |`), ''
].join('\n');

if (outIdx >= 0) fs.writeFileSync(args[outIdx + 1], md);
else process.stdout.write(md);
