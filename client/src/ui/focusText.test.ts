import { describe, expect, it } from 'vitest';
import { focusText } from './focusText';
import { grabLabel, SNACK_IDS, SNACKS } from '../world/fridge';
import { translate } from '../../../shared/i18n';
import type { Focus } from '../store';

describe('fridge interaction localization', () => {
  it('translates canonical grab and sold-out prompts for every snack, with English unchanged', () => {
    for (const snack of SNACK_IDS) {
      for (const left of [0, 1, 4]) {
        const focus: Focus = { id: `fridge:${snack}`, label: grabLabel(snack, left), action: { kind: 'fridge', op: 'take', snack } };
        const before = JSON.stringify(focus);
        expect(focusText(focus, 'it')).toBe(`${left ? 'Prendi' : 'Esaurito'}: ${translate('it', SNACKS[snack].short)}`);
        expect(focusText(focus)).toBe(focus.label);
        expect(focusText(focus, 'en')).toBe(focus.label);
        expect(JSON.stringify(focus)).toBe(before);
      }
    }
  });

  it('translates door controls only for the matching action', () => {
    for (const [label, expected] of [['Open the fridge', 'Apri il frigorifero'], ['Close the fridge', 'Chiudi il frigorifero']]) {
      const focus: Focus = { id: 'fridge:door', label, action: { kind: 'fridge', op: 'door' } };
      expect(focusText(focus, 'it')).toBe(expected);
      expect(focusText({ ...focus, action: { kind: 'fridge', op: 'lunch' } }, 'it')).toBe(label);
    }
  });

  it('never rewrites lunch labels, unknown formats or mismatched snack labels', () => {
    for (const label of ['“Settings {snack}’s lunch, DO NOT EAT”', 'Grab the cold brew', 'Open the fridge', 'custom $& {snack}']) {
      expect(focusText({ id: 'fridge:lunch', label, action: { kind: 'fridge', op: 'lunch' } }, 'it')).toBe(label);
    }
    const label = grabLabel('coldbrew', 1);
    expect(focusText({ id: 'fridge:pizza', label, action: { kind: 'fridge', op: 'take', snack: 'pizza' } }, 'it')).toBe(label);
    expect(focusText({ id: 'fridge:missing', label, action: { kind: 'fridge', op: 'take' } }, 'it')).toBe(label);
    expect(focusText(null, 'it')).toBe('');
  });

  it('preserves historical lunch content and rebound keys in generated notices', () => {
    const label = 'Ada {snack}’s lunch, DO NOT EAT';
    expect(translate('it', '🥡 “{label}”. Best leave it.', { label })).toBe(`🥡 “${label}”. Meglio lasciarlo stare.`);
    expect(translate('it', '{emoji} One at a time: finish that one first ({key})', { emoji: '🍕', key: 'Z' })).toBe('🍕 Uno alla volta: finisci prima quello che hai (Z)');
  });
});
