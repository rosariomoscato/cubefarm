import { describe, expect, it, vi } from 'vitest';
import { createModelCatalogReader, openCodeModels, sanitizeCatalog } from './opencodeModels.ts';
import { searchOpenCodeModels } from '../shared/opencodeModels.ts';
import { createDemoBackend } from './demo.ts';

const { run, version } = vi.hoisted(() => ({ run: vi.fn(), version: vi.fn() }));
vi.mock('./exec.ts', async (original) => ({ ...await original<typeof import('./exec.ts')>(), run }));
vi.mock('./clis.ts', async (original) => ({
  ...await original<typeof import('./clis.ts')>(),
  commandFor: () => ({ file: 'opencode.exe', args: [] }), checkOpenCodeVersion: version,
}));

const raw = {
  id: 'custom/model', modelID: 'different-api-id', providerID: 'provider', name: 'Coding Model', type: 'chat', enabled: true,
  capabilities: { tools: true }, settings: { apiKey: 'secret' }, headers: { authorization: 'secret' }, body: { secret: true },
  variants: [{ id: 'high', settings: { secret: true }, headers: { token: 'secret' } }, { id: 'low' }, { id: 'high' }, null, {}],
};
const catalog = () => sanitizeCatalog({ data: [raw] }, { data: raw }, 'project');

describe('OpenCode model inventory', () => {
  it('uses only read-only model API calls with the requested project location', async () => {
    version.mockResolvedValue(null);
    run.mockReset().mockImplementation(async (_file, args: string[]) => JSON.stringify({ data: args.at(-1)!.startsWith('/api/model/default?') ? raw : [raw] }));
    const c = await openCodeModels('C:\\project with spaces');
    expect(c.models[0].id).toBe('provider/custom/model');
    expect(run).toHaveBeenCalledTimes(2);
    for (const call of run.mock.calls) {
      expect(call[1].slice(0, 2)).toEqual(['api', 'get']);
      expect(call[1][2]).toContain('location[directory]=C%3A%5Cproject%20with%20spaces');
    }
  });
  it('blocks incompatible versions before reading inventory', async () => {
    version.mockResolvedValue('Requires OpenCode V2');
    run.mockClear();
    await expect(openCodeModels('incompatible-project')).rejects.toThrow('Requires OpenCode V2');
    expect(run).not.toHaveBeenCalled();
  });
  it('never forwards CLI diagnostics that might contain credentials', async () => {
    version.mockResolvedValue(null);
    run.mockRejectedValue(new Error('secret-auth-token'));
    await expect(openCodeModels('offline-project')).rejects.toThrow('Could not read OpenCode models');
    await expect(openCodeModels('offline-project')).rejects.not.toThrow('secret-auth-token');
  });
  it('whitelists metadata, retaining slash-containing IDs but never modelID or secrets', () => {
    expect(catalog()).toEqual({ directory: 'project', defaultModel: 'provider/custom/model', models: [{
      id: 'provider/custom/model', provider: 'provider', name: 'Coding Model', variants: ['high', 'low'], tools: true,
    }] });
    expect(JSON.stringify(catalog())).not.toContain('secret');
  });
  it('filters disabled, non-chat and malformed models and deduplicates IDs', () => {
    const c = sanitizeCatalog({ data: [raw, raw, { ...raw, enabled: false }, { ...raw, type: 'embedding' }, null, {}, { id: 'x' }] }, { data: null }, 'p');
    expect(c.models).toHaveLength(1);
    expect(c.defaultModel).toBeNull();
  });
  it('handles no variants and models without tools', () => {
    expect(sanitizeCatalog({ data: [{ ...raw, variants: undefined, capabilities: undefined }] }, {}, 'p').models[0]).toMatchObject({ variants: [], tools: false });
  });
  it('refuses invalid envelopes, but accepts an empty inventory', () => {
    expect(() => sanitizeCatalog({}, {}, 'p')).toThrow(/Invalid/);
    expect(sanitizeCatalog({ data: [] }, { data: null }, 'p').models).toEqual([]);
  });
  it('searches all words case-insensitively and filters by provider', () => {
    const models = catalog().models;
    expect(searchOpenCodeModels(models, 'CODING provider')).toEqual(models);
    expect(searchOpenCodeModels(models, 'missing')).toEqual([]);
    expect(searchOpenCodeModels(models, '', 'other')).toEqual([]);
  });
  it('deduplicates concurrent reads, caches briefly and refreshes explicitly', async () => {
    let time = 0;
    const read = vi.fn(async () => catalog());
    const get = createModelCatalogReader(read, () => time);
    const first = get('p');
    expect(get('p', true)).toBe(first);
    await first;
    await get('p');
    expect(read).toHaveBeenCalledTimes(1);
    await get('p', true);
    expect(read).toHaveBeenCalledTimes(2);
    time = 30_001;
    await get('p');
    await get('different-project');
    expect(read).toHaveBeenCalledTimes(4);
  });
  it('does not cache failures and permits a retry', async () => {
    const read = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(catalog());
    const get = createModelCatalogReader(read);
    await expect(get('p')).rejects.toThrow('offline');
    await expect(get('p')).resolves.toEqual(catalog());
    expect(read).toHaveBeenCalledTimes(2);
  });
  it('serves a simulated demo catalog without invoking OpenCode', async () => {
    const c = await createDemoBackend().openCodeModels('demo-project');
    expect(c.directory).toBe('demo-project');
    expect(c.models.find((m) => m.id === c.defaultModel)?.variants).toContain('high');
  });
});
