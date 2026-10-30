import { useState, type ReactNode } from 'react';
import { T, useT } from '../i18n';
import { Markdown } from './Markdown';
import type { SavedAnalysisReply } from './savedAnalysisReply';

export function AnalysisReply({ reply }: { reply: SavedAnalysisReply }) {
  const t = useT();
  return <section className="card analysis-reply" aria-label={t('Analysis result')}>
    <h3><T>Analysis result</T></h3>
    {reply.partial && <p className="muted small"><T>Saved log excerpt: older analyses did not store the full Markdown. The original output remains in the terminal.</T></p>}
    <Markdown text={reply.text} />
  </section>;
}

export function TerminalDetails({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  if (!collapsed) return <>{children}</>;
  return <details className="analysis-terminal" open={expanded} onToggle={(e) => setExpanded(e.currentTarget.open)}>
    <summary><T>Terminal and technical log</T></summary>
    {expanded && children}
  </details>;
}
