import { translate, type Language } from '../../../../shared/i18n';
import { MOOD_LINES, STAGES } from './pet';

export const PET_LINES = [
  ...Object.values(MOOD_LINES), 'Five more minutes… 😒', 'Good morning! ☀️', "I'm not sleepy!", 'Nap time… 💤', 'Zzz… (shh, still asleep) 💤',
  "I'm stuffed! No more donuts.", 'Nom nom nom! 🍩', 'Sprinkles! My favourite.', 'Donut-driven development!', 'Too… much… coffee! 😵‍💫',
  '☕ Ready to ship!', 'Caffeine: loaded.', 'Brb, refactoring everything.', 'Too tired to play… 🥱', 'Wheee! 🎾', 'Again! Again!', 'Best. Break. Ever.',
  'Hehe ❤️', '*happy wiggle*', "You're the best manager!",
] as const;

/** Display known pet-generated text only. Never rewrite the saved message, pet name or historical office news. */
export function petSpeech(text: string, name: string, language?: Language): string {
  if (language !== 'it') return text;
  if (PET_LINES.some((line) => line === text)) return translate(language, text);
  if (text === `Hi! I'm ${name}, your new desk pet. Keep me fed, busy and rested!`) return translate(language, 'Hi! I’m {name}, your new desk pet. Keep me fed, busy and rested!', { name });
  for (const { title } of STAGES) {
    if (text === `Promoted to ${title}! 🎉`) return translate(language, 'Promoted to {stage}! 🎉', { stage: translate(language, title) });
  }
  return text;
}
