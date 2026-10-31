import { useEffect, useState, useSyncExternalStore } from 'react';
import { PONG_PLAYER } from '../../../shared/pong';
import { useStore } from '../store';
import { Key } from './Key';
import { pongView, subscribePong } from '../world/toys/pongState';
import { T, useT } from '../i18n';
import { pongStatus } from './pongText';
export { pongStatus } from './pongText';

// Playing ping-pong (a paddle in hand): the score chip at the top of the screen, what's happening, and the controls.

export function PongHud() {
  const t = useT();
  const language = useStore((s) => s.settings.language);
  const v = useSyncExternalStore(subscribePong, pongView);
  const agents = useStore((s) => s.agents);
  const [waited, setWaited] = useState(0);
  const waiting = v?.phase === 'waiting';
  useEffect(() => {
    setWaited(0);
    if (!waiting) return;
    const t = setInterval(() => setWaited((w) => w + 1), 1000);
    return () => clearInterval(t);
  }, [waiting]);
  if (!v) return null;
  const name = (end: 'west' | 'east') => {
    const id = v[end];
    return !id ? '…' : id === PONG_PLAYER ? t('You') : (agents[id]?.name ?? '?');
  };
  const left = v.you ?? 'west';
  const right = left === 'west' ? 'east' : 'west';
  const status = pongStatus(v, name, waited, language);
  return (
    <>
      <div className="hud-pong" aria-live="polite">
        <div className="hud-pong-score">
          <span className={v.server === left && v.phase !== 'over' ? 'hud-pong-serving' : ''}>{name(left)}</span>
          <b>{v.score[left]}</b>
          <i>:</i>
          <b>{v.score[right]}</b>
          <span className={v.server === right && v.phase !== 'over' ? 'hud-pong-serving' : ''}>{name(right)}</span>
        </div>
        {status && <div className="hud-pong-status">{status}</div>}
      </div>
      <div className="hud-hint hud-pong-keys">
        <kbd>Mouse</kbd> <T>paddle (up: towards the net) · swing through for pace and spin</T> · <kbd>Click</kbd> / <Key action="throw" /> <T>serve</T> · <Key action="drop" /> / <kbd>Esc</kbd> <T>leave</T>
      </div>
    </>
  );
}
