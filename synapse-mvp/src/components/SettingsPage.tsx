import { useMemo, useState } from 'react';
import { AppLink } from '../app/AppLink';
import ThemeSettings from './ThemeSettings';
import { PlaylistNameField } from './PlaylistSwitcher';
import { usePathStore } from '../store';
import { allThemes, filterThemes, useThemeStore } from '../theme/themeStore';

const SECTIONS = [
  { id: 'themes', label: 'Themes', keywords: 'theme appearance color font preset dark light' },
  { id: 'playlists', label: 'Playlists', keywords: 'rename library path name' },
  { id: 'general', label: 'General', keywords: 'language startup' },
  { id: 'canvas', label: 'Canvas / Workspace', keywords: 'grid zoom minimap' },
  { id: 'playback', label: 'Playback', keywords: 'queue skip volume' },
  { id: 'visualizer', label: 'Visualizer', keywords: 'fft spectrum' },
  { id: 'import', label: 'Import / Export', keywords: 'json package' },
  { id: 'workshop', label: 'Workshop', keywords: 'share publish' },
  { id: 'account', label: 'Account', keywords: 'profile login' },
  { id: 'pro', label: 'Pro', keywords: 'billing premium' },
] as const;

export default function SettingsPage() {
  const [query, setQuery] = useState('');
  const customThemes = useThemeStore((s) => s.customThemes);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const switchPlaylist = usePathStore((s) => s.switchPlaylist);
  const q = query.trim().toLowerCase();
  const themeQueryHits = filterThemes(allThemes(customThemes), q);
  const sections = useMemo(
    () =>
      SECTIONS.filter(
        (s) =>
          !q ||
          s.label.toLowerCase().includes(q) ||
          s.keywords.includes(q) ||
          (s.id === 'themes' && themeQueryHits.length > 0) ||
          (s.id === 'playlists' &&
            pathSummaries.some((p) => p.name.toLowerCase().includes(q)))
      ),
    [q, themeQueryHits.length, pathSummaries]
  );

  return (
    <div className="synapse-settings">
      <div className="synapse-settings-head">
        <div>
          <p className="synapse-section-label">Synapse</p>
          <h1 className="synapse-settings-title">Settings</h1>
        </div>
        <input
          className="synapse-settings-input synapse-settings-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search settings"
          aria-label="Search settings"
        />
      </div>
      <div className="synapse-settings-layout">
        <nav className="synapse-settings-nav" aria-label="Settings sections">
          {sections.map((s) => (
            <a key={s.id} href={`#settings-${s.id}`} className="synapse-settings-nav-item">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="synapse-settings-main">
          {sections.some((s) => s.id === 'themes') ? (
            <section id="settings-themes" className="synapse-settings-section">
              <h2>Themes</h2>
              <p className="synapse-settings-lead">
                Presets and custom themes control colors, fonts, and chrome. They
                never run code. Import only Synapse theme JSON.
              </p>
              <ThemeSettings hintQuery={themeQueryHits.length > 0 ? q : ''} />
            </section>
          ) : null}
          {sections.some((s) => s.id === 'playlists') ? (
            <section id="settings-playlists" className="synapse-settings-section">
              <h2>Playlists</h2>
              <p className="synapse-settings-lead">
                Rename playlists stored on this device. The current playlist
                can also be renamed from the name field in the top bar.
              </p>
              <ul className="synapse-settings-playlist-list">
                {pathSummaries.map((path) => {
                  const current = path.id === activePathId;
                  return (
                    <li key={path.id} className="synapse-settings-playlist-row">
                      <PlaylistNameField
                        id={path.id}
                        name={path.name}
                        className="synapse-settings-input"
                      />
                      {current ? (
                        <span className="synapse-settings-hint">Current</span>
                      ) : (
                        <button
                          type="button"
                          className="synapse-btn synapse-btn-ghost"
                          onClick={() => switchPlaylist(path.id)}
                        >
                          Switch
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {sections
            .filter((s) => s.id !== 'themes' && s.id !== 'playlists')
            .map((s) => (
              <section key={s.id} id={`settings-${s.id}`} className="synapse-settings-section is-stub">
                <h2>{s.label}</h2>
                {s.id === 'account' ? (
                  <p className="synapse-settings-lead">
                    Username, picture, and optional music sections live on your{' '}
                    <AppLink to="profile">profile</AppLink>. Sign-in and cloud
                    sync are not wired yet.
                  </p>
                ) : (
                  <p className="synapse-settings-lead">
                    This section is reserved for a later phase of the extensive
                    settings handoff.
                  </p>
                )}
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}
