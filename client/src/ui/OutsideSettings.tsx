// The Settings tab's Outside section: where the weather comes from (the calm cycle, off, or the manager's own local
// weather, which the office's server reads from Open-Meteo) and how often something happens outside (world events),
// both saved on the server for every viewer.
import { useId } from 'react';
import { T, useT } from '../i18n';
import { api } from '../api';
import { useStore } from '../store';
import type { EventFrequency, WeatherKind, WeatherMode, WeatherSettings, WorldEventSettings } from '../../../shared/outside';

const MODES: [WeatherMode, string, string][] = [
  ['cycle', 'Calm cycle', 'a gentle, mostly fair day of its own, different every date'],
  ['off', 'Off', 'always clear'],
  ['real', 'My real weather', "your city's current weather"],
];

const FREQUENCIES: [EventFrequency, string][] = [
  ['off', 'Off'],
  ['rare', 'Rare (every half hour or so)'],
  ['normal', 'Normal (every 6–20 minutes)'],
  ['chaos', 'Chaos (every minute or two)'],
];

export const WEATHER_LABELS: Record<WeatherKind, string> = {
  clear: '☀️ clear',
  cloudy: '☁️ cloudy',
  'light-rain': '🌦️ light rain',
  'heavy-rain': '🌧️ heavy rain',
  storm: '⛈️ thunderstorm',
  fog: '🌫️ fog',
  snow: '🌨️ snow',
};

function ago(at: number, t: ReturnType<typeof useT>) {
  const min = Math.round((Date.now() - at) / 60_000);
  return min < 1 ? t('just now') : min < 60 ? t('{count} min ago', { count: min }) : t('{count} h ago', { count: Math.round(min / 60) });
}

export function OutsideSettings() {
  const t = useT();
  const weather = useStore((s) => s.settings.weather);
  const events = useStore((s) => s.settings.worldEvents);
  const view = useStore((s) => s.weather);
  const radioName = useId();
  const saveWeather = (patch: Partial<WeatherSettings>) => void api.updateSettings({ weather: { ...weather, ...patch } }).catch(() => undefined);
  const saveEvents = (patch: Partial<WorldEventSettings>) => void api.updateSettings({ worldEvents: { ...events, ...patch } }).catch(() => undefined);
  const real = weather.mode === 'real';
  return (
    <div className="card">
      <h3><T>🌦️ Weather</T></h3>
      <div role="radiogroup" aria-label={t('Where the weather comes from')}>
        {MODES.map(([m, label, note]) => (
          <label key={m} className="toggle block">
            <input type="radio" name={radioName} checked={weather.mode === m} onChange={() => saveWeather({ mode: m })} />
            <span>
              <b>{t(label)}</b> ({t(note)})
            </span>
          </label>
        ))}
      </div>
      {real && (
        <>
          <label className="field">
            <span><T>Your city</T></span>
            <input
              key={weather.city}
              defaultValue={weather.city}
              placeholder={t('Cape Town, South Africa (or -33.92, 18.42)')}
              maxLength={80}
              onBlur={(e) => e.target.value.trim() !== weather.city && saveWeather({ city: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
          </label>
          <p className="small" aria-live="polite">
            {view.place && <b>{view.place.name}</b>}
            {view.place && view.reading && t(': {weather}, read {ago}', { weather: t(WEATHER_LABELS[view.reading.kind]), ago: ago(view.reading.at, t) })}
            {view.place && !view.reading && !view.error && t(': looking it up…')}
            {view.error && <span className="muted"> {view.error}</span>}
          </p>
          <p className="muted small">
            <T>The office’s server looks the city up once with Open-Meteo’s free geocoder, then sends only its coordinates (to about a kilometre) every 15 minutes. While it’s offline the office shows the calm cycle.</T>
          </p>
        </>
      )}
      <h3><T>🛸 World events</T></h3>
      <p className="muted small"><T>Now and then something happens outside: a plane, a blimp with the office’s news, fireworks at night, a UFO… and very rarely a friendly kaiju. Idle agents run to the windows to watch.</T></p>
      <label className="field">
        <span><T>How often</T></span>
        <select value={events.frequency} onChange={(e) => saveEvents({ frequency: e.target.value as EventFrequency })}>
          {FREQUENCIES.map(([f, label]) => (
            <option key={f} value={f}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      <label className="toggle block">
        <input type="checkbox" checked={events.calm} onChange={(e) => saveEvents({ calm: e.target.checked })} />
        <span>
          <b><T>Keep it calm</T></b><T>: no kaiju, giant rubber duck, whale airship or hurricane</T>
        </span>
      </label>
    </div>
  );
}
