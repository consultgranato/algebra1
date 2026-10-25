// Lighthouse on index + three unit pages, desktop and mobile (Lighthouse's default
// mobile profile: mid-range phone, 4x CPU slowdown, slow-4G simulated throttling).
// Usage: node tools/lighthouse-run.mjs [outDir]   (default audit/raw/lighthouse)
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { ROOT, serve, chromePath } from './lib/site.mjs';

const outDir = path.resolve(ROOT, process.argv[2] || 'audit/raw/lighthouse');
fs.mkdirSync(outDir, { recursive: true });
const PAGES = ['index.html', 'unit1-4.html', 'unit5.html', 'unit15.html'];
const { server, base } = await serve();
const chrome = await chromeLauncher.launch({ chromePath: chromePath(), chromeFlags: ['--headless=new', '--no-first-run'] });
const rows = [];
try {
  for (const formFactor of ['mobile', 'desktop']) {
    for (const p of PAGES) {
      const flags = { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices'] };
      const res = await lighthouse(base + p, flags, formFactor === 'desktop' ? desktopConfig : undefined);
      const lhr = res.lhr;
      fs.writeFileSync(path.join(outDir, `${p.replace('.html', '')}-${formFactor}.json`), res.report);
      const a = lhr.audits;
      const longTasks = (a['long-tasks'] && a['long-tasks'].details && a['long-tasks'].details.items) || [];
      rows.push({
        page: p, formFactor,
        perf: Math.round(lhr.categories.performance.score * 100),
        a11y: Math.round(lhr.categories.accessibility.score * 100),
        bp: Math.round(lhr.categories['best-practices'].score * 100),
        transferKB: Math.round(a['total-byte-weight'].numericValue / 1024),
        htmlKB: Math.round(((a['network-requests'].details.items || []).find(i => i.resourceType === 'Document') || {}).transferSize / 1024),
        fcpMs: Math.round(a['first-contentful-paint'].numericValue),
        lcpMs: Math.round(a['largest-contentful-paint'].numericValue),
        tbtMs: Math.round(a['total-blocking-time'].numericValue),
        cls: +a['cumulative-layout-shift'].numericValue.toFixed(3),
        longTasks: longTasks.length,
        failedA11y: Object.values(a).filter(x => x.score === 0 && lhr.categories.accessibility.auditRefs.some(r => r.id === x.id)).map(x => x.id)
      });
      console.log(rows[rows.length - 1]);
    }
  }
} finally {
  await chrome.kill();
  server.close();
}
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(rows, null, 1));
