import type { OpenCodeCatalog, OpenCodeModel } from '../shared/opencodeModels.ts';
import { checkOpenCodeVersion, commandFor } from './clis.ts';
import { run } from './exec.ts';

function model(value: unknown): OpenCodeModel | null {
  if (!value || typeof value !== 'object') return null;
  const m = value as Record<string, unknown>;
  if (typeof m.id !== 'string' || !m.id || typeof m.providerID !== 'string' || !m.providerID || m.enabled === false || (m.type && m.type !== 'chat')) return null;
  return {
    id: `${m.providerID}/${m.id}`, provider: m.providerID,
    name: typeof m.name === 'string' ? m.name : m.id,
    variants: [...new Set<string>((Array.isArray(m.variants) ? m.variants : []).flatMap((v: unknown) => v && typeof v === 'object' && typeof (v as { id?: unknown }).id === 'string' ? [(v as { id: string }).id] : []))],
    tools: !!m.capabilities && typeof m.capabilities === 'object' && (m.capabilities as { tools?: unknown }).tools === true,
  };
}
export function sanitizeCatalog(list: unknown, selected: unknown, directory: string): OpenCodeCatalog {
  const data = (list as { data?: unknown })?.data;
  if (!Array.isArray(data)) throw new Error('Invalid OpenCode model inventory');
  const models = [...new Map(data.flatMap((v) => { const m = model(v); return m ? [[m.id, m] as const] : []; })).values()];
  models.sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));
  return { models, defaultModel: model((selected as { data?: unknown })?.data)?.id ?? null, directory };
}
export function createModelCatalogReader(read: (directory: string) => Promise<OpenCodeCatalog>, now = Date.now) {
  const cache = new Map<string, { until: number; data: OpenCodeCatalog }>();
  const pending = new Map<string, Promise<OpenCodeCatalog>>();
  return (directory: string, refresh = false): Promise<OpenCodeCatalog> => {
    const active = pending.get(directory);
    if (active) return active;
    const saved = cache.get(directory);
    if (!refresh && saved && saved.until > now()) return Promise.resolve(saved.data);
    const request = read(directory).then((data) => {
      if (cache.size >= 32) cache.delete(cache.keys().next().value!);
      cache.set(directory, { until: now() + 30_000, data });
      return data;
    }).finally(() => pending.delete(directory));
    pending.set(directory, request);
    return request;
  };
}
export const openCodeModels = createModelCatalogReader(async (directory) => {
  const cmd = commandFor('opencode');
  if (!cmd) throw new Error('OpenCode is not installed on this computer.');
  const problem = await checkOpenCodeVersion(cmd);
  if (problem) throw new Error(problem);
  try {
    const query = `?location[directory]=${encodeURIComponent(directory)}`;
    const [list, selected] = await Promise.all(['/api/model', '/api/model/default'].map((endpoint) =>
      run(cmd.file, [...cmd.args, 'api', 'get', endpoint + query], { timeoutMs: 30_000 }).then((text) => JSON.parse(text))));
    return sanitizeCatalog(list, selected, directory);
  } catch {
    throw new Error('Could not read OpenCode models. Check OpenCode connections and retry; manual model entry is still available.');
  }
});
