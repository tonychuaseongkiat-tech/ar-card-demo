// Renders card-front.png and card-back.png (1000x632, business-card ratio).
// Designs are deliberately detail-rich and asymmetric: MindAR image tracking
// needs many unique high-contrast feature points to lock on.
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const path = require('path');

const LIVE_URL = 'https://tonychuaseongkiat-tech.github.io/ar-card-demo/';
const OUT = path.join(__dirname, '..', 'assets');

// seeded pseudo-random so the design is reproducible
function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function frontHTML(qrDataUrl) {
  const r = rng(42);
  // scattered star/plus marks for extra feature points
  let marks = '';
  for (let i = 0; i < 40; i++) {
    const x = 30 + r() * 940, y = 30 + r() * 570, s = 3 + r() * 6, o = 0.35 + r() * 0.5;
    marks += r() > 0.5
      ? `<path d="M${x - s} ${y}h${2 * s}M${x} ${y - s}v${2 * s}" stroke="#ffd166" stroke-width="2" opacity="${o}"/>`
      : `<circle cx="${x}" cy="${y}" r="${s / 2}" fill="#4ecdc4" opacity="${o}"/>`;
  }
  // varied skyline
  let sky = '';
  const cols = ['#4ecdc4', '#ff6b6b', '#ffd166', '#a78bfa', '#f4a261', '#90e0ef'];
  let x = 40;
  for (let i = 0; i < 11; i++) {
    const w = 45 + r() * 65, h = 120 + r() * 260, c = cols[i % cols.length];
    sky += `<rect x="${x}" y="${560 - h}" width="${w}" height="${h}" fill="${c}" opacity="0.92" rx="3"/>`;
    for (let wy = 580 - h; wy < 530; wy += 26) {
      for (let wx = x + 8; wx < x + w - 12; wx += 20) {
        if (r() > 0.4) sky += `<rect x="${wx}" y="${wy}" width="9" height="12" fill="#0b132b" opacity="0.85"/>`;
      }
    }
    x += w + 8 + r() * 14;
    if (x > 620) break;
  }
  return `<!doctype html><meta charset="utf-8"><body style="margin:0">
  <div style="width:1000px;height:632px;position:relative;background:#0b132b;font-family:Helvetica,Arial,sans-serif;overflow:hidden">
    <svg width="1000" height="632" style="position:absolute;inset:0">
      <rect x="14" y="14" width="972" height="604" fill="none" stroke="#4ecdc4" stroke-width="3" rx="14"/>
      <rect x="26" y="26" width="948" height="580" fill="none" stroke="#ffd166" stroke-width="1.5" stroke-dasharray="14 7" rx="10"/>
      ${marks}${sky}
      <line x1="40" y1="561" x2="640" y2="561" stroke="#4ecdc4" stroke-width="4"/>
      <circle cx="560" cy="120" r="38" fill="#ffd166"/>
      <circle cx="560" cy="120" r="52" fill="none" stroke="#ffd166" stroke-width="2" stroke-dasharray="6 8"/>
      <path d="M120 100 q18 -22 36 0 q18 -22 36 0" stroke="#90e0ef" stroke-width="3" fill="none"/>
      <path d="M300 160 q14 -18 28 0 q14 -18 28 0" stroke="#90e0ef" stroke-width="3" fill="none"/>
    </svg>
    <div style="position:absolute;left:56px;top:52px;color:#fff">
      <div style="font-size:52px;font-weight:800;letter-spacing:2px">AR HOLO<span style="color:#4ecdc4">CARD</span></div>
      <div style="font-size:20px;color:#ffd166;margin-top:6px;letter-spacing:4px">SCAN &middot; POINT &middot; WATCH IT RISE</div>
    </div>
    <div style="position:absolute;right:48px;bottom:44px;background:#fff;padding:14px;border-radius:12px;text-align:center">
      <img src="${qrDataUrl}" width="190" height="190" style="display:block">
      <div style="font-size:15px;font-weight:700;color:#0b132b;margin-top:6px">SCAN ME</div>
    </div>
    <div style="position:absolute;right:60px;top:140px;color:#90e0ef;font-size:15px;text-align:right;line-height:1.7">
      1&nbsp; Scan the QR code<br>2&nbsp; Allow camera<br>3&nbsp; Point at this card<br>4&nbsp; Flip for room layout
    </div>
  </div></body>`;
}

function backHTML() {
  const r = rng(7);
  let dots = '';
  for (let i = 0; i < 35; i++) {
    const x = 40 + r() * 920, y = 40 + r() * 550;
    dots += `<rect x="${x}" y="${y}" width="${3 + r() * 5}" height="${3 + r() * 5}" fill="#083d77" opacity="${0.3 + r() * 0.5}" transform="rotate(${r() * 90} ${x} ${y})"/>`;
  }
  return `<!doctype html><meta charset="utf-8"><body style="margin:0">
  <div style="width:1000px;height:632px;position:relative;background:#eaf4f4;font-family:Helvetica,Arial,sans-serif;overflow:hidden">
    <svg width="1000" height="632" style="position:absolute;inset:0">
      <rect x="14" y="14" width="972" height="604" fill="none" stroke="#083d77" stroke-width="3" rx="14"/>
      ${dots}
      <!-- floor plan -->
      <g stroke="#083d77" stroke-width="5" fill="none">
        <rect x="90" y="130" width="520" height="400" fill="#fff"/>
        <line x1="310" y1="130" x2="310" y2="380"/>
        <line x1="90" y1="380" x2="450" y2="380"/>
        <line x1="450" y1="290" x2="450" y2="530"/>
        <line x1="310" y1="290" x2="610" y2="290"/>
      </g>
      <g stroke="#ee6c4d" stroke-width="4" fill="none">
        <path d="M200 380 a40 40 0 0 1 40 40" /><line x1="200" y1="380" x2="200" y2="420"/>
        <path d="M450 340 a35 35 0 0 0 -35 35" /><line x1="450" y1="340" x2="450" y2="375"/>
      </g>
      <g fill="#3d5a80">
        <rect x="115" y="160" width="130" height="70" rx="6"/>
        <rect x="340" y="160" width="90" height="90" rx="45"/>
        <rect x="480" y="330" width="100" height="55" rx="6"/>
        <rect x="120" y="430" width="80" height="80" rx="6"/>
      </g>
      <g stroke="#ee6c4d" stroke-width="2">
        <line x1="90" y1="90" x2="610" y2="90"/><line x1="90" y1="80" x2="90" y2="100"/><line x1="610" y1="80" x2="610" y2="100"/>
        <line x1="650" y1="130" x2="650" y2="530"/><line x1="640" y1="130" x2="660" y2="130"/><line x1="640" y1="530" x2="660" y2="530"/>
      </g>
      <circle cx="880" cy="150" r="46" fill="none" stroke="#083d77" stroke-width="3"/>
      <path d="M880 112 l12 34 -12 -8 -12 8 z" fill="#ee6c4d"/>
      <text x="880" y="222" font-size="18" fill="#083d77" text-anchor="middle" font-family="Helvetica">N</text>
    </svg>
    <div style="position:absolute;left:90px;top:44px;color:#083d77;font-size:34px;font-weight:800;letter-spacing:2px">ROOM LAYOUT <span style="color:#ee6c4d">BLUEPRINT</span></div>
    <div style="position:absolute;left:120px;top:190px;color:#083d77;font-size:17px;font-weight:700">BEDROOM</div>
    <div style="position:absolute;left:340px;top:200px;color:#083d77;font-size:17px;font-weight:700">LIVING</div>
    <div style="position:absolute;left:480px;top:300px;color:#083d77;font-size:17px;font-weight:700">KITCHEN</div>
    <div style="position:absolute;left:120px;top:490px;color:#083d77;font-size:17px;font-weight:700">BATH</div>
    <div style="position:absolute;right:70px;bottom:60px;color:#083d77;font-size:16px;text-align:right;line-height:1.8">
      Keep the AR page open<br>and point your camera here<br>to see the 3D room layout
    </div>
    <div style="position:absolute;left:750px;top:300px;color:#ee6c4d;font-size:64px;font-weight:800;transform:rotate(-8deg)">3D</div>
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
