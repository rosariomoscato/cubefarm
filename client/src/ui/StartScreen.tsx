import { usePhoneBadge, useStore } from '../store';
import { LanguageSelect, T, useT } from '../i18n';
import { requestLook } from '../world/Player';
import { setMode } from '../pocket/mode';
import { CEO_ID } from '../../../shared/types';
import { keyName, useKeyName } from './controls';
import { Key } from './Key';
import { SetupWizard } from './SetupWizard';
import { unlockAudio } from './sfx';
import { announce } from './announce';

export function StartScreen() {
  const t = useT();
  const started = useStore((s) => s.started);
  const loaded = useStore((s) => s.loaded);
  const connected = useStore((s) => s.connected);
  const demo = useStore((s) => s.demo);
  const version = useStore((s) => s.version);
  const repos = useStore((s) => s.repos);
  const agents = useStore((s) => s.agents);
  const settings = useStore((s) => s.settings);
  const start = useStore((s) => s.start);
  const waiting = usePhoneBadge();
  const phoneKey = useKeyName('phone');
  if (started) return null;
  if (loaded && !settings.setupDone) return <SetupWizard />;

  const enter = () => {
    start();
    unlockAudio();
    requestLook();
    announce(
      `You're in the office. Press ${keyName('phone')} for your phone: its Company tab opens the console, the Kanban, a list view of this floor and the accessibility settings. ${keyName('help')} opens help.`,
    );
  };
  const ceo = agents[CEO_ID];
  const staff = Object.values(agents).filter((a) => a.role !== 'ceo').length;

  return (
    <div className="start">
      <div className="start-card">
        {loaded && <LanguageSelect />}
        <div className="start-logo">✻</div>
        <h1>{settings.companyName || 'cubefarm'}</h1>
        <p className="start-tag">{settings.managerName ? t('Welcome back, {name}.', { name: settings.managerName }) : t('A cartoon office where a team of AI coding agents works through your GitHub issues.')}</p>
        <ul className="start-list">
          <li>
            {t('🏢 Projects: {projects} · Team: {staff}', { projects: repos.length, staff })}{ceo ? ` · CEO: ${ceo.name}` : ''}
          </li>
          <li>{waiting ? t('📱 Notifications: {count}. Press {key} once you enter.', { count: waiting, key: phoneKey }) : t('📱 Press {key} anywhere for your phone.', { key: phoneKey })}</li>
          <li>
            💻 <T>Walk up behind anyone to watch their screen.</T> <Key action="interact" /> · <T>Interact</T> · <Key action="help" /> · <T>Help</T>
          </li>
        </ul>
        <button className="btn btn-big" onClick={enter} disabled={!loaded}>
          {t(loaded ? 'Enter the office' : connected ? 'Loading…' : 'Connecting to the swarm server…')}
        </button>
        <div className="start-meta">
          <button className="linkish start-pocket" onClick={() => setMode('pocket')} title="The office without the 3D building: tabs for the company, the CEO chat, the board, the team and approvals">
            <T>📱 Pocket mode, for phones and touch screens</T>
          </button>
          {demo && <span className="pill pill-demo"><T>DEMO MODE: fake repos, fake agents</T></span>}
          {version && <span className="small">cubefarm {version}</span>}
        </div>
      </div>
    </div>
  );
}
