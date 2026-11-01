# Droidsembly

<p align="center">
  <img src="client/public/icons/logo-light.svg" alt="Droidsembly logo" width="360">
</p>

**Small droids. Serious software.**

A visual workspace for AI-assisted software development: connect your GitHub repositories, coordinate coding agents and follow their work in an interactive 3D office or a mobile-friendly dashboard.

**English** · [Italiano](README.it.md)

[Source code](https://github.com/rosariomoscato/droidsembly) · [Report an issue](https://github.com/rosariomoscato/droidsembly/issues) · [Documentation](#documentation) · [Support the project](#support-the-project)

**Website coming soon:** `droidsembly.com`. Until it launches, this repository is the reference for installation and documentation.

**Free and open source, under the MIT license.** No paid activation or commercial agent unlocks. Voluntary support helps development; your AI subscriptions, API usage and optional cloud services have their own costs and limits.

## See the office

![Droidsembly demo lobby with robot agents, reception and the manager and CEO offices](docs/branding/screenshots/office.png)

<details>
<summary>Kanban and mobile Pocket view</summary>

![Demo Kanban board showing backlog, development, QA and merge stages](docs/screenshots/cyan-panels/kanban-en.png)

<img src="docs/branding/screenshots/pocket-mobile.png" alt="Italian Pocket dashboard with project status, CEO chat and team navigation" width="360">

</details>

These are existing demo captures from the fork. Some styling predates the latest popup updates; company and project names are demo content.

## What you can do

- **Coordinate coding agents:** Claude Code, Codex and OpenCode V2, with model selection and supported reasoning variants. Provider availability depends on the runtime; the Agent SDK runtime is Claude-only, and OpenCode is currently local-only.
- **Follow the full workflow:** issue → development and initial checks → pull request → separate QA session → corrections → merge when the configured conditions pass.
- **Keep control:** manual or automatic assignment, optional CEO onboarding, team-change approvals and a separate auto-merge switch.
- **Watch real work:** live terminals, project floors, a Kanban board and the manager console. Local clones and worktrees separate agents' working copies; they are not security sandboxes.
- **Inspect AI usage:** multi-provider observations, reported tokens/costs and selective scheduling limits. Missing provider data remains unavailable, not zero or unlimited. See [AI usage](docs/AI_USAGE.md) (Italian).
- **Ask for read-only analysis:** start a discussion without an issue or PR. Read-only rules are agent instructions, not a sandbox.
- **Use desktop or mobile:** a 3D office and a touch-friendly Pocket view, English/Italian interface, keyboard controls and accessibility settings. See [language coverage](docs/languages.md).
- **Make the office yours:** robot agents, a robot dog, decorations, adaptive music, photo mode and time-lapse.

## Install this fork

**Current distribution: build from source.** This fork's additions are not published as a dedicated npm package or desktop installer. `npx cubefarm` installs the original package, not Droidsembly. The technical package/CLI name in this checkout remains `cubefarm`; the current version is `0.3.20`.

### Requirements

- [Node.js](https://nodejs.org/) **22 or newer**, with npm, and [Git](https://git-scm.com/).
- For real work: [GitHub CLI](https://cli.github.com/), authenticated with `gh auth login`, and a supported coding agent signed in to its provider.
- Claude Code is bundled through the Agent SDK. OpenCode **2.x** and Codex are installed separately when selected. OpenCode-only terminal sessions do not require a Claude subscription.
- Google Chrome for agents that test projects in a browser.

The project targets Windows, macOS and Linux. The no-AI demo below does not require provider credentials or a GitHub login.

### 1. Download and build

Run these commands in the parent folder where you want a **new** checkout.

**Windows — PowerShell**

```powershell
git clone https://github.com/rosariomoscato/droidsembly.git
cd droidsembly
npm.cmd ci
npm.cmd run build
```

**macOS / Linux**

```bash
git clone https://github.com/rosariomoscato/droidsembly.git
cd droidsembly
npm ci
npm run build
```

### 2. Try the no-AI demo

From the checkout, start the built server with a dedicated data folder and ports:

**Windows — PowerShell**

```powershell
$env:SWARM_HOME = Join-Path $env:LOCALAPPDATA 'Droidsembly-Demo'
$env:SWARM_PORT = '4419'
$env:SWARM_HOST = '127.0.0.1'
$env:SWARM_PREVIEW_PORT = '9600'
$env:SWARM_DEMO = '1'
node dist-server/index.js --demo
```

**macOS / Linux**

```bash
SWARM_HOME="$HOME/.droidsembly-demo" SWARM_PORT=4419 SWARM_HOST=127.0.0.1 SWARM_PREVIEW_PORT=9600 SWARM_DEMO=1 node dist-server/index.js --demo
```

Open **http://127.0.0.1:4419/** and confirm **DEMO MODE** is displayed. GitHub and agents are simulated; demo state is saved only in the chosen demo folder. Stop with `Ctrl+C`. Choose unused ports if these are occupied.

### 3. Start a real office

Stop the demo first. Use a separate data folder and remove `--demo`. Real sessions can modify connected projects and consume AI quota.

**Windows — PowerShell**

```powershell
$env:SWARM_HOME = Join-Path $env:LOCALAPPDATA 'Droidsembly'
$env:SWARM_PORT = '4419'
$env:SWARM_HOST = '127.0.0.1'
$env:SWARM_PREVIEW_PORT = '9600'
$env:SWARM_DEMO = '0'
node dist-server/index.js
```

**macOS / Linux**

```bash
SWARM_HOME="$HOME/.droidsembly" SWARM_PORT=4419 SWARM_HOST=127.0.0.1 SWARM_PREVIEW_PORT=9600 SWARM_DEMO=0 node dist-server/index.js
```

Open **http://127.0.0.1:4419/**. These example folders are an explicit choice for a new installation, not a migration: existing data paths and launchers remain valid. Without `SWARM_HOME`, the application's default remains `~/.cubefarm`.

Before connecting a project, select the CEO's coding agent if you do not want the default Claude Code. To skip the initial AI analysis, turn off **Let the CEO study this repository and plan from the brief**. Auto-assignment, auto-merge and periodic CEO reviews are separate settings. See [Agents](docs/agents.md) for provider setup and runtime limitations.

## Desktop, mobile and PWA

The Node.js backend runs on your computer; the browser displays and controls the office. Installing the PWA adds the interface to your home screen **but does not install the Node.js backend or coding agents**. The office computer must remain running and reachable.

For mobile installation and private remote access, follow [Pocket mode](docs/pocket.md) and [Phone access](docs/phone-access.md). PWA features require a supported browser and a secure context, such as HTTPS or localhost. The office has no built-in sign-in: keep it on loopback or use authenticated private access rather than exposing it publicly.

### Essential controls

| Control | Action |
| --- | --- |
| `W A S D` / arrows | Walk |
| `Shift` | Run |
| `E` / left click | Interact |
| `P` | Open the phone |
| `Tab` | Office overview |
| `K` | Photo mode |
| `M` | Mute |
| `H` | Help and full control list |
| `Esc` | Release the mouse / close a panel |

Settings include captions, motion comfort, UI scaling, contrast and list views. Pocket provides touch-friendly navigation.

## Updating

For a source installation, stop the office when agents are idle, back up your chosen `SWARM_HOME`, and review the [fork changelog](docs/FORK_CHANGELOG.md). In a clean checkout on `main`, use `git pull --ff-only`, then `npm.cmd ci` and `npm.cmd run build` on Windows (`npm ci` and `npm run build` on macOS/Linux). Restart using the same data folder and ports. Preserve local changes before updating.

Do not use `npx cubefarm@latest` to update this fork: it targets the original npm package. The inherited CLI still checks that package for updates. The direct server commands above do not use the checkout's self-updating launcher; see [how updating works](docs/how-it-works.md#updating-the-office) for that separate workflow.

## Support the project

Droidsembly is free and open source. If it helps you, you can support its development by starring the repository, sharing it, reporting reproducible issues or contributing improvements.

**Voluntary financial support is planned through GitHub Sponsors.** The profile is not yet activated; a link will be added when it is available. No donation is required to use the app or unlock agents. Technical limits and AI-provider quotas still apply.

## Documentation

- [Agents and provider setup](docs/agents.md)
- [Workflow, terminals, QA and updates](docs/how-it-works.md)
- [Multi-provider AI usage](docs/AI_USAGE.md) (Italian)
- [Pocket, PWA and notifications](docs/pocket.md) · [Phone access](docs/phone-access.md)
- [Optional cloud agents](docs/cloud.md) · [Voice](docs/voice.md)
- [English/Italian coverage](docs/languages.md)
- [Contributing and development](CONTRIBUTING.md)
- [Fork changelog](docs/FORK_CHANGELOG.md) (Italian)
- [Local validation report](docs/validation-english-italian.md) · [Pathfinding investigation](docs/pathfinding-investigation.md)

CI results and historical local test failures are separate evidence; a green CI run does not establish that those local failures have been resolved.

## Credits and license

Droidsembly is maintained by [Rosario Moscato](https://github.com/rosariomoscato), based on [CubeFarm by Leon van Zyl](https://github.com/leonvanzyl/cubefarm). This fork was previously hosted at `rosariomoscato/cubefarm`.

The fork adds OpenCode V2 integration, model/variant selection, optional onboarding and manual analysis, English/Italian support, robot visuals and branding, coordinated desktop/mobile styling, adaptive music and multi-provider usage monitoring. The [changelog](docs/FORK_CHANGELOG.md) records implementation and validation history.

Licensed under [MIT](LICENSE), preserving the original **Copyright (c) 2026 Leon van Zyl** notice. Third-party components retain their respective licenses, including the [Sora font's SIL Open Font License](client/public/icons/Sora-OFL.txt).
