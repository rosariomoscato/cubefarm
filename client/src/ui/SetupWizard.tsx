import { useState } from 'react';
import { LanguageSelect, T, useT } from '../i18n';
import { api } from '../api';
import { useStore } from '../store';
import { requestLook } from '../world/Player';
import { CEO_ID, type RepoView } from '../../../shared/types';
import { Key } from './Key';
import { ProjectPicker } from './ProjectPicker';
import { Brand } from './Brand';

// First run: who you are, the company, your CEO and your first project. Every field has a default, so
// "Skip" (or just pressing Next) gets a working office.

const COMPANIES = ['Pixel & Pine', 'Byte Bakery', 'Night Owl Software', 'Tiny Rocket Co.', 'Moonbeam Works', 'Happy Path Inc.', 'Merge Conflict Ltd.', 'Quokka Labs', 'Blue Kettle Studio', 'Paper Plane Software'];
const CEO_NAMES = ['Morgan', 'Avery', 'Jordan', 'Riley', 'Quinn', 'Harper', 'Rowan', 'Sasha', 'Casey', 'Jamie', 'Alex', 'Robin'];
const TIES = ['#e63946', '#3a86ff', '#06d6a0', '#ffbe0b', '#9b5de5', '#fb5607'];
const STEPS = ['Welcome', 'You', 'Your CEO', 'First project', 'Ready'];

const pickOther = <T,>(list: T[], current: T) => {
  const rest = list.filter((x) => x !== current);
  return rest[Math.floor(Math.random() * rest.length)];
};

/** Decorative robot portrait; the existing identity and colour settings remain unchanged. */
function CeoPortrait({ color, look }: { color: string; look: 'feminine' | 'masculine' }) {
  return (
    <svg viewBox="0 0 120 120" className="ceo-portrait" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#dceef2" stroke="#17485c" strokeWidth="3" />
      <path d="M60 26V14" stroke="#202b38" strokeWidth="4" />
      <circle cx="60" cy="12" r="5" fill={color} stroke="#202b38" strokeWidth="2" />
      <rect x="34" y="82" width="52" height="31" rx="12" fill="#faf8f5" stroke="#202b38" strokeWidth="3" />
      <rect x="48" y="90" width="24" height="12" rx="4" fill={color} />
      <rect x="20" y="40" width="12" height="28" rx="6" fill={color} stroke="#202b38" strokeWidth="2" />
      <rect x="88" y="40" width="12" height="28" rx="6" fill={color} stroke="#202b38" strokeWidth="2" />
      <rect x="27" y="25" width="66" height="61" rx="20" fill="#faf8f5" stroke="#202b38" strokeWidth="3" />
      <rect x="33" y="35" width="54" height="43" rx="14" fill="#121824" />
      <path d="M43 54Q48 43 53 54M67 54Q72 43 77 54M53 65Q60 71 67 65" fill="none" stroke="#54dfff" strokeWidth="3.5" strokeLinecap="round" />
      {look === 'feminine' && <path d="M42 30H78" stroke={color} strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

export function SetupWizard() {
  const t = useT();
  const user = useStore((s) => s.user);
  const demo = useStore((s) => s.demo);
  const ghReady = useStore((s) => s.ghReady);
  const ghError = useStore((s) => s.ghError);
  const ceoAgent = useStore((s) => s.agents[CEO_ID]);
  const maxAgents = useStore((s) => s.settings.maxAgents);
  const start = useStore((s) => s.start);

  const [step, setStep] = useState(0);
  const [managerName, setManagerName] = useState('');
  const [companyName, setCompanyName] = useState(() => COMPANIES[Math.floor(Math.random() * COMPANIES.length)]);
  const [ceoName, setCeoName] = useState(ceoAgent?.name ?? 'Morgan');
  const [ceoLook, setCeoLook] = useState<'feminine' | 'masculine'>(ceoAgent?.look ?? 'masculine');
  const [ceoColor, setCeoColor] = useState(ceoAgent?.color ?? TIES[0]);
  const [scaling, setScaling] = useState<'approve' | 'auto'>('approve');
  const [project, setProject] = useState<RepoView | null>(null);
  const [busy, setBusy] = useState(false);

  const me = managerName.trim() || user || 'Boss';
  const ceo = ceoName.trim() || 'Morgan';
  const company = companyName.trim() || COMPANIES[0];

  const save = () => api.setup({ managerName: me, companyName: company, scaling, ceoName: ceo, ceoLook, ceoColor });
  const finish = async () => {
    setBusy(true);
    try {
      await save();
      await api.updateSettings({ setupDone: true, tutorialStep: 0 });
      start();
      requestLook();
    } catch {
      setBusy(false); // api() already toasted
    }
  };
  const next = async () => {
    if (step === 2) {
      setBusy(true);
      try {
        await save(); // so the CEO already knows everyone's names when they study the first project
      } catch {
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    setStep(step + 1);
  };

  return (
    <div className="start">
      <div className="start-card wizard">
        <LanguageSelect />
        <div className="wizard-steps">
          {STEPS.map((s, i) => (
            <span key={s} className={`wizard-dot ${i === step ? 'wizard-dot-on' : i < step ? 'wizard-dot-done' : ''}`} title={t(s)} />
          ))}
        </div>

        {step === 0 && (
          <>
            <Brand animated />
            <h1 className="sr-only">Droidsembly</h1>
            <p className="start-tag"><T>Your own cartoon software company, staffed by AI coding agents.</T></p>
            <ul className="start-list">
              <li><T>🏢 Every project gets its own floor, with a team of coding agents building and testing its GitHub issues.</T></li>
              <li><T>🧠 A CEO studies each project, plans the work you ask for and sizes each team. You approve every new agent.</T></li>
              <li><T>📱 Your phone keeps you in the loop from anywhere in the building.</T></li>
            </ul>
            {!ghReady && ghError && <div className="term-error small">⚠️ {ghError}</div>}
            <button className="btn btn-big" onClick={() => setStep(1)}>
              <T>Let's set up your company</T>
            </button>
            <div className="start-meta">
              <button className="linkish" onClick={finish} disabled={busy}>
                <T>Skip setup and use the defaults</T>
              </button>
              {demo && <span className="pill pill-demo"><T>DEMO MODE</T></span>}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="wizard-icon">🧑‍💼</div>
            <h2><T>Who's the boss?</T></h2>
            <p className="start-tag"><T>That's you. You run the company; the agents do the typing.</T></p>
            <label className="field">
              <span><T>Your name</T></span>
              <input value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder={user ?? 'Boss'} autoFocus />
            </label>
            <label className="field">
              <span><T>Company name</T></span>
              <div className="row" style={{ margin: 0 }}>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={COMPANIES[0]} />
                <button type="button" className="btn btn-small" title="Suggest another name" onClick={() => setCompanyName(pickOther(COMPANIES, companyName))}>
                  🎲
                </button>
              </div>
            </label>
            <p className="muted small"><T>It goes on the sign in the lobby. Change either any time in the manager's console.</T></p>
          </>
        )}

        {step === 2 && (
          <>
            <h2><T>Meet your CEO</T></h2>
            <div className="ceo-setup">
              <CeoPortrait color={ceoColor} look={ceoLook} />
              <div className="grow">
                <label className="field">
                  <span><T>Name</T></span>
                  <div className="row" style={{ margin: 0 }}>
                    <input value={ceoName} onChange={(e) => setCeoName(e.target.value)} placeholder="Morgan" autoFocus />
                    <button type="button" className="btn btn-small" title="Suggest another name" onClick={() => setCeoName(pickOther(CEO_NAMES, ceoName))}>
                      🎲
                    </button>
                  </div>
                </label>
                <div className="row">
                  <label className="toggle">
                    <input type="radio" checked={ceoLook === 'feminine'} onChange={() => setCeoLook('feminine')} /> <T>👩 She</T>
                  </label>
                  <label className="toggle">
                    <input type="radio" checked={ceoLook === 'masculine'} onChange={() => setCeoLook('masculine')} /> <T>👨 He</T>
                  </label>
                  <span className="spacer" />
                  {TIES.map((c) => (
                    <button key={c} type="button" className={`swatch ${c === ceoColor ? 'swatch-on' : ''}`} style={{ background: c }} onClick={() => setCeoColor(c)} title="Tie colour" />
                  ))}
                </div>
                <div className="muted small"><T>Claude Opus 5.5 at xhigh effort: the thinking-hardest person in the building.</T></div>
              </div>
            </div>
            <p className="start-tag" style={{ margin: '12px 0 6px' }}>
              {t('{name} studies every project, writes its QA checklist, turns the work you ask for into GitHub issues and decides how big each team should be.', { name: ceo })}
            </p>
            <label className="toggle block">
              <input type="radio" checked={scaling === 'approve'} onChange={() => setScaling('approve')} />
              <span>
                <b><T>Ask me before every team change</T></b> <T>(recommended). New agents wait in the lobby and on your phone.</T>
              </span>
            </label>
            <label className="toggle block">
              <input type="radio" checked={scaling === 'auto'} onChange={() => setScaling('auto')} />
              <span>
                <b>{t('Let {name} change teams', { name: ceo })}</b> {t('on their own, up to {count} agents per floor.', { count: maxAgents })}
              </span>
            </label>
          </>
        )}

        {step === 3 && (
          <>
            <h2><T>Your first project</T></h2>
            {project ? (
              <div className="wizard-done">
                <div className="wizard-icon">🎉</div>
                <p>
                  <b>{project.fullName}</b> {t('moved into floor {floor}.', { floor: project.floor })}
                </p>
                <p className="muted">
                  {t('The project is connected. CEO onboarding and automatic work follow the options you selected.')}
                </p>
              </div>
            ) : (
              <>
                <p className="start-tag"><T>Pick one of your project folders, a GitHub repo, or start something new. Every project needs to be on GitHub: issues and pull requests are how the team works.</T></p>
                <ProjectPicker onConnected={setProject} />
              </>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div className="wizard-icon">🏢</div>
            <h2>{t('{company} is open for business', { company })}</h2>
            <ul className="start-list">
              <li>
                🧠 {ceo} · {t(project ? 'Your project is connected.' : 'Waiting for your first project.')}{' '}
                {t(scaling === 'approve' ? 'Team changes wait for your OK.' : 'Team changes up to {count} agents per floor go through on their own.', { count: maxAgents })}
              </li>
              <li>
                📱 <T>Open your phone:</T> <Key action="phone" /> · {t('Chat with {name}, approve team changes, and see every project at a glance.', { name: ceo })}
              </li>
              <li>
                🧭 <T>A short tour starts when you walk in.</T> <Key action="help" /> · <T>Help</T>
              </li>
            </ul>
            <button className="btn btn-big" onClick={finish} disabled={busy}>
              {t(busy ? 'Opening the doors…' : 'Enter the office')}
            </button>
          </>
        )}

        {step > 0 && step < 4 && (
          <div className="wizard-nav">
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              ← <T>Back</T>
            </button>
            <span className="spacer" />
            {step === 3 && !project && (
              <button className="linkish" onClick={() => setStep(4)}>
                <T>I'll add one later</T>
              </button>
            )}
            {(step !== 3 || project) && (
              <button className="btn btn-good" onClick={() => void next()} disabled={busy}>
                <T>Next</T> →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
