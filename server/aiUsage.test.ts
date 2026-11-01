import { describe, expect, it } from 'vitest';
import { mergeUsage, openCodeUsage, quotaKey, type AiUsageObservation, type QuotaIdentity } from '../shared/aiUsage.ts';
import { QuotaGate } from './quotaGate.ts';

describe('observed AI usage', () => {
  it('discovers arbitrary providers, keeps missing values unknown and drops private fields', () => {
    const observation = openCodeUsage('session', { id: 'message', type: 'assistant', time: { created: 100 }, model: { providerID: 'future-provider', id: 'new-model', secret: 'secret' }, content: ['private'], cost: null, tokens: { input: 0, output: '12', reasoning: -1 } });
    expect(observation).toMatchObject({ provider: 'future-provider', model: 'new-model', input: 0, output: null, reasoning: null, costUsd: null });
    expect(JSON.stringify(observation)).not.toMatch(/secret|private/);
  });

  it('replaces repeated observations without reassigning history after a model change', () => {
    const history: AiUsageObservation[] = [];
    const first = openCodeUsage('session', { id: 'a', type: 'assistant', time: { created: 100 }, model: { providerID: 'one', id: 'm1' }, tokens: { input: 10 } })!;
    mergeUsage(history, first);
    mergeUsage(history, { ...first, output: 20 });
    mergeUsage(history, { ...first, id: 'b', provider: 'two', model: 'm2' });
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ provider: 'one', model: 'm1', input: 10, output: 20 });
  });
});

describe('resource-local quota gates', () => {
  it('keeps simultaneous windows distinct across a waiver and never revives an expired warning', () => {
    const gate = new QuotaGate();
    const short = { resetsAt: 100000, utilization: .9, rateLimitType: 'short' };
    const long = { ...short, resetsAt: 300000, rateLimitType: 'long' };
    gate.warn('a', short, 1000); gate.warn('a', long, 1000);
    expect(gate.resume('a', 2000)).toBe(true);
    gate.warn('a', short, 3000); gate.warn('a', long, 3000);
    expect(gate.allows('a', 'issue', 3000, 3, 3)).toBe(true);
    gate.warn('a', { ...short, rateLimitType: 'new-window' }, 3000);
    expect(gate.allows('a', 'issue', 3000, 3, 3)).toBe(false);
    gate.warn('b', short, 200000);
    expect(gate.view('b', 200000).state).toBe('normal');
  });
  const identity: QuotaIdentity = { tool: 'opencode', provider: 'arbitrary', account: 'account', access: 'subscription', fallback: 'agent' };
  it('isolates tools, providers, accounts and access modes unless sharing is confirmed', () => {
    const variants: QuotaIdentity[] = [identity, { ...identity, tool: 'codex' }, { ...identity, provider: 'other' }, { ...identity, account: 'other' }, { ...identity, access: 'api' }];
    expect(new Set(variants.map(quotaKey)).size).toBe(5);
    expect(quotaKey({ ...identity, sharedGroup: 'confirmed' })).toBe(quotaKey({ ...identity, tool: 'codex', sharedGroup: 'confirmed' }));
    const gate = new QuotaGate();
    gate.limit(quotaKey(identity), 5000, 1000);
    for (const kind of ['issue', 'qa', 'fix', 'ceo'] as const) {
      expect(gate.allows(quotaKey(identity), kind, 2000, 0, 3)).toBe(false);
      expect(gate.allows(quotaKey(variants[2]), kind, 2000, 0, 3)).toBe(true);
    }
    expect(gate.resume(quotaKey(identity), 2000)).toBe(false);
    expect(gate.allows(quotaKey(identity), 'ceo', 5000, 0, 3)).toBe(true);
  });

  it('paces only new issues in the affected resource and waives only the selected window', () => {
    const gate = new QuotaGate();
    const warning = { resetsAt: 100000, utilization: 0.9, rateLimitType: 'weekly' };
    gate.warn('a', warning, 1000);
    gate.warn('b', warning, 1000);
    expect(gate.allows('a', 'issue', 2000, 3, 3)).toBe(false);
    expect(gate.allows('a', 'qa', 2000, 3, 3)).toBe(true);
    expect(gate.resume('a', 2000)).toBe(true);
    gate.warn('a', warning, 2000);
    expect(gate.allows('a', 'issue', 2000, 3, 3)).toBe(true);
    expect(gate.allows('b', 'issue', 2000, 3, 3)).toBe(false);
    gate.warn('a', { ...warning, resetsAt: 300000 }, 2000);
    expect(gate.allows('a', 'issue', 2000, 3, 3)).toBe(false);
  });
});
