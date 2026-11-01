import { useSyncExternalStore } from 'react';

// Shared, same-origin artwork for photo stamps and canvas textures. Static signs redraw once loaded.
const image = typeof Image === 'undefined' ? null : new Image();
const listeners = new Set<() => void>();
let ready = false;
if (image) {
  image.onload = () => { ready = true; for (const listener of listeners) listener(); };
  image.src = '/icons/icon.svg';
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useBrandReady = () => useSyncExternalStore(subscribe, () => ready, () => false);
export function drawBrandIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  if (ready && image) ctx.drawImage(image, x, y, size * 152 / 170, size);
}
