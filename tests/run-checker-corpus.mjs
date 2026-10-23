// Run tests/checker-corpus.json against the answer checker the site actually uses.
// The checker is assets/algebra1.js `isMatch`, loaded after each unit page's own
// copy; we load every unit page and confirm the page's grading functions resolve
// to that one shared function, then run the corpus in the page.
//
//   node tests/run-checker-corpus.mjs            -> report + writes audit/raw/checker-run.json
//   node tests/run-checker-corpus.mjs --baseline -> also (re)writes tests/checker-baseline.json
//   node tests/run-checker-corpus.mjs --check    -> exit 1 if any input accepted in the baseline is now rejected
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, UNIT_PAGES, serve, browser, localOnly } from '../tools/lib/site.mjs';

const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/checker-corpus.json'), 'utf8'));
const { server, base } = await serve();
const b = await browser();
let results, identity = {};
try {
  for (const f of UNIT_PAGES) {
    const page = await b.newPage();
    await localOnly(page, base);
    await page.goto(base + f, { waitUntil: 'load' });
    identity[f] = await page.evaluate(() => ({
      shared: typeof window.isMatch === 'function' && /aliasOf/.test(String(window.isMatch)),
      matchesIsShared: window.matches === window.isMatch,
      // what an unqualified call inside the page's own gradeT resolves to
      lexical: (function () { try { return isMatch === window.isMatch; } catch (e) { return 'n/a'; } })()
    }));
    if (f === 'unit5.html') {
      results = await page.evaluate(cs => cs.map(c => ({ ...c, actual: window.isMatch(c.input, c.key) ? 'accept' : 'reject' })), corpus);
    }
    await page.close();
  }
} finally {
  await b.close();
  server.close();
}

const verdict = r => r.expected === 'either' ? 'unjudged' : r.expected === r.actual ? 'ok' : r.expected === 'accept' ? 'CORRECT-REJECTED' : 'WRONG-ACCEPTED';
results.forEach(r => { r.verdict = verdict(r); });
const run = { when: new Date().toISOString(), identity, results };
fs.mkdirSync(path.join(ROOT, 'audit/raw'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audit/raw/checker-run.json'), JSON.stringify(run, null, 1));

const count = v => results.filter(r => r.verdict === v).length;
console.log(`cases ${results.length}: ok ${count('ok')}, correct-rejected ${count('CORRECT-REJECTED')}, wrong-accepted ${count('WRONG-ACCEPTED')}, unjudged ${count('unjudged')}`);
console.log('every page grades with the shared isMatch:', Object.values(identity).every(i => i.shared && i.matchesIsShared && i.lexical === true));
for (const r of results.filter(r => r.verdict !== 'ok' && r.verdict !== 'unjudged'))
  console.log(`${r.verdict.padEnd(16)} #${r.id} [${r.category}] input ${JSON.stringify(r.input)} key ${JSON.stringify(r.key)} — ${r.why}`);

const basePath = path.join(ROOT, 'tests/checker-baseline.json');
if (process.argv.includes('--baseline')) {
  fs.writeFileSync(basePath, JSON.stringify(Object.fromEntries(results.map(r => [r.id, r.actual])), null, 1) + '\n');
  console.log('baseline written:', basePath);
}
if (process.argv.includes('--check')) {
  const baseline = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const regressions = results.filter(r => baseline[r.id] === 'accept' && r.actual === 'reject');
  regressions.forEach(r => console.log('REGRESSION: previously accepted, now rejected', r));
  if (regressions.length) process.exit(1);
  console.log('no regressions against the baseline');
}
