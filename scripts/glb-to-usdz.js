// Converts a GLB to USDZ (for iOS AR Quick Look) using three's USDZExporter
// in headless Chrome. Usage: node scripts/glb-to-usdz.js <in.glb> <out.usdz> [realWorldWidthMeters]
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const http = require('http');

const [inGlb, outUsdz, widthArg] = process.argv.slice(2);
const WIDTH_M = parseFloat(widthArg || '0.5');
const ROOT = path.join(__dirname, '..');

const PAGE = `<!doctype html><body><script type="importmap">{"imports":{"three":"/docs/libs/three.module.min.js","three/addons/":"/docs/libs/addons/"}}</script>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
const b64 = u8 => { let s=''; for (let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); };
window.convert = async (glbUrl, widthM) => {
  const gltf = await new GLTFLoader().loadAsync(glbUrl);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.scale.setScalar(widthM / Math.max(size.x, size.z));
  box.setFromObject(model);
  const c = box.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  model.updateMatrixWorld(true);
  const scene = new THREE.Scene();
  scene.add(model);
  const usdz = await new USDZExporter().parse(scene);
  return b64(new Uint8Array(usdz));
};
window.ready = true;
</script></body>`;

(async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/') { res.setHeader('content-type', 'text/html'); return res.end(PAGE); }
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
    res.setHeader('content-type', { '.js': 'text/javascript', '.glb': 'model/gltf-binary' }[path.extname(f)] || 'application/octet-stream');
    res.end(fs.readFileSync(f));
  }).listen(0);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load' });
  await page.waitForFunction('window.ready === true', { timeout: 30000 });
  const rel = '/' + path.relative(ROOT, path.resolve(inGlb)).split(path.sep).join('/');
  const b64 = await page.evaluate((u, w) => window.convert(u, w), rel, WIDTH_M);
  fs.writeFileSync(outUsdz, Buffer.from(b64, 'base64'));
  console.log('wrote', outUsdz, fs.statSync(outUsdz).size, 'bytes');
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
