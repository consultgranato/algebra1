// Dev-only helpers: serve the repo root over HTTP and drive the system Chrome.
// Nothing here is loaded by the site.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
// Where generated evidence goes. The test harness points this at tests/out so the
// Phase 0 baseline in audit/raw is never overwritten.
export const RAW = path.resolve(ROOT, process.env.A1_RAW || 'audit/raw');

export const PAGES = ['index.html', 'unit1-4.html', 'unit5.html', 'unit6.html', 'unit7.html', 'unit8.html',
  'unit9.html', 'unit10.html', 'unit11.html', 'unit12.html', 'unit13.html', 'unit14.html', 'unit15.html',
  'unit16.html'];
export const UNIT_PAGES = PAGES.filter(p => p !== 'index.html');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json'
};

export function serve(port = 0) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
      const file = path.join(ROOT, rel);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve({ server, base: `http://127.0.0.1:${server.address().port}/` }));
  });
}

export function chromePath() {
  const c = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'
  ].filter(Boolean);
  return c.find(p => fs.existsSync(p));
}

export async function browser(opts = {}) {
  return chromium.launch({ executablePath: chromePath(), headless: true, ...opts });
}

/* Block anything that is not our own server, so audits never hit YouTube/Desmos. */
export async function localOnly(page, base) {
  await page.route('**/*', r => (r.request().url().startsWith(base) || r.request().url().startsWith('data:'))
    ? r.continue() : r.abort());
}
