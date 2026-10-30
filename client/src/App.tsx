import { lazy, Suspense } from 'react';
import { useMode } from './pocket/mode';
import { Captions, LiveRegions } from './ui/CaptionStrip';
import { ConfirmDialog } from './ui/Confirm';
import { LanguageSync, T } from './i18n';

// Each loads only when it's shown: a phone in pocket mode never fetches three.js.
const Office = lazy(() => import('./Office'));
const Pocket = lazy(() => import('./pocket/Pocket'));

export function App() {
  const mode = useMode((s) => s.mode);
  return (
    <>
      <LanguageSync />
      <Suspense fallback={<div className="app-loading"><T>Loading the office…</T></div>}>{mode === 'pocket' ? <Pocket /> : <Office />}</Suspense>
      <ConfirmDialog />
      <Captions />
      <LiveRegions />
    </>
  );
}
