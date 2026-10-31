// Settings → Accessibility: captions, colour-blind-safe status, motion comfort, UI scale and readability, and how to
// use the office by keyboard. Everything is saved in this browser (a11y.ts) and applies at once. In pocket mode the
// 3D-only parts (motion, the field of view) are left out.
import { useId, type ReactNode } from 'react';
import { T, useT } from '../i18n';
import { useStore } from '../store';
import { Key } from './Key';
import { resetA11y, setA11y, useA11y } from './a11y';
import { DEFAULT_A11Y, LIMITS, reducesMotion, showsShapes, type A11yPrefs, type ReduceMotion } from './a11yPrefs';
import { KIND_ICON, KIND_WORD, kindStrong, PALETTE_LABELS, PALETTES, STATUS_KINDS, type Palette } from './statusLook';

function Toggle({ k, children, hint, disabled }: { k: 'captions' | 'statusShapes' | 'headBob' | 'cameraShake' | 'centerDot' | 'readableFont' | 'highContrast'; children: ReactNode; hint?: string; disabled?: boolean }) {
  const t = useT();
  const on = useA11y((s) => s.prefs[k]);
  const hintId = useId();
  return (
    <label className="toggle block">
      <input type="checkbox" checked={on || !!disabled} disabled={disabled} onChange={(e) => setA11y({ [k]: e.target.checked })} aria-describedby={hint ? hintId : undefined} />
      <span>
        <b>{children}</b>
        {hint && (
          <span className="muted small a11y-hint" id={hintId}>
            {' '}
            {t(hint)}
          </span>
        )}
      </span>
    </label>
  );
}

function Slider({ k, label, unit, describe }: { k: 'captionSize' | 'captionBg' | 'fov' | 'uiScale'; label: string; unit: string; describe?: (v: number) => string }) {
  const t = useT();
  const v = useA11y((s) => s.prefs[k]);
  const { min, max, step } = LIMITS[k];
  return (
    <label className="a11y-slider">
      <span>{t(label)}</span>
      <input type="range" min={min} max={max} step={step} value={v} aria-valuetext={`${v}${unit}${describe ? `, ${t(describe(v))}` : ''}`} onChange={(e) => setA11y({ [k]: Number(e.target.value) })} />
      <b>
        {v}
        {unit}
      </b>
      {v !== DEFAULT_A11Y[k] && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setA11y({ [k]: DEFAULT_A11Y[k] })} aria-label={t('Reset {label}', { label: t(label).toLowerCase() })}>
          <T>Reset</T>
        </button>
      )}
    </label>
  );
}

/** Each kind of status as it looks now: its colour and shape, and its name. */
function Swatches({ palette, shapes }: { palette: Palette; shapes: boolean }) {
  const t = useT();
  return (
    <ul className="status-swatches" aria-label={t('How statuses look')}>
      {STATUS_KINDS.map((k) => (
        <li key={k} className={`status-kind status-kind-${k}`} style={{ ['--kind' as string]: kindStrong(k, palette) }}>
          {shapes && <span aria-hidden>{KIND_ICON[k]}</span>} {t(KIND_WORD[k])}
        </li>
      ))}
    </ul>
  );
}

const MOTION_LABELS: Record<ReduceMotion, string> = { system: 'Follow my system setting', on: 'Always reduce motion', off: 'Full motion' };

export function AccessibilitySettings({ pocket = false }: { pocket?: boolean }) {
  const t = useT();
  const prefs = useA11y((s) => s.prefs);
  const systemReduced = useA11y((s) => s.systemReduced);
  const openOverlay = useStore((s) => s.openOverlay);
  const name = useId();
  const shapes = showsShapes(prefs);
  const set = (p: Partial<A11yPrefs>) => setA11y(p);
  return (
    <>
      <section className="card a11y-card" aria-labelledby={`${name}-cap`}>
        <h3 id={`${name}-cap`}><T>💬 Captions</T></h3>
        <Toggle k="captions" hint="The CEO’s messages written out as they’re read aloud, and short captions for important sounds (the gong, a merge cheer, alarms, the jukebox) with an arrow towards where they came from.">
          <T>Show captions</T>
        </Toggle>
        <Slider k="captionSize" label="Caption size" unit="%" />
        <Slider k="captionBg" label="Caption background" unit="%" />
        <div className="captions captions-preview" aria-hidden style={{ ['--caption-scale' as string]: prefs.captionSize / 100, ['--caption-bg' as string]: prefs.captionBg / 100 }}>
          <div className="caption">[gong] ↗</div>
          <div className="caption caption-speech">
            <b>CEO:</b> <T>PR number 12 is ready to merge.</T>
          </div>
        </div>
      </section>

      <section className="card a11y-card" aria-labelledby={`${name}-col`}>
        <h3 id={`${name}-col`}><T>🎨 Colour and status</T></h3>
        <fieldset className="a11y-fieldset">
          <legend><T>Status colours</T></legend>
          {PALETTES.map((p) => (
            <label key={p} className="toggle block">
              <input type="radio" name={`${name}-palette`} checked={prefs.palette === p} onChange={() => set({ palette: p })} /> {t(PALETTE_LABELS[p])}
            </label>
          ))}
        </fieldset>
        <Toggle k="statusShapes" disabled={prefs.palette !== 'standard'} hint={prefs.palette !== 'standard' ? 'Always on with a colour-blind palette.' : 'On name tags, the whiteboard, Kanban cards, status pills and toasts.'}>
          <T>Shapes beside status colours (✓ ✕ ! ⏳)</T>
        </Toggle>
        <Swatches palette={prefs.palette} shapes={shapes} />
      </section>

      {!pocket && (
        <section className="card a11y-card" aria-labelledby={`${name}-mot`}>
          <h3 id={`${name}-mot`}><T>🌀 Motion</T></h3>
          <Slider k="fov" label="Field of view" unit="°" describe={(v) => (v < 72 ? 'narrower' : v > 72 ? 'wider' : 'normal')} />
          <Toggle k="headBob"><T>Head bob while walking</T></Toggle>
          <Toggle k="cameraShake" hint="The view tipping back when you sip a coffee, and any screen shake.">
            <T>Camera sway and shake</T>
          </Toggle>
          <fieldset className="a11y-fieldset">
            <legend><T>Reduce motion</T></legend>
            {(Object.keys(MOTION_LABELS) as ReduceMotion[]).map((m) => (
              <label key={m} className="toggle block">
                <input type="radio" name={`${name}-motion`} checked={prefs.reduceMotion === m} onChange={() => set({ reduceMotion: m })} /> {t(MOTION_LABELS[m])}
                {m === 'system' && <span className="muted small">{t(systemReduced ? '(your system asks for less motion)' : '(your system doesn’t ask for less motion)')}</span>}
              </label>
            ))}
            <p className="muted small">
              <T>Reduced motion: confetti bursts become a glow, the elevator doors cut to a fade, and panels, toasts and badges appear without moving.</T>{' '}
              {t(reducesMotion(prefs.reduceMotion, systemReduced) ? 'On now.' : 'Off now.')}
            </p>
          </fieldset>
          <Toggle k="centerDot" hint="A dot fixed in the middle of the view, which helps some people with motion sickness.">
            <T>Centre dot</T>
          </Toggle>
        </section>
      )}

      <section className="card a11y-card" aria-labelledby={`${name}-read`}>
        <h3 id={`${name}-read`}><T>🔎 Size and readability</T></h3>
        <Slider k="uiScale" label="UI scale" unit="%" />
        <p className="muted small"><T>The HUD, the phone, the console and every panel, from 80% to 150%.</T></p>
        <Toggle k="readableFont" hint="Verdana, with wider letter, word and line spacing, as dyslexia style guides recommend.">
          <T>Dyslexia-friendly font</T>
        </Toggle>
        <Toggle k="highContrast" hint="Plain white panels, darker grey text, heavier borders and focus rings.">
          <T>High-contrast panels</T>
        </Toggle>
      </section>

      {!pocket && (
        <section className="card a11y-card" aria-labelledby={`${name}-kb`}>
          <h3 id={`${name}-kb`}><T>⌨️ Keyboard and screen readers</T></h3>
          <p className="small">
            <Key action="phone" /> <T>opens your phone from anywhere: its</T> <b><T>Company</T></b> <T>tab opens the console, this floor’s Kanban, the floor list, help and these settings.</T> <Key action="help" /> <T>opens help. In any panel,</T>{' '}
            <kbd>Tab</kbd> <T>and</T> <kbd>Shift</kbd>+<kbd>Tab</kbd> <T>move between controls,</T> <kbd>Enter</kbd> <T>or</T> <kbd>Space</kbd> <T>uses one and</T> <kbd>Esc</kbd> <T>closes it; focus goes back where it was. Screen readers hear the CEO’s messages and alarms as they happen.</T>
          </p>
          <div className="row wrap">
            <button className="btn btn-small" onClick={() => openOverlay({ kind: 'floorList' })}>
              <T>👥 List view of this floor</T>
            </button>
          </div>
        </section>
      )}

      <div className="row">
        <button className="btn btn-ghost btn-small" onClick={resetA11y}>
          <T>Reset accessibility settings</T>
        </button>
      </div>
    </>
  );
}
