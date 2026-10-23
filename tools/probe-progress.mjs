// Seed one practised topic and read both percentages the site shows.
import { serve, browser, localOnly } from './lib/site.mjs';
const { server, base } = await serve();
const b = await browser();
const page = await b.newPage();
await localOnly(page, base);
await page.goto(base + 'index.html');
await page.evaluate(() => localStorage.setItem('alg1.progress.v1', JSON.stringify({ '10': { practice: { '10.1': { attempts: 1, last: 100, best: 100 } }, updated: 1 } })));
await page.goto(base + 'unit10.html');
const unitPct = await page.textContent('.a1-hero-ring .a1-ring-pct');
const chips = await page.$$eval('.a1-chip', cs => cs.map(c => c.textContent));
await page.goto(base + 'index.html');
const card = await page.$$eval('.unit-card', cs => cs.map(c => c.textContent.replace(/\s+/g, ' ').trim()).find(t => /Word Problems/.test(t)));
console.log({ unitPct, chips, card });
await b.close(); server.close();
