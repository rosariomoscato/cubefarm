import { languageTag } from './i18n.ts';

/** Prefer a voice in the office language; retain an explicit selection as the last fallback. */
export function speechVoice<T extends { name: string; lang: string; default?: boolean }>(voices: readonly T[], name: string, language: unknown): T | undefined {
  const prefix = languageTag(language).slice(0, 2);
  const matches = (v: T) => v.lang.toLowerCase().split(/[-_]/)[0] === prefix;
  return voices.find((v) => v.name === name && matches(v)) ?? voices.find((v) => matches(v) && v.default) ?? voices.find(matches) ?? voices.find((v) => v.name === name);
}
