import ReactFlowCanvas from './components/ReactFlowCanvas';
import Sidebar from './components/Sidebar';
import InspectorPanel from './components/InspectorPanel';
import Player from './Player';
import TrackMetadataAutofill from './TrackMetadataAutofill';
import SettingsPage from './components/SettingsPage';
import ThemeRoot from './theme/ThemeRoot';
import { usePathStore } from './store';

export default function App() {
  const { isPlaying, setIsPlaying, playbackQueue, requestSkip, uiMode, setUiMode } =
    usePathStore();

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const listen = uiMode === 'listen';
  const settings = uiMode === 'settings';

  return (
    <div className="synapse-app w-full h-screen flex flex-col text-[var(--text)]">
      <ThemeRoot />
      <header className="synapse-topbar">
        <div className="synapse-topbar-brand">
          <div className="synapse-brand">Synapse</div>
          <div className="synapse-brand-meta">
            {listen
              ? 'Music path · Listen'
              : settings
                ? 'Music path · Settings'
                : 'Music path · Studio'}
          </div>
        </div>
        <div className="synapse-mode-toggle" role="tablist" aria-label="App mode">
          <button
            type="button"
            role="tab"
            aria-selected={uiMode === 'studio'}
            className={`synapse-mode-btn ${uiMode === 'studio' ? 'is-active' : ''}`}
            onClick={() => setUiMode('studio')}
          >
            Studio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={listen}
            className={`synapse-mode-btn ${listen ? 'is-active' : ''}`}
            onClick={() => setUiMode('listen')}
          >
            Listen
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={settings}
            className={`synapse-mode-btn ${settings ? 'is-active' : ''}`}
            onClick={() => setUiMode('settings')}
          >
            Settings
          </button>
        </div>
        {!listen && !settings ? (
          <div className="synapse-transport">
            <button
              type="button"
              onClick={togglePlayback}
              className={`synapse-btn ${isPlaying ? 'synapse-btn-ghost' : 'synapse-btn-play'}`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => requestSkip()}
              disabled={playbackQueue.length === 0}
              className="synapse-btn synapse-btn-ghost"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="synapse-transport" />
        )}
      </header>

      {uiMode === 'studio' ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <Sidebar />
          <ReactFlowCanvas />
          <InspectorPanel />
        </div>
      ) : null}

      {settings ? <SettingsPage /> : null}

      <TrackMetadataAutofill />
      <Player />
    </div>
  );
}
