// Renders card-front.png and card-back.png (1000x632, business-card ratio)
// using the real Avenue Residences aerial render (front) and Type H floor
// plan (back). Both faces keep dense, asymmetric detail so MindAR image
// tracking locks on well.
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://tonychuaseongkiat-tech.github.io/ar-card-demo/';
const OUT = path.join(__dirname, '..', 'assets');
const b64 = f => fs.readFileSync(path.join(OUT, f)).toString('base64');

function frontHTML(qrDataUrl) {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0">
  <div style="width:1000px;height:632px;position:relative;background:#0b132b;font-family:Helvetica,Arial,sans-serif;overflow:hidden">
    <img src="data:image/png;base64,${b64('aerial.png')}" style="position:absolute;left:0;top:0;width:1000px;height:632px;object-fit:cover;object-position:center">
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(6,12,32,.78) 0%,rgba(6,12,32,.15) 32%,rgba(6,12,32,0) 55%,rgba(6,12,32,.55) 100%)"></div>
    <div style="position:absolute;left:44px;top:36px;color:#fff">
      <div style="font-size:44px;font-weight:800;letter-spacing:1px">AVENUE <span style="color:#4ecdc4">RESIDENCES</span></div>
      <div style="font-size:18px;color:#ffd166;margin-top:4px;letter-spacing:4px">AR CARD &middot; SCAN &middot; POINT &middot; WATCH IT RISE</div>
    </div>
    <div style="position:absolute;right:36px;bottom:36px;background:#fff;padding:12px;border-radius:12px;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.5)">
      <img src="${qrDataUrl}" width="170" height="170" style="display:block">
      <div style="font-size:14px;font-weight:700;color:#0b132b;margin-top:5px">SCAN ME</div>
    </div>
    <div style="position:absolute;left:44px;bottom:40px;color:#fff;font-size:15px;line-height:1.7;text-shadow:0 1px 4px #000">
      1&nbsp; Scan the QR code<br>2&nbsp; Allow camera &amp; point at this card<br>3&nbsp; Flip the card for the unit layout
    </div>
  </div></body>`;
}

function backHTML() {
  return `<!doctype html><meta charset="utf-8"><body style="margin:0">
  <div style="width:1000px;height:632px;position:relative;background:#f4efe8;font-family:Helvetica,Arial,sans-serif;overflow:hidden">
    <img src="data:image/png;base64,${b64('plan-h.png')}" style="position:absolute;left:150px;top:-16px;height:664px;transform:rotate(-2deg)">
    <svg width="1000" height="632" style="position:absolute;inset:0">
      <rect x="12" y="12" width="976" height="608" fill="none" stroke="#083d77" stroke-width="3" rx="12"/>
      <rect x="22" y="22" width="956" height="588" fill="none" stroke="#ee6c4d" stroke-width="1.5" stroke-dasharray="12 6" rx="9"/>
      <g fill="#083d77" opacity=".75">
        <rect x="46" y="500" width="10" height="10" transform="rotate(12 51 505)"/><rect x="70" y="540" width="7" height="7"/>
        <rect x="905" y="90" width="9" height="9" transform="rotate(30 909 94)"/><rect x="940" y="130" width="6" height="6"/>
        <rect x="60" y="120" width="8" height="8" transform="rotate(45 64 124)"/><rect x="930" y="560" width="8" height="8"/>
      </g>
    </svg>
    <div style="position:absolute;left:44px;top:36px;color:#083d77">
      <div style="font-size:32px;font-weight:800;letter-spacing:1px">TYPE H <span style="color:#ee6c4d">&middot; 1001 SQ FT</span></div>
      <div style="font-size:16px;margin-top:4px;letter-spacing:2px">3 BEDROOMS &middot; 3 BATHROOMS &middot; FROM RM750,000</div>
    </div>
    <div style="position:absolute;right:44px;bottom:44px;color:#083d77;font-size:15px;text-align:right;line-height:1.8">
      Keep the AR page open and<br>point your camera here to see<br>the unit layout in 3D
    </div>
    <div style="position:absolute;left:52px;bottom:120px;color:#ee6c4d;font-size:58px;font-weight:800;transform:rotate(-8deg)">3D</div>
  </div></body>`;
}

(async () => {
  const qr = await QRCode.toDataURL(LIVE_URL, { margin: 1, width: 380, errorCorrectionLevel: 'H' });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 632, deviceScaleFactor: 2 });
  for (const [name, html] of [['card-front', frontHTML(qr)], ['card-back', backHTML()]]) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('wrote', name + '.png');
  }
  await browser.close();
})();
