// One command for the whole safety net:
//
//   node tests/run-all.mjs                    run everything, compare with tests/expected/
//   node tests/run-all.mjs --update-expected  after a reviewed fix, record the new state
//   node tests/run-all.mjs --skip-axe         faster local loop
//
// Every check compares against a recorded list of *known* failures (from the Phase 0
// audit). The run fails if anything new breaks, and also if a known failure starts
// passing without the list being updated, so the lists stay honest as fixes land.
// Generated output goes to tests/out/ (A1_RAW), never to audit/raw/.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests/out');
const EXP = path.join(ROOT, 'tests/expected');
const UPDATE = process.argv.includes('--update-expected');
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(EXP, { recursive: true });
const env = { ...process.env, A1_RAW: OUT, PYTHONIOENCODING: 'utf-8' };

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0 && !(args.includes('--check'))) {
    console.error(r.stdout, r.stderr);
    throw new Error(`${cmd} ${args.join(' ')} exited ${r.status}`);
  }
  return r;
}
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const sorted = o => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const results = [];

/* Compare a map of failing-thing -> value against the expected map.
   Numeric values: more is a regression, fewer is an improvement. */
function compare(name, actual, file, describe = k => k) {
  const expPath = path.join(EXP, file);
  if (UPDATE || !fs.existsSync(expPath)) {
    fs.writeFileSync(expPath, JSON.stringify(sorted(actual), null, 1) + '\n');
    results.push({ name, status: 'recorded', detail: `${Object.keys(actual).length} known entries written to tests/expected/${file}` });
    return;
  }
  const expected = read(expPath);
  const worse = [], better = [];
  for (const [k, v] of Object.entries(actual)) {
    if (!(k in expected)) worse.push(`NEW: ${describe(k)} (${JSON.stringify(v)})`);
    else if (typeof v === 'number' && v > expected[k]) worse.push(`MORE: ${describe(k)} ${expected[k]} -> ${v}`);
    else if (typeof v !== 'number' && JSON.stringify(v) !== JSON.stringify(expected[k])) worse.push(`CHANGED: ${describe(k)} ${JSON.stringify(expected[k])} -> ${JSON.stringify(v)}`);
  }
  for (const [k, v] of Object.entries(expected)) {
    if (!(k in actual)) better.push(`FIXED: ${describe(k)}`);
    else if (typeof v === 'number' && actual[k] < v) better.push(`FEWER: ${describe(k)} ${v} -> ${actual[k]}`);
  }
  const status = worse.length ? 'FAIL' : better.length ? 'UPDATE-EXPECTED' : 'pass';
  results.push({ name, status, detail: [...worse, ...better].join('\n      ') || `${Object.keys(expected).length} known, unchanged` });
}

// 1. Item verification (independent solver over the current pages)
run('node', ['tools/extract-items.mjs']);
run(PY, ['tools/verify/verify_items.py']);
{
  const v = read(path.join(OUT, 'verification.json'));
  const content = {};
  for (const i of v.items) {
    const kinds = [...new Set(i.flags.map(f => f.split(':')[0]).filter(k => ['MARKUP', 'HINT-WORKING', 'HINT', 'LABEL', 'KEY', 'AMBIGUOUS'].includes(k)))];
    if (i.status !== 'match' || kinds.length) content[i.id] = [i.status, ...kinds.sort()].join(' ');
  }
  for (const d of v.duplicates) content[`duplicate:${d.unit}:${d.kind}:${d.group}:${d.idx.join(',')}`] = 'duplicate';
  for (const [u, d] of Object.entries(v.draws)) if (d.practice_sets_with_duplicate || d.tests_with_duplicate) content[`draws:${u}`] = 'duplicate in draws';
  for (const q of v.vocab || []) content[`vocab:${q.unit}:${q.idx}:${q.issue}`] = 'vocab';
  compare('item verification', content, 'content.json');

  // Regression cases: each key fixed in Phase 1 must keep its corrected value and keep matching the solver.
  const regs = read(path.join(ROOT, 'tests/content-regressions.json'));
  const items = read(path.join(OUT, 'items.json'));
  const keyOf = id => { const [f, kind, group, idx] = id.split(':'); const it = items[f].items.find(i => i.kind === kind && i.group === group && String(i.idx) === idx); return it && it.a; };
  const byId = Object.fromEntries(v.items.map(i => [i.id, i]));
  const bad = regs.filter(r => keyOf(r.id) !== r.key || !byId[r.id] || byId[r.id].status !== 'match')
    .map(r => `${r.id}: key ${JSON.stringify(keyOf(r.id))}, solver ${byId[r.id] && byId[r.id].status} (${r.finding})`);
  results.push({ name: 'content regression cases', status: bad.length ? 'FAIL' : 'pass', detail: bad.join('\n      ') || `${regs.length} fixed keys hold` });
}

// 2. Checker corpus: no answer accepted in the baseline may now be rejected
{
  const r = run('node', ['tests/run-checker-corpus.mjs', '--check']);
  const regress = r.status !== 0;
  results.push({ name: 'checker: no accepted answer becomes rejected', status: regress ? 'FAIL' : 'pass',
    detail: regress ? r.stdout.split('\n').filter(l => /REGRESSION/.test(l)).join('\n      ') : 'baseline holds (tests/checker-baseline.json)' });
  const run_ = read(path.join(OUT, 'checker-run.json'));
  const wrong = {};
  for (const c of run_.results) if (c.verdict === 'CORRECT-REJECTED' || c.verdict === 'WRONG-ACCEPTED') wrong[`#${c.id}`] = c.verdict;
  if (!Object.values(run_.identity).every(i => i.shared && i.matchesIsShared && i.lexical === true))
    results.push({ name: 'checker: every page grades with the shared isMatch', status: 'FAIL', detail: JSON.stringify(run_.identity) });
  const byId = Object.fromEntries(run_.results.map(c => [`#${c.id}`, c]));
  compare('checker corpus verdicts', wrong, 'checker.json', k => `${k} ${JSON.stringify(byId[k] ? byId[k].input : '')} vs ${JSON.stringify(byId[k] ? byId[k].key : '')}`);
}

// 3. Key round-trip: each key, typed in normal notation, must be accepted
{
  run('node', ['tests/run-key-roundtrip.mjs']);
  const k = read(path.join(OUT, 'key-roundtrip.json'));
  compare('key round-trip', Object.fromEntries(k.rejected.map(r => [r.id, 'rejected'])), 'key-roundtrip.json');
}

// 4. Maths a screen reader can read: Chrome's accessibility tree for sample problems
{
  run('node', ['tools/probe-math-a11y.mjs']);
  const got = read(path.join(OUT, 'math-a11y.json'));
  const want = read(path.join(ROOT, 'tests/math-speech.json'));
  const sq = s => s.replace(/\s+/g, ' ').trim();
  const bad = got.filter(g => want[g.source] !== undefined && sq(g.axReading) !== sq(want[g.source]))
    .map(g => `${g.source}: heard "${sq(g.axReading)}", want "${want[g.source]}"`);
  const missing = Object.keys(want).filter(k => !got.some(g => g.source === k));
  results.push({ name: 'maths read by assistive technology', status: bad.length || missing.length ? 'FAIL' : 'pass',
    detail: [...bad, ...missing.map(m => 'no sample: ' + m)].join('\n      ') || `${Object.keys(want).length} samples read as intended` });
}

// 5. Student-experience checks through the real UI (all must pass)
{
  const r = run('node', ['tests/run-ux.mjs', '--check']);
  const lines = r.stdout.split('\n').filter(l => /^FAIL/.test(l));
  const n = r.stdout.split('\n').filter(l => /^ok/.test(l)).length;
  results.push({ name: 'student experience (tests/run-ux.mjs)', status: r.status ? 'FAIL' : 'pass', detail: lines.join('\n      ') || `${n} checks pass` });
}

// 6. axe-core on every page and view
if (!process.argv.includes('--skip-axe')) {
  run('node', ['tests/run-axe.mjs']);
  const a = read(path.join(OUT, 'axe-run.json'));
  if (a.errors.length) results.push({ name: 'axe: views reachable', status: 'FAIL', detail: a.errors.join('\n      ') });
  compare('axe violations', a.violations, 'axe.json');
}

console.log('');
for (const r of results) console.log(`${r.status.padEnd(16)} ${r.name}\n      ${r.detail}`);
const failed = results.filter(r => r.status === 'FAIL' || r.status === 'UPDATE-EXPECTED');
if (failed.some(r => r.status === 'UPDATE-EXPECTED'))
  console.log('\nSome known failures are now fixed. If that is intended, run: node tests/run-all.mjs --update-expected');
process.exit(failed.length ? 1 : 0);
