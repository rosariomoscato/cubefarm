/** Safe selection metadata; no provider settings or credentials. */
export interface OpenCodeModel {
  id: string;
  provider: string;
  name: string;
  variants: string[];
  tools: boolean;
}
export interface OpenCodeCatalog {
  models: OpenCodeModel[];
  defaultModel: string | null;
  directory: string;
}

export function openCodeModelRef(value: string) {
  const [base, variant] = value.trim().split('#');
  const slash = base.indexOf('/');
  if (slash < 1 || slash === base.length - 1) return null;
  return { providerID: base.slice(0, slash), id: base.slice(slash + 1), ...(variant ? { variant } : {}) };
}

export function withOpenCodeVariant(model: string, variant: string) {
  const base = model.split('#')[0];
  return base ? base + (variant ? `#${variant}` : '') : '';
}
export function searchOpenCodeModels(models: OpenCodeModel[], query: string, provider = '') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return models.filter((m) => (!provider || m.provider === provider) && words.every((word) => `${m.id} ${m.name}`.toLowerCase().includes(word)));
}
