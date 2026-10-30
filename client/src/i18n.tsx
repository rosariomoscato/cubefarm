import { useCallback, useEffect } from 'react';
import { languageOf, languageTag, translate } from '../../shared/i18n';
import { useStore } from './store';
import { api } from './api';

export function useT() {
  const language = useStore((s) => languageOf(s.settings.language));
  return useCallback((text: string, values?: Record<string, string | number>) => translate(language, text, values), [language]);
}

/** Explicit UI text only: never walks the DOM or translates user names, prompts, code or model IDs. */
export function T({ children }: { children: string }) {
  const t = useT();
  return <>{t(children)}</>;
}

export function LanguageSync() {
  const language = useStore((s) => languageOf(s.settings.language));
  useEffect(() => { document.documentElement.lang = languageTag(language); }, [language]);
  return null;
}

export function LanguageSelect() {
  const t = useT();
  const language = useStore((s) => languageOf(s.settings.language));
  return <label className="field">
    <span>{t('Office language')}</span>
    <select aria-label={t('Office language')} value={language} onChange={(e) => void api.updateSettings({ language: languageOf(e.target.value) }).catch(() => undefined)}>
      <option value="en" lang="en">English</option><option value="it" lang="it">Italiano</option>
    </select>
    <span className="muted small">{t('Language applies to this office, the CEO’s replies and speech. Code, issues and pull requests remain in English.')}</span>
  </label>;
}
