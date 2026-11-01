import { translate, type Language } from '../../../shared/i18n';
import type { Focus } from '../store';
import { grabLabel, isSnackId, SNACKS } from '../world/fridge';

/** Verified interaction prompts only; never translate card titles, people, lunch labels or diagnostics. */
export const STATIC_FOCUS: Partial<Record<Focus['action']['kind'], readonly string[]>> = {
  manager: ["Open the manager's console", 'Mission control: open it in the console', 'Time-lapse: replay the office’s day', 'AI usage: open it in the console'],
  resume: ['AI usage: select the quota to resume'],
  elevator: ['Use the elevator', 'Choose a floor', 'Floor directory — take the elevator'],
  kanban: ['Open the Kanban board'], phone: ['See every team change on your phone'],
  hire: ['Add an agent at this desk'], coffee: ['Put mug under the machine', 'Brew coffee', 'Take coffee', 'Take mug'],
  pickup: ['Take a blaster', 'Pick up blaster', 'Take a mug', 'Pick up mug', 'Pick up ball'],
  pong: ['Play ping-pong'], poke: ['Bang the gong'],
  roof: ['Sit back in the deck chair', 'Look through the telescope'],
  catalogue: ['Browse the decoration catalogue'],
  fridge: ['Open the fridge', 'Close the fridge'],
};

export function focusText(focus: Focus | null, language?: Language): string {
  if (!focus) return '';
  const action = focus.action;
  if (action.kind === 'fridge' && action.op === 'take' && isSnackId(action.snack)) {
    const snack = translate(language, SNACKS[action.snack].short);
    if (focus.label === grabLabel(action.snack, 1)) return translate(language, 'Grab the {snack}', { snack });
    if (focus.label === grabLabel(action.snack, 0)) return translate(language, 'Out of {snack}', { snack });
  }
  if (action.kind === 'fridge' && action.op !== 'door') return focus.label;
  return STATIC_FOCUS[focus.action.kind]?.includes(focus.label) ? translate(language, focus.label) : focus.label;
}
