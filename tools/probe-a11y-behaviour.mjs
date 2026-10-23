// Behavioural accessibility checks that axe cannot make:
//  - reflow at 200% and 400% zoom (WCAG 1.4.4 / 1.4.10): 1280px desktop at 400% = 320 CSS px
//  - prefers-reduced-motion
//  - forced-colors (Windows High Contrast) screenshots
//  - keyboard-only operation: tab order, tablist arrows, notes modal, practice, quiz, calculator, test
// Output: audit/raw/a11y-behaviour.json and screenshots in audit/raw/shots/
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, browser, localOnly } from './lib/site.mjs';

const SHOTS = path.join(ROOT, 'audit/raw/shots');
fs.mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serve();
const b = await browser();
const out = { reflow: [], motion: {}, forcedColors: [], keyboard: {} };

const overflow = () => {
  const W = document.documentElement.clientWidth;
  const offenders = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > W + 1) {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll' || o === 'hidden') return;
      }
      offenders.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + [...el.classList].join('.')) + ` right=${Math.round(r.right)}`);
    }
  });
  return { viewport: W, scrollWidth: document.documentElement.scrollWidth, horizontalScroll: document.documentElement.scrollWidth > W + 1, offenders: offenders.slice(0, 12) };
};

async function goView(page, view) {
  if (view === 'notes') return;
  if (view === 'modal') { await page.click('.tg-card'); await page.waitForTimeout(250); return; }
  await page.click(`.tabs .tab[data-view="${view}"]`);
  await page.waitForTimeout(150);
}

// ---- reflow ----
for (const [label, vp] of [['200%', { width: 640, height: 400 }], ['400%', { width: 320, height: 256 }]]) {
  for (const [file, views] of [['index.html', ['notes']], ['unit5.html', ['notes', 'modal', 'practice', 'test']], ['unit15.html', ['practice']]]) {
    for (const view of views) {
      const ctx = await b.newContext({ viewport: vp });
      const page = await ctx.newPage();
      await localOnly(page, base);
      await page.goto(base + file);
      await goView(page, view);
      const r = await page.evaluate(overflow);
      const shot = `reflow-${label.replace('%', '')}-${file.replace('.html', '')}-${view}.png`;
      await page.screenshot({ path: path.join(SHOTS, shot) });
      out.reflow.push({ zoom: label, file, view, ...r, shot });
      await ctx.close();
    }
  }
}

// ---- reduced motion ----
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await localOnly(page, base);
  await page.goto(base + 'unit5.html');
  const css = fs.readFileSync(path.join(ROOT, 'assets/algebra1.css'), 'utf8');
  out.motion.cssHasReducedMotionQuery = /prefers-reduced-motion/.test(css);
  out.motion.cssRulesInsideQuery = (css.match(/@media\s*\(prefers-reduced-motion[^{]*\{([\s\S]*?)\n\}/) || [])[1] || null;
  await page.click('.tabs .tab[data-view="practice"]');
  await page.waitForSelector('#pa0');
  const key = await page.evaluate(() => pset[0].a);
  await page.fill('#pa0', key.replace(/<[^>]+>/g, ''));
  await page.press('#pa0', 'Enter');
  out.motion.runningAnimationsAfterCorrect = await page.evaluate(() => document.getAnimations().map(a => ({ name: a.animationName || a.transitionProperty || a.constructor.name, target: a.effect && a.effect.target && a.effect.target.className })));
  out.motion.smoothScrollCallsInSource = fs.readdirSync(ROOT).filter(f => /^unit.*\.html$/.test(f))
    .map(f => [f, (fs.readFileSync(path.join(ROOT, f), 'utf8').match(/behavior:'smooth'/g) || []).length]).filter(x => x[1]);
  await ctx.close();
}

// ---- forced colours ----
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, forcedColors: 'active', colorScheme: 'dark' });
  const page = await ctx.newPage();
  await localOnly(page, base);
  await page.goto(base + 'unit5.html');
  await page.screenshot({ path: path.join(SHOTS, 'forced-colors-unit5-notes.png') });
  await page.click('.tabs .tab[data-view="practice"]');
  await page.waitForSelector('#pa0');
  const key = await page.evaluate(() => pset[0].a);
  await page.fill('#pa0', key); await page.press('#pa0', 'Enter');
  await page.fill('#pa1', 'zzz'); await page.press('#pa1', 'Enter'); await page.fill('#pa1', 'zzz'); await page.press('#pa1', 'Enter');
  await page.screenshot({ path: path.join(SHOTS, 'forced-colors-unit5-practice-feedback.png'), fullPage: false });
  await page.click('.tabs .tab[data-view="vocab"]');
  const q = await page.$$('.vstab'); await q[1].click();
  await page.click('#vqo0_0'); await page.click('#vq-sbtn');
  await page.screenshot({ path: path.join(SHOTS, 'forced-colors-unit5-vocab-graded.png') });
  out.forcedColors.push({ shots: ['forced-colors-unit5-notes.png', 'forced-colors-unit5-practice-feedback.png', 'forced-colors-unit5-vocab-graded.png'],
    selectedTabDistinguishable: await page.evaluate(() => { const on = document.querySelector('.tab.on'), off = document.querySelector('.tab:not(.on)'); const a = getComputedStyle(on), z = getComputedStyle(off); return a.borderBottomStyle !== z.borderBottomStyle || a.borderBottomWidth !== z.borderBottomWidth || a.fontWeight !== z.fontWeight || a.textDecorationLine !== z.textDecorationLine || a.outlineStyle !== z.outlineStyle; }) });
  await ctx.close();
}

// ---- keyboard ----
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await localOnly(page, base);
  await page.goto(base + 'unit5.html');
  const desc = () => page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'body'; const cs = getComputedStyle(e); const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || /rgb/.test(cs.boxShadow); return `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 28)}" focusRing=${ring}`; });
  const order = [];
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); order.push(await desc()); }
  out.keyboard.first30Tabs = order;

  await page.focus('#tab-notes');
  await page.keyboard.press('ArrowRight');
  out.keyboard.arrowRightFromNotes = await desc();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  out.keyboard.backToNotes = await desc();

  await page.focus('.tg-card');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  out.keyboard.modalOpenFocus = await desc();
  const trap = [];
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); trap.push(await page.evaluate(() => !!document.activeElement.closest('.topic-modal'))); }
  out.keyboard.focusStaysInModalFor40Tabs = trap.every(Boolean);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  out.keyboard.afterEscape = { focus: await desc(), modalOpen: await page.evaluate(() => document.getElementById('topic-overlay').classList.contains('open')) };

  await page.focus('#tab-practice'); await page.keyboard.press('Enter');
  await page.waitForSelector('#pa0');
  await page.focus('#pa0');
  const key = await page.evaluate(() => pset[0].a);
  await page.keyboard.type(key.replace(/<[^>]+>/g, ''));
  await page.keyboard.press('Enter');
  out.keyboard.practiceEnterChecks = await page.evaluate(() => document.getElementById('pc0').classList.contains('ok'));
  out.keyboard.focusAfterCorrect = await desc();
  const hintReachable = [];
  await page.focus('#pa1'); await page.keyboard.type('zzz'); await page.keyboard.press('Enter');
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); hintReachable.push(await desc()); }
  out.keyboard.afterWrongTabs = hintReachable;

  // calculator
  await page.focus('#v-practice .calc-box');
  for (const k of ['7', '*', '6', 'Enter']) await page.keyboard.press(k);
  out.keyboard.calculatorTyped7x6 = await page.evaluate(() => document.querySelector('#v-practice .calc-val').textContent);
  out.keyboard.calculatorKeysAreButtons = await page.evaluate(() => [...document.querySelectorAll('#v-practice .ckey')].every(k => k.tagName === 'BUTTON'));

  // vocab quiz by keyboard
  await page.focus('#tab-vocab'); await page.keyboard.press('Enter');
  const vs = await page.$$('.vstab'); await vs[1].focus(); await page.keyboard.press('Enter');
  await page.focus('#vqo0_1'); await page.keyboard.press('Enter');
  out.keyboard.quizOptionSelectable = await page.evaluate(() => document.getElementById('vqo0_1').classList.contains('sel'));
  const matchSel = await page.$('.match-sel');
  out.keyboard.quizHasMatchSelects = !!matchSel;

  // test submit by keyboard, with blanks
  await page.focus('#tab-test'); await page.keyboard.press('Enter');
  await page.waitForSelector('#ta0');
  await page.focus('#sbtn'); await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  out.keyboard.testSubmittedWithAllBlank = await page.evaluate(() => ({ score: document.getElementById('snum').textContent, warned: false }));
  out.keyboard.focusAfterSubmit = await desc();
  await ctx.close();
}

await b.close();
server.close();
fs.writeFileSync(path.join(ROOT, 'audit/raw/a11y-behaviour.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ reflow: out.reflow.map(r => `${r.zoom} ${r.file} ${r.view}: hscroll=${r.horizontalScroll} sw=${r.scrollWidth} ${r.offenders.slice(0, 4).join(' ')}`), motion: { ...out.motion, cssRulesInsideQuery: (out.motion.cssRulesInsideQuery || '').slice(0, 300) }, forced: out.forcedColors, keyboard: out.keyboard }, null, 1));
