import type { VisitorView } from '../../../shared/types';
import { translate, type Language } from '../../../shared/i18n';

// One visitor in the people list (VisitorsList.tsx). Their name is rendered as text, so whatever someone calls
// themselves stays text (VisitorRow.test.tsx).

export function VisitorRow({ v, where, following, onFollow, language }: { v: VisitorView; where: string; following: boolean; onFollow: () => void; language?: Language }) {
  const t = (text: string, values?: Record<string, string | number>) => translate(language, text, values);
  return (
    <div className="vs-row">
      <span className="wk-dot" style={{ background: v.color }} />
      <span className="wk-main">
        <span className="wk-name">{v.name}</span>
        <span className="wk-last">{where}</span>
      </span>
      <button className={`btn btn-small vs-follow ${following ? 'vs-on' : ''}`} onClick={onFollow} title={t(following ? 'Stop following {name}' : 'Follow {name} with the camera', { name: v.name })}>
        {t(following ? 'Stop' : '👀 Follow')}
      </button>
    </div>
  );
}
