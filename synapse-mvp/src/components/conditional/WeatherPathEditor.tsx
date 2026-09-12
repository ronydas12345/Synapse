import { useEffect } from 'react';
import { AppLink } from '../../app/AppLink';
import {
  WEATHER_STATES,
  WEATHER_STATE_LABELS,
  type WeatherState,
} from '../../conditional/types';
import { refreshWeather } from '../../weather/client';
import { useWeatherSnapshot } from '../../weather/useWeatherSnapshot';

export function WeatherStatusBanner() {
  const snap = useWeatherSnapshot();

  useEffect(() => {
    void refreshWeather();
  }, []);

  const label =
    snap.status === 'loading'
      ? 'Looking up local weather…'
      : snap.status === 'ready'
        ? `${WEATHER_STATE_LABELS[snap.state]}${snap.placeLabel ? ` · ${snap.placeLabel}` : ''}`
        : snap.error || 'Weather unavailable. Using Other / Unknown.';

  return (
    <div className="border-t border-[var(--border)] pt-3">
      <p className="text-xs text-[var(--text-muted)] m-0">{label}</p>
      {snap.status !== 'ready' && snap.status !== 'loading' ? (
        <p className="text-xs text-[var(--text-faint)] mt-1 mb-0">
          Set a place on your <AppLink to="profile">Profile</AppLink>, or allow
          location access. Unknown weather uses any path that includes Other /
          Unknown.
        </p>
      ) : null}
    </div>
  );
}

export default function WeatherPathEditor({
  pathWeather,
  onChange,
}: {
  pathWeather: WeatherState[][];
  onChange: (next: WeatherState[][]) => void;
}) {
  const toggle = (pathIdx: number, state: WeatherState) => {
    const next = pathWeather.map((row) => [...row]);
    const row = next[pathIdx] || [];
    next[pathIdx] = row.includes(state) ? row.filter((s) => s !== state) : [...row, state];
    onChange(next);
  };

  const hasOther = pathWeather.some((row) => row.includes('other'));

  return (
    <>
      <WeatherStatusBanner />
      {!hasOther ? (
        <p className="text-xs text-[var(--warning)] m-0 pt-2">
          No path includes Other / Unknown. Unavailable or unmatched weather will
          fall through to the last path.
        </p>
      ) : null}
      {pathWeather.map((states, pathIdx) => (
        <div key={`weather-${pathIdx}`} className="border-t border-[var(--border)] pt-3">
          <label className="text-[var(--text)] block mb-2 font-semibold text-sm">
            Path {String.fromCharCode(65 + pathIdx)} weather
          </label>
          <p className="text-xs text-[var(--text-muted)] mb-2 m-0">
            This branch plays when current weather matches any checked state.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {WEATHER_STATES.map((state) => {
              const on = states.includes(state);
              return (
                <button
                  key={state}
                  type="button"
                  onClick={() => toggle(pathIdx, state)}
                  className={`px-2 py-1 rounded text-xs ${
                    on
                      ? 'bg-[var(--accent)] text-[var(--bg-void)]'
                      : 'bg-[var(--bg-deep)] text-[var(--text)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {WEATHER_STATE_LABELS[state]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
