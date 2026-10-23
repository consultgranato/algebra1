// axe-core over every page and every view a student reaches, desktop and 390px.
// Writes $A1_RAW/axe-run.json: { "<page>|<viewport>|<state>|<rule>": nodeCount }.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { RAW, PAGES, serve, browser, localOnly } from '../tools/lib/site.mjs';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('../tools/node_modules/axe-core/axe.min.js'), 'utf8');
const VIEWPORTS = { desktop: { viewport: { width: 1280, height: 800 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } };

/* Practice sets and quizzes are random; seed Math.random in the page (test only) so
   every run sees the same questions and axe counts are comparable. */
const SEED = `(() => { let a = 219; Math.random = function () { a |= 0; a = a + 0x6D2B79F5 | 0;
  let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();`;

function states(page) {
  const tab = v => page.click(`.tabs .tab[data-view="${v}"]`);
  return [
    ['initial', async () => {}],
    ['notes-modal', async () => { await page.click('.tg-card'); await page.waitForTimeout(200); }],
    ['vocab-quiz', async () => { await page.keyboard.press('Escape'); await tab('vocab'); const b = await page.$$('.vstab'); if (b[1]) await b[1].click(); }],
    ['vocab-quiz-match', async () => {
      // filter to a topic that has a matching question, so its dropdowns are always checked
      const t = await page.evaluate(() => { try { const q = VQB.find(x => x.type === 'match'); return q ? q.topic : null; } catch (e) { return null; } });
      if (!t) return;
      for (let i = 0; i < 20; i++) {
        await page.click(`.pqf-btn[onclick*="'${t}'"]`);
        if (await page.$('.match-sel')) break;
      }
    }],
    ['practice', async () => { await tab('practice'); await page.waitForSelector('#plist .ai'); }],
    ['practice-feedback', async () => {
      await page.fill('#pa0', 'zzz'); await page.press('#pa0', 'Enter');
      await page.fill('#pa1', 'zzz'); await page.press('#pa1', 'Enter'); await page.fill('#pa1', 'zzz'); await page.press('#pa1', 'Enter');
    }],
    ['test', async () => { await tab('test'); await page.waitForSelector('#tlist .ai'); }],
    ['test-graded', async () => {
      page.once('dialog', d => d.accept());
      await page.click('#sbtn'); await page.waitForTimeout(250);
      // a blank-answer confirmation step (Phase 1) may need a second click
      const confirm = await page.$('[data-a1-confirm-submit]'); if (confirm) { await confirm.click(); await page.waitForTimeout(250); }
    }],
  ];
}

const { server, base } = await serve();
const b = await browser();
const out = {};
const errors = [];
try {
  for (const [vp, opts] of Object.entries(VIEWPORTS)) {
    for (const file of PAGES) {
      const ctx = await b.newContext(opts);
      const page = await ctx.newPage();
      await page.addInitScript(SEED);
      await localOnly(page, base);
      await page.goto(base + file, { waitUntil: 'load' });
      const list = file === 'index.html' ? [['initial', async () => {}]] : states(page);
      for (const [name, act] of list) {
        try { await act(); } catch (e) { errors.push(`${file} ${vp} ${name}: ${String(e).split('\n')[0]}`); continue; }
        await page.addScriptTag({ content: AXE });
        const res = await page.evaluate(() => window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
          resultTypes: ['violations'] }));
        for (const v of res.violations) out[`${file}|${vp}|${name}|${v.id}`] = v.nodes.length;
      }
      await ctx.close();
    }
  }
} finally {
  await b.close();
  server.close();
}
fs.mkdirSync(RAW, { recursive: true });
fs.writeFileSync(path.join(RAW, 'axe-run.json'), JSON.stringify({ violations: out, errors }, null, 1));
console.log(`axe: ${Object.keys(out).length} page/view/rule combinations with violations, ${errors.length} state errors`);
errors.forEach(e => console.log('  state error:', e));
