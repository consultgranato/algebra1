// Keyboard entry on the built-in calculator: 7 * 6 Enter, and 9 / 3 =.
import { serve, browser, localOnly } from './lib/site.mjs';
const { server, base } = await serve();
const b = await browser();
const page = await b.newPage();
await localOnly(page, base);
await page.goto(base + 'unit5.html');
await page.click('.tabs .tab[data-view="practice"]');
await page.focus('#v-practice .calc-box');
for (const k of ['7', '*', '6', 'Enter']) await page.keyboard.press(k);
const a = await page.textContent('#v-practice .calc-val');
for (const k of ['Escape', '9', '/', '3', '=']) await page.keyboard.press(k);
const c = await page.textContent('#v-practice .calc-val');
console.log({ '7*6 Enter': a, '9/3=': c, focusRole: await page.evaluate(() => document.activeElement.getAttribute('role')) });
await b.close(); server.close();
