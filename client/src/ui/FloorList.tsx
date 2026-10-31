// The list view (Settings → Accessibility, or the phone): a floor as a table of who is there, their status and what
// they're doing, with the panels you'd otherwise walk to. For anyone who can't use the 3D view; works by keyboard
// and screen reader. In the lobby it lists the CEO and every floor.
import { useMemo, useState } from 'react';
import { agentsOnRepo, floorPrCounts, useStore } from '../store';
import { CEO_ID } from '../../../shared/types';
import { floorRows, type FloorRow } from './floorRows';
import { Panel } from './Panel';
import { T, useT } from '../i18n';

function People({ rows, caption }: { rows: FloorRow[]; caption: string }) {
  const t = useT();
  const openOverlay = useStore((s) => s.openOverlay);
  if (!rows.length) return <p className="muted"><T>Nobody works here yet.</T></p>;
  return (
    <table className="floor-table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col"><T>Name</T></th>
          <th scope="col"><T>Agent</T></th>
          <th scope="col"><T>Status</T></th>
          <th scope="col"><T>Doing</T></th>
          <th scope="col">
            <span className="sr-only"><T>Actions</T></span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <th scope="row">{r.name}</th>
            <td>{r.agent}</td>
            <td>
              <span className={`status-kind status-kind-${r.kind}`}>
                <span aria-hidden>{r.icon}</span> {r.status}
              </span>
            </td>
            <td>{r.doing}</td>
            <td>
              <button className="btn btn-small" onClick={() => openOverlay({ kind: 'terminal', agentId: r.id })} aria-label={r.signIn ? t('Sign {name}’s {provider} in, in their terminal', { name: r.name, provider: r.signIn }) : t('Open {name}’s terminal', { name: r.name })}>
                {t(r.signIn ? '🔑 Sign in' : 'Terminal')}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FloorList() {
  const t = useT();
  const floor = useStore((s) => s.floor);
  const repos = useStore((s) => s.repos);
  const agents = useStore((s) => s.agents);
  const qa = useStore((s) => s.qa);
  const settings = useStore((s) => s.settings);
  const clis = useStore((s) => s.clis);
  const openOverlay = useStore((s) => s.openOverlay);
  const goToFloor = useStore((s) => s.goToFloor);
  const [shown, setShown] = useState(floor);
  const repo = repos.find((r) => r.floor === shown) ?? null;
  const rows = useMemo(
    () => floorRows(repo ? agentsOnRepo(agents, repo.id) : agents[CEO_ID] ? [agents[CEO_ID]] : [], settings, clis),
    [repo, agents, settings, clis],
  );
  const counts = repo ? floorPrCounts(repo, qa) : null;
  const busy = rows.filter((r) => r.kind === 'busy' || r.kind === 'waiting').length;

  return (
    <Panel title={repo ? t('👥 Floor {floor}: {repo}', { floor: repo.floor, repo: repo.fullName }) : t('👥 Lobby')} className="floor-list">
      <div className="row wrap">
        <label className="field-inline">
          <span><T>Floor</T></span>
          <select value={shown} onChange={(e) => setShown(Number(e.target.value))}>
            <option value={0}>{t('Lobby')}</option>
            {repos.map((r) => (
              <option key={r.id} value={r.floor}>
                {r.floor} · {r.fullName}
              </option>
            ))}
          </select>
        </label>
        <span className="spacer" />
        {shown !== floor && (
          <button className="btn btn-small" onClick={() => goToFloor(shown)}>
            <T>🛗 Go there</T>
          </button>
        )}
        {repo && (
          <>
            <button className="btn btn-small" onClick={() => openOverlay({ kind: 'kanban', repoId: repo.id })}>
              <T>📋 Kanban</T>
            </button>
            <button className="btn btn-small" onClick={() => openOverlay({ kind: 'app', repoId: repo.id })}>
              <T>🖥️ App</T>
            </button>
          </>
        )}
      </div>
      {repo && counts && (
        <p className="floor-summary">
          {t('{people} people, {busy} busy · {issues} open issues · {qa} in QA · {ready} ready to merge', { people: rows.length, busy, issues: repo.issues.length, qa: counts.inQa, ready: counts.ready })}
          {counts.needsYou ? t(' · {count} need you', { count: counts.needsYou }) : ''}
        </p>
      )}
      <People rows={rows} caption={repo ? t('Who is on floor {floor}', { floor: repo.floor }) : t('Who is in the lobby')} />
      {!repo && repos.length > 0 && (
        <>
          <h3><T>Floors</T></h3>
          <ul className="floor-floors">
            {repos.map((r) => {
              const team = agentsOnRepo(agents, r.id);
              const working = team.filter((a) => a.status === 'working' || a.status === 'preparing').length;
              return (
                <li key={r.id}>
                  <button className="linkish" onClick={() => setShown(r.floor)}>
                    {t('Floor {floor}', { floor: r.floor })}: {r.fullName}
                  </button>{' '}
                  <span className="muted">
                    · {t('{people} people, {working} working', { people: team.length, working })}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
