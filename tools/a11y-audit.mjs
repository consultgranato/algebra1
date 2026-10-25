// Accessibility baseline: axe-core plus a DOM walk, on index + three unit pages,
// in every view a student reaches (notes, modal, vocab, quiz, practice, feedback,
// test, graded test), at desktop and 390px mobile.
// Output: audit/raw/axe/<page>-<viewport>-<state>.json and audit/raw/a11y-domwalk.json
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, RAW, serve, browser, localOnly } from './lib/site.mjs';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const OUT = path.join(RAW, 'axe');
fs.mkdirSync(OUT, { recursive: true });

const PAGES = ['index.html', 'unit1-4.html', 'unit5.html', 'unit15.html'];
const VIEWPORTS = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true } };

/* Runs in the page: everything axe does not measure the way the brief asks. */
function domWalk() {
  const out = { lowContrast: [], smallText: [], smallTargets: [], imgNoAlt: [], headings: [], h1Count: 0, newTabLinks: [], dialogs: [] };
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = el => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { unknown: true, why: 'background image/gradient on ' + (e.className || e.tagName) };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
    return bg;
  };
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity !== 0; };
  const sel = el => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].join('.') : ''));
  const seenC = new Set(), seenS = new Set();
  document.querySelectorAll('body *').forEach(el => {
    const direct = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!direct || !visible(el) || el.closest('svg')) return;
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const fg = parse(cs.color); const bg = bgOf(el);
    if (fg && !bg.unknown) {
      const f = blend(fg, bg);
      const L1 = lum(f), L2 = lum(bg);
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const large = px >= 24 || (bold && px >= 18.66);
      const need = large ? 3 : 4.5;
      const key = sel(el) + '|' + cs.color + '|' + (bg.r + ',' + bg.g + ',' + bg.b);
      if (ratio < need && !seenC.has(key)) {
        seenC.add(key);
        out.lowContrast.push({ el: sel(el), text: direct.slice(0, 40), ratio: +ratio.toFixed(2), need, fontPx: px, color: cs.color, bg: `rgb(${bg.r | 0},${bg.g | 0},${bg.b | 0})` });
      }
    }
    if (px < 12) { const k = sel(el) + px; if (!seenS.has(k)) { seenS.add(k); out.smallText.push({ el: sel(el), text: direct.slice(0, 40), fontPx: px }); } }
  });
  const seenT = new Set();
  document.querySelectorAll('a[href],button,input,select,textarea,[role=button],[role=tab],[tabindex]:not([tabindex="-1"])').forEach(el => {
    if (!visible(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) {
      const k = sel(el) + Math.round(r.width) + 'x' + Math.round(r.height);
      if (!seenT.has(k)) { seenT.add(k); out.smallTargets.push({ el: sel(el), text: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }); }
    }
  });
  document.querySelectorAll('img').forEach(img => { if (!img.hasAttribute('alt')) out.imgNoAlt.push({ src: img.getAttribute('src'), inModal: !!img.closest('#topic-overlay') }); });
  document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]').forEach(h => out.headings.push({ level: h.getAttribute('aria-level') || h.tagName, text: h.textContent.trim().slice(0, 50), visible: visible(h) }));
  out.h1Count = document.querySelectorAll('h1').length;
  document.querySelectorAll('a[target=_blank]').forEach(a => out.newTabLinks.push({ text: a.textContent.trim().slice(0, 40), href: a.getAttribute('href'), warns: /new (tab|window)/i.test((a.getAttribute('aria-label') || '') + a.textContent) }));
  document.querySelectorAll('[role=dialog],dialog,.topic-modal,.desmos-modal').forEach(d => out.dialogs.push({ el: sel(d), role: d.getAttribute('role'), ariaModal: d.getAttribute('aria-modal'), name: d.getAttribute('aria-label') || (d.getAttribute('aria-labelledby') && (document.getElementById(d.getAttribute('aria-labelledby')) || {}).textContent) || null, visible: visible(d) }));
  return out;
}

async function states(page, file) {
  const s = [['initial', async () => {}]];
  if (file === 'index.html') return s;
  const tab = v => page.click(`.tabs .tab[data-view="${v}"]`);
  s.push(['notes-modal', async () => { await page.click('.tg-card'); await page.waitForTimeout(300); }]);
  s.push(['vocab-cards', async () => { await page.keyboard.press('Escape'); await tab('vocab'); }]);
  s.push(['vocab-quiz', async () => { const b = await page.$$('.vstab'); if (b[1]) await b[1].click(); }]);
  s.push(['practice', async () => { await tab('practice'); await page.waitForSelector('#plist .ai'); }]);
  s.push(['practice-feedback', async () => {
    await page.fill('#pa0', 'zzz'); await page.press('#pa0', 'Enter');
    const hb = await page.$('#pfb0 .a1-fb-hint'); if (hb) await hb.click();
    await page.fill('#pa1', 'zzz'); await page.press('#pa1', 'Enter'); await page.fill('#pa1', 'zzz'); await page.press('#pa1', 'Enter');
  }]);
  s.push(['test', async () => { await tab('test'); await page.waitForSelector('#tlist .ai'); }]);
  s.push(['test-graded', async () => { await page.click('#sbtn'); await page.waitForTimeout(300); }]);
  return s;
}

const { server, base } = await serve();
const b = await browser();
const domwalk = {};
const summary = [];
try {
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const file of PAGES) {
      const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.isMobile ? 3 : 1 });
      const page = await ctx.newPage();
      await localOnly(page, base);
      await page.goto(base + file, { waitUntil: 'load' });
      for (const [name, act] of await states(page, file)) {
        try { await act(); } catch (e) { summary.push({ file, vpName, name, error: String(e).slice(0, 200) }); continue; }
        await page.addScriptTag({ content: AXE });
        const axe = await page.evaluate(async () => await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
          resultTypes: ['violations', 'incomplete']
        }));
        const tag = `${file.replace('.html', '')}-${vpName}-${name}`;
        fs.writeFileSync(path.join(OUT, tag + '.json'), JSON.stringify(axe, null, 1));
        domwalk[tag] = await page.evaluate(domWalk);
        summary.push({ file, vpName, name, violations: axe.violations.map(v => `${v.id}(${v.impact}) x${v.nodes.length}`) });
      }
      await ctx.close();
    }
  }
} finally {
  await b.close();
  server.close();
}
fs.writeFileSync(path.join(RAW, 'a11y-domwalk.json'), JSON.stringify(domwalk, null, 1));
fs.writeFileSync(path.join(RAW, 'a11y-summary.json'), JSON.stringify(summary, null, 1));
for (const s of summary) console.log(s.vpName.padEnd(8), s.file.padEnd(13), (s.name || '').padEnd(18), s.error || s.violations.join(' '));
