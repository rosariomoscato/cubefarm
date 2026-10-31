import { translate, type Language } from '../../../shared/i18n';
import type { PongView } from '../world/toys/pongState';
import type { PointWhy } from '../world/toys/pongRules';

const LOST: Record<PointWhy, string> = {
  'serve-fault': 'served a fault', net: 'hit the net', 'own-side': "didn't clear the net",
  out: 'hit it out', missed: 'missed it', 'double-bounce': 'let it bounce twice',
};

/** Pure display framing; names and match state remain untouched. English is the default. */
export function pongStatus(v: PongView, name: (end: 'west' | 'east') => string, waited: number, language?: Language): string {
  const t = (key: string, values?: Record<string, string | number>) => translate(language, key, values);
  const you = v.you;
  const other = you === 'west' ? 'east' : 'west';
  if (v.phase === 'waiting') {
    if (you && v[other]) return t('{name} is on the way…', { name: name(other) });
    return t(waited > 20 ? "Nobody's free to play right now" : 'Waiting for someone free to come and play…');
  }
  if (v.phase === 'over' && v.last) {
    const w = v.last.winner;
    const score = `${v.score[w]}–${v.score[w === 'west' ? 'east' : 'west']}`;
    return t(w === you ? 'You win {score}!' : '{name} wins {score}!', { name: name(w), score }) + (you ? t(' · Click for a rematch') : '');
  }
  if (v.phase === 'point') {
    if (!v.last) return t('Let: serve again');
    if (v.last.why === 'game') return '';
    const loser = v.last.winner === 'west' ? 'east' : 'west';
    return t('{name} {reason}', { name: loser === you ? t('You') : name(loser), reason: t(LOST[v.last.why]) }) + (v.gamePoint ? t(' · Game point') : '');
  }
  if (v.phase === 'serve') {
    const lead = v.gamePoint ? t('Game point · ') : '';
    return lead + (v.server === you ? t('Your serve: click to toss and hit') : t('{name} to serve', { name: name(v.server) }));
  }
  return v.rally >= 3 ? t('Rally {count}', { count: v.rally }) : '';
}
