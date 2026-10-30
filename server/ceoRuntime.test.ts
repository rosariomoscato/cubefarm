import fs from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CEO_ID } from '../shared/types.ts';
import type { SessionCallbacks, SessionOptions } from './agentRunner.ts';
import { createDemoBackend } from './demo.ts';
import { Swarm } from './swarm.ts';
import { openCodeVersionProblem } from './clis.ts';

const { home } = vi.hoisted(() => ({ home: `${process.env.SWARM_HOME}/ceo-runtime-${process.pid}` }));
vi.mock('./config.ts', async (original) => ({
  ...await original<typeof import('./config.ts')>(),
  HOME_DIR: home, STATE_FILE: `${home}/state.json`, WORKSPACE_ROOT: `${home}/workspaces`,
}));

let swarm: Swarm | undefined;
afterEach(async () => {
  await swarm?.shutdown();
  swarm = undefined;
  await fs.rm(home, { recursive: true, force: true, maxRetries: 5 });
});

async function office(openCodeInstalled = true, problem?: string) {
  const sessions: { opts: SessionOptions; cb: SessionCallbacks }[] = [];
  const send = vi.fn();
  const backend = createDemoBackend();
  const detect = backend.detectClis;
  backend.detectClis = async () => (await detect()).map((cli) => cli.id === 'opencode' ? { ...cli, installed: openCodeInstalled, ...(problem ? { problem } : {}) } : cli);
  backend.listMyRepos = async () => [];
  backend.startSession = (opts, cb) => {
    sessions.push({ opts, cb });
    return { send, stop: () => undefined };
  };
  swarm = new Swarm(backend);
  vi.spyOn(swarm.journal, 'hasPastDays').mockResolvedValue(true);
  await swarm.init();
  return { swarm, sessions, send };
}

describe('the CEO coding agent', () => {
  it('restores Italian after restart and migrates older offices without a language', async () => {
    const first = await office();
    first.swarm.updateSettings({ language: 'it' });
    await first.swarm.shutdown();
    const second = await office();
    expect(second.swarm.snapshot().settings.language).toBe('it');
    await second.swarm.shutdown();
    const saved = JSON.parse(await fs.readFile(`${home}/state.json`, 'utf8'));
    delete saved.settings.language;
    await fs.writeFile(`${home}/state.json`, JSON.stringify(saved));
    const third = await office();
    expect(third.swarm.snapshot().settings.language).toBe('en');
  });
  it('saves the language, rejects invalid changes and updates an active CEO without changing stored user text', async () => {
    const { swarm, sessions, send } = await office();
    expect(swarm.snapshot().settings.language).toBe('en');
    swarm.updateSettings({ language: 'it' });
    swarm.updateSettings({ language: 'de' as 'it' });
    expect(swarm.snapshot().settings.language).toBe('it');
    await swarm.messageCeo('Ciao');
    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    expect(sessions[0].opts.systemAppend).toContain('Reply to the manager in Italian');
    expect(sessions[0].opts.systemAppend).toContain('GitHub issue titles/bodies');
    swarm.updateSettings({ language: 'en' });
    await swarm.messageCeo('Hello again');
    expect(send).toHaveBeenLastCalledWith(expect.stringContaining('Office language: English'));
    expect(swarm.snapshot().messages.filter((m) => m.from === 'manager').map((m) => m.text)).toEqual(['Ciao', 'Hello again']);
    await swarm.shutdown();
    const saved = JSON.parse(await fs.readFile(`${home}/state.json`, 'utf8'));
    expect(saved.settings.language).toBe('en');
  });
  it('loads the model inventory in the CEO or repository context and rejects unknown agents', async () => {
    const { swarm } = await office();
    const ceoModels = await swarm.openCodeModels(CEO_ID);
    expect(ceoModels.directory).toContain('ceo');
    expect(ceoModels.models.length).toBeGreaterThan(0);
    const repo = await swarm.connectRepo('demo-co/pixel-todo');
    const agent = swarm.snapshot().agents.find((a) => a.repoId === repo.id)!;
    expect((await swarm.openCodeModels(agent.id)).directory).toBe((await swarm.openCodeModels(undefined, repo.id)).directory);
    expect(() => swarm.openCodeModels('missing')).toThrow();
  });
  it('rejects V1 for the CEO, an explicit team hire and a hire inheriting the office default', async () => {
    const { swarm } = await office(true, openCodeVersionProblem('1.18.29')!);
    expect(() => swarm.updateAgent(CEO_ID, { cli: 'opencode' })).toThrow(/requires OpenCode 2\.x/);
    const repo = await swarm.connectRepo('demo-co/pixel-todo');
    const count = swarm.snapshot().agents.length;
    expect(() => swarm.hireAgent(repo.id, { cli: 'opencode' })).toThrow(/requires OpenCode 2\.x/);
    swarm.updateSettings({ defaultCli: 'opencode' });
    expect(() => swarm.hireAgent(repo.id, {})).toThrow(/requires OpenCode 2\.x/);
    expect(swarm.snapshot().agents).toHaveLength(count);
  });
  it('refuses OpenCode when it is not installed, leaving the CEO on Claude', async () => {
    const { swarm } = await office(false);
    expect(() => swarm.updateAgent(CEO_ID, { cli: 'opencode' })).toThrow(/isn't installed/);
    expect(swarm.snapshot().agents.find((a) => a.id === CEO_ID)?.cli).toBe('claude');
  });
  it('starts OpenCode with office tools, its own model and a resumable OpenCode chat', async () => {
    const { swarm, sessions } = await office();
    swarm.updateAgent(CEO_ID, { cli: 'opencode', model: 'openai/test-model#high' });
    swarm.messageCeo('Describe the company');
    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    expect(sessions[0].opts).toMatchObject({ role: 'ceo', cli: 'opencode', model: 'openai/test-model#high' });
    expect(sessions[0].opts.office).toBeDefined();
    expect(sessions[0].opts.systemAppend).toContain('office_company_status');
    sessions[0].cb.sessionId('ses_ceo');
    sessions[0].cb.finished({ ok: true, text: 'Ready', errors: [], costUsd: 0, turns: 1 });
    swarm.messageCeo('Continue');
    await vi.waitFor(() => expect(sessions).toHaveLength(2));
    expect(sessions[1].opts).toMatchObject({ cli: 'opencode', resumeSessionId: 'ses_ceo' });
  });

  it('keeps Claude as the CEO default even when workers default to OpenCode', async () => {
    const { swarm, sessions } = await office();
    swarm.updateSettings({ defaultCli: 'opencode', defaultModel: 'openai/worker-model' });
    swarm.updateAgent(CEO_ID, { cli: '' });
    swarm.messageCeo('Hello');
    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    expect(sessions[0].opts).toMatchObject({ cli: 'claude', model: 'claude-opus-5-5' });
    expect(() => swarm.updateAgent(CEO_ID, { cli: 'codex' })).toThrow(/CEO can run Claude Code or OpenCode/);
  });

  it('does not resume Claude or pass its model after switching a busy CEO to OpenCode', async () => {
    const { swarm, sessions } = await office();
    swarm.messageCeo('Hello');
    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    swarm.updateAgent(CEO_ID, { cli: 'opencode' });
    // The old session can still report its id after the manager changes the next task's setup.
    sessions[0].cb.sessionId('old-claude-session');
    sessions[0].cb.finished({ ok: true, text: 'Ready', errors: [], costUsd: 0, turns: 1 });
    swarm.messageCeo('Use OpenCode now');
    await vi.waitFor(() => expect(sessions).toHaveLength(2));
    expect(sessions[1].opts).toMatchObject({ cli: 'opencode', model: '' });
    expect(sessions[1].opts.resumeSessionId).toBeUndefined();
  });

  it('retains Claude-only behavior in the SDK runtime without reusing an OpenCode session', async () => {
    const { swarm, sessions } = await office();
    swarm.updateAgent(CEO_ID, { cli: 'opencode' });
    swarm.messageCeo('Hello');
    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0].cb.sessionId('ses_old');
    sessions[0].cb.finished({ ok: true, text: 'Ready', errors: [], costUsd: 0, turns: 1 });
    swarm.updateSettings({ runtime: 'sdk' });
    swarm.messageCeo('Hello through the SDK');
    await vi.waitFor(() => expect(sessions).toHaveLength(2));
    expect(sessions[1].opts.cli).toBeUndefined();
    expect(sessions[1].opts.resumeSessionId).toBeUndefined();
    expect(sessions[1].opts.model).toBe('claude-opus-5-5');
  });
});
