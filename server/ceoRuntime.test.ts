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
  const backend = createDemoBackend();
  const detect = backend.detectClis;
  backend.detectClis = async () => (await detect()).map((cli) => cli.id === 'opencode' ? { ...cli, installed: openCodeInstalled, ...(problem ? { problem } : {}) } : cli);
  backend.listMyRepos = async () => [];
  backend.startSession = (opts, cb) => {
    sessions.push({ opts, cb });
    return { send: () => undefined, stop: () => undefined };
  };
  swarm = new Swarm(backend);
  vi.spyOn(swarm.journal, 'hasPastDays').mockResolvedValue(true);
  await swarm.init();
  return { swarm, sessions };
}

describe('the CEO coding agent', () => {
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
