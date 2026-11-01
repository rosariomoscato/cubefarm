import type { AgentCli } from './types.ts';

/** An observation, not an invoice or a subscription balance. Missing values stay null. */
export interface AiUsageObservation {
  agentId?: string;
  repoId?: string | null;
  id: string;
  sessionId: string;
  tool: AgentCli;
  provider: string | null;
  model: string | null;
  at: number;
  input: number | null;
  output: number | null;
  reasoning: number | null;
  cacheRead: number | null;
  cacheWrite: number | null;
  costUsd: number | null;
  source: 'opencode-message' | 'claude-message' | 'claude-status' | 'codex-transcript';
  /** Message time and receipt time are deliberately distinct. */
  observedAt?: number;
}

export interface AiResource {
  tool: AgentCli;
  provider: string | null;
  model: string | null;
  account: string | null;
  access: 'subscription' | 'api' | 'unknown';
}

export interface AiLimitSignal {
  resource: AiResource;
  kind: 'warning' | 'limit';
  resetsAt: number | null;
  utilization: number | null;
  limit: string | null;
  source: string;
}

export interface AiResourceView extends AiResource {
  key: string;
  group: string | null;
  agentIds: string[];
  running: number;
  state: 'normal' | 'pacing' | 'paused';
  until: number | null;
  observedAt: number | null;
  warning: import('./types.ts').UsageWarningView | null;
}

export function resourceInput(tool: AgentCli, value: unknown): AiResource {
  const v = object(value);
  return { tool, provider: text(v.provider), model: text(v.model), account: text(v.account), access: v.access === 'api' || v.access === 'subscription' ? v.access : 'unknown' };
}

export function claudeMessageUsage(sessionId: string, value: unknown, at: number): AiUsageObservation | null {
  const m = object(value), u = object(m.usage);
  const id = text(m.id);
  if (!id) return null;
  return { id, sessionId, tool: 'claude', provider: null, model: text(m.model), at,
    input: amount(u.input_tokens), output: amount(u.output_tokens), reasoning: null,
    cacheRead: amount(u.cache_read_input_tokens), cacheWrite: amount(u.cache_creation_input_tokens), costUsd: null, source: 'claude-message' };
}

/** Statusline totals are cumulative per session; they must not be added to message token observations. */
export function claudeStatusUsage(sessionId: string, value: unknown, at: number): AiUsageObservation {
  const b = object(value);
  return { id: 'status-cost', sessionId, tool: 'claude', provider: null, model: null, at,
    input: amount(object(b.context_window).total_input_tokens), output: amount(object(b.context_window).total_output_tokens), reasoning: null, cacheRead: null, cacheWrite: null,
    costUsd: amount(object(b.cost).total_cost_usd), source: 'claude-status' };
}

const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown): string | null => typeof v === 'string' && v.length > 0 && v.length <= 512 ? v : null;
const amount = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;

/** Whitelist the native V2 message fields; never retain content, errors, headers or credentials. */
export function openCodeUsage(sessionId: string, value: unknown): AiUsageObservation | null {
  const m = object(value), model = object(m.model), tokens = object(m.tokens), cache = object(tokens.cache);
  const id = text(m.id), at = amount(object(m.time).created);
  if (m.type !== 'assistant' || !id || at === null || !text(sessionId)) return null;
  return {
    id, sessionId, tool: 'opencode', provider: text(model.providerID), model: text(model.id), at,
    input: amount(tokens.input), output: amount(tokens.output), reasoning: amount(tokens.reasoning),
    cacheRead: amount(cache.read), cacheWrite: amount(cache.write), costUsd: amount(m.cost), source: 'opencode-message',
  };
}

/** A message can be observed repeatedly or updated after streaming. Replace it, never add it twice. */
export function mergeUsage(history: AiUsageObservation[], incoming: AiUsageObservation): boolean {
  const index = history.findIndex((m) => m.tool === incoming.tool && m.sessionId === incoming.sessionId && m.id === incoming.id);
  if (index >= 0 && JSON.stringify({ ...history[index], observedAt: undefined }) === JSON.stringify({ ...incoming, observedAt: undefined })) return false;
  if (index < 0) history.push(incoming);
  else history[index] = incoming;
  return true;
}

export interface QuotaIdentity {
  tool: AgentCli;
  provider: string | null;
  /** Opaque, non-secret local account reference. Absent means sharing has not been established. */
  account: string | null;
  access: 'subscription' | 'api' | 'unknown';
  /** Set only from an explicit, confirmed quota association. */
  sharedGroup?: string;
  fallback: string;
}

export function quotaKey(identity: QuotaIdentity): string {
  if (identity.sharedGroup) return JSON.stringify(['shared', identity.sharedGroup]);
  return JSON.stringify([identity.tool, identity.provider, identity.account ?? identity.fallback, identity.access]);
}

/** Best-effort adapter for allowlisted Codex transcript records. Never use context-window percentages as quota. */
export function codexUsage(sessionId: string, records: unknown, now: number): { observations: AiUsageObservation[]; resource: AiResource; signals: AiLimitSignal[] } | null {
  if (!Array.isArray(records) || records.length > 4000 || object(object(records[0]).payload).id !== sessionId) return null;
  const resource: AiResource = { tool: 'codex', provider: text(object(object(records[0]).payload).model_provider), model: null, account: null, access: 'unknown' };
  const observations: AiUsageObservation[] = [];
  let previous: Record<string, unknown> = {};
  let latestLimits: Record<string, unknown> = {}, latestAt = 0;
  const seen = new Set<string>();
  for (const raw of records) {
    const row = object(raw), p = object(row.payload);
    if (row.type === 'turn_context') resource.model = text(p.model);
    if (row.type !== 'event_msg' || p.type !== 'token_count') continue;
    const at = typeof row.timestamp === 'string' ? Date.parse(row.timestamp) : NaN;
    if (!Number.isFinite(at)) continue;
    if (p.limits && at >= latestAt) { latestLimits = object(p.limits); latestAt = at; }
    if (!p.total) continue;
    const total = object(p.total), fingerprint = JSON.stringify(total);
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    const delta = (key: string) => {
      const value = amount(total[key]), before = amount(previous[key]);
      return value === null ? null : before === null ? (observations.length ? null : value) : value >= before ? value - before : null;
    };
    observations.push({ id: `tokens:${fingerprint}`, sessionId, tool: 'codex', provider: resource.provider, model: resource.model, at,
      input: delta('input_tokens'), output: delta('output_tokens'), cacheRead: delta('cached_input_tokens'), cacheWrite: delta('cache_write_input_tokens'),
      reasoning: delta('reasoning_output_tokens'), costUsd: null, source: 'codex-transcript' });
    previous = total;
  }
  const signals: AiLimitSignal[] = [];
  // Never resurrect an old window on replay or restart. New quota data will arrive on another hook.
  if (latestAt > now - 5 * 60_000 && latestAt <= now + 60_000) for (const name of ['primary', 'secondary']) {
    const w = object(latestLimits[name]), used = amount(w.used_percent), seconds = amount(w.resets_at);
    const resetsAt = seconds === null ? null : seconds * 1000;
    if (used === null || used < 80 || (resetsAt !== null && resetsAt <= now)) continue;
    const credits = object(latestLimits.credits);
    signals.push({ resource: { ...resource }, kind: used >= 100 && credits.has_credits !== true && credits.unlimited !== true ? 'limit' : 'warning', resetsAt, utilization: used / 100, limit: name, source: 'codex-transcript' });
  }
  return { observations, resource, signals };
}
