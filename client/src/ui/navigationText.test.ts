import { describe, expect, it } from 'vitest';
import { focusText, STATIC_FOCUS } from './focusText';
import type { Focus } from '../store';
import { usageChip } from '../ops';
import { translate } from '../../../shared/i18n';

describe('navigation framing and content boundaries', () => {
  it('localizes static prompts only for their verified interaction kinds', () => {
    for (const [kind, labels] of Object.entries(STATIC_FOCUS)) {
      for (const label of labels) {
        const focus = { id: 'test', label, action: { kind } } as Focus;
        expect(focusText(focus, 'en')).toBe(label);
        expect(focusText(focus, 'it')).not.toBe(label);
      }
    }
    expect(focusText(null, 'it')).toBe('');
    const title = "Open the manager's console";
    expect(focusText({ id: 'card', label: title, action: { kind: 'card', repoId: 'x', key: 'issue:1', number: 1, pr: false } }, 'it')).toBe(title);
    const unknown = { id: 'console', label: 'Error $& {name}', action: { kind: 'manager' } } as Focus;
    expect(focusText(unknown, 'it')).toBe(unknown.label);
  });

  it('preserves names, targets, keys and diagnostic values during interpolation', () => {
    const value = 'Settings $& {name} <script>';
    expect(translate('it', 'Watch {name}’s screen', { name: value })).toBe(`Guarda lo schermo di ${value}`);
    expect(translate('it', 'working on {title}', { title: value })).toBe(`al lavoro su ${value}`);
    expect(translate('it', 'Effects are off: {reason}.', { reason: value })).toBe(`Effetti disattivati: ${value}.`);
    expect(translate('it', '{key} is now {action}.', { key: 'F12', action: 'Test' })).toBe('F12 ora attiva Test.');
  });

  it('localizes pacing and pause framing while preserving the original English default', () => {
    const now = new Date(2026, 9, 31, 12).getTime();
    const until = new Date(2026, 10, 1, 12).getTime();
    const warning = null;
    expect(usageChip({ state: 'paused', until, warning }, 3, now)).toBe("⏸ Paused until Sun 12:00: at Claude's usage limit, nothing new starts");
    expect(usageChip({ state: 'paused', until, warning }, 3, now, 'it')).toBe('⏸ In pausa fino alle dom 12:00: limite di utilizzo di Claude, non parte nuovo lavoro');
    expect(usageChip({ state: 'pacing', until, warning }, 1, now, 'it')).toContain('meno di 1 sessione attiva');
    expect(usageChip({ state: 'normal', until: null, warning }, 3, now, 'it')).toBeNull();
  });
});
