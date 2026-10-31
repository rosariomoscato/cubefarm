import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { handleGateway } from './previewGateway.ts';
import { PREVIEW_CHECK_EVENT, PREVIEW_CHECK_PATH } from '../shared/phoneAccess.ts';

const servers: http.Server[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(s => new Promise<void>(resolve => s.close(() => resolve())))); });
async function office() {
  const s = http.createServer((req, res) => {
    if (!handleGateway(req, res, () => false)) res.writeHead(404).end('office fallback');
  });
  servers.push(s);
  await new Promise<void>(resolve => s.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
}

describe('synthetic preview transport check', () => {
  it('serves exact diagnostic paths without any running preview or upstream connection', async () => {
    const base = await office();
    const page = await fetch(base + PREVIEW_CHECK_PATH + '?nonce=not-reflected<script>');
    expect(page.status).toBe(200);
    expect(page.headers.get('cache-control')).toBe('no-store');
    const body = await page.text();
    expect(body).toContain('data-cubefarm-preview');
    expect(body).toContain('href="/__cubefarm_check__.css"');
    expect(body).toContain('src="/__cubefarm_check__.js"');
    expect(body).not.toContain('not-reflected');
    const css = await fetch(base + '/preview/0/__cubefarm_check__.css');
    expect(css.headers.get('content-type')).toMatch(/^text\/css/);
    expect(await css.text()).toContain('--cubefarm-preview-check:ready');
    const js = await fetch(base + '/preview/0/__cubefarm_check__.js');
    expect(js.headers.get('content-type')).toMatch(/^text\/javascript/);
    expect(js.headers.get('x-content-type-options')).toBe('nosniff');
    const script = await js.text();
    expect(() => new Function(script)).not.toThrow();
    expect(script).toContain(PREVIEW_CHECK_EVENT);
    expect((await fetch(base + '/preview/0/')).status).toBe(404);
    expect((await fetch(base + '/preview/0/__cubefarm_check__.js/extra')).status).toBe(404);
    expect((await fetch(base + '/__cubefarm_check__.css')).status).toBe(404);
    expect((await fetch(base + '/preview/1234/__cubefarm_check__.js')).status).toBe(404);
    expect((await fetch(base + PREVIEW_CHECK_PATH, { method: 'POST' })).status).toBe(405);
  });

  it('reports real worker and computed-style failures, ignores invalid nonces and targets its own origin', async () => {
    const base = await office();
    const script = await (await fetch(base + '/preview/0/__cubefarm_check__.js')).text();
    const nonce = 'a'.repeat(32);
    for (const worker of [false, true]) for (const styles of [false, true]) {
      const sent: unknown[][] = [];
      new Function('addEventListener', 'location', 'navigator', 'parent', 'getComputedStyle', 'document', script)(
        (_event: string, fn: () => void) => fn(), { href: `https://office.example${PREVIEW_CHECK_PATH}?nonce=${nonce}`, origin: 'https://office.example' },
        { serviceWorker: { controller: worker ? { scriptURL: 'https://office.example/preview/sw.js' } : { scriptURL: 'https://office.example/sw.js' } } },
        { postMessage: (...args: unknown[]) => sent.push(args) }, () => ({ getPropertyValue: () => styles ? ' ready ' : '' }), { documentElement: {} },
      );
      expect(sent).toEqual([[{ type: PREVIEW_CHECK_EVENT, nonce, worker, styles, script: true }, 'https://office.example']]);
    }
    let sent = false;
    new Function('addEventListener', 'location', 'parent', script)((_event: string, fn: () => void) => fn(), { href: `https://office.example${PREVIEW_CHECK_PATH}?nonce=invalid` }, { postMessage: () => { sent = true; } });
    expect(sent).toBe(false);
  });
});
