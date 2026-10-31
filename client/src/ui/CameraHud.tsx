import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { enterBuilding, enterOverview, exitView, rotateView, useCameraView, visitFloor } from '../world/camera/rig';
import { watchPads } from '../world/gamepad';
import { useLookPrefs } from '../world/look';
import { requestLook } from '../world/Player';
import { keyName } from './controls';
import { Key, MoveKeys } from './Key';
import { T, useT } from '../i18n';

// The camera's HUD: the overview button (on the floor card), the overview's and the building's toolbars (turn, the
// building, back) with what a click would open, the follow cam's banner, and a reticle for the gamepad's A in a view.

/** Back to first person from a click: the click may grab the mouse again (if that setting is on). */
function back() {
  exitView();
  if (useLookPrefs.getState().grabOnClose) requestLook();
}

/** On the floor card: fly up to the overview (the HUD button for Tab). */
export function OverviewButton() {
  const t = useT();
  const onFoot = useCameraView((s) => s.mode) === 'first';
  const started = useStore((s) => s.started);
  const travel = useStore((s) => s.travel);
  if (!started || !onFoot || travel) return null;
  return (
    <button
      className="cam-btn"
      title={t('See the whole floor from above ({key}; twice for the building)', { key: keyName('overview') })}
      onClick={(e) => {
        e.currentTarget.blur();
        enterOverview();
      }}
    >
      🗺️ <Key action="overview" />
    </button>
  );
}

export function CameraHud() {
  const t = useT();
  const mode = useCameraView((s) => s.mode);
  const following = useCameraView((s) => s.following);
  const hover = useCameraView((s) => s.hover);
  const started = useStore((s) => s.started);
  const overlay = useStore((s) => s.overlay);
  const floor = useStore((s) => s.floor);
  const [pad, setPad] = useState(false);
  useEffect(() => watchPads((on) => setPad(on)), []);
  if (!started || overlay || mode === 'first') return null;

  if (mode === 'follow') {
    return (
      <div className="cam-follow" role="status">
        <T>🎥 Following</T> <b>{following}</b> · <MoveKeys joined /> <T>or</T> <kbd>Esc</kbd> <T>to take over</T>
        <button className="btn btn-small" onClick={back}>
          <T>✕ Stop</T>
        </button>
      </div>
    );
  }

  const tip =
    mode === 'overview' ? 'Drag to pan · scroll to zoom · click someone, a desk, the whiteboard or the app screen' : 'Click a floor to go there · drag up and down · scroll to zoom';
  return (
    <>
      {pad && <div className="crosshair cam-reticle" />}
      <div className="cam-bar" role="toolbar" aria-label={t(mode === 'overview' ? 'Overview' : 'The building')}>
        <span className="cam-title">{t(mode === 'overview' ? '🗺️ Overview' : '🏢 The building')}</span>
        {mode === 'overview' ? (
          <>
            <button className="btn btn-small" onClick={() => rotateView(-1)} title={t('Turn the view left')}>
              ⟲ <Key action="rotateLeft" />
            </button>
            <button className="btn btn-small" onClick={() => rotateView(1)} title={t('Turn the view right')}>
              ⟳ <Key action="rotateRight" />
            </button>
            <button className="btn btn-small" onClick={() => enterBuilding()} title={t('Every floor at once ({key} twice)', { key: keyName('overview') })}>
              <T>🏢 Building</T>
            </button>
          </>
        ) : (
          <button className="btn btn-small" onClick={() => visitFloor(floor)} title={t('Back down to the overview of this floor')}>
            <T>🗺️ This floor</T>
          </button>
        )}
        <button className="btn btn-small btn-good" onClick={back} title={t('Fly back to where you were standing')}>
          <T>✕ Back</T> <Key action="overview" />
        </button>
      </div>
      <div className="cam-tip">{hover ? t('Click: {target}', { target: hover }) : t(tip)}</div>
    </>
  );
}
