/** Static headers; only the entrance plays the assembly once per document load. */
import { useEffect, useState } from 'react';
import './brand.css';

let entrancePlayed = false;

export function BrandIcon({ animated = false }: { animated?: boolean }) {
  const [play] = useState(() => animated && !entrancePlayed);
  useEffect(() => { if (play) entrancePlayed = true; }, [play]);
  return (
    <span className={`brand-icon${play ? ' brand-assemble' : ''}`} aria-hidden="true">
      <img className="brand-static" src="/icons/icon.svg" alt="" width="152" height="170" />
      {play && <span className="brand-parts">
        {['wire', 'shell', 'eyes', 'antenna', 'spark'].map((part) => (
          <img key={part} className={`brand-part brand-${part}`} src={`/icons/droid-${part}.svg`} alt="" width="152" height="170" />
        ))}
      </span>}
    </span>
  );
}

export function Brand({ animated = false }: { animated?: boolean }) {
  return <div className="brand-lockup">
    <BrandIcon animated={animated} />
    <div className="brand-type">
      <div className="brand-name" aria-label="Droidsembly">Droid<span>sembly</span></div>
      <div className="brand-payoff" lang="en">Software, assembled by agents.</div>
    </div>
  </div>;
}
