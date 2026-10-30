import fs from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { INSTALL_STEP } from '../shared/types.ts';
import { createDemoBackend } from './demo.ts';
import { Swarm } from './swarm.ts';
import { PREPARING_MS } from './watchdog.ts';

const { home } = vi.hoisted(() => ({ home: `${process.env.SWARM_HOME}/install-watchdog-${process.pid}` }));
vi.mock('./config.ts', async (original) => ({ ...await original<typeof import('./config.ts')>(),
  HOME_DIR: home, STATE_FILE: `${home}/state.json`, WORKSPACE_ROOT: `${home}/workspaces`,
}));
let swarm: Swarm | undefined;
let releaseInstall: (() => void) | undefined;
afterEach(async () => {
  vi.restoreAllMocks();
  releaseInstall?.();
  releaseInstall = undefined;
  await swarm?.shutdown();
  swarm = undefined;
  await fs.rm(home, { recursive: true, force: true, maxRetries: 5 });
});

describe('dependency installation and the watchdog', () => {
  it.each(['installed', 'failed'] as const)('does not requeue an issue during install, then continues once (%s)', async (outcome) => {
    const backend = createDemoBackend();
    backend.listMyRepos = async () => [];
    backend.machines.prepareDesk = async () => backend.mainDir('demo-co/pixel-todo');
    let complete!: (value: typeof outcome) => void;
    backend.installDeps = async (_dir, cb) => {
      cb.installing();
      return new Promise<typeof outcome>((resolve) => {
        complete = resolve;
        releaseInstall = () => resolve(outcome);
      });
    };
    const start = vi.fn(() => ({ send: () => undefined, stop: () => undefined }));
    backend.startSession = start;
    swarm = new Swarm(backend);
    vi.spyOn(swarm.journal, 'hasPastDays').mockResolvedValue(true);
    await swarm.init();
    swarm.updateSettings({ ceoHeartbeatMin: 0 });
    const repo = await swarm.connectRepo('demo-co/pixel-todo', { onboardCeo: false, autoAssign: false, autoMerge: false });
    await vi.waitFor(() => expect(swarm!.snapshot().repos[0].cloneStatus).toBe('ready'));
    const agent = swarm.snapshot().agents.find((a) => a.repoId === repo.id)!;
    const issue = swarm.snapshot().repos[0].issues[0];
    swarm.assign(agent.id, issue.number);
    await vi.waitFor(() => expect(swarm!.snapshot().agents.find((a) => a.id === agent.id)?.currentTool).toBe(INSTALL_STEP));
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + PREPARING_MS + 60_000);
    (swarm as unknown as { watchdogTick(): void }).watchdogTick();
    expect(swarm.snapshot().agents.find((a) => a.id === agent.id)).toMatchObject({ status: 'preparing', issueNumber: issue.number });
    expect(start).not.toHaveBeenCalled();
    now.mockRestore();
    complete(outcome);
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(1));
    expect(swarm.snapshot().agents.find((a) => a.id === agent.id)).toMatchObject({ status: 'working', issueNumber: issue.number });
  });
});
