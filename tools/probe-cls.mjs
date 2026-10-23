// Which elements shift during load on a phone-sized viewport? (Lighthouse reports CLS ~0.25 on mobile.)
import { serve, browser, localOnly } from './lib/site.mjs';
const { server, base } = await serve();
const b = await browser();
for (const f of ['index.html', 'unit5.html', 'unit15.html']) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 823 }, isMobile: true, deviceScaleFactor: 2.6 });
  const page = await ctx.newPage();
  await localOnly(page, base);
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver(l => l.getEntries().forEach(e => window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map(s => s.node ? (s.node.id ? '#' + s.node.id : (s.node.className || s.node.nodeName)) : '?').slice(0, 4) }))).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(base + f, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const s = await page.evaluate(() => window.__shifts);
  console.log(f, 'total', s.reduce((a, x) => a + x.v, 0).toFixed(3), JSON.stringify(s));
  await ctx.close();
}
await b.close(); server.close();
