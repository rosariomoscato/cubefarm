// Install the real tarball in isolation and exercise its public CLI in demo mode only.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.name, 'droidsembly');
assert.deepEqual(pkg.bin, { droidsembly: 'bin/cubefarm.js' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'droidsembly-package-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const env = { ...process.env, CI: '1', SWARM_HOME: path.join(tmp, 'home'), SWARM_HOST: '127.0.0.1', SWARM_DEMO: '1' };
delete env.SWARM_DEMO_FLOORS;
delete env.SWARM_DEMO_AGENTS;
const sh = (cmd, cwd) => {
  const res = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', env });
  if (res.status !== 0) throw new Error(`${cmd} failed:\n${res.stdout}\n${res.stderr}`);
  return res.stdout.trim();
};

let server;
try {
  const packed = JSON.parse(sh(`${npm} pack --ignore-scripts --json --pack-destination "${tmp}"`, root))[0];
  const paths = packed.files.map((f) => f.path);
  for (const file of ['LICENSE', 'README.md', 'README.it.md', 'bin/distribution.js', 'dist/icons/Sora-OFL.txt', 'dist-server/index.js']) {
    assert.ok(paths.includes(file), `missing package file: ${file}`);
  }
  assert.ok(!paths.some((f) => /PerChatGPT|STACK_E_ARCHITETTURA|FORK_CHANGELOG|NPM_DISTRIBUTION_PLAN/.test(f)), 'local documents must not be packed');
  const tarball = path.join(tmp, packed.filename);
  sh(`${npm} init -y`, tmp);
  sh(`${npm} install --no-audit --no-fund "${tarball}"`, tmp);
  const cli = path.join(tmp, 'node_modules', '.bin', process.platform === 'win32' ? 'droidsembly.cmd' : 'droidsembly');
  assert.equal(sh(`"${cli}" --version`, tmp), pkg.version);
  const help = sh(`"${cli}" --help`, tmp);
  assert.ok(help.includes(`Droidsembly ${pkg.version}`));
  assert.ok(help.includes(`npx droidsembly@${pkg.publishConfig.tag}`));
  assert.ok(help.includes('~/.cubefarm'), 'legacy default data directory is preserved');
  console.log(`droidsembly --version/--help: ${pkg.version}`);

  const installed = path.join(tmp, 'node_modules', pkg.name);
  const mcpPkg = createRequire(path.join(installed, 'dist-server', 'index.js')).resolve('@playwright/mcp/package.json');
  const mcp = spawnSync(process.execPath, [path.join(path.dirname(mcpPkg), 'cli.js'), '--version'], { encoding: 'utf8', env });
  if (mcp.status !== 0) throw new Error(`the pinned browser tool does not run:\n${mcp.stdout}\n${mcp.stderr}`);

  // Use an unused loopback port; never probe or attach to an existing office.
  const socket = net.createServer();
  socket.listen(Number(process.env.SWARM_PORT) || 0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  server = spawn(process.execPath, [path.join(installed, pkg.bin.droidsembly), '--demo', '--no-open', '--port', String(port)], {
    env: { ...env, SWARM_PORT: String(port) }, stdio: ['ignore', 'inherit', 'inherit'],
  });
  let startupError;
  server.on('error', (error) => { startupError = error; });
  let state = null;
  for (let i = 0; i < 120 && !state; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error(`the office exited with code ${server.exitCode}`);
    state = await fetch(`http://127.0.0.1:${port}/api/state`, { signal: AbortSignal.timeout(2000) })
      .then((r) => r.json()).catch(() => null);
  }
  assert.ok(state && Array.isArray(state.repos), 'demo office never answered /api/state');
  const page = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(5000) }).then((r) => r.text());
  assert.ok(page.includes('<title>Droidsembly</title>'), 'client not served');
  // HTTP readiness precedes the debounced state write (currently 1500 ms).
  // Wait for a valid persisted snapshot, not an arbitrary startup delay.
  let saved;
  for (let i = 0; i < 100 && !saved; i++) {
    if (server.exitCode !== null) throw new Error(`the office exited before saving state: ${server.exitCode}`);
    try {
      saved = JSON.parse(fs.readFileSync(path.join(env.SWARM_HOME, 'demo-state.json'), 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (!saved) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(saved && Array.isArray(saved.repos) && Array.isArray(saved.agents), 'demo state not saved in the isolated home');
  assert.deepEqual(saved.repos.map((r) => r.id).sort(), state.repos.map((r) => r.id).sort(), 'persisted state must belong to this demo');
  assert.ok(!fs.existsSync(path.join(env.SWARM_HOME, 'state.json')), 'real state must not be created');
  console.log(`demo office up: ${state.repos.length} floors, ${state.agents.length} agents; isolated data and client verified`);
} finally {
  if (server?.pid && server.exitCode === null && server.signalCode === null) {
    const closed = once(server, 'close');
    server.kill();
    await closed;
  }
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5 });
}
