import { useEffect } from 'react';
import { AiUsageObservations } from './AiUsageObservations';
import { AiUsageResources } from './AiUsageResources';
import { api } from '../api';
import { fmtDuration, fmtPct, fmtUsd, usageMeter } from '../ops';
import { useStore } from '../store';
import type { DoctorFinding, DoctorFix, OpsAlarm, OpsNumbers, RepoView } from '../../../shared/types';
import { confirmDialog } from './Confirm';
import { T, useT } from '../i18n';
import { translate } from '../../../shared/i18n';
import { alarmText, doctorFindingText } from './operationText';

// The manager's console → Mission control: Claude's usage with "Resume full speed", what needs you (the alarms the
// lobby wall's beacon rings for), the office doctor's findings with their one-click fixes, and every floor's numbers
// from the wall as a table.

async function attempt<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch {
    return undefined; // api() already toasted the error
  }
}

/** "Resume full speed": asks first, then clears pacing. From the console's button and E on the lobby's usage meter. */
export async function confirmResume(resourceKey?: string) {
  const { usage, settings } = useStore.getState();
  const t = (text: string, values?: Record<string, string | number>) => translate(settings.language, text, values);
  const paced = usage.resources?.filter((r) => r.state === 'pacing') ?? [];
  const selected = resourceKey ? paced.find((r) => r.key === resourceKey) : paced.length === 1 ? paced[0] : undefined;
  if (!selected) {
    useStore.getState().openOverlay({ kind: 'manager', tab: 'ops', card: 'usage' });
    return;
  }
  if (document.pointerLockElement) document.exitPointerLock();
  const ok = await confirmDialog({
    icon: '⏩',
    tone: 'warn',
    title: t('Resume full speed?'),
    body: (
      <>
        <p>
          {selected.tool} · {selected.provider ?? t('Provider not reported')} · {selected.group ?? selected.model}
        </p>
        <p>{t('Resume only this quota. Hard limits cannot be cleared early; other quotas are unchanged.')}</p>
      </>
    ),
    confirm: t('Resume full speed'),
  });
  if (ok) await attempt(() => api.resumeFullSpeed(selected.key));
}

export function UsageCard({ hot }: { hot: boolean }) {
  const language = useStore((s) => s.settings.language);
  const usage = useStore((s) => s.usage);
  const m = usageMeter(usage, Date.now(), language);
  return (
    <div id="ops-card-usage" className={`card usage-card usage-${m.tone} ${hot ? 'ops-card-hot' : ''}`}>
      <div className="row wrap">
        <b><T>🤖 AI usage</T></b>
        <span className={`pill usage-pill-${m.tone}`}>{m.state}</span>
      </div>
      <p className="muted small"><T>Limits apply only to the affected quota. Warnings pace new issues; hard limits also hold QA, fixes and CEO jobs. Running sessions continue. Missing data does not mean unlimited usage.</T></p>
      <AiUsageResources resume={(key) => void confirmResume(key)} />
      <AiUsageObservations />
    </div>
  );
}

function AlarmCard({ alarm, repo, hot }: { alarm: OpsAlarm; repo: RepoView | undefined; hot: boolean }) {
  const t = useT();
  const language = useStore((s) => s.settings.language);
  const name = useStore((s) => alarm.agentId ? s.agents[alarm.agentId]?.name : undefined);
  const openOverlay = useStore((s) => s.openOverlay);
  const goToFloor = useStore((s) => s.goToFloor);
  const pr = alarm.prNumber !== null ? repo?.pulls.find((p) => p.number === alarm.prNumber) : undefined;
  return (
    <div id={`ops-card-${alarm.id}`} className={`card floor-card alarm-card ${hot ? 'ops-card-hot' : ''}`} style={{ ['--accent' as string]: repo?.color ?? '#ef476f' }}>
      <div className="row">
        <span className="floor-badge">{alarm.floor}</span>
        <div className="grow">
          <b>🚨 {alarmText(alarm, name, language)}</b>
          <div className="muted small">
            {repo?.fullName ?? alarm.repoId}
            {pr ? ` · ${pr.title}` : ''} · {t('since {time}', { time: new Date(alarm.since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
          </div>
        </div>
      </div>
      <div className="row wrap">
        {alarm.kind === 'pr' && alarm.prNumber !== null ? (
          <>
            <button className="btn btn-small" onClick={() => openOverlay({ kind: 'kanban', repoId: alarm.repoId })}>
              <T>📋 Open the Kanban</T>
            </button>
            <button className="btn btn-small btn-good" onClick={() => void attempt(() => api.sendToQa(alarm.repoId, alarm.prNumber!))}>
              <T>Retry QA</T>
            </button>
            <button className="btn btn-small" title={t('Hand it to its author, or any free agent, with QA’s findings')} onClick={() => void attempt(() => api.sendBack(alarm.repoId, alarm.prNumber!))}>
              <T>Send back for a fix</T>
            </button>
            {pr && (
              <a className="small" href={pr.url} target="_blank" rel="noreferrer">
                <T>PR on GitHub ↗</T>
              </a>
            )}
          </>
        ) : (
          alarm.agentId && (
            <>
              <button className="btn btn-small" onClick={() => openOverlay({ kind: 'terminal', agentId: alarm.agentId! })}>
                <T>Terminal</T>
              </button>
              <button className="btn btn-small btn-good" title={t('Clear their desk so they take new work')} onClick={() => void attempt(() => api.reset(alarm.agentId!))}>
                <T>Clear desk</T>
              </button>
            </>
          )
        )}
        <span className="spacer" />
        <button className="btn btn-small btn-ghost" onClick={() => goToFloor(alarm.floor)}>
          {t('Visit floor {floor}', { floor: alarm.floor })}
        </button>
      </div>
    </div>
  );
}

const FIXES: Record<DoctorFix, [string, string]> = {
  clear: ['↺ Clear desk', 'Clear their desk so they take new work'],
  stop: ['■ Stop', 'Stop their session'],
  requeue: ['↩ Requeue', 'Stop them and put the work back in line, without a strike'],
  'retry-qa': ['Retry QA', 'Queue the PR for a fresh QA run'],
  'send-back': ['Send back for a fix', 'Hand the PR to its author, or any free agent'],
  'close-issue': ['Close issue', 'Close the issue on GitHub as completed'],
};

async function applyFix(f: DoctorFinding, fix: DoctorFix) {
  const t = (text: string, values?: Record<string, string | number>) => translate(useStore.getState().settings.language, text, values);
  if (fix === 'close-issue') {
    if (document.pointerLockElement) document.exitPointerLock();
    const ok = await confirmDialog({
      icon: '🩺',
      tone: 'warn',
      title: t('Close issue #{number}?', { number: f.issueNumber ?? '?' }),
      body: <p>{t('It’s closed on GitHub as completed, with a comment saying PR #{number} resolved it.', { number: f.prNumber ?? '?' })}</p>,
      confirm: t('Close issue'),
    });
    if (!ok) return;
  }
  await attempt(() => api.doctorFix(f.id, fix));
}

function DoctorCard({ finding: f, repo }: { finding: DoctorFinding; repo: RepoView | undefined }) {
  const t = useT();
  const language = useStore((s) => s.settings.language);
  const name = useStore((s) => f.agentId ? s.agents[f.agentId]?.name : undefined);
  const openOverlay = useStore((s) => s.openOverlay);
  return (
    <div id={`ops-card-doctor-${f.id}`} className="card floor-card alarm-card doctor-card" style={{ ['--accent' as string]: repo?.color ?? '#7c6cf0' }}>
      <div className="row">
        <span className="floor-badge">{repo?.floor ?? '?'}</span>
        <div className="grow">
          <b>🩺 {doctorFindingText(f, name, language)}</b>
          <div className="muted small">
            {repo?.fullName ?? f.repoId} · {t('since {time}', { time: new Date(f.since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
          </div>
        </div>
      </div>
      <div className="row wrap">
        {f.fixes.map((fix, i) => (
          <button key={fix} className={`btn btn-small ${i === 0 ? 'btn-good' : ''}`} title={t(FIXES[fix][1])} onClick={() => void applyFix(f, fix)}>
            {t(FIXES[fix][0])}
          </button>
        ))}
        {f.agentId && (
          <button className="btn btn-small" onClick={() => openOverlay({ kind: 'terminal', agentId: f.agentId! })}>
            <T>Terminal</T>
          </button>
        )}
        <span className="spacer" />
        <button className="btn btn-small btn-ghost" title={t('Hide it until it goes away')} onClick={() => void attempt(() => api.doctorIgnore(f.id))}>
          <T>Ignore</T>
        </button>
      </div>
    </div>
  );
}

async function demoDoctor(action: Parameters<typeof api.demoDoctor>[0]) {
  const r = await attempt(() => api.demoDoctor(action));
  if (r) useStore.getState().pushToast('info', r.text);
}

function DoctorSection({ hot }: { hot: boolean }) {
  const t = useT();
  const doctor = useStore((s) => s.doctor);
  const repos = useStore((s) => s.repos);
  const demo = useStore((s) => s.demo);
  return (
    <div id="ops-card-doctor" className={hot ? 'ops-card-hot' : ''}>
      <h3 className="section"><T>🩺 Office doctor</T> {doctor.length > 0 && <span className="badge">{doctor.length}</span>}</h3>
      {doctor.length === 0 && (
        <p className="muted small"><T>Nothing stuck. Every minute the watchdog nudges quiet sessions, frees stuck desks and puts orphaned work back in line by itself; what it can’t safely fix shows up here.</T></p>
      )}
      {doctor.map((f) => (
        <DoctorCard key={f.id} finding={f} repo={repos.find((r) => r.id === f.repoId)} />
      ))}
      {demo && (
        <div className="row wrap">
          <span className="muted small">Demo:</span>
          <button className="btn btn-small btn-ghost" title={t('Restart with desks gone and work finished on GitHub meanwhile')} onClick={() => void demoDoctor('restart')}>
            <T>Simulate a restart</T>
          </button>
          <button className="btn btn-small btn-ghost" title={t('Someone’s session goes quiet for 20 minutes')} onClick={() => void demoDoctor('stuck')}>
            <T>Make a session stuck</T>
          </button>
          <button className="btn btn-small btn-ghost" title={t('Ten more minutes pass for the stuck sessions')} onClick={() => void demoDoctor('later')}>
            <T>10 minutes later</T>
          </button>
          <button className="btn btn-small btn-ghost" title={t('A merged PR whose issue was never closed')} onClick={() => void demoDoctor('unclosed')}>
            <T>Leave an issue open</T>
          </button>
        </div>
      )}
    </div>
  );
}

const COLUMNS: [string, (n: OpsNumbers, t: ReturnType<typeof useT>) => string, string?][] = [
  ['Ready to start', (n) => String(n.ready), 'Backlog issues that can start now'],
  ['Building', (n) => String(n.building)],
  ['In QA', (n) => String(n.inQa)],
  ['Fixing', (n) => String(n.fixing), 'Back with an agent: QA findings, checks or a conflict'],
  ['To merge', (n) => String(n.toMerge)],
  ['Needs you', (n) => `${n.needsYou}${n.triage ? ` (+${n.triage} 🧭)` : ''}`, '🧭: the CEO is looking first'],
  ['Merged today', (n, t) => t('{count} ({hour} last hour)', { count: n.mergedToday, hour: n.mergedHour })],
  ['Lead time', (n) => fmtDuration(n.leadMs), 'Median issue → merge over the last 24 hours'],
  ['QA wait', (n) => fmtDuration(n.qaWaitMs), 'Median wait for a free agent over the last 24 hours'],
  ['CI', (n) => (n.ciRuns ? `${fmtPct(n.ciPass)} · ${fmtDuration(n.ciMs)}` : '—'), 'GitHub’s checks over 7 days: pass rate · median time'],
  ['Team', (n, t) => t('{busy} busy · {idle} idle', { busy: n.busy, idle: n.idle }) + (n.errors ? t(' · errors: {count}', { count: n.errors }) : '')],
  ['Cost today', (n) => `~${fmtUsd(n.costToday)}`, 'An estimate from finished sessions’ reported cost'],
];

function OpsTable() {
  const t = useT();
  const ops = useStore((s) => s.ops);
  const repos = useStore((s) => s.repos);
  const rows: [string, string, OpsNumbers][] = [
    ...ops.floors.map((f): [string, string, OpsNumbers] => {
      const r = repos.find((x) => x.id === f.repoId);
      return [`${f.floor} · ${r?.fullName.split('/')[1] ?? f.repoId}`, r?.color ?? '#ccc', f];
    }),
    [t('All floors'), '#1f1d2b', ops.total],
  ];
  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            <th />
            {rows.map(([name, color]) => (
              <th key={name} style={{ ['--accent' as string]: color }} className="ops-col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COLUMNS.map(([label, value, tip]) => (
            <tr key={label}>
              <th title={tip ? t(tip) : undefined}>{t(label)}</th>
              {rows.map(([name, , n]) => (
                <td key={name}>{value(n, t)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {ops.ceoCostToday > 0 && <div className="muted small">{t('The CEO’s sessions today: ~{cost} (in All floors’ cost).', { cost: fmtUsd(ops.ceoCostToday) })}</div>}
    </div>
  );
}

export function OpsTab({ card }: { card?: string }) {
  const alarms = useStore((s) => s.ops.alarms);
  const repos = useStore((s) => s.repos);
  useEffect(() => {
    if (card) document.getElementById(`ops-card-${card}`)?.scrollIntoView({ block: 'center' });
  }, [card]);
  return (
    <div className="tab-grid">
      <div>
        <UsageCard hot={card === 'usage'} />
        <h3 className="section"><T>🚨 Needs you</T> {alarms.length > 0 && <span className="badge">{alarms.length}</span>}</h3>
        {alarms.length === 0 && <p className="muted small"><T>All clear. The beacon on the lobby’s mission control wall spins when a PR needs you or an agent has been stuck on an error for 10 minutes.</T></p>}
        {alarms.map((a) => (
          <AlarmCard key={a.id} alarm={a} repo={repos.find((r) => r.id === a.repoId)} hot={a.id === card} />
        ))}
        <DoctorSection hot={card === 'doctor'} />
      </div>
      <div>
        <h3 className="section"><T>🛰️ The numbers</T></h3>
        <OpsTable />
      </div>
    </div>
  );
}
