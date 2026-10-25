// Student-experience checks, driven through the real UI. Every check must pass.
// Writes $A1_RAW/ux-run.json and screenshots to $A1_RAW/shots/.
import fs from 'node:fs';
import path from 'node:path';
import { RAW, serve, browser, localOnly } from '../tools/lib/site.mjs';

const SHOTS = path.join(RAW, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serve();
const b = await browser();
const checks = [];
const ok = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
const typed = k => String(k).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<\/?[a-z][^<>]*>/gi, '').replace(/[−–]/g, '-');

async function open(file, vp = { width: 1280, height: 800 }, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, ...extra });
  const page = await ctx.newPage();
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await localOnly(page, base);
  await page.goto(base + file);
  return { ctx, page, dialogs, errors };
}
const qs = page => page.$$eval('#tlist .pcard', cs => cs.map(c => c.querySelector('.pq-q').textContent + '|' + ((c.querySelector('.pmath') || {}).textContent || '')));

try {
  // 1. The practice test survives a refresh; Retake starts a new one
  {
    const { ctx, page, errors } = await open('unit8.html');
    await page.click('.tabs .tab[data-view="test"]');
    await page.waitForSelector('#ta0');
    const before = await qs(page);
    for (let i = 0; i < 3; i++) await page.fill('#ta' + i, 'answer ' + i);
    ok('test: URL names the view', page.url().endsWith('#test'), page.url());
    await page.reload();
    await page.waitForSelector('#ta0');
    const after = await qs(page);
    const vals = await page.$$eval('#tlist .ai', is => is.slice(0, 4).map(i => i.value));
    ok('test: reload returns to the test', await page.$eval('.tabs .tab.on', t => t.dataset.view) === 'test');
    ok('test: same questions after reload', JSON.stringify(before) === JSON.stringify(after), `${before.length} questions`);
    ok('test: typed answers restored', vals.join('|') === 'answer 0|answer 1|answer 2|', vals.join('|'));
    ok('test: restored answers are announced', /still here/.test(await page.textContent('.a1-restored').catch(() => '')));
    await page.click('#sbtn');                                   // blanks remain -> warning
    await page.click('[data-a1-confirm-submit]');
    ok('test: saved answers cleared on submit', await page.evaluate(() => localStorage.getItem('alg1.test.v1.8')) === null);
    await page.click('#rbtn');
    const retake = await qs(page);
    ok('test: Retake draws a new set', JSON.stringify(retake) !== JSON.stringify(before));
    ok('test: no page errors', !errors.length, errors.join(' '));
    await ctx.close();
  }

  // 2. Deep links
  {
    const { ctx, page } = await open('unit8.html#practice/8.3');
    await page.waitForSelector('#pa0');
    ok('deep link: #practice/8.3 opens practice on 8.3', await page.evaluate(() => curTopic) === '8.3' && await page.$eval('.tabs .tab.on', t => t.dataset.view) === 'practice');
    await page.click('.tabs .tab[data-view="vocab"]');
    ok('deep link: tab click updates the URL', page.url().endsWith('#vocab'), page.url());
    await page.goto(base + 'unit15.html#notes');
    ok('deep link: #notes', await page.$eval('.tabs .tab.on', t => t.dataset.view) === 'notes');
    await ctx.close();
  }

  // 3+4. Blank warning, Skipped state, focus, results sorted with links
  {
    const { ctx, page, dialogs } = await open('unit6.html');
    await page.click('.tabs .tab[data-view="test"]');
    await page.waitForSelector('#ta0');
    const keys = await page.evaluate(() => tset.map(p => p.a));
    for (let i = 0; i < 6; i++) await page.fill('#ta' + i, typed(keys[i]));
    await page.click('#sbtn');
    const warned = await page.$('#a1-blank-warn');
    ok('blank: warning shown before grading', !!warned && (await page.textContent('#snum')).trim() === '', warned ? (await warned.textContent()).slice(0, 80) : 'none');
    ok('blank: warning has focus', await page.evaluate(() => !!document.activeElement.closest('#a1-blank-warn')));
    await page.click('[data-a1-goto-blank]');
    ok('blank: "Go to question" focuses the first blank', await page.evaluate(() => document.activeElement.id) === 'ta6');
    await page.click('#sbtn');
    await page.click('[data-a1-confirm-submit]');
    await page.waitForTimeout(300);
    ok('blank: no native dialog', dialogs.length === 0, dialogs.join(' '));
    ok('blank: graded after confirming', /\/25/.test(await page.textContent('#snum')), await page.textContent('#snum'));
    ok('blank: blank cards say Skipped', await page.evaluate(() => document.querySelectorAll('#tlist .pcard.a1-skipped .a1-skip-tag').length) === 19);
    ok('results: focus moves to the score', await page.evaluate(() => document.activeElement.id) === 'sbar');
    const pcts = await page.$$eval('#t-results-body .tr-pct', ps => ps.map(p => parseInt(p.textContent)));
    ok('results: weakest first', pcts.every((v, i) => !i || pcts[i - 1] <= v), pcts.join(','));
    const links = await page.$$eval('#t-results-body .tr-row', rs => rs.map(r => r.querySelectorAll('.a1-tr-link').length));
    ok('results: every row links to notes and practice', links.every(n => n === 2), links.join(','));
    await page.waitForTimeout(800);
    await (await page.$('#t-results')).screenshot({ path: path.join(SHOTS, 'ux-results-desktop.png') });
    await page.click('#t-results-body .tr-row:first-child .a1-tr-link:last-child');
    ok('results: Practice link opens practice', await page.$eval('.tabs .tab.on', t => t.dataset.view) === 'practice');
    await ctx.close();
  }

  // 5+6. Phone: calculator sheet, streak pill
  {
    const { ctx, page } = await open('unit5.html', { width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await page.click('.tabs .tab[data-view="practice"]');
    await page.waitForSelector('#pa0');
    const sheet = await page.evaluate(() => {
      const col = document.querySelector('#v-practice .pt-calc-col'), t = col.querySelector('.a1-calc-toggle');
      const r = t.getBoundingClientRect();
      return { fixed: getComputedStyle(col).position === 'fixed', toggleBottom: Math.round(r.bottom), vh: innerHeight, toggleH: Math.round(r.height),
        boxHidden: getComputedStyle(col.querySelector('.calc-box')).display === 'none' };
    });
    ok('phone: calculator is a sheet at the bottom', sheet.fixed && Math.abs(sheet.toggleBottom - sheet.vh) < 70 && sheet.toggleH >= 44, JSON.stringify(sheet));
    ok('phone: sheet starts closed', sheet.boxHidden);
    await page.click('#v-practice .a1-calc-toggle');
    const keys = await page.$$eval('#v-practice .ckey', ks => ks.map(k => Math.round(k.getBoundingClientRect().height)));
    ok('phone: calculator keys at least 44px', keys.length && keys.every(h => h >= 44), keys.slice(0, 4).join(','));
    await page.screenshot({ path: path.join(SHOTS, 'ux-calculator-open-390.png') });
    await page.click('#v-practice .a1-calc-toggle');
    ok('phone: empty streak pill hidden', await page.$eval('#a1-streak', e => getComputedStyle(e).display) === 'none');
    const keys5 = await page.evaluate(() => pset.map(p => p.a));
    for (let i = 0; i < 2; i++) { await page.fill('#pa' + i, typed(keys5[i])); await page.press('#pa' + i, 'Enter'); }
    const pill = await page.$eval('#a1-streak', e => ({ shown: getComputedStyle(e).display !== 'none', text: e.textContent }));
    ok('phone: streak pill shows text once there is a streak', pill.shown && /2 in a row/.test(pill.text), JSON.stringify(pill));
    await ctx.close();
  }

  // 7. Clear all: outside any heading, in-page confirmation
  {
    const { ctx, page, dialogs } = await open('index.html');
    await page.evaluate(() => localStorage.setItem('alg1.progress.v1', JSON.stringify({ '5': { vocab: { attempts: 1, last: 50, best: 50 }, updated: 1 } })));
    await page.reload();
    ok('clear all: not inside a heading', await page.$eval('#a1-reset-all', b => !b.closest('h1,h2,h3,h4,h5,h6')));
    await page.click('#a1-reset-all');
    ok('clear all: in-page confirmation, no native dialog', !!(await page.$('.a1-confirm')) && !dialogs.length);
    await page.click('.a1-confirm [data-no]');
    ok('clear all: Cancel keeps progress and returns focus', await page.evaluate(() => !!localStorage.getItem('alg1.progress.v1') && document.activeElement.id === 'a1-reset-all'));
    await page.click('#a1-reset-all');
    await page.click('.a1-confirm [data-yes]');
    await page.waitForLoadState('load');
    ok('clear all: Delete clears progress', await page.evaluate(() => JSON.stringify(JSON.parse(localStorage.getItem('alg1.progress.v1') || '{}'))) === '{}');
    await ctx.close();
  }

  // 8. Unit Reset asks first; target is large enough
  {
    const { ctx, page } = await open('unit5.html', { width: 390, height: 844 }, { isMobile: true });
    await page.evaluate(() => localStorage.setItem('alg1.progress.v1', JSON.stringify({ '5': { vocab: { attempts: 1, last: 50, best: 50 }, updated: 1 } })));
    await page.reload();
    const h = await page.$eval('#a1-reset', b => b.getBoundingClientRect().height);
    ok('reset: target at least 44px tall', h >= 44, h);
    await page.click('#a1-reset');
    ok('reset: asks before deleting', !!(await page.$('.a1-confirm')) && await page.evaluate(() => !!JSON.parse(localStorage.getItem('alg1.progress.v1'))['5']));
    await page.click('.a1-confirm [data-yes]');
    ok('reset: deletes after confirming', await page.evaluate(() => !JSON.parse(localStorage.getItem('alg1.progress.v1'))['5']));
    await ctx.close();
  }

  // 9+10. Index and unit agree; an old-shape record loads intact
  {
    const OLD = {
      '10': { practice: { '10.1': { attempts: 1, last: 100, best: 100 } }, updated: 1700000000000 },
      '5': { notesRead: { '0': true, '1': true }, practice: { '5.1': { attempts: 3, last: 80, best: 100 }, '5.4': { attempts: 1, last: 40, best: 40 } },
        test: { attempts: 1, last: 65, best: 65 }, vocab: { attempts: 2, last: 75, best: 83 }, updated: 1700000001000 },
      '1-4': { notesRead: { '3': true }, updated: 1700000002000 }
    };
    const { ctx, page, errors } = await open('index.html');
    await page.evaluate(o => localStorage.setItem('alg1.progress.v1', JSON.stringify(o)), OLD);
    await page.goto(base + 'unit5.html');
    const unitPct = (await page.textContent('.a1-hero-ring .a1-ring-pct')).trim();
    const chips = await page.$$eval('.a1-chip', cs => cs.map(c => c.textContent));
    await page.goto(base + 'unit10.html');
    const u10 = (await page.textContent('.a1-hero-ring .a1-ring-pct')).trim();
    await page.goto(base + 'index.html');
    const cards = await page.$$eval('.unit-card', cs => Object.fromEntries(cs.map(c => [c.querySelector('.u-badge').textContent.trim(), (c.querySelector('.u-state') || {}).textContent])));
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('alg1.progress.v1')));
    const intact = Object.keys(OLD).every(u => Object.keys(OLD[u]).every(k => JSON.stringify(OLD[u][k]) === JSON.stringify(stored[u][k])));
    ok('old progress: every original field unchanged', intact, JSON.stringify(stored).slice(0, 300));
    ok('old progress: unit 5 shows its saved scores', chips.join(' ').includes('Notes2/4') && chips.join(' ').includes('83%') && chips.join(' ').includes('65%'), chips.join(' | '));
    ok('index and unit page agree (unit 5)', cards['5'] === unitPct || (cards['5'] === 'Strong' && parseInt(unitPct) >= 80), `unit ${unitPct}, index ${cards['5']}`);
    ok('index and unit page agree (unit 10)', cards['10'] === u10, `unit ${u10}, index ${cards['10']}`);
    ok('old progress: unit never opened keeps the old estimate', cards['1–4'] !== undefined, JSON.stringify(cards));
    ok('old progress: no page errors', !errors.length, errors.join(' '));
    fs.writeFileSync(path.join(RAW, 'progress-compat.json'), JSON.stringify({ seeded: OLD, after: stored, unit5: { pct: unitPct, chips }, unit10: u10, index: cards }, null, 1));
    await ctx.close();
  }
} finally {
  await b.close();
  server.close();
}
fs.writeFileSync(path.join(RAW, 'ux-run.json'), JSON.stringify(checks, null, 1));
for (const c of checks) console.log(`${c.pass ? 'ok  ' : 'FAIL'} ${c.name}${c.pass ? '' : '  — ' + c.detail}`);
process.exit(checks.every(c => c.pass) ? 0 : 1);
