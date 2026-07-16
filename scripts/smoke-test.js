// Loads site/index.html over http with a fake camera and checks the AR engine starts.
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SITE = path.join(__dirname, '..', 'docs');
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.png': 'image/png', '.mind': 'application/octet-stream' };

(async () => {
  const server = http.createServer((req, res) => {
    let file = path.join(SITE, decodeURIComponent(req.url.split('?')[0]));
    if (req.url === '/') file = path.join(SITE, 'index.html');
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end(); }
    res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  }).listen(0);
  const port = server.address().port;

  const browser = await puppeteer.launch({
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle0' });
  await page.click('#startBtn');
  await new Promise(r => setTimeout(r, 6000));
  const state = await page.evaluate(() => {
    const video = document.querySelector('video');
    const canvas = document.querySelector('#ar canvas');
    return { video: !!video, videoPlaying: video ? !video.paused && video.readyState >= 2 : false, canvas: !!canvas };
  });
  console.log('state:', JSON.stringify(state));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
  server.close();
  if (!state.videoPlaying || !state.canvas || errors.length) process.exit(1);
  console.log('SMOKE TEST PASSED');
})().catch(e => { console.error(e); process.exit(1); });
