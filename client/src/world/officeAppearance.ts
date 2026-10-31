// Visual-only finishes. Floor colours/agent colours remain data owned by the office.
export const OFFICE = {
  ivory: '#faf8f5',
  graphite: '#202b38',
  metal: '#596d7b',
  cyan: '#54dfff',
  amber: '#ffbb66',
  orange: '#e99743',
  floor: '#cdd5d8',
  rug: '#718797',
  petrol: '#17485c',
  ceiling: '#dce3e5',
};

/** Muted project pigment for 3D finishes only; never changes the saved project colour. */
export function projectAccent(color: string): string {
  const rgb = Number.parseInt(color.slice(1), 16);
  const neutral = [146, 153, 154];
  return '#' + neutral.map((n, i) => Math.round(((rgb >> (16 - i * 8)) & 255) * 0.55 + n * 0.45).toString(16).padStart(2, '0')).join('');
}
