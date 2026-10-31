import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { CHARGE, chargePower } from '../world/toys/hands';
import { BlasterHud } from './BlasterHud';
import { decorName } from '../world/decor/actions';
import { SNACKS } from '../world/fridge';
import { Key } from './Key';
import { PongHud } from './PongHud';
import { T, useT } from '../i18n';

/** The throw meter under the crosshair. Animates itself while charging; hidden during the first moments of a tap. */
function ChargeMeter({ at }: { at: number }) {
  const meter = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const ms = performance.now() - at;
      const p = chargePower(ms);
      if (meter.current) meter.current.className = `charge ${ms > CHARGE.tap ? 'charge-on' : ''} ${p >= 1 ? 'charge-full' : ''}`;
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [at]);
  return (
    <div ref={meter} className="charge">
      <div ref={fill} className="charge-fill" />
    </div>
  );
}

/** What you can do with what's in your hands. */
export function HeldHint() {
  const t = useT();
  const held = useStore((s) => s.held);
  const chargeAt = useStore((s) => s.chargeAt);
  if (!held) return null;
  if (held.kind === 'blaster') return <BlasterHud held={held} />;
  if (held.kind === 'sausage') {
    return (
      <div className="hud-hint hud-held">
        🌭 {t(held.bites === 1 ? '{count} bite left' : '{count} bites left', { count: held.bites })}{held.charred ? t(' (a bit charred)') : ''} · <Key action="interact" /> <T>eat</T> · <Key action="drop" /> <T>drop</T>
      </div>
    );
  }
  if (held.kind === 'snack') {
    const s = SNACKS[held.snack];
    const key = s.kind === 'drink' ? (held.left === 1 ? '{count} sip left' : '{count} sips left') : (held.left === 1 ? '{count} bite left' : '{count} bites left');
    return (
      <div className="hud-hint hud-held">
        {s.emoji} {t(s.name)} · {t(key, { count: held.left })} · <Key action="interact" /> {t(s.kind === 'drink' ? 'drink' : 'eat')} · <Key action="drop" /> <T>drop</T>
      </div>
    );
  }
  if (held.kind === 'decor') {
    return (
      <div className="hud-hint hud-held">
        {t('📦 Carrying the {item}', { item: t(decorName(held.item)).toLowerCase() })} · <Key action="interact" /> <T>on a glowing spot places it</T> · <Key action="drop" /> <T>puts it back</T>
      </div>
    );
  }
  if (held.kind === 'paddle') return <PongHud />;
  if (held.kind === 'sticky') {
    return (
      <div className="hud-hint hud-held">
        📌 {held.pr ? `PR #${held.number}` : `#${held.number}`} · {t(held.pr ? 'take it to a free agent’s desk to have them test it' : 'take it to a free agent’s desk')} <T>and press</T> <Key action="interact" /> · <Key action="drop" /> <T>elsewhere puts it back</T>
      </div>
    );
  }
  if (held.kind === 'mug') {
    return (
      <div className="hud-hint hud-held">
        ☕ {held.sips > 0 ? t(held.sips === 1 ? '{count} sip left' : '{count} sips left', { count: held.sips }) : t('Empty mug')} · <Key action="drop" /> <T>drop</T>
      </div>
    );
  }
  return (
    <>
      {chargeAt !== null && <ChargeMeter at={chargeAt} />}
      <div className="hud-hint hud-held">
        <kbd>Click</kbd> / <Key action="throw" /> <T>throw · hold to charge</T> · <Key action="drop" /> <T>drop</T>
      </div>
    </>
  );
}
