import fs from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CEO_ID } from '../shared/types.ts';
import type { SessionCallbacks, SessionOptions } from './agentRunner.ts';
import { createDemoBackend } from './demo.ts';
import { Swarm } from './swarm.ts';
import { reconcileStep } from './reconcile.ts';
import { resumesAfterRestart } from './restartRecovery.ts';
import { diagnose, QUIET_MS } from './watchdog.ts';

const { home } = vi.hoisted(() => ({ home: `${process.env.SWARM_HOME}/analysis-${process.pid}` }));
vi.mock('./config.ts', async (original) => ({ ...await original<typeof import('./config.ts')>(),
  HOME_DIR: home, STATE_FILE: `${home}/state.json`, WORKSPACE_ROOT: `${home}/workspaces`,
}));
let swarm: Swarm | undefined;
afterEach(async () => {
  await swarm?.shutdown();
  swarm = undefined;
  await fs.rm(home, { recursive: true, force: true, maxRetries: 5 });
});

async function office(onboardCeo = false) {
  const backend = createDemoBackend();
  backend.listMyRepos = async () => [];
  const sessions: { opts: SessionOptions; cb: SessionCallbacks }[] = [];
  backend.startSession = (opts, cb) => { sessions.push({ opts, cb }); return { send: vi.fn(), stop: vi.fn() }; };
  const install = vi.spyOn(backend, 'installDeps');
  const prepare = vi.spyOn(backend, 'prepareDesk');
  const findPr = vi.spyOn(backend, 'prForBranch');
  const createIssue = vi.spyOn(backend, 'createIssue');
  const merge = vi.spyOn(backend, 'mergePull');
  swarm = new Swarm(backend);
  vi.spyOn(swarm.journal, 'hasPastDays').mockResolvedValue(true);
  await swarm.init();
  const repo = await swarm.connectRepo('demo-co/pixel-todo', { onboardCeo, autoAssign: false, autoMerge: false, mission: onboardCeo ? '' : 'A brief that must not trigger a plan' });
  await vi.waitFor(() => expect(swarm!.snapshot().repos[0].cloneStatus).toBe('ready'));
  const agent = swarm.snapshot().agents.find((a) => a.repoId === repo.id)!;
  swarm.updateAgent(agent.id, { cli: 'opencode', model: 'openai/demo-model#high' });
  return { swarm, backend, repo, agent, sessions, install, prepare, findPr, createIssue, merge };
}
const finished = { ok: true, text: 'The integration lives in server/clis.ts.', costUsd: 0, turns: 1, errors: [] };

describe('manual analysis workflow', () => {
  it('persists the full final Markdown separately from the shortened technical preview', async () => {
    const o = await office();
    const text = '# Analisi\n\n' + Array.from({ length: 60 }, (_, i) => `- Riga ${i}`).join('\n');
    o.swarm.analyze(o.agent.id, 'Leggi soltanto');
    o.sessions[0].cb.finished({ ...finished, text });
    await vi.waitFor(() => expect(o.swarm.snapshot().agents.find((a) => a.id === o.agent.id)?.status).toBe('done'));
    await o.swarm.shutdown();
    const state = JSON.parse(await fs.readFile(`${home}/state.json`, 'utf8'));
    expect(state.agents.find((a: { id: string }) => a.id === o.agent.id).logTail)
      .toContainEqual(expect.objectContaining({ kind: 'reply', text }));
    expect(o.sessions).toHaveLength(1);
    expect(o.swarm.snapshot().agents.find((a) => a.id === o.agent.id)?.log).toEqual([]);
  });
  it('uses the saved language in analysis and manually resumed follow-ups', async () => {
    const o = await office();
    o.swarm.updateSettings({ language: 'it' });
    o.swarm.analyze(o.agent.id, 'Leggi il progetto');
    expect(o.sessions[0].opts.systemAppend).toContain('Reply to the manager in Italian');
    expect(o.sessions[0].opts.prompt).toBe('Leggi il progetto');
    o.sessions[0].cb.sessionId('ses_it');
    o.sessions[0].cb.finished(finished);
    o.swarm.updateSettings({ language: 'en' });
    await o.swarm.message(o.agent.id, 'Explain it');
    expect(o.sessions[1].opts.systemAppend).toContain('Reply to the manager in English');
  });
  it('connects without CEO onboarding, planning, automatic assignment or automatic merge', async () => {
    const o = await office();
    expect(o.swarm.snapshot().ceo.queue).toEqual([]);
    expect(o.swarm.snapshot().ceo.job).toBeNull();
    expect(o.swarm.snapshot().repos[0]).toMatchObject({ autoAssign: false, autoMerge: false });
    expect(o.sessions).toHaveLength(0);
  });
  it('retains onboarding as the default for existing callers', async () => {
    const o = await office(true);
    expect(o.swarm.snapshot().ceo.queue.some((j) => j.kind === 'onboard') || o.sessions.some((s) => s.opts.role === 'ceo')).toBe(true);
  });
  it('runs with a dedicated analysis prompt, no worktree/deps/browser, and no missing-PR retry', async () => {
    const o = await office();
    o.swarm.analyze(o.agent.id, 'Read the OpenCode integration.');
    expect(o.sessions).toHaveLength(1);
    expect(o.sessions[0].opts).toMatchObject({ task: 'analysis', role: 'agent', cli: 'opencode', model: 'openai/demo-model#high', cwd: o.backend.mainDir(o.repo.fullName), browserTesting: false, keepAlive: false });
    expect(o.sessions[0].opts.systemAppend).toContain('Do not commit, push, merge or deploy.');
    expect(o.sessions[0].opts.systemAppend).not.toContain('Closes #');
    o.sessions[0].cb.sessionId('ses_analysis');
    o.sessions[0].cb.finished(finished);
    await vi.waitFor(() => expect(o.swarm.snapshot().agents.find((a) => a.id === o.agent.id)?.status).toBe('done'));
    expect(o.sessions).toHaveLength(1);
    for (const call of [o.install, o.prepare, o.findPr, o.createIssue, o.merge]) expect(call).not.toHaveBeenCalled();
    expect(o.swarm.snapshot().qa).toEqual([]);
    expect(o.swarm.snapshot().ceo.queue).toEqual([]);
    expect(o.swarm.snapshot().agents.find((a) => a.id === o.agent.id)).toMatchObject({ task: 'analysis', issueNumber: null, prNumber: null, branch: null });
  });
  it('resumes only a manual follow-up with analysis instructions, then can clear the desk', async () => {
    const o = await office();
    o.swarm.analyze(o.agent.id, 'Read the integration.');
    o.sessions[0].cb.sessionId('ses_analysis');
    o.sessions[0].cb.finished(finished);
    await o.swarm.message(o.agent.id, 'Explain its callback.');
    expect(o.sessions).toHaveLength(2);
    expect(o.sessions[1].opts).toMatchObject({ task: 'analysis', resumeSessionId: 'ses_analysis', cwd: o.backend.mainDir(o.repo.fullName) });
    expect(o.sessions[1].opts.systemAppend).toContain('ANALYSIS task');
    o.sessions[1].cb.finished(finished);
    o.swarm.resetAgent(o.agent.id);
    expect(o.swarm.snapshot().agents.find((a) => a.id === o.agent.id)).toMatchObject({ task: null, status: 'idle' });
  });
  it('refuses empty requests, the CEO, concurrent work and missing checkouts', async () => {
    const o = await office();
    expect(() => o.swarm.analyze(o.agent.id, ' ')).toThrow(/1–4000/);
    expect(() => o.swarm.analyze(CEO_ID, 'Read')).toThrow(/team member/);
    const exists = vi.spyOn(o.backend, 'deskExists').mockReturnValue(false);
    expect(() => o.swarm.analyze(o.agent.id, 'Read')).toThrow(/checkout is missing/);
    exists.mockRestore();
    o.swarm.analyze(o.agent.id, 'Read');
    expect(() => o.swarm.analyze(o.agent.id, 'Read again')).toThrow(/busy/);
  });
  it('ends failed analysis without a PR retry, QA handoff or CEO escalation', async () => {
    const o = await office();
    o.swarm.analyze(o.agent.id, 'Read');
    o.sessions[0].cb.finished({ ...finished, ok: false, errors: ['Provider unavailable'] });
    await vi.waitFor(() => expect(o.swarm.snapshot().agents.find((a) => a.id === o.agent.id)?.status).toBe('error'));
    expect(o.sessions).toHaveLength(1);
    expect(o.findPr).not.toHaveBeenCalled();
    expect(o.swarm.snapshot().qa).toEqual([]);
    expect(o.swarm.snapshot().ceo.queue).toEqual([]);
  });
  it('never automatically nudges a quiet analysis session', () => {
    expect(diagnose([{ id: 'a', name: 'Ada', repoId: 'r', role: 'agent', task: 'analysis', status: 'working',
      issueNumber: null, prNumber: null, startedAt: 0, activeAt: 0, work: 'unknown' }], [], [], QUIET_MS + 1)).toEqual([]);
  });
  it('does not automatically resume analysis after a restart', () => {
    const a = { role: 'agent', status: 'working', task: 'analysis' as const, work: 'unknown' as const, deskExists: true, cliAlive: false, resumable: false };
    expect(reconcileStep(a)).toBe('keep');
    expect(reconcileStep({ ...a, cliAlive: true })).toBe('reattach');
    expect(resumesAfterRestart({ ...a, sessionId: 'ses_a', branch: null, issueNumber: null, issueTitle: 'Analysis', prNumber: null }, false, false)).toBe(false);
  });
});
