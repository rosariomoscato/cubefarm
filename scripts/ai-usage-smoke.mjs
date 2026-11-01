// Built UI + isolated fake backend. No project operations, AI requests or real app state.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const root = path.resolve(import.meta.dirname, '..'), port = 4419;
await new Promise((resolve, reject) => {
  const probe = net.createServer(); probe.once('error', reject);
  probe.listen(port, '127.0.0.1', () => probe.close(resolve));
});
const base = process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA, 'Temp/opencode') : os.tmpdir();
const home = await fs.mkdtemp(path.join(base, 'droidsembly-ai-usage-'));
const now = Date.now();
const repo = { id: 'demo-co/pixel-todo', fullName: 'demo-co/pixel-todo', description: 'Usage fixture', url: 'https://example.com/demo', defaultBranch: 'main', floor: 1, color: '#35a8ce', autoAssign: false, autoMerge: false, browserTesting: false, links: [], mission: '', summary: '', qaBrief: '', addedAt: now };
const agents = [
  { id: 'ceo', name: 'Demo CEO', role: 'ceo', cli: 'opencode', model: 'fixture-one/reasoner', repoId: '' },
  { id: 'fixture-a', name: 'Ada Fixture', role: 'developer', cli: 'opencode', model: 'fixture-two/reasoner', repoId: repo.id },
  { id: 'fixture-b', name: 'Codex Fixture', role: 'developer', cli: 'codex', model: '', repoId: repo.id },
  { id: 'fixture-c', name: 'Claude Fixture', role: 'developer', cli: 'claude', model: '', repoId: repo.id },
].map((a, desk) => ({ ...a, role: a.role === 'ceo' ? 'ceo' : 'agent', desk, status: 'idle', look: 'masculine', color: '#35a8ce', hair: '#333333', skin: '#cccccc', task: null, sessionId: null, sessionCli: null, costUsd: 0, turns: 0, startedAt: null, endedAt: null, logTail: [] }));
const aiUsage = agents.map((a, i) => ({ id: `fixture-${i}`, sessionId: `fake-session-${i}`, agentId: a.id, repoId: a.repoId, tool: a.cli, provider: i < 2 ? a.model.split('/')[0] : null, model: i < 2 ? 'reasoner' : null, at: now, observedAt: now, input: i === 3 ? null : 1234, output: i === 3 ? null : 56, reasoning: null, cacheRead: null, cacheWrite: null, costUsd: i === 0 ? 0 : null, source: i < 2 ? 'opencode-message' : i === 2 ? 'codex-transcript' : 'claude-status' }));
await fs.writeFile(path.join(home, 'demo-state.json'), JSON.stringify({ settings: { setupDone: true, tutorialStep: -1, companyName: 'AI Usage Fixtures', managerName: 'Demo Manager', language: 'en', runtime: 'terminal', defaultCli: 'opencode', scaling: 'approve', ceoHeartbeatMin: 0, autoUpdate: false }, repos: [repo], agents, aiUsage, qa: [], requests: [], ceo: { queue: [], job: null, lastReviewAt: null, lastFingerprint: null }, messages: [] }));
const server = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts', '--demo'], { cwd: root, env: { ...process.env, SWARM_HOME: home, SWARM_PORT: String(port), SWARM_HOST: '127.0.0.1', SWARM_LAUNCHER: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
let output = '', browser;
server.stdout.on('data', (b) => output += b); server.stderr.on('data', (b) => output += b);
const exited = once(server, 'exit');
const origin = `http://127.0.0.1:${port}`;
const request = async (url, method = 'GET', body) => {
  const r = await fetch(origin + url, { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert(r.ok, `${url}: ${r.status}`); return r.json();
};
const errors = [];
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Demo startup timeout: ' + output)), 90000);
    const ready = () => { if (output.includes('DEMO MODE')) { clearTimeout(timer); resolve(); } };
    server.stdout.on('data', ready); ready();
    server.once('error', reject);
  });
  let state = await request('/api/state'); assert(state.demo);
  await request('/api/usage/simulate', 'POST', { kind: 'warning', agentId: 'ceo' });
  state = await request('/api/state');
  assert.equal(state.usage.resources.find((r) => r.agentIds.includes('ceo')).state, 'pacing');
  assert(state.usage.resources.filter((r) => !r.agentIds.includes('ceo')).every((r) => r.state === 'normal'));
  browser = await chromium.launch({ ...(process.platform === 'win32' ? { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, hasTouch: true });
  page.setDefaultTimeout(45000); page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin + '/?pocket=1');
  await page.getByRole('button', { name: 'Settings and notifications', exact: true }).click();
  const card = page.locator('#ops-card-usage');
  await expect(card).toBeVisible();
  await expect(card.getByText('🤖 AI usage', { exact: true })).toBeVisible();
  await card.getByText('Observed AI usage', { exact: true }).click();
  await expect(card.getByText(/^Input tokens:/).first()).toBeVisible();
  await page.screenshot({ path: path.join(home, 'usage-desktop-en.png') });
  await card.getByRole('button', { name: 'Resume this quota', exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('alertdialog').screenshot({ path: path.join(home, 'confirmation-desktop-en.png') });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole('alertdialog').screenshot({ path: path.join(home, 'confirmation-mobile-en.png') });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Resume full speed', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Resume this quota', exact: true }).first()).toBeDisabled();
  await request('/api/settings', 'PATCH', { language: 'it' });
  await expect(card.getByText('🤖 Utilizzo AI', { exact: true })).toBeVisible();
  for (const [name, width, height] of [['tablet', 820, 1180], ['mobile', 360, 800]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: path.join(home, `usage-${name}-it.png`) });
    assert.equal(await card.evaluate((el) => el.scrollWidth > el.clientWidth + 1), false, name + ' card overflow');
  }
  await page.locator('.notify-hook').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(home, 'pocket-notifications-touch-it.png') });
  await page.locator('.a11y-slider').first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(home, 'pocket-accessibility-touch-it.png') });
  await request('/api/usage/simulate', 'POST', { kind: 'limit', agentId: 'fixture-a' });
  state = await request('/api/state');
  assert.equal(state.usage.resources.find((r) => r.agentIds.includes('fixture-a')).state, 'paused');
  assert.equal(state.usage.resources.find((r) => r.agentIds.includes('ceo')).state, 'normal');
  assert(state.repos.every((r) => !r.autoAssign && !r.autoMerge));
  assert.equal(state.settings.ceoHeartbeatMin, 0); assert.equal(state.settings.scaling, 'approve');
  assert(state.agents.every((a) => !['working', 'preparing'].includes(a.status)));
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(home, 'checks.json'), JSON.stringify({ errors, demo: true, activeAgents: 0, checks: ['EN/IT', 'desktop/tablet/mobile', 'quota isolation', 'selective resume', 'unknown values'], resources: state.usage.resources }, null, 2));
  console.log('AI usage QA passed. Artifacts: ' + home);
} finally {
  // Navigate away from software WebGL before closing Chrome.
  for (const context of browser?.contexts() ?? []) for (const page of context.pages()) await page.goto('about:blank').catch(() => undefined);
  await browser?.close();
  if (server.exitCode === null) {
    server.send({ type: 'office:shutdown', restart: false });
    const timer = setTimeout(() => server.kill(), 15000);
    await exited; clearTimeout(timer);
  }
  await fs.writeFile(path.join(home, 'server.log'), output);
  console.log('Isolated demo directory: ' + home);
}
