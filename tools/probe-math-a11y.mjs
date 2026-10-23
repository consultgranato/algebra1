// How is maths exposed to assistive technology? Render real problem strings with
// the page's own formatEq into a practice card, then read (a) innerText, the text a
// copy/paste or many readers get, and (b) Chrome's computed accessibility tree,
// which is what NVDA/VoiceOver consume. Output: audit/raw/math-a11y.json
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, serve, browser, localOnly } from './lib/site.mjs';

const SAMPLES = [
  ['unit5.html', 'fraction coefficient', '(7/3)x = 14'],
  ['unit5.html', 'x over a number', 'x/4 + 6 = 2'],
  ['unit1-4.html', 'fraction arithmetic', '1/3 + 1/4'],
  ['unit11.html', 'exponent', 'x^9 / x^3'],
  ['unit11.html', 'negative exponent', 'x^(-4)'],
  ['unit13.html', 'superscript in markup', '4x<sup>3</sup> - 2x + 7'],
  ['unit13.html', 'malformed superscript (shipped)', '5x<sup>2(x</sup> - 3)'],
  ['unit6.html', 'inequality symbol', '-5x + 10 ≥ -2x - 5'],
  ['unit6.html', 'compound inequality', '-1 < 2x + 1 < 7'],
  ['unit16.html', 'square root in a key', 'x = 2+√3 or x = 2-√3'],
  ['unit7.html', 'absolute value', 'Is y = |x| a linear function?'],
  ['unit15.html', 'vertex form', 'y = (1/2)(x - 4)^2 - 3'],
];

const { server, base } = await serve();
const b = await browser();
const out = [];
for (const [file, label, src] of SAMPLES) {
  const page = await b.newPage();
  await localOnly(page, base);
  await page.goto(base + file, { waitUntil: 'load' });
  const html = await page.evaluate(s => {
    const host = document.createElement('div');
    host.className = 'pcard'; host.id = 'probe';
    host.innerHTML = '<div class="pmath" id="probe-m">' + (typeof formatEq === 'function' ? formatEq(s) : s) + '</div>';
    document.body.prepend(host);
    return host.querySelector('.pmath').innerHTML;
  }, src);
  const innerText = await page.$eval('#probe-m', e => e.innerText.replace(/\n/g, '⏎'));
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#probe-m' });
  const { node: dn } = await cdp.send('DOM.describeNode', { nodeId });
  await cdp.send('Accessibility.enable');
  const { nodes: all } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(all.map(n => [n.nodeId, n]));
  const start = all.find(n => n.backendDOMNodeId === dn.backendNodeId);
  const nodes = [];
  const walk = n => { if (!n) return; nodes.push(n); (n.childIds || []).forEach(c => walk(byId.get(c))); };
  walk(start);
  const texts = nodes.filter(n => !n.ignored && n.role && ['StaticText', 'text'].includes(n.role.value)).map(n => n.name && n.name.value);
  const roles = [...new Set(nodes.filter(n => !n.ignored).map(n => n.role && n.role.value))];
  out.push({ file, label, source: src, html, innerText, axStaticText: texts, axReading: texts.join(' '), axRoles: roles, hasMathML: /<math/i.test(html), hasAriaLabel: /aria-label/.test(html) });
  await page.close();
}
await b.close();
server.close();
fs.writeFileSync(path.join(ROOT, 'audit/raw/math-a11y.json'), JSON.stringify(out, null, 1));
for (const o of out) console.log(`${o.label.padEnd(32)} source: ${o.source.padEnd(28)} AT reads: "${o.axReading}"   innerText: "${o.innerText}"`);
