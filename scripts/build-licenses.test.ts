import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture(version = '1.0.0', text?: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'droidsembly-licenses-'));
  roots.push(root);
  for (const dir of ['scripts/licenses', 'dist', 'node_modules/example']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(new URL('./build-licenses.mjs', import.meta.url), path.join(root, 'scripts/build-licenses.mjs'));
  fs.writeFileSync(path.join(root, 'scripts/licenses/overrides.json'), JSON.stringify({
    'example@1.0.0': { identifier: 'MIT', file: 'example.txt', source: 'https://example.org/pinned/LICENSE' },
  }));
  fs.writeFileSync(path.join(root, 'scripts/licenses/example.txt'), 'Original upstream license text');
  fs.writeFileSync(path.join(root, 'dist/third-party-licenses.json'), JSON.stringify([{ name: 'example', version, text }]));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/example': { version } } }));
  fs.writeFileSync(path.join(root, 'node_modules/example/package.json'), JSON.stringify({ name: 'example', version }));
  fs.writeFileSync(path.join(root, 'node_modules/example/NOTICE'), 'Additional upstream attribution');
  return { root, run: () => spawnSync(process.execPath, [path.join(root, 'scripts/build-licenses.mjs')], { encoding: 'utf8' }) };
}

it('retains separate NOTICE text alongside a version-pinned license fallback', () => {
  const { root, run } = fixture();
  expect(run().status).toBe(0);
  const text = fs.readFileSync(path.join(root, 'dist/THIRD_PARTY_LICENSES.txt'), 'utf8');
  expect(text).toContain('Original upstream license text');
  expect(text).toContain('Additional upstream attribution');
  expect(text).toContain('https://example.org/pinned/LICENSE');
});

it('rejects missing texts after a dependency version changes instead of reusing a stale license', () => {
  const { run } = fixture('2.0.0');
  const result = run();
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('Missing license text for example@2.0.0');
});

it('accepts an upstream text for a new version without applying the old override', () => {
  const { root, run } = fixture('2.0.0', 'New upstream license');
  expect(run().status).toBe(0);
  const text = fs.readFileSync(path.join(root, 'dist/THIRD_PARTY_LICENSES.txt'), 'utf8');
  expect(text).toContain('New upstream license');
  expect(text).not.toContain('Original upstream license text');
  expect(text).not.toContain('https://example.org/pinned/LICENSE');
});
