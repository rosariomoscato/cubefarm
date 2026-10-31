import { useEffect, useRef } from 'react';
import type { Held } from '../store';
import { BLASTER, reloadProgress, settle } from '../world/toys/darts';
import { Key } from './Key';
import { T, useT } from '../i18n';

/** With a blaster in hand: the controls, and the darts left ("Darts 9/12") with a bar while reloading. */
export function BlasterHud({ held }: { held: Extract<Held, { kind: 'blaster' }> }) {
  const t = useT();
  const bar = useRef<HTMLDivElement>(null);
  const reloading = held.reloadAt !== null;
  useEffect(() => {
    if (!reloading) return;
    let raf = 0;
    const tick = () => {
      const p = reloadProgress(held, performance.now());
      if (bar.current) bar.current.style.transform = `scaleX(${p ?? 1})`;
      if (p !== null) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [held, reloading]);
  const empty = held.ammo === 0 && !reloading;
  return (
    <>
      <div className="hud-hint hud-held">
        <kbd>Click</kbd> / <Key action="throw" /> <T>fire</T> · <Key action="reload" /> <T>reload</T> · <Key action="drop" /> <T>drop</T>
      </div>
      <div className={`hud-ammo ${empty ? 'hud-ammo-empty' : ''}`}>
        <span className="hud-ammo-count">🎯 {t('Darts {ammo}/{max}', { ammo: settle(held, performance.now()).ammo, max: BLASTER.mag })}</span>
        {reloading && (
          <div className="hud-ammo-bar">
            <div ref={bar} className="hud-ammo-fill" />
          </div>
        )}
        {reloading && <span className="hud-ammo-note"><T>Reloading…</T></span>}
        {empty && <span className="hud-ammo-note"><T>Empty:</T> <Key action="reload" /> <T>to reload</T></span>}
      </div>
    </>
  );
}
