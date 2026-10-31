import { describe, expect, it } from 'vitest';
import { pongStatus } from './pongText';
import type { PongView } from '../world/toys/pongState';
import { PET_LINES, petSpeech } from './games/petText';
import { STAGES } from './games/pet';
import { italian, translate } from '../../../shared/i18n';

const view = (v: Partial<PongView> = {}): PongView => ({
  phase: 'waiting', west: 'player', east: null, ready: { west: true, east: false },
  score: { west: 11, east: 8 }, server: 'west', you: 'west', last: null, rally: 0, longest: 0, gamePoint: false, ...v,
});
const name = (end: 'west' | 'east') => end === 'west' ? 'You' : 'Ada {count}';

describe('specialized display text', () => {
  it('keeps exported filenames, dimensions and raw photo diagnostics literal', () => {
    const name = 'cubefarm-Save-$&-{width}.png';
    expect(translate('it', '📸 Saved {name}, {width}×{height}', { name, width: 1440, height: 1000 }))
      .toBe(`📸 Salvato ${name}, 1440×1000`);
    const error = 'WebGL: $& {name} E_INVALID';
    for (const key of ['The shot failed: {error}', 'The clip failed: {error}', 'Recording could not start: {error}']) {
      expect(translate('it', key, { error })).toContain(error);
      expect(translate('en', key, { error })).toBe(key.replace('{error}', () => error));
    }
    expect(translate('it', error)).toBe(error);
    expect(translate('it', '🎬 Saved {name}, {seconds} s at {width}×{height}', { name, seconds: 4, width: 390, height: 844 }))
      .toBe(`🎬 Salvato ${name}, 4 s a 390×844`);
  });
  it('translates every canned pet line without rewriting English or unknown news', () => {
    for (const line of PET_LINES) {
      expect(Object.hasOwn(italian, line)).toBe(true);
      expect(petSpeech(line, 'Pip', 'it')).toBe(translate('it', line));
      expect(petSpeech(line, 'Pip')).toBe(line);
      expect(petSpeech(line, 'Pip', 'en')).toBe(line);
    }
    for (const line of ['Yay! Ada finished testing PR #9! 🧪', 'custom text {stage}', 'Promoted to Custom! 🎉']) {
      expect(petSpeech(line, 'Pip', 'it')).toBe(line);
    }
  });

  it('preserves names and recognizes only the current-name greeting and canonical promotions', () => {
    const name = 'Pip {stage}';
    const greeting = `Hi! I'm ${name}, your new desk pet. Keep me fed, busy and rested!`;
    expect(petSpeech(greeting, name, 'it')).toBe(`Ciao! Sono ${name}, il tuo nuovo cucciolo d’ufficio. Dammi cibo, giochi e riposo!`);
    expect(petSpeech(greeting, 'another pet', 'it')).toBe(greeting);
    for (const { title } of STAGES) {
      const line = `Promoted to ${title}! 🎉`;
      expect(petSpeech(line, name, 'it')).toBe(`Promosso a ${translate('it', title)}! 🎉`);
      expect(petSpeech(line, name, 'en')).toBe(line);
    }
  });

  it('covers waiting, serves, lets, rallies and game over while preserving names', () => {
    expect(pongStatus(view(), name, 0)).toBe('Waiting for someone free to come and play…');
    expect(pongStatus(view(), name, 21, 'it')).toBe('Nessuno è libero per giocare adesso');
    expect(pongStatus(view({ east: 'ada' }), name, 0, 'it')).toBe('Ada {count} sta arrivando…');
    expect(pongStatus(view({ phase: 'serve', gamePoint: true }), name, 0, 'it')).toBe('Punto decisivo · Tocca a te: clic per alzare e colpire');
    expect(pongStatus(view({ phase: 'serve', server: 'east' }), name, 0, 'it')).toBe('Servizio a Ada {count}');
    expect(pongStatus(view({ phase: 'point' }), name, 0, 'it')).toBe('Let: ripeti il servizio');
    expect(pongStatus(view({ phase: 'rally', rally: 4 }), name, 0, 'it')).toBe('Scambi 4');
    expect(pongStatus(view({ phase: 'rally', rally: 2 }), name, 0, 'it')).toBe('');
    expect(pongStatus(view({ phase: 'over', last: { winner: 'west', why: 'game' } }), name, 0)).toBe('You win 11–8! · Click for a rematch');
    expect(pongStatus(view({ phase: 'over', you: null, last: { winner: 'east', why: 'game' } }), name, 0, 'it')).toBe('Ada {count} vince 8–11!');
  });

  it('covers every point reason in both languages, without mutating match state', () => {
    const reasons = {
      'serve-fault': ['served a fault', 'fallo al servizio'], net: ['hit the net', 'palla in rete'],
      'own-side': ["didn't clear the net", 'rete non superata'], out: ['hit it out', 'palla fuori'],
      missed: ['missed it', 'palla mancata'], 'double-bounce': ['let it bounce twice', 'doppio rimbalzo'],
    } as const;
    for (const why of Object.keys(reasons) as (keyof typeof reasons)[]) {
      const v = view({ phase: 'point', last: { winner: 'west', why }, gamePoint: true });
      const before = JSON.stringify(v);
      expect(pongStatus(v, name, 0)).toBe(`Ada {count} ${reasons[why][0]} · Game point`);
      expect(pongStatus(v, name, 0, 'it')).toBe(`Ada {count}: ${reasons[why][1]} · Punto decisivo`);
      expect(JSON.stringify(v)).toBe(before);
    }
  });
});
