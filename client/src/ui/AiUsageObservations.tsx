import { useStore } from '../store';
import { T, useT } from '../i18n';

/** Reported message usage is deliberately separate from subscription quota and scheduling controls. */
export function AiUsageObservations() {
  const observations = useStore((s) => s.usage.observations);
  const agents = useStore((s) => s.agents);
  const language = useStore((s) => s.settings.language);
  const t = useT();
  const number = (n: number | null) => n === null ? t('Not available') : n.toLocaleString(language, { maximumFractionDigits: 6 });
  return <details>
    <summary><T>Observed AI usage</T></summary>
    <p className="muted small"><T>Latest 200 observations. Status rows are cumulative session counters, not additional consumption. Reported costs are not subscription charges or remaining quota.</T></p>
    {!observations?.length ? <p className="muted small"><T>No usage observations received yet.</T></p> :
      [...observations].reverse().map((m) => <div className="card" key={JSON.stringify([m.tool, m.sessionId, m.id])} style={{ overflowWrap: 'anywhere' }}>
        <b>{m.agentId ? agents[m.agentId]?.name ?? m.agentId : '—'} · {m.tool}</b>
        <div>{m.provider ?? t('Not available')} / {m.model ?? t('Not available')}</div>
        <div className="small"><T>Input tokens</T>: {number(m.input)} · <T>Output tokens</T>: {number(m.output)}</div>
        <div className="small"><T>Reasoning tokens</T>: {number(m.reasoning)} · <T>Cache read / write</T>: {number(m.cacheRead)} / {number(m.cacheWrite)}</div>
        <div className="small"><T>Reported cost (USD)</T>: {number(m.costUsd)} · <T>Remaining quota</T>: <T>Not available</T></div>
        <div className="muted small">{new Date(m.at).toLocaleString(language)} · {m.source}</div>
        <div className="muted small"><T>Last observation</T>: {m.observedAt ? new Date(m.observedAt).toLocaleString(language) : t('Not available')}</div>
      </div>)}
  </details>;
}
