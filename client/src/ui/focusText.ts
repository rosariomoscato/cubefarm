import { translate, type Language } from '../../../shared/i18n';
import type { Focus } from '../store';

/** Verified static interaction prompts only; never translate card titles, people, lunch labels or diagnostics. */
export const STATIC_FOCUS: Partial<Record<Focus['action']['kind'], readonly string[]>> = {
  manager: ["Open the manager's console", 'Mission control: open it in the console', 'Time-lapse: replay the office’s day'],
  elevator: ['Use the elevator', 'Choose a floor', 'Floor directory — take the elevator'],
  kanban: ['Open the Kanban board'], phone: ['See every team change on your phone'],
  hire: ['Add an agent at this desk'], coffee: ['Put mug under the machine', 'Brew coffee'],
  pickup: ['Take a blaster', 'Pick up blaster', 'Take a mug', 'Pick up mug', 'Pick up ball'],
  pong: ['Play ping-pong'], poke: ['Bang the gong'],
  roof: ['Sit back in the deck chair', 'Look through the telescope'],
  catalogue: ['Browse the decoration catalogue'],
};

export function focusText(focus: Focus | null, language?: Language): string {
  if (!focus) return '';
  return STATIC_FOCUS[focus.action.kind]?.includes(focus.label) ? translate(language, focus.label) : focus.label;
}
