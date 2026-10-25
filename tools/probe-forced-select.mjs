// In forced-colors mode, can a student see which quiz option they picked before submitting?
import path from 'node:path';
import { ROOT, serve, browser, localOnly } from './lib/site.mjs';
const { server, base } = await serve();
const b = await browser();
for (const fc of ['none', 'active']) {
  const ctx = await b.newContext({ viewport: { width: 900, height: 400 }, forcedColors: fc, colorScheme: fc === 'active' ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await localOnly(page, base);
  await page.goto(base + 'unit5.html');
  await page.click('.tabs .tab[data-view="vocab"]');
  (await page.$$('.vstab'))[1].click();
  await page.waitForSelector('#vqo0_1');
  await page.click('#vqo0_1');
  const card = await page.$('#vqc0');
  await card.screenshot({ path: path.join(ROOT, `audit/raw/shots/quiz-selected-forced-${fc}.png`) });
  console.log(fc, await page.evaluate(() => { const s = getComputedStyle(document.getElementById('vqo0_1')), n = getComputedStyle(document.getElementById('vqo0_0')); return { sel: [s.backgroundColor, s.borderColor, s.borderWidth, s.color, s.fontWeight], other: [n.backgroundColor, n.borderColor, n.borderWidth, n.color, n.fontWeight] }; }));
  await ctx.close();
}
await b.close(); server.close();
