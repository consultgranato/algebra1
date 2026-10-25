// Reproduce, through the real UI, each issue reported from the teacher's own browser
// audit, plus the Unit 13 grading bug found by the checker corpus.
// Output: audit/raw/repro.json and audit/raw/shots/repro-*.png
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, browser, localOnly } from './lib/site.mjs';

const SH = f => path.join(ROOT, 'audit/raw/shots', f);
const { server, base } = await serve();
const b = await browser();
const R = {};
const typed = k => String(k).replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/[−–]/g, '-');

async function ctxPage(vp = { width: 1280, height: 800 }, extra = {}) {
  const ctx = await b.newContext({ viewport: vp, ...extra });
  const page = await ctx.newPage();
  await localOnly(page, base);
  return { ctx, page };
}

// 1+2. Test answers lost on refresh; set reshuffles; no deep links
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + 'unit8.html');
  await page.click('.tabs .tab[data-view="test"]');
  await page.waitForSelector('#ta0');
  const before = await page.$$eval('#tlist .pcard', cs => cs.map(c => (c.querySelector('.pq-q').textContent + ' ' + ((c.querySelector('.pmath') || {}).textContent || '')).trim()));
  for (let i = 0; i < 3; i++) await page.fill('#ta' + i, 'answer ' + i);
  const urlAfterTab = page.url();
  await page.reload();
  const viewAfterReload = await page.$eval('.tabs .tab.on', t => t.getAttribute('data-view'));
  await page.click('.tabs .tab[data-view="test"]');
  await page.waitForSelector('#ta0');
  const after = await page.$$eval('#tlist .pcard', cs => cs.map(c => (c.querySelector('.pq-q').textContent + ' ' + ((c.querySelector('.pmath') || {}).textContent || '')).trim()));
  const valuesAfter = await page.$$eval('#tlist .ai', is => is.slice(0, 3).map(i => i.value));
  const samePositions = before.filter((q, i) => q === after[i]).length;
  R.testLostOnRefresh = { urlAfterOpeningTest: urlAfterTab, viewAfterReload, typedAnswersAfterReload: valuesAfter,
    questionsInSamePositionAfterReload: `${samePositions}/${before.length}` };
  await ctx.close();
  // a fresh tab opened straight onto a hash, as a shared link would be
  for (const h of ['#test', '#practice', '#v-test']) {
    const c2 = await ctxPage();
    await c2.page.goto(base + 'unit8.html' + h);
    R.deepLink = R.deepLink || {};
    R.deepLink['unit8.html' + h + ' opens view'] = await c2.page.$eval('.tabs .tab.on', t => t.getAttribute('data-view'));
    await c2.page.click('.tabs .tab[data-view="practice"]');
    R.deepLink['url after clicking Practice (from ' + h + ')'] = c2.page.url().replace(base, '');
    await c2.ctx.close();
  }
}

// 3+4. Blank submit: no warning, blanks graded wrong; results order; links back to review
{
  const { ctx, page } = await ctxPage();
  const dialogs = [];
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  await page.goto(base + 'unit6.html');
  await page.click('.tabs .tab[data-view="test"]');
  await page.waitForSelector('#ta0');
  const tset = await page.evaluate(() => tset.map(p => p.a));
  // answer the first 5 correctly, leave the rest blank
  for (let i = 0; i < 5; i++) await page.fill('#ta' + i, typed(tset[i]));
  await page.click('#sbtn');
  await page.waitForTimeout(400);
  const blankCard = await page.evaluate(() => { const c = document.getElementById('tc10'); return { cls: c.className, feedback: document.getElementById('tfb10').textContent.trim().slice(0, 60) }; });
  const rows = await page.$$eval('#t-results-body .tr-row', rs => rs.map(r => ({ label: r.querySelector('.tr-label').textContent, pct: r.querySelector('.tr-pct').textContent, hasLinkOrButton: !!r.querySelector('a,button') })));
  R.blankSubmit = { nativeDialogs: dialogs, score: await page.textContent('#snum'), blankCardAfterGrading: blankCard,
    anyInPageWarning: await page.evaluate(() => /blank|unanswered|skipped/i.test(document.getElementById('v-test').textContent)) };
  R.resultsBreakdown = { rows, sortedByScore: rows.map(r => parseInt(r.pct)).every((v, i, a) => i === 0 || a[i - 1] <= v),
    anyRowLinksToNotesOrPractice: rows.some(r => r.hasLinkOrButton) };
  await page.screenshot({ path: SH('repro-test-results-desktop.png') });
  await ctx.close();
}

// 5+6. Mobile: calculator position, streak pill
{
  const { ctx, page } = await ctxPage({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.goto(base + 'unit5.html');
  await page.click('.tabs .tab[data-view="practice"]');
  await page.waitForSelector('#pa0');
  const geo = await page.evaluate(() => {
    const top = el => el.getBoundingClientRect().top + scrollY;
    const first = document.querySelector('#plist .pcard'), last = [...document.querySelectorAll('#plist .pcard')].pop();
    const calc = document.querySelector('#v-practice .calc-box');
    return { firstProblemTop: Math.round(top(first)), lastProblemBottom: Math.round(top(last) + last.offsetHeight), calcTop: Math.round(top(calc)) };
  });
  R.mobileCalculator = { ...geo, calcBelowFirstProblemPx: geo.calcTop - geo.firstProblemTop, calcBelowLastProblemPx: geo.calcTop - geo.lastProblemBottom };
  const pill = await page.evaluate(() => {
    const p = document.getElementById('a1-streak'); if (!p) return null;
    const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
    const inner = p.firstElementChild, ics = inner ? getComputedStyle(inner) : null, ir = inner ? inner.getBoundingClientRect() : null;
    return { text: p.textContent, w: Math.round(r.width), h: Math.round(r.height), overflow: cs.overflow, whiteSpace: cs.whiteSpace,
      innerW: ir && Math.round(ir.width), innerColor: ics && ics.color, innerDisplay: ics && ics.display, clipped: inner ? inner.scrollWidth > p.clientWidth + 1 : null };
  });
  R.mobileStreakPill = pill;
  const el = await page.$('#a1-streak');
  if (el) { await el.scrollIntoViewIfNeeded(); await page.screenshot({ path: SH('repro-streak-pill-390.png'), clip: await (async () => { const bb = await el.boundingBox(); return { x: 0, y: Math.max(0, bb.y - 40), width: 390, height: 140 }; })() }); }
  await page.screenshot({ path: SH('repro-practice-390-fullpage.png'), fullPage: true });
  await ctx.close();
}

// 7. Clear-all control inside the Semester 2 heading, native confirm()
{
  const { ctx, page } = await ctxPage();
  const dialogs = [];
  page.on('dialog', d => { dialogs.push({ type: d.type(), message: d.message() }); d.dismiss(); });
  await page.goto(base + 'index.html');
  const h2 = await page.evaluate(() => { const b = document.getElementById('a1-reset-all'); const h = b.closest('h2'); return h ? { headingText: h.textContent.replace(/\s+/g, ' ').trim() } : null; });
  await page.click('#a1-reset-all');
  R.clearAll = { buttonInsideH2: !!h2, ...h2, dialogs };
  await ctx.close();
}

// 8. Notes modal semantics: static source vs rendered DOM
{
  const src = fs.readFileSync(path.join(ROOT, 'unit5.html'), 'utf8');
  const { ctx, page } = await ctxPage();
  await page.goto(base + 'unit5.html');
  await page.click('.tg-card');
  await page.waitForTimeout(200);
  R.notesModal = {
    staticSource: { hasRoleDialog: /class="topic-modal"[^>]*role="dialog"/.test(src) },
    rendered: await page.evaluate(() => { const m = document.querySelector('.topic-modal'); return { role: m.getAttribute('role'), ariaModal: m.getAttribute('aria-modal'), labelledBy: m.getAttribute('aria-labelledby'), name: (document.getElementById(m.getAttribute('aria-labelledby')) || {}).textContent, focus: document.activeElement.className }; })
  };
  await ctx.close();
}

// 10. Images without alt in unit1-4: source, and what the modal shows at runtime
{
  const src = fs.readFileSync(path.join(ROOT, 'unit1-4.html'), 'utf8').split('\n');
  const lines = src.map((l, i) => [i + 1, l]).filter(([, l]) => /<img(?![^>]*\balt=)/.test(l)).map(([n, l]) => ({ line: n, tag: (l.match(/<img[^>]*>/) || [''])[0].slice(0, 120) }));
  const { ctx, page } = await ctxPage();
  await page.goto(base + 'unit1-4.html');
  const altsInModal = [];
  for (let i = 0; i < 13; i++) {
    await page.evaluate(n => openTopic(n), i);
    const a = await page.$$eval('#modal-body img', is => is.map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') })));
    a.forEach(x => altsInModal.push({ topic: i, ...x }));
    await page.evaluate(() => closeTopic());
  }
  R.imagesWithoutAlt = { sourceLines: lines, runtimeAltInModal: altsInModal };
  await ctx.close();
}

// 11. Unit 13: typing the right answer in normal notation, through the practice UI
{
  const { ctx, page } = await ctxPage();
  await page.goto(base + 'unit13.html');
  await page.click('.tabs .tab[data-view="practice"]');
  await page.click('.tpbtns .tpbtn:nth-child(4)');
  await page.waitForSelector('#pa0');
  const keys = await page.evaluate(() => pset.map(p => p.a));
  const rows = [];
  for (let i = 0; i < keys.length; i++) {
    const t = typed(keys[i]);
    await page.fill('#pa' + i, t);
    await page.click(`#pc${i} .cbtn`);
    rows.push({ typed: t, feedback: (await page.textContent('#pfb' + i)).trim().slice(0, 40) });
    if (i === 0) await page.screenshot({ path: SH('repro-unit13-correct-marked-wrong.png'), clip: { x: 0, y: 0, width: 1280, height: 800 } });
  }
  // and the wrong answer that the checker accepts instead
  await page.click('.tpbtns .tpbtn:nth-child(4)');
  await page.waitForSelector('#pa0');
  const k0 = await page.evaluate(() => pset[0].a);
  const noCaret = k0.replace(/<sup>(.*?)<\/sup>/g, '$1');
  await page.fill('#pa0', noCaret);
  await page.click('#pc0 .cbtn');
  R.unit13 = { correctTypedNormally: rows, withoutCaret: { typed: noCaret, feedback: (await page.textContent('#pfb0')).trim().slice(0, 40) } };
  await ctx.close();
}

await b.close();
server.close();
fs.writeFileSync(path.join(ROOT, 'audit/raw/repro.json'), JSON.stringify(R, null, 1));
console.log(JSON.stringify(R, null, 1));
