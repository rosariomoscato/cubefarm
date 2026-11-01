/** Runs inside the trusted Codex hook on its own machine, never scans unrelated sessions. */
export const CODEX_USAGE_READER_SOURCE = String.raw`
function usageRecords(event) {
  if (typeof event.transcript_path !== 'string' || event.agent_id) return [];
  const fs = require('node:fs');
  const file = event.transcript_path;
  if (!file.endsWith('.jsonl') || fs.statSync(file).size > 16 * 1024 * 1024) return [];
  const records = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let row; try { row = JSON.parse(line); } catch { continue; }
    const p = row.payload;
    if (!p || typeof p !== 'object') continue;
    if (row.type === 'session_meta') {
      if (p.id !== event.session_id) return [];
      records.push({ type: row.type, payload: { id: p.id, model_provider: p.model_provider } });
    } else if (row.type === 'turn_context') {
      records.push({ type: row.type, payload: { model: p.model } });
    } else if (row.type === 'event_msg' && p.type === 'token_count') {
      const u = p.info?.total_token_usage;
      const limits = p.rate_limits;
      const window = (w) => w && ({ used_percent: w.used_percent, resets_at: w.resets_at });
      records.push({ type: row.type, timestamp: row.timestamp, payload: {
        type: 'token_count', total: u && { input_tokens: u.input_tokens, output_tokens: u.output_tokens,
          cached_input_tokens: u.cached_input_tokens, cache_write_input_tokens: u.cache_write_input_tokens,
          reasoning_output_tokens: u.reasoning_output_tokens },
        limits: limits && { primary: window(limits.primary), secondary: window(limits.secondary),
          credits: limits.credits && { has_credits: limits.credits.has_credits, unlimited: limits.credits.unlimited } },
      } });
    }
  }
  // If the format changes, don't guess which session owns the observations.
  return records[0]?.type === 'session_meta' && records.length <= 4000 ? records : [];
}
`;
