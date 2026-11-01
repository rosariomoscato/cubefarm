import { useState } from 'react';
import type { AiResourceView } from '../../../shared/aiUsage';
import { api } from '../api';
import { useStore } from '../store';
import { T, useT } from '../i18n';
import { fmtDuration } from '../ops';
import { confirmDialog } from './Confirm';

export function AiUsageResources({ resume }: { resume: (key: string) => void }) {
  const resources = useStore((s) => s.usage.resources);
  return <div>{resources?.map((r) => <Resource key={r.key} resource={r} resume={resume} />)}</div>;
}

function Resource({ resource: r, resume }: { resource: AiResourceView; resume: (key: string) => void }) {
  const t = useT();
  const agents = useStore((s) => s.agents);
  const language = useStore((s) => s.settings.language);
  const demo = useStore((s) => s.demo);
  const [group, setGroup] = useState(r.group ?? '');
  const [saving, setSaving] = useState(false);
  const status: Record<string, string> = { idle: 'Idle', preparing: 'Setting up', working: 'Working', done: 'Finished', error: 'Needs help', stopped: 'Stopped' };
  const stamp = (at: number | null) => at === null ? t('Not available') : new Date(at).toLocaleString(language);
  const save = async () => {
    const confirmed = await confirmDialog({ icon: '🔗', tone: 'warn', title: t('Confirm shared quota'),
      body: <p><T>Use the same label only when these connections share a quota. This does not change provider, model or billing mode.</T></p>, confirm: t('Confirm shared quota') });
    if (!confirmed) return;
    setSaving(true);
    try { await api.setUsageGroup(r.key, group); } catch { /* API shows the error */ }
    finally { setSaving(false); }
  };
  return <section className="card" style={{ overflowWrap: 'anywhere', minWidth: 0 }} aria-label={`${r.tool} ${r.provider ?? ''}`}>
    <div className="row wrap"><b>{r.tool} · {r.provider ?? t('Provider not reported')}</b><span className="pill">{t(r.state === 'paused' ? 'Paused' : r.state === 'pacing' ? 'Pacing' : 'No active limit signal')}</span></div>
    <div>{r.model ?? t('Model not reported')} · {t(r.access === 'api' ? 'API' : r.access === 'subscription' ? 'Subscription' : 'Access mode not reported')}</div>
    {r.group && <div className="small"><T>Shared quota</T>: {r.group}</div>}
    <div className="muted small"><T>{r.observedAt === null ? 'Configured selection; awaiting session telemetry' : 'Observed connection'}</T></div>
    <div className="small"><T>Running sessions</T>: {r.running} · <T>Last observation</T>: {stamp(r.observedAt)}</div>
    <div className="small"><T>Last quota signal</T>: {stamp(r.warning?.at ?? null)} · <T>Reported reset</T>: {stamp(r.warning?.resetsAt ?? null)}</div>
    {r.until !== null && <div className="small"><T>Next scheduling check</T>: {stamp(r.until)}</div>}
    {r.warning?.pct != null ? <div><T>Reported usage</T>: {r.warning.pct}% <meter min={0} max={100} value={r.warning.pct} aria-label={t('Reported usage')} /></div> : <div className="muted small"><T>Remaining quota</T>: <T>Not available</T></div>}
    <ul>{r.agentIds.map((id) => {
      const a = agents[id];
      return <li key={id}>{a?.name ?? id} · {a?.role === 'ceo' ? 'CEO' : a?.repoId || '—'} · {a ? t(status[a.status] ?? a.status) : '—'}{a?.startedAt ? ` · ${fmtDuration((a.endedAt ?? Date.now()) - a.startedAt)}` : ''}</li>;
    })}</ul>
    <div className="row wrap"><button className="btn btn-small" disabled={r.state !== 'pacing'} onClick={() => resume(r.key)}><T>Resume this quota</T></button>
      {demo && <><button className="btn btn-small" onClick={() => void api.simulateUsage('warning', r.agentIds[0]).catch(() => undefined)}><T>Simulate a usage warning</T></button><button className="btn btn-small" onClick={() => void api.simulateUsage('limit', r.agentIds[0]).catch(() => undefined)}><T>Simulate reaching the limit</T></button></>}
    </div>
    <details><summary><T>Quota association</T></summary>
      <p className="muted small"><T>Without an identified account or confirmed association, limits stay isolated. OAuth alone does not identify a subscription.</T></p>
      <label><T>Confirmed shared quota label</T><input value={group} onChange={(e) => setGroup(e.target.value)} maxLength={64} style={{ width: '100%', boxSizing: 'border-box' }} /></label>
      <button className="btn btn-small" disabled={saving || group === (r.group ?? '')} onClick={() => void save()}><T>Save quota association</T></button>
    </details>
  </section>;
}
