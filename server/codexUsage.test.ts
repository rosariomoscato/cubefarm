import { describe, expect, it } from 'vitest';
import { codexUsage, claudeStatusUsage, claudeMessageUsage } from '../shared/aiUsage.ts';
import { CODEX_USAGE_READER_SOURCE } from './codexUsage.ts';

const now = Date.now();
const meta = { type: 'session_meta', payload: { id: 'session', model_provider: 'custom-provider' } };
const model = (name: string) => ({ type: 'turn_context', payload: { model: name } });
const count = (input: number, output: number, at = now) => ({ type: 'event_msg', timestamp: new Date(at).toISOString(), payload: { type: 'token_count', total: { input_tokens: input, output_tokens: output }, limits: { primary: { used_percent: 92, resets_at: (now + 100000) / 1000 } } } });

describe('CLI telemetry normalization', () => {
  it('executes the hook reader against only the supplied fixture and never forwards transcript content', () => {
    const rows = [
      meta,
      { type: 'response_item', payload: { content: 'private prompt' } },
      { type: 'turn_context', payload: { model: 'test-model', cwd: 'private-path' } },
      { type: 'event_msg', timestamp: new Date(now).toISOString(), payload: { type: 'token_count', info: { total_token_usage: { input_tokens: 10, output_tokens: 2, secret: 'secret' } }, rate_limits: { primary: { used_percent: 100, resets_at: (now + 10000) / 1000 }, private: 'secret' } } },
    ];
    const content = rows.map((r) => JSON.stringify(r)).join('\n');
    const read = new Function('require', CODEX_USAGE_READER_SOURCE + '; return usageRecords;')(() => ({ statSync: () => ({ size: content.length }), readFileSync: (file: string) => { expect(file).toBe('fixture.jsonl'); return content; } }));
    const records = read({ session_id: 'session', transcript_path: 'fixture.jsonl' });
    expect(JSON.stringify(records)).not.toMatch(/private|secret|content/);
    expect(codexUsage('session', records, now)?.signals[0].kind).toBe('limit');
    expect(read({ session_id: 'foreign', transcript_path: 'fixture.jsonl' })).toEqual([]);
  });
  it('deduplicates Codex cumulative counters and attributes only deltas after model changes', () => {
    const result = codexUsage('session', [meta, model('a'), count(100, 10), count(100, 10), model('b'), count(150, 30)], now)!;
    expect(result.observations).toHaveLength(2);
    expect(result.observations[0]).toMatchObject({ provider: 'custom-provider', model: 'a', input: 100, output: 10, costUsd: null });
    expect(result.observations[1]).toMatchObject({ model: 'b', input: 50, output: 20, reasoning: null });
    expect(result.signals[0]).toMatchObject({ kind: 'warning', utilization: 0.92 });
  });
  it('ignores foreign transcripts, expired quota signals and counter resets', () => {
    expect(codexUsage('other', [meta, count(100, 20)], now)).toBeNull();
    expect(codexUsage('session', [meta, count(100, 20, now - 600000)], now)?.signals).toEqual([]);
    const reset = codexUsage('session', [meta, count(100, 20), count(10, 2)], now)!;
    expect(reset.observations[1]).toMatchObject({ input: null, output: null });
  });
  it('keeps Claude cumulative counters separate from model-specific messages and unknown cost from zero', () => {
    expect(claudeStatusUsage('s', { cost: { total_cost_usd: null } }, now)).toMatchObject({ model: null, costUsd: null });
    expect(claudeStatusUsage('s', { cost: { total_cost_usd: 0 }, context_window: { total_input_tokens: 12 } }, now)).toMatchObject({ model: null, costUsd: 0, input: 12, output: null });
    expect(claudeMessageUsage('s', { id: 'm', model: 'changed', usage: { input_tokens: 10, cache_read_input_tokens: 5 } }, now)).toMatchObject({ model: 'changed', input: 10, cacheRead: 5, costUsd: null });
  });
});
