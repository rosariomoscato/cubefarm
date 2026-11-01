// Isolated visual QA: built app, fake backend only, fresh Chrome profile, exact child shutdown.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..');
const port = 4419;
await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(port, '127.0.0.1', () => probe.close(resolve));
});
const base = process.env.BRANDING_QA_DIR || (process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA, 'Temp/opencode') : os.tmpdir());
const home = await fs.mkdtemp(path.join(base, 'droidsembly-qa-'));
const repo = { id: 'demo-co/pixel-todo', fullName: 'demo-co/pixel-todo', description: 'Brand QA only', url: 'https://example.com/demo', defaultBranch: 'main', floor: 1, color: '#35a8ce', autoAssign: false, autoMerge: false, browserTesting: false, links: [], mission: '', summary: '', qaBrief: '', addedAt: Date.now() };
await fs.writeFile(path.join(home, 'demo-state.json'), JSON.stringify({ settings: { setupDone: true, tutorialStep: -1, companyName: 'Soot & Stars', managerName: 'Demo Manager', language: 'en', scaling: 'approve', ceoHeartbeatMin: 0, autoUpdate: false }, repos: [repo], agents: [], qa: [], requests: [], ceo: { queue: [], job: null, lastReviewAt: null, lastFingerprint: null }, messages: [] }));
const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts', '--demo'], { cwd: root, env: { ...process.env, SWARM_HOME: home, SWARM_PORT: String(port), SWARM_HOST: '127.0.0.1', SWARM_LAUNCHER: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
let output = '';
server.stdout.on('data', b => { output += b; });
server.stderr.on('data', b => { output += b; });
const exited = once(server, 'exit');
let browser;
const errors = [];
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Demo startup timeout: ' + output)), 90000);
    server.stdout.on('data', () => { if (output.includes('DEMO MODE')) { clearTimeout(timer); resolve(); } });
    server.once('error', e => { clearTimeout(timer); reject(e); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error('Demo exited: ' + code + output)); });
  });
  const origin = `http://127.0.0.1:${port}`;
  const state = async () => { const r = await fetch(origin + '/api/state'); assert(r.ok); return r.json(); };
  const settings = async (data) => { const r = await fetch(origin + '/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }); assert(r.ok); };
  const before = await state();
  assert(before.demo);
  assert(before.repos.every(r => !r.autoAssign && !r.autoMerge));
  browser = await chromium.launch({ ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : { channel: 'chrome' }), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  // Software WebGL can take longer than Playwright's default to produce a captured frame.
  page.setDefaultTimeout(90000);
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(origin + '/icons/') && !r.ok()) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(origin + '/?pocket=0');
  await expect(page.getByRole('button', { name: 'Enter the office', exact: true })).toBeEnabled({ timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
  assert(await page.evaluate(() => document.fonts.check('700 16px Sora')));
  await page.evaluate(async () => {
    const icon = document.querySelector('.brand-icon');
    const animations = icon.getAnimations({ subtree: true });
    if (animations.some(a => a.effect.getTiming().iterations !== 1)) throw new Error('Brand animation must not loop');
    await Promise.all(animations.map(a => a.finished));
    await navigator.serviceWorker.ready;
    if (!await caches.match('/icons/icon.svg')) throw new Error('Brand icon missing from offline shell');
  });
  await expect(page.locator('.start h1')).toHaveText('Soot & Stars');
  assert.equal(await page.title(), 'Droidsembly');
  await page.screenshot({ path: path.join(home, 'entrance-en.png'), animations: 'disabled' });
  await page.getByRole('button', { name: 'Enter the office', exact: true }).click();
  await expect(page.locator('.start')).toHaveCount(0);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 45000 });
  await page.screenshot({ path: path.join(home, 'office.png') });
  await settings({ language: 'it' });
  await page.goto(origin + '/?pocket=0');
  await expect(page.locator('.brand-name')).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.start h1')).toHaveText('Soot & Stars');
  await page.screenshot({ path: path.join(home, 'entrance-it.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: path.join(home, 'entrance-mobile.png'), animations: 'disabled' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await page.locator('.start-card').evaluate(el => el.scrollWidth > el.clientWidth), false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.brand-static').evaluate(el => getComputedStyle(el).animationName), 'none');
  await page.goto(origin + '/?pocket=1');
  await expect(page.locator('.pk-title')).toHaveText('Soot & Stars', { timeout: 45000 });
  assert((await page.title()).includes('Droidsembly'));
  await page.screenshot({ path: path.join(home, 'pocket-mobile.png'), animations: 'disabled' });
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.screenshot({ path: path.join(home, 'pocket-tablet.png'), animations: 'disabled' });
  await settings({ setupDone: false });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(origin + '/?pocket=0');
  await expect(page.locator('.wizard .brand-name')).toBeVisible({ timeout: 45000 });
  await page.screenshot({ path: path.join(home, 'wizard-mobile.png'), animations: 'disabled' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await page.locator('.start-card').evaluate(el => el.scrollWidth > el.clientWidth), false);
  await settings({ setupDone: true });
  const manifest = await (await fetch(origin + '/manifest.webmanifest')).json();
  assert.equal(manifest.name, 'Droidsembly');
  assert.equal(manifest.id, '/');
  // Decode the exports in a browser, including Sora lockups and the installable PNGs.
  await page.setContent('<body style="background:#eee;padding:20px"></body>');
  const dimensions = await page.evaluate(async origin => {
    const files = ['logo-light.svg', 'logo-dark.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'badge-96.png', 'favicon-16.png', 'favicon-32.png'];
    return Promise.all(files.map(async file => { const img = new Image(); img.src = origin + '/icons/' + file; await img.decode(); img.style.cssText = 'width:240px;display:inline-block;margin:12px;background:' + (file.includes('dark') ? '#101925' : '#faf9f5'); document.body.append(img); return [file, img.naturalWidth, img.naturalHeight]; }));
  }, origin);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: path.join(home, 'exported-assets.png'), fullPage: true });
  const after = await state();
  assert.equal(after.settings.companyName, 'Soot & Stars');
  assert.equal(after.settings.ceoHeartbeatMin, 0);
  assert.equal(after.settings.scaling, 'approve');
  assert(after.repos.every(r => !r.autoAssign && !r.autoMerge));
  assert(after.agents.every(a => !['working', 'preparing'].includes(a.status)));
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(home, 'checks.json'), JSON.stringify({ errors, dimensions, company: after.settings.companyName, automations: false, ceoHeartbeatMin: 0, scaling: 'approve' }, null, 2));
  console.log('Branding QA passed. Artifacts: ' + home);
} finally {
  await browser?.close();
  if (server.exitCode === null) {
    server.send({ type: 'office:shutdown', restart: false });
    const timer = setTimeout(() => server.kill(), 15000);
    await exited;
    clearTimeout(timer);
  }
  await fs.writeFile(path.join(home, 'server.log'), output);
}
