// Phase 1 screenshots at the three sizes the brief names.
// Output: audit/after/screens/<size>-<view>.png
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, browser, localOnly } from './lib/site.mjs';

const OUT = path.join(ROOT, 'audit/after/screens');
fs.mkdirSync(OUT, { recursive: true });
const SIZES = { '360x740': { width: 360, height: 740, m: true }, '390x844': { width: 390, height: 844, m: true }, '1280x800': { width: 1280, height: 800 } };
const SEED = `(() => { let a = 7; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;
const typed = k => String(k).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<\/?[a-z][^<>]*>/gi, '').replace(/[−–]/g, '-');

const { server, base } = await serve();
const b = await browser();
for (const [name, s] of Object.entries(SIZES)) {
  const ctx = await b.newContext({ viewport: { width: s.width, height: s.height }, isMobile: !!s.m, hasTouch: !!s.m, deviceScaleFactor: s.m ? 2 : 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.addInitScript(SEED);
  await localOnly(page, base);
  const shot = async view => page.screenshot({ path: path.join(OUT, `${name}-${view}.png`) });

  await page.goto(base + 'index.html');
  await page.evaluate(() => localStorage.setItem('alg1.progress.v1', JSON.stringify({ '5': { notesRead: { '0': true }, practice: { '5.1': { attempts: 2, last: 80, best: 100 } }, vocab: { attempts: 1, last: 75, best: 75 }, updated: Date.now() } })));
  await page.reload();
  await shot('1-home');

  await page.goto(base + 'unit5.html');
  await shot('2-unit');

  await page.click('.tg-card:nth-child(2) .a1-tg-open');
  await page.waitForTimeout(300);
  await shot('3-notes-modal');
  await page.keyboard.press('Escape');

  await page.click('.tabs .tab[data-view="practice"]');
  await page.click('.tpbtns .tpbtn:nth-child(2)');
  await page.waitForSelector('#pa0');
  const k = await page.evaluate(() => pset.map(p => p.a));
  await page.fill('#pa0', typed(k[0])); await page.press('#pa0', 'Enter');
  await page.fill('#pa1', 'x = 9'); await page.press('#pa1', 'Enter');
  await page.evaluate(() => document.getElementById('pc0').scrollIntoView({ block: 'start' }));
  await shot('4-practice');

  if (s.m) {
    await page.click('#v-practice .a1-calc-toggle');
    await page.waitForTimeout(200);
    await shot('5-calculator-open');
    await page.click('#v-practice .a1-calc-toggle');
  }

  await page.click('.tabs .tab[data-view="test"]');
  await page.waitForSelector('#ta0');
  const tk = await page.evaluate(() => tset.map(p => p.a));
  for (let i = 0; i < 12; i++) await page.fill('#ta' + i, typed(tk[i]));
  await page.fill('#ta12', '7');
  await page.click('#sbtn');
  await page.evaluate(() => document.getElementById('a1-blank-warn').scrollIntoView({ block: 'center' }));
  await shot('6-test-blank-warning');

  await page.click('[data-a1-confirm-submit]');
  await page.waitForTimeout(300);
  await page.evaluate(() => document.getElementById('sbar').scrollIntoView({ block: 'start' }));
  await shot('7-results');
  await page.evaluate(() => document.getElementById('t-results').scrollIntoView({ block: 'start' }));
  await shot('8-results-by-topic');
  await ctx.close();
  console.log(name, 'done');
}
await b.close();
server.close();
