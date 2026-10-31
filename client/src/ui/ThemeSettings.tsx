// The Settings tab's Themes section: holiday themes by date (auto), never (off), or one forced on; holidays the office
// doesn't celebrate switched off one by one; and the manager's birthday (day and month, kept on the server).
import { useId } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import { DEFAULT_THEME_SETTINGS, THEME_IDS, THEME_INFO, type ThemeMode, type ThemeSettings as Themes } from '../../../shared/themes';
import { useTheme } from '../world/themes/active';
import { T, useT } from '../i18n';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function ThemeSettings() {
  const t = useT();
  const themes = useStore((s) => s.settings.themes) ?? DEFAULT_THEME_SETTINGS;
  const now = useTheme();
  const radio = useId();
  const save = (patch: Partial<Themes>) => void api.updateSettings({ themes: { ...themes, ...patch } }).catch(() => undefined);
  const forced = themes.mode !== 'auto' && themes.mode !== 'off';
  const b = themes.birthday;
  const setBirthday = (month: number, day: number) => save({ birthday: month ? { month, day: Math.min(day || 1, DAYS[month - 1]) } : null });
  const source = now.source === 'auto' ? 'by date' : now.source === 'forced' ? 'forced' : now.source === 'url' ? 'from the address bar' : '';
  return (
    <div className="card">
      <h3><T>🎉 Themes</T></h3>
      <p className="muted small">
        <T>The office dresses up for the holidays: decorations, costumes, music and a few surprises.</T>{' '}
        {now.id ? (
          <>
            <T>Now:</T> <b>{THEME_INFO[now.id].emoji} {t(THEME_INFO[now.id].name)}</b> ({t(source)}).
          </>
        ) : (
          t('No theme today.')
        )}
      </p>
      <div role="radiogroup" aria-label={t('Holiday themes')}>
        {(
          [
            ['auto', 'By date', 'each holiday on its own days'],
            ['off', 'Off', 'no themes at all'],
          ] as [ThemeMode, string, string][]
        ).map(([m, label, note]) => (
          <label key={m} className="toggle block">
            <input type="radio" name={radio} checked={themes.mode === m} onChange={() => save({ mode: m })} />
            <span>
              <b>{t(label)}</b> ({t(note)})
            </span>
          </label>
        ))}
        <label className="toggle block">
          <input type="radio" name={radio} checked={forced} onChange={() => save({ mode: forced ? themes.mode : 'halloween' })} />
          <span>
            <b><T>Always</T></b>{' '}
            <select value={forced ? themes.mode : 'halloween'} onChange={(e) => save({ mode: e.target.value as ThemeMode })} aria-label={t('Theme to show')}>
              {THEME_IDS.map((id) => (
                <option key={id} value={id}>
                  {THEME_INFO[id].emoji} {t(THEME_INFO[id].name)}
                </option>
              ))}
            </select>
          </span>
        </label>
      </div>
      <div className="field"><T>Celebrate (by date)</T></div>
      {THEME_IDS.map((id) => (
        <label key={id} className="toggle block">
          <input type="checkbox" checked={!themes.disabled.includes(id)} onChange={(e) => save({ disabled: e.target.checked ? themes.disabled.filter((x) => x !== id) : [...themes.disabled, id] })} />
          <span>
            {THEME_INFO[id].emoji} {t(THEME_INFO[id].name)} <span className="muted small">({t(THEME_INFO[id].when)})</span>
          </span>
        </label>
      ))}
      <div className="field"><T>Your birthday (the team throws a party; it beats any other theme that day)</T></div>
      <div className="row">
        <select value={b?.month ?? 0} onChange={(e) => setBirthday(Number(e.target.value), b?.day ?? 1)} aria-label={t('Birthday month')}>
          <option value={0}>{t('Month…')}</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {t(m)}
            </option>
          ))}
        </select>
        <select value={b?.day ?? 0} disabled={!b} onChange={(e) => b && setBirthday(b.month, Number(e.target.value))} aria-label={t('Birthday day')}>
          {!b && <option value={0}>{t('Day…')}</option>}
          {Array.from({ length: b ? DAYS[b.month - 1] : 31 }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        {b && (
          <button className="btn btn-small" onClick={() => save({ birthday: null })}>
            <T>Clear</T>
          </button>
        )}
      </div>
      <p className="muted small">
        <T>Preview any theme with</T> <code>?theme=christmas</code> <T>in the address bar (or</T> <code>?date=2026-12-24</code> <T>to pretend it’s another day).</T>
      </p>
    </div>
  );
}
