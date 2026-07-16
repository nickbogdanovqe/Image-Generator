import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1400, height: 1200 },
  deviceScaleFactor: 3,
});
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' });

const nameInput = page.getByLabel('Contact name / number');
await nameInput.fill('Deepak Kumar');
await page.waitForTimeout(300);

// Live avatar at 3x device scale, matching export pixel ratio.
const avatarSvg = page.locator('.header-center svg').first();
await avatarSvg.screenshot({ path: '/tmp/live-avatar-3x.png' });

const phoneBox = await page.locator('.phone').boundingBox();
const avatarBox = await avatarSvg.boundingBox();
console.log(
  'avatar relative to phone (logical px):',
  JSON.stringify({
    x: avatarBox.x - phoneBox.x,
    y: avatarBox.y - phoneBox.y,
    width: avatarBox.width,
    height: avatarBox.height,
  }),
);

// Report the actual font used by the live text element (resolved by the browser).
const liveFontInfo = await page.evaluate(() => {
  const textEl = document.querySelector('.header-center svg text');
  const cs = getComputedStyle(textEl);
  return {
    fontFamily: cs.fontFamily,
    fontWeight: cs.fontWeight,
    fontSize: cs.fontSize,
    fill: cs.fill,
  };
});
console.log('LIVE font info:', liveFontInfo);

const dataUrl = await page.evaluate(async () => {
  const mod = await import('/src/lib/exportScreenshots.js');
  const phoneEl = document.querySelector('.phone');
  return await mod.exportVisibleScreenshot(phoneEl);
});

const b64 = dataUrl.split(',')[1];
const fs = await import('fs');
fs.writeFileSync('/tmp/exported-full.png', Buffer.from(b64, 'base64'));

// Crop the avatar region out of the full exported PNG (scale 3x, avatar is
// roughly at header-center, need pixel coords). We'll use sharp if available,
// otherwise just leave the full image for manual crop via screenshot tool.
console.log('done');
await browser.close();
