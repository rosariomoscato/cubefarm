// Rebuild the approved revision 02 artwork; offline after the Sora fonts are vendored.
// Run: node scripts/branding-assets.mjs (uses an installed Chrome, never the app).
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'client/public/icons');
const preview = await fs.readFile(path.join(root, 'docs/branding/preview.html'), 'utf8');
const defs = preview.match(/<defs>([\s\S]*?)<\/defs>/)?.[1];
if (!defs) throw new Error('Approved SVG definitions missing');
const svg = (body, viewBox = '0 0 152 170') => `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBox.split(' ')[2]}" height="${viewBox.split(' ')[3]}" viewBox="${viewBox}"><defs>${defs}</defs>${body}</svg>`;
await fs.mkdir(dir, { recursive: true });
const write = (name, text) => fs.writeFile(path.join(dir, name), text + '\n');
await write('icon.svg', svg('<use href="#robot" width="152" height="170"/>'));
for (const part of ['wire', 'shell', 'eyes', 'antenna', 'spark']) await write(`droid-${part}.svg`, svg(`<use href="#${part}"/>`));
const simple = '<path d="M3 12 15 6 27 12V26L15 32 3 26Z" fill="#142637" stroke="#36c9e7" stroke-width="2" stroke-linejoin="round"/><path d="m3 12 12 6 12-6-12-6Z" fill="#faf8ee"/><path d="m3 12 12 6v14L3 26Z" fill="#d9c6b0"/><path d="m16 10 3-7" stroke="#ff951e" stroke-width="2"/><circle cx="19" cy="3" r="2.5" fill="#ff951e"/><path d="m19 23 0-2m5-1v-2" stroke="#a4f5ff" stroke-width="3" stroke-linecap="round"/>';
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 34">${simple}</svg>`;
await write('favicon.svg', favicon);
const badge = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 32 34"><path fill="white" fill-rule="evenodd" d="M18 1a3 3 0 1 1 0 6l-1 3 10 5v14l-12 5-12-6V14l11-5 2-4a3 3 0 0 1 2-4ZM18 21v4l3-1v-4Zm5-3v4l2-1v-4Z"/></svg>';
await write('badge.svg', badge);
const regular = (await fs.readFile(path.join(dir, 'sora-400.ttf'))).toString('base64');
const bold = (await fs.readFile(path.join(dir, 'sora-700.ttf'))).toString('base64');
for (const [theme, ink] of [['light', '#101925'], ['dark', '#faf9f5']]) {
  await write(`logo-${theme}.svg`, svg(`<style>@font-face{font-family:Sora;src:url(data:font/ttf;base64,${regular})} @font-face{font-family:Sora;font-weight:700;src:url(data:font/ttf;base64,${bold})}</style><use href="#robot" width="140" height="156" y="2"/><text x="156" y="88" font-family="Sora,sans-serif" font-weight="700" font-size="54" letter-spacing="-2" fill="${ink}">Droid<tspan fill="#00a7e8">sembly</tspan></text><text x="158" y="124" font-family="Sora,sans-serif" font-size="21" fill="${ink}">Software, assembled by agents.</text>`, '0 0 560 164'));
}
const browser = await chromium.launch(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : { channel: 'chrome' });
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  async function png(name, size, source) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;background:transparent}img{width:100vw;height:100vh}</style><img src="data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}">`);
    await page.locator('img').evaluate(img => img.decode());
    await page.screenshot({ path: path.join(dir, name), omitBackground: true });
  }
  const tile = (scale) => svg(`<rect width="512" height="512" fill="#101925"/><g transform="translate(${(512 - 152 * scale) / 2} ${(512 - 170 * scale) / 2}) scale(${scale})"><use href="#robot" width="152" height="170"/></g>`, '0 0 512 512');
  for (const size of [192, 512]) await png(`icon-${size}.png`, size, tile(2.5));
  await png('icon-maskable-512.png', 512, tile(2));
  await png('apple-touch-icon.png', 180, tile(2.5));
  await png('badge-96.png', 96, badge);
  for (const size of [16, 32]) await png(`favicon-${size}.png`, size, favicon);
} finally { await browser.close(); }
console.log('Droidsembly SVG, Sora logo lockups and PNG icons generated.');
