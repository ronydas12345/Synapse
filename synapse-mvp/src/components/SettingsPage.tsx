import { useMemo, useRef, useState } from 'react';
import { AppLink } from '../app/AppLink';
import ThemeSettings, { ThemeEdgeTypeSelect, ThemeVisualizerBarSelect } from './ThemeSettings';
import PlaylistTransfer, { downloadTextFile } from './PlaylistTransfer';
import { PlaylistNameField } from './PlaylistSwitcher';
import { SettingsRange, SettingsSelect, SettingsToggle } from './settings/Fields';
import { usePathStore } from '../store';
import { allThemes, filterThemes, useThemeStore } from '../theme/themeStore';
import { useTutorialStore } from '../tutorial/tutorialStore';
import AuthPanel from '../auth/AuthPanel';
import { useAuthStore } from '../auth/authStore';
import { signOut } from '../auth/client';
import { deleteOwnAccount, exportMyAccount } from '../admin/privacy';
import { useProfileStore } from '../profile/profileStore';
import { useAppSettings } from '../settings/settingsStore';
import SupportForm from '../admin/SupportForm';
import { GRID_SIZE_OPTIONS } from '../settings/types';
import {
  clearMetadataCache,
  listedLocalKeys,
  wipeSynapseLocalData,
} from '../settings/localData';
import { creditsCacheSize } from '../metadata/cache';
import {
  clearWeatherCache,
  clearGeoDenied,
  refreshWeather,
} from '../weather/client';
import { useWeatherSnapshot } from '../weather/useWeatherSnapshot';

const SECTIONS = [
  { id: 'themes', label: 'Themes', keywords: 'theme appearance color font preset dark light arrow bezier edge rectangular triangular visualizer bar' },
  { id: 'appearance', label: 'Appearance', keywords: 'motion reduce animation theme light dark' },
  { id: 'playlists', label: 'Playlists', keywords: 'rename library path name export visibility public private' },
  { id: 'general', label: 'General', keywords: 'language english startup edit listen confirm delete' },
  { id: 'canvas', label: 'Canvas / Workspace', keywords: 'grid zoom minimap snap fit view' },
  { id: 'connections', label: 'Connections / Arrows', keywords: 'arrow edge bezier rectangular straight triangular' },
  { id: 'nodes', label: 'Nodes', keywords: 'track volume play count default' },
  { id: 'playback', label: 'Playback', keywords: 'queue skip master volume youtube' },
  { id: 'visualizer', label: 'Visualizer', keywords: 'fft spectrum bars capture share theme' },
  { id: 'environment', label: 'Environment', keywords: 'weather geolocation location open-meteo' },
  { id: 'import', label: 'Import / Export', keywords: 'json package synapse playlist file import export settings' },
  { id: 'tutorial', label: 'Tutorial', keywords: 'help walkthrough tour guide' },
  { id: 'workshop', label: 'Workshop', keywords: 'share publish' },
  { id: 'account', label: 'Account', keywords: 'profile login visibility username google oauth signin account email' },
  { id: 'privacy', label: 'Privacy / Data', keywords: 'localstorage cache clear erase metadata weather' },
  { id: 'pro', label: 'Pro', keywords: 'billing premium' },
  { id: 'support', label: 'Support', keywords: 'faq changelog privacy terms help ticket' },
] as const;

export default function SettingsPage() {
  const [query, setQuery] = useState('');
  const customThemes = useThemeStore((s) => s.customThemes);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const switchPlaylist = usePathStore((s) => s.switchPlaylist);
  const exportPlaylistFile = usePathStore((s) => s.exportPlaylistFile);
  const setPlaylistVisibility = usePathStore((s) => s.setPlaylistVisibility);
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
  const show = (id: (typeof SECTIONS)[number]['id']) =>
    sections.some((s) => s.id === id);

  return (
    <div className="synapse-settings" id="workspace-main">
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
        <nav className="synapse-settings-nav" aria-label="Settings sections" data-tutorial="settings-nav">
          {sections.map((s) => (
            <a key={s.id} href={`#settings-${s.id}`} className="synapse-settings-nav-item">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="synapse-settings-main">
          {show('themes') ? (
            <section id="settings-themes" className="synapse-settings-section" data-tutorial="settings-themes">
              <h2>Themes</h2>
              <p className="synapse-settings-lead">
                Presets and custom themes control colors, fonts, arrow type, and chrome. They
                never run code. Import only Synapse theme JSON.
              </p>
              <ThemeSettings hintQuery={themeQueryHits.length > 0 ? q : ''} />
            </section>
          ) : null}
          {show('appearance') ? <AppearanceSection /> : null}
          {show('playlists') ? (
            <section id="settings-playlists" className="synapse-settings-section" data-tutorial="settings-playlists">
              <h2>Playlists</h2>
              <p className="synapse-settings-lead">
                Rename playlists stored on this device. Public/private is a local
                label until Workshop publishing exists — nothing is uploaded.
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
                      <select
                        className="synapse-settings-input synapse-settings-playlist-vis"
                        value={path.visibility}
                        aria-label={`${path.name} visibility`}
                        onChange={(e) =>
                          setPlaylistVisibility(
                            path.id,
                            e.target.value === 'public' ? 'public' : 'private'
                          )
                        }
                      >
                        <option value="private">Private</option>
                        <option value="public">Public (local)</option>
                      </select>
                      <div className="synapse-settings-playlist-actions">
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
                        <button
                          type="button"
                          className="synapse-btn synapse-btn-ghost"
                          onClick={() => {
                            const file = exportPlaylistFile(path.id, 'playlist');
                            if (file) downloadTextFile(file.filename, file.json);
                          }}
                        >
                          Export
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {show('general') ? <GeneralSection /> : null}
          {show('canvas') ? <CanvasSection /> : null}
          {show('connections') ? (
            <section id="settings-connections" className="synapse-settings-section" data-tutorial="settings-connections">
              <h2>Connections / Arrows</h2>
              <p className="synapse-settings-lead">
                Playback edges follow the saved theme. Comment links stay dashed
                and are not controlled here.
              </p>
              <ThemeEdgeTypeSelect />
            </section>
          ) : null}
          {show('nodes') ? <NodesSection /> : null}
          {show('playback') ? <PlaybackSection /> : null}
          {show('visualizer') ? <VisualizerSection /> : null}
          {show('environment') ? <EnvironmentSection /> : null}
          {show('import') ? (
            <section id="settings-import" className="synapse-settings-section" data-tutorial="settings-import">
              <h2>Import / Export</h2>
              <PlaylistTransfer />
              <SettingsTransfer />
            </section>
          ) : null}
          {show('tutorial') ? (
            <section id="settings-tutorial" className="synapse-settings-section" data-tutorial="settings-tutorial">
              <h2>Tutorial</h2>
              <p className="synapse-settings-lead">
                The ? button in the header opens Help. First visit offers a short
                tour. The full walkthrough is always under Help. Progress is stored
                on this device. Esc leaves a tour without deleting progress.
              </p>
              <div className="synapse-theme-actions">
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  onClick={() => useTutorialStore.getState().openMenu()}
                >
                  Open tutorial menu
                </button>
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  onClick={() => useTutorialStore.getState().startSimple()}
                >
                  Start quick tour
                </button>
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  onClick={() => useTutorialStore.getState().startFull()}
                >
                  Start full tutorial
                </button>
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  onClick={() => useTutorialStore.getState().showWelcomeAgain()}
                >
                  Show welcome again
                </button>
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  onClick={() => useTutorialStore.getState().resetProgress()}
                >
                  Reset tutorial progress
                </button>
              </div>
            </section>
          ) : null}
          {show('workshop') ? (
            <section id="settings-workshop" className="synapse-settings-section" data-tutorial="settings-workshop">
              <h2>Workshop</h2>
              <p className="synapse-settings-lead">
                Publishing, sharing IDs, and remote playlists need a backend that
                is not in this release. The Workshop page is a preview of that
                direction, not a live catalog.
              </p>
              <AppLink to="workshop" className="synapse-btn synapse-btn-ghost">
                Open Workshop preview
              </AppLink>
            </section>
          ) : null}
          {show('account') ? <AccountSection /> : null}
          {show('privacy') ? <PrivacySection /> : null}
          {show('pro') ? (
            <section id="settings-pro" className="synapse-settings-section" data-tutorial="settings-pro">
              <h2>Pro</h2>
              <p className="synapse-settings-lead">
                Pro is not for sale and there is no billing, entitlement, or
                cloud sync in this release. Plan copy lives on the pricing page.
              </p>
              <AppLink to="pricing" className="synapse-btn synapse-btn-ghost">
                View pricing
              </AppLink>
            </section>
          ) : null}
          {show('support') ? (
            <section id="settings-support" className="synapse-settings-section" data-tutorial="settings-support">
              <h2>Support</h2>
              <p className="synapse-settings-lead">
                File a ticket for staff. FAQ and legal pages stay public.
              </p>
              <SupportForm />
              <div className="synapse-theme-actions">
                <AppLink to="faq" className="synapse-btn synapse-btn-ghost">
                  FAQ
                </AppLink>
                <AppLink to="changelog" className="synapse-btn synapse-btn-ghost">
                  Changelog
                </AppLink>
                <AppLink to="privacy" className="synapse-btn synapse-btn-ghost">
                  Privacy
                </AppLink>
                <AppLink to="terms" className="synapse-btn synapse-btn-ghost">
                  Terms
                </AppLink>
                <AppLink to="cookies" className="synapse-btn synapse-btn-ghost">
                  Cookies
                </AppLink>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AppearanceSection() {
  const motion = useAppSettings((s) => s.general.motion);
  const updateGeneral = useAppSettings((s) => s.updateGeneral);
  return (
    <section id="settings-appearance" className="synapse-settings-section" data-tutorial="settings-appearance">
      <h2>Appearance</h2>
      <p className="synapse-settings-lead">
        Colors, fonts, and chrome come from Themes. There is no separate OS
        light/dark toggle.
      </p>
      <SettingsSelect
        label="Motion"
        value={motion}
        onChange={(value) =>
          updateGeneral({
            motion: value === 'reduce' || value === 'full' ? value : 'system',
          })
        }
      >
        <option value="system">Match the operating system</option>
        <option value="reduce">Reduce motion</option>
        <option value="full">Allow motion</option>
      </SettingsSelect>
      <p className="synapse-settings-hint">
        Reduce motion skips Style interpolation and shortens UI transitions.
        Allow motion overrides the OS reduced-motion setting in this app.
      </p>
      <p className="synapse-settings-hint">
        Change colors and arrow type in{' '}
        <a href="#settings-themes">Themes</a>.
      </p>
    </section>
  );
}

function GeneralSection() {
  const general = useAppSettings((s) => s.general);
  const updateGeneral = useAppSettings((s) => s.updateGeneral);
  return (
    <section id="settings-general" className="synapse-settings-section" data-tutorial="settings-general">
      <h2>General</h2>
      <SettingsSelect label="Language" value="en" onChange={() => {}} disabled>
        <option value="en">English</option>
      </SettingsSelect>
      <p className="synapse-settings-hint">
        English is the only language shipped. Extra locales would be a later
        translation pass, not a setting that pretends they exist.
      </p>
      <SettingsSelect
        label="Open Synapse into"
        value={general.startupWorkspace}
        onChange={(value) =>
          updateGeneral({ startupWorkspace: value === 'listen' ? 'listen' : 'edit' })
        }
      >
        <option value="edit">Edit</option>
        <option value="listen">Listen</option>
      </SettingsSelect>
      <SettingsToggle
        label="Remember last workspace"
        hint="Home’s Open Synapse button uses Edit or Listen from your last visit. Direct URLs are unchanged."
        checked={general.rememberLastWorkspace}
        onChange={(rememberLastWorkspace) => updateGeneral({ rememberLastWorkspace })}
      />
      <SettingsToggle
        label="Confirm Remove All and deleting connections"
        hint="Turn off only if you want those canvas actions to run immediately."
        checked={general.confirmDestructive}
        onChange={(confirmDestructive) => updateGeneral({ confirmDestructive })}
      />
    </section>
  );
}

function CanvasSection() {
  const canvas = useAppSettings((s) => s.canvas);
  const updateCanvas = useAppSettings((s) => s.updateCanvas);
  return (
    <section id="settings-canvas" className="synapse-settings-section" data-tutorial="settings-canvas">
      <h2>Canvas / Workspace</h2>
      <SettingsToggle
        label="Show minimap"
        hint="The canvas collapse control writes the same setting."
        checked={canvas.showMinimap}
        onChange={(showMinimap) => updateCanvas({ showMinimap })}
      />
      <SettingsToggle
        label="Snap to grid while dragging"
        hint="Alignment guides still appear when you hold Shift."
        checked={canvas.snapToGrid}
        onChange={(snapToGrid) => updateCanvas({ snapToGrid })}
      />
      <SettingsSelect
        label="Grid size"
        value={canvas.gridSize}
        onChange={(value) => updateCanvas({ gridSize: Number(value) })}
      >
        {GRID_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}px
          </option>
        ))}
      </SettingsSelect>
      <SettingsToggle
        label="Fit view when switching playlists"
        checked={canvas.fitViewOnPlaylistSwitch}
        onChange={(fitViewOnPlaylistSwitch) =>
          updateCanvas({ fitViewOnPlaylistSwitch })
        }
      />
    </section>
  );
}

function NodesSection() {
  const nodes = useAppSettings((s) => s.nodes);
  const updateNodes = useAppSettings((s) => s.updateNodes);
  return (
    <section id="settings-nodes" className="synapse-settings-section" data-tutorial="settings-nodes">
      <h2>Nodes</h2>
      <p className="synapse-settings-lead">
        These defaults apply to new track nodes. Existing nodes keep their
        saved values. Pitch and tempo remain experimental on the inspector
        because YouTube does not guarantee them.
      </p>
      <SettingsRange
        label="Default track volume"
        value={nodes.defaultVolume}
        min={0}
        max={100}
        suffix="%"
        onChange={(defaultVolume) => updateNodes({ defaultVolume })}
      />
      <SettingsRange
        label="Default play count"
        value={nodes.defaultPlayCount}
        min={1}
        max={99}
        onChange={(defaultPlayCount) => updateNodes({ defaultPlayCount })}
      />
    </section>
  );
}

function PlaybackSection() {
  const masterVolume = useAppSettings((s) => s.playback.masterVolume);
  const updatePlayback = useAppSettings((s) => s.updatePlayback);
  return (
    <section id="settings-playback" className="synapse-settings-section" data-tutorial="settings-playback">
      <h2>Playback</h2>
      <p className="synapse-settings-lead">
        Skip and previous already live on the deck. Crossfade is not available
        through the YouTube iframe, so it is not offered here.
      </p>
      <SettingsRange
        label="Master volume"
        value={masterVolume}
        min={0}
        max={100}
        suffix="%"
        onChange={(value) => updatePlayback({ masterVolume: value })}
      />
      <p className="synapse-settings-hint">
        Master volume multiplies each track’s node volume. 50% master with a
        80% track plays at 40%.
      </p>
    </section>
  );
}

function VisualizerSection() {
  const visualizer = useAppSettings((s) => s.visualizer);
  const updateVisualizer = useAppSettings((s) => s.updateVisualizer);
  return (
    <section id="settings-visualizer" className="synapse-settings-section" data-tutorial="settings-visualizer">
      <h2>Visualizer</h2>
      <p className="synapse-settings-lead">
        YouTube blocks a direct audio tap. The visualizer uses tab capture or
        the microphone after you connect it on the deck.
      </p>
      <SettingsToggle
        label="Show visualizer"
        checked={visualizer.visible}
        onChange={(visible) => updateVisualizer({ visible })}
      />
      <ThemeVisualizerBarSelect />
      <SettingsToggle
        label="Start with capture status collapsed"
        hint="Hides the sharing banner until you expand it. Stop still ends capture."
        checked={visualizer.collapseShareStatus}
        onChange={(collapseShareStatus) => updateVisualizer({ collapseShareStatus })}
      />
    </section>
  );
}

function EnvironmentSection() {
  const allowGeolocation = useAppSettings((s) => s.environment.allowGeolocation);
  const updateEnvironment = useAppSettings((s) => s.updateEnvironment);
  const weather = useWeatherSnapshot();
  return (
    <section id="settings-environment" className="synapse-settings-section" data-tutorial="settings-environment">
      <h2>Environment</h2>
      <p className="synapse-settings-lead">
        Weather conditionals use Open-Meteo. Coordinates come from your Profile
        location first, then the browser geolocation prompt if allowed.
      </p>
      <SettingsToggle
        label="Allow browser geolocation"
        hint="Off skips the prompt. Set a Profile location if weather nodes should still resolve."
        checked={allowGeolocation}
        onChange={(next) => {
          updateEnvironment({ allowGeolocation: next });
          if (next) clearGeoDenied();
        }}
      />
      <p className="synapse-settings-hint">
        Status: {weather.status}
        {weather.placeLabel ? ` · ${weather.placeLabel}` : ''}
        {weather.error ? ` · ${weather.error}` : ''}
      </p>
      <div className="synapse-theme-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() =>
            void refreshWeather({
              allowGeo: useAppSettings.getState().environment.allowGeolocation,
              force: true,
            })
          }
        >
          Refresh weather
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => clearWeatherCache()}
        >
          Clear weather cache
        </button>
      </div>
    </section>
  );
}

function AccountSection() {
  const visibility = useProfileStore((s) => s.profile.visibility);
  const username = useProfileStore((s) => s.profile.username);
  const setVisibility = useProfileStore((s) => s.setVisibility);
  return (
    <section id="settings-account" className="synapse-settings-section" data-tutorial="settings-account">
      <h2>Account</h2>
      <p className="synapse-settings-lead">
        Sign in with Google or email. Username and display name are required
        when you create an account. Picture and music sections still live on
        your <AppLink to="profile">profile</AppLink>
        {username ? ` (@${username})` : ''}. Paths stay on this device until
        cloud sync exists. Sign-out hides this account; it does not erase local
        playlists.
      </p>
      <AuthPanel variant="account" />
      <SettingsSelect
        label="Profile visibility"
        value={visibility}
        onChange={(value) => setVisibility(value === 'public' ? 'public' : 'private')}
      >
        <option value="private">Private</option>
        <option value="public">Public (local)</option>
      </SettingsSelect>
    </section>
  );
}

function PrivacySection() {
  const user = useAuthStore((s) => s.user);
  const [eraseInput, setEraseInput] = useState('');
  const [deleteInput, setDeleteInput] = useState('');
  const [metaCount, setMetaCount] = useState(() => creditsCacheSize());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useAppSettings((s) => s.exportJson());
  const keys = listedLocalKeys();

  async function downloadAccount() {
    setError('');
    setBusy(true);
    try {
      const json = await exportMyAccount();
      downloadTextFile(`synapse-account-${Date.now()}.json`, json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export account data.');
    } finally {
      setBusy(false);
    }
  }

  async function eraseAccount() {
    setError('');
    setBusy(true);
    try {
      await deleteOwnAccount();
      wipeSynapseLocalData();
      await signOut();
      window.location.assign('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the account.');
      setBusy(false);
    }
  }

  return (
    <section id="settings-privacy" className="synapse-settings-section" data-tutorial="settings-privacy">
      <h2>Privacy / Data</h2>
      <p className="synapse-settings-lead">
        Paths, themes, and most profile extras stay in localStorage. Signed-in
        account rows live in Supabase (US West). YouTube may set cookies when a
        track plays. Read the <AppLink to="privacy">Privacy Policy</AppLink>.
      </p>
      <ul className="synapse-settings-key-list">
        {keys.map((item) => (
          <li key={item.key}>
            <code>{item.key}</code>
            <span>{item.present ? 'present' : 'empty'}</span>
          </li>
        ))}
      </ul>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-theme-actions">
        {user ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            disabled={busy}
            onClick={() => void downloadAccount()}
          >
            Download my data
          </button>
        ) : null}
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => {
            const removed = clearMetadataCache();
            setMetaCount(creditsCacheSize());
            window.alert(
              removed
                ? `Cleared ${removed} cached track credit ${removed === 1 ? 'entry' : 'entries'}.`
                : 'Song-metadata cache was already empty.'
            );
          }}
        >
          Clear song-metadata cache{metaCount ? ` (${metaCount})` : ''}
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => useAppSettings.getState().reset()}
        >
          Reset application settings
        </button>
      </div>
      <div className="synapse-settings-danger">
        <p className="synapse-settings-lead">
          Erase all Synapse data on this browser, including playlists, themes,
          profile, settings, and tutorial progress. Type <code>erase</code> to
          enable the button. The page reloads afterward. This does not delete
          the cloud account.
        </p>
        <input
          className="synapse-settings-input"
          value={eraseInput}
          onChange={(e) => setEraseInput(e.target.value)}
          placeholder='Type "erase"'
          aria-label="Type erase to confirm wiping local data"
        />
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={eraseInput.trim().toLowerCase() !== 'erase'}
          onClick={() => {
            wipeSynapseLocalData();
            window.location.reload();
          }}
        >
          Erase local Synapse data
        </button>
      </div>
      {user ? (
        <div className="synapse-settings-danger">
          <p className="synapse-settings-lead">
            Delete the signed-in account and its cloud profile, tickets, and
            roles. Local playlists are also wiped. Type <code>delete</code> to
            confirm.
          </p>
          <input
            className="synapse-settings-input"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder='Type "delete"'
            aria-label="Type delete to confirm account deletion"
          />
          <button
            type="button"
            className="synapse-btn synapse-btn-danger"
            disabled={busy || deleteInput.trim().toLowerCase() !== 'delete'}
            onClick={() => void eraseAccount()}
          >
            Delete my account
          </button>
        </div>
      ) : null}
    </section>
  );
}

function SettingsTransfer() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  return (
    <div className="synapse-settings-transfer">
      <p className="synapse-settings-lead">
        Application settings (canvas, volume, visualizer, motion) export as
        Synapse settings JSON. They never run code.
      </p>
      <div className="synapse-theme-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() =>
            downloadTextFile(
              'synapse-settings.json',
              useAppSettings.getState().exportJson()
            )
          }
        >
          Export settings
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => fileRef.current?.click()}
        >
          Import settings
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const text = await file.text();
            setError(useAppSettings.getState().importJson(text) || '');
          }}
        />
      </div>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
    </div>
  );
}
