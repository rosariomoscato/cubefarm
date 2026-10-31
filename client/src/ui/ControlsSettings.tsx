import { useEffect, useState, useSyncExternalStore } from 'react';
import { T, useT } from '../i18n';
import { SENSITIVITY_MAX, SENSITIVITY_MIN, useLookPrefs } from '../world/look';
import { pad, padName, watchPads } from '../world/gamepad';
import { clearBinding, resetControls, setBinding, setPadSensitivity, useControls } from './controls';
import { ACTIONS, PAD_SENSITIVITY_MAX, PAD_SENSITIVITY_MIN, SLOTS, actionDef, exactKeyLabel, findConflicts, keyLabel, type ActionDef, type ActionId } from './keymap';

// Help → Controls: every key action rebindable (click a key, press the new one), conflicts called out, the mouse's
// sensitivity and invert-Y, the gamepad's sensitivity and button map, and a reset. All saved in this browser.

const GROUPS: ActionDef['group'][] = ['Moving', 'Hands', 'Office', 'Overview'];

function MouseSettings() {
  const { sensitivity, invertY, grabOnClose, set } = useLookPrefs();
  return (
    <div className="mouse-settings">
      <label className="mouse-sens">
        <span><T>Mouse sensitivity</T></span>
        <input type="range" min={SENSITIVITY_MIN} max={SENSITIVITY_MAX} step={0.05} value={sensitivity} onChange={(e) => set({ sensitivity: Number(e.target.value) })} />
        <b>{sensitivity.toFixed(2)}×</b>
        {sensitivity !== 1 && (
          <button className="btn btn-ghost btn-small" onClick={() => set({ sensitivity: 1 })}>
            <T>Reset</T>
          </button>
        )}
      </label>
      <label className="toggle">
        <input type="checkbox" checked={invertY} onChange={(e) => set({ invertY: e.target.checked })} /> <T>Invert Y (push the mouse or the right stick forward to look down)</T>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={grabOnClose} onChange={(e) => set({ grabOnClose: e.target.checked })} /> <T>Grab the mouse when panels close</T>
      </label>
    </div>
  );
}

// The pad's state is read once a frame (Player.tsx): look again just after a plug event, and now and then.
function subscribePads(cb: () => void) {
  const off = watchPads(() => setTimeout(cb, 100));
  const t = setInterval(cb, 1000);
  return () => {
    off();
    clearInterval(t);
  };
}

/** The pad that's plugged in, or null. */
const padNow = () => (pad.connected ? padName(pad.id) : null);

function GamepadSettings() {
  const t = useT();
  const sens = useControls((s) => s.padSensitivity);
  const name = useSyncExternalStore(subscribePads, padNow);
  return (
    <div className="mouse-settings">
      <div className="pad-status">{name ? t('🎮 {name} is connected', { name }) : t('🎮 No controller yet: plug one in and press a button.')}</div>
      <label className="mouse-sens">
        <span><T>Gamepad sensitivity</T></span>
        <input type="range" min={PAD_SENSITIVITY_MIN} max={PAD_SENSITIVITY_MAX} step={0.05} value={sens} onChange={(e) => setPadSensitivity(Number(e.target.value))} />
        <b>{sens.toFixed(2)}×</b>
      </label>
      <p className="muted small pad-map">
        <T>Left stick walks (click it to run) · right stick looks ·</T> <b>A</b> <T>uses (like E) ·</T> <b>B</b> <T>goes back (Esc) ·</T> <b>X</b> <T>picks up or drops · triggers throw and fire ·</T> <b>Y</b> <T>reloads ·</T> <b>Start</b> <T>the phone ·</T>{' '}
        <b>Select</b> <T>the overview (twice: the building) ·</T> <b>LB</b>/<b>RB</b> <T>turn the overview, where the left stick pans, the right stick zooms and</T> <b>A</b> <T>opens what’s in the middle.</T>
      </p>
    </div>
  );
}

export function ControlsSettings() {
  const t = useT();
  const b = useControls((s) => s.bindings);
  const [listen, setListen] = useState<{ action: ActionId; slot: number } | null>(null);
  const [note, setNote] = useState<((t: ReturnType<typeof useT>) => string) | null>(null);

  // Waiting for a key: it's caught before the office (or the panel's Esc) sees it.
  useEffect(() => {
    if (!listen) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.code === 'Escape') return setListen(null);
      const r = setBinding(listen.action, listen.slot, e.code);
      if (!r) return setNote(() => (t: ReturnType<typeof useT>) => t('{key} can’t be bound: it belongs to the browser (Esc always backs out).', { key: keyLabel(e.code) }));
      const what = actionDef(listen.action).label;
      setNote(() => (t: ReturnType<typeof useT>) => r.displaced
        ? t('{key} is now {action}. It was {previous}’s, which {result}.', { key: keyLabel(e.code), action: t(what), previous: t(actionDef(r.displaced.action).label), result: r.displaced.key ? t('moved to {key}', { key: keyLabel(r.displaced.key) }) : t('has no key now') })
        : t('{key} is now {action}.', { key: keyLabel(e.code), action: t(what) }));
      setListen(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listen]);

  const conflicts = findConflicts(b);
  const clash = new Set(conflicts.flatMap((c) => c.actions.map((a) => `${a}|${c.code}`)));
  const reset = () => {
    resetControls();
    useLookPrefs.getState().set({ sensitivity: 1, invertY: false, grabOnClose: true });
    setListen(null);
    setNote(() => (t: ReturnType<typeof useT>) => t('Every control is back to how it came.'));
  };

  return (
    <div className="controls">
      <p className="muted small"><T>Click a key and press the new one (Esc cancels). A key another action uses moves over, and that action gets your old key. Esc always backs out and frees the mouse.</T></p>
      {GROUPS.map((g) => (
        <div key={g} className="controls-group">
          <h3>{t(g === 'Overview' ? 'Overview and views' : g)}</h3>
          <div className="controls-table" role="table" aria-label={t('{group} keys', { group: t(g) })}>
            {ACTIONS.filter((a) => a.group === g).map((a) => (
              <div key={a.id} className="controls-row" role="row">
                <span role="cell" className="controls-name">
                  {t(a.label)}
                </span>
                {Array.from({ length: SLOTS }, (_, slot) => {
                  const code = b[a.id][slot];
                  const waiting = listen?.action === a.id && listen.slot === slot;
                  return (
                    <span key={slot} role="cell" className="controls-slot">
                      <button
                        className={`key-btn ${waiting ? 'key-btn-wait' : ''} ${code && clash.has(`${a.id}|${code}`) ? 'key-btn-clash' : ''} ${!code ? 'key-btn-empty' : ''}`}
                        aria-label={t('{action}: {slot} {key}. Click to change', { action: t(a.label), slot: t(slot ? 'other key' : 'key'), key: code ? exactKeyLabel(code) : t('none') })}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          setNote(null);
                          setListen(waiting ? null : { action: a.id, slot });
                        }}
                      >
                        {waiting ? t('press a key…') : code ? exactKeyLabel(code) : slot ? '+' : '—'}
                      </button>
                      {code && slot > 0 && (
                        <button className="key-clear" title={t('Remove this key')} aria-label={t('Remove {key} from {action}', { key: exactKeyLabel(code), action: t(a.label) })} onClick={() => clearBinding(a.id, slot)}>
                          ✕
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
      {note && (
        <p className="controls-note" role="status">
          {note(t)}
        </p>
      )}
      {conflicts.length > 0 && (
        <p className="controls-clash" role="alert">
          ⚠️ {conflicts.map((c) => t('{key} does both {first} and {second}', { key: keyLabel(c.code), first: t(actionDef(c.actions[0]).label), second: t(actionDef(c.actions[1]).label) })).join('; ')}. <T>Give one of them another key.</T>
        </p>
      )}
      <h3><T>Mouse</T></h3>
      <MouseSettings />
      <h3><T>Gamepad</T></h3>
      <GamepadSettings />
      <div className="controls-reset">
        <button className="btn btn-small" onClick={reset}>
          <T>↺ Reset to defaults</T>
        </button>
      </div>
    </div>
  );
}
