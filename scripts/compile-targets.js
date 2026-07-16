// Compiles card-front.png + card-back.png into assets/targets.mind
// by running the official MindAR image-target compiler in headless Chrome,
// served locally from vendor/package/dist (ES modules need http, not file://).
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const PAGE = `<!doctype html><html><body><script type="module">
  import { Compiler } from '/vendor/package/dist/mindar-image.prod.js';
  window.runCompile = async (srcs) => {
    const load = src => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = rej; img.src = src;
    });
    const images = await Promise.all(srcs.map(load));
    const compiler = new Compiler();
    await compiler.compileImageTargets(images, p => console.log('progress', p.toFixed(1) + '%'));
    const bytes = new Uint8Array(compiler.exportData());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  };
  window.ready = true;
</script></body></html>`;

const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png' };

(async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end(PAGE); }
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
    res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  }).listen(0);
  const port = server.address().port;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.waitForFunction('window.ready === true', { timeout: 30000 });

  const b64 = await page.evaluate(
    srcs => window.runCompile(srcs),
    ['/assets/card-front.png', '/assets/card-back.png']
  );

  fs.writeFileSync(path.join(ASSETS, 'targets.mind'), Buffer.from(b64, 'base64'));
  console.log('wrote targets.mind,', Buffer.from(b64, 'base64').length, 'bytes');
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
