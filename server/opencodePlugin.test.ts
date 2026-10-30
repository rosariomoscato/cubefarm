import { afterEach, describe, expect, it, vi } from 'vitest';
import { OPENCODE_PLUGIN_SOURCE } from './clis.ts';

const SESSION = 'ses_cubefarm_test';
const URL = 'http://127.0.0.1:4417/api/hooks/test';
const user = { id: 'user', type: 'user', text: 'Plan the work' };
const reply = { id: 'reply', type: 'assistant', content: [{ type: 'reasoning', text: 'private reasoning' }, { type: 'text', text: 'The plan is ready.' }] };
const idle = { id: 'idle', type: 'idle', outcome: 'succeeded' };

async function plugin(events: Record<string, unknown>[], messages: unknown[] = [user, reply, idle], model?: { providerID: string; id: string; variant?: string }) {
  const posts: Record<string, unknown>[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    expect(url).toBe(URL);
    posts.push(JSON.parse(String(init.body)));
    return new Response('{}');
  }));
  let signal: AbortSignal | undefined;
  const context = vi.fn(async () => messages);
  const definition = (await import(`data:text/javascript;base64,${Buffer.from(OPENCODE_PLUGIN_SOURCE).toString('base64')}`)).default;
  const promptHook = vi.fn();
  const switchModel = vi.fn();
  const defaultModel = vi.fn(async () => ({ providerID: 'openai', id: 'configured-default' }));
  const dispose = await definition.setup({
    options: { sessionID: SESSION, notifyUrl: URL, model },
    model: { default: defaultModel },
    session: { context, get: async () => ({ id: SESSION, outcome: 'succeeded' }), hook: promptHook, switchModel },
    event: { subscribe: async function* (options: { signal: AbortSignal }) {
      signal = options.signal;
      for (const event of events) yield event;
    } },
  });
  return { posts, context, dispose, promptHook, switchModel, defaultModel, signal: () => signal };
}

afterEach(() => vi.unstubAllGlobals());

describe('OpenCode V2 turn notifications', () => {
  it('applies the selected model and variant before admitting a resumed prompt', async () => {
    const model = { providerID: 'openai', id: 'gpt-6.1-sol', variant: 'medium' };
    const p = await plugin([], undefined, model);
    await p.promptHook.mock.calls[0][1]({ sessionID: SESSION, prompt: { text: 'Continue' } });
    expect(p.switchModel).toHaveBeenCalledWith({ sessionID: SESSION, model });
    expect(p.defaultModel).not.toHaveBeenCalled();
    expect(p.posts[0].hook_event_name).toBe('UserPromptSubmit');
    p.dispose();
  });

  it('restores the OpenCode default on resume when the explicit model is cleared', async () => {
    const p = await plugin([]);
    await p.promptHook.mock.calls[0][1]({ sessionID: SESSION, prompt: { text: 'Continue' } });
    expect(p.switchModel).toHaveBeenCalledWith({ sessionID: SESSION, model: { providerID: 'openai', id: 'configured-default' } });
    p.dispose();
  });
  it('forwards native V2 execution completion without relying on the compatibility idle event', async () => {
    const p = await plugin([{ id: 'evt_native', type: 'session.execution.succeeded', data: { sessionID: SESSION }, durable: { aggregateID: SESSION, seq: 1, version: 1 } }]);
    await vi.waitFor(() => expect(p.posts).toHaveLength(1));
    expect(p.posts[0]).toMatchObject({ hook_event_name: 'TurnComplete', last_assistant_message: 'The plan is ready.' });
    p.dispose();
  });

  it.each(['failed', 'interrupted'])('handles native execution %s events', async (outcome) => {
    const p = await plugin([{ type: `session.execution.${outcome}`, data: { sessionID: SESSION, error: 'provider unavailable' } }]);
    await vi.waitFor(() => expect(p.posts).toHaveLength(1));
    expect(p.posts[0].hook_event_name).toBe(outcome === 'failed' ? 'TurnError' : 'Interrupt');
    p.dispose();
  });

  it('does not deliver twice when native and compatibility completion events both arrive', async () => {
    const p = await plugin([
      { type: 'session.execution.succeeded', data: { sessionID: SESSION } },
      { type: 'session.idle', data: { sessionID: SESSION } },
    ]);
    await vi.waitFor(() => expect(p.context).toHaveBeenCalledTimes(2));
    expect(p.posts).toHaveLength(1);
    p.dispose();
  });
  it('handles the native V2 event envelope: sessionID is inside data', async () => {
    const p = await plugin([{ id: 'evt_test', created: 1, type: 'session.idle', data: { sessionID: SESSION } }]);
    await vi.waitFor(() => expect(p.posts).toHaveLength(1));
    expect(p.posts[0]).toEqual({ hook_event_name: 'TurnComplete', session_id: SESSION, last_assistant_message: 'The plan is ready.' });
    p.dispose();
  });
  it('reports new prompts only for its own session so the office knows it is busy', async () => {
    const p = await plugin([]);
    expect(p.promptHook.mock.calls[0][0]).toBe('prompt');
    const hook = p.promptHook.mock.calls[0][1];
    await hook({ sessionID: 'ses_foreign', prompt: { text: 'Ignore this' } });
    expect(p.posts).toEqual([]);
    await hook({ sessionID: SESSION, prompt: { text: 'Plan it' } });
    expect(p.posts).toEqual([{ hook_event_name: 'UserPromptSubmit', session_id: SESSION, prompt: 'Plan it' }]);
    p.dispose();
  });
  it('reads the V2 context, forwards only the final text, and deduplicates idle events', async () => {
    const event = { type: 'session.idle', sessionID: SESSION };
    const p = await plugin([event, event]);
    await vi.waitFor(() => expect(p.context).toHaveBeenCalledTimes(2));
    expect(p.posts).toEqual([{ hook_event_name: 'TurnComplete', session_id: SESSION, last_assistant_message: 'The plan is ready.' }]);
    p.dispose();
    expect(p.signal()?.aborted).toBe(true);
  });

  it('ignores other sessions and subagents, including their failures', async () => {
    const p = await plugin([
      { type: 'session.idle', sessionID: 'ses_other' },
      { type: 'session.error', sessionID: 'ses_child', error: 'child failed' },
      { type: 'session.idle', properties: { sessionID: SESSION } },
    ]);
    await vi.waitFor(() => expect(p.posts).toHaveLength(1));
    expect(p.context).toHaveBeenCalledTimes(1);
    p.dispose();
  });

  it.each(['failed', 'interrupted'])('reports a %s turn instead of treating it as a successful reply', async (outcome) => {
    const p = await plugin([{ type: 'session.idle', sessionID: SESSION }], [user, reply, { ...idle, outcome, error: 'provider unavailable' }]);
    await vi.waitFor(() => expect(p.posts).toHaveLength(1));
    expect(p.posts[0].hook_event_name).toBe(outcome === 'failed' ? 'TurnError' : 'Interrupt');
    p.dispose();
  });

  it('does not reuse an old reply when the new turn produced none', async () => {
    const p = await plugin([{ type: 'session.idle', sessionID: SESSION }], [reply, user, idle]);
    await vi.waitFor(() => expect(p.posts).toHaveLength(1));
    expect(p.posts[0]).toMatchObject({ hook_event_name: 'TurnError', error: 'OpenCode finished without a final reply' });
    p.dispose();
  });
});
