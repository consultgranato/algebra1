// What a screen reader gets for the first worked-example lines in Unit 5 topic 5.2 notes,
// the first practice-card in 5.2, and the post-submit focus. Used to write HUMAN-CHECKS.md.
import { serve, browser, localOnly } from './lib/site.mjs';
const { server, base } = await serve();
const b = await browser();
const page = await b.newPage();
await localOnly(page, base);
await page.goto(base + 'unit5.html');
await page.evaluate(() => openTopic(1));
const cdp = await page.context().newCDPSession(page);
await cdp.send('Accessibility.enable');
async function axText(selector, n = 3) {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector });
  const { nodes: all } = await cdp.send('Accessibility.getFullAXTree');
  const byId = new Map(all.map(x => [x.nodeId, x]));
  const res = [];
  for (const id of nodeIds.slice(0, n)) {
    const { node } = await cdp.send('DOM.describeNode', { nodeId: id });
    const start = all.find(x => x.backendDOMNodeId === node.backendNodeId);
    const t = []; const walk = x => { if (!x) return; if (!x.ignored && x.role && ['StaticText'].includes(x.role.value)) t.push(x.name.value); (x.childIds || []).forEach(c => walk(byId.get(c))); };
    walk(start); res.push(t.join(' '));
  }
  return res;
}
console.log('notes 5.2 eq rows:', await axText('#modal-body .eq', 4));
console.log('dialog node:', (await cdp.send('Accessibility.getFullAXTree')).nodes.filter(n => n.role && n.role.value === 'dialog').map(n => n.name && n.name.value));
await page.evaluate(() => closeTopic());
await page.click('.tabs .tab[data-view="practice"]');
await page.click('.tpbtns .tpbtn:nth-child(2)');
await page.waitForSelector('#pa0');
console.log('practice 5.2 pmath:', await axText('#plist .pmath', 5));
await b.close(); server.close();
