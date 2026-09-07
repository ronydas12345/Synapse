import { useEffect } from 'react';
import ReactFlowCanvas from './components/ReactFlowCanvas';
import Sidebar from './components/Sidebar';
import InspectorPanel from './components/InspectorPanel';
import Player from './Player';
import TrackMetadataAutofill from './TrackMetadataAutofill';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import ThemeRoot from './theme/ThemeRoot';
import PlaylistSwitcher from './components/PlaylistSwitcher';
import { usePathStore } from './store';
import { AppLink, useAppRoute } from './app/AppLink';
import { isMarketingRoute, isWorkspaceRoute, routeToUiMode, type AppRoute } from './app/routes';
import { useProfileStore } from './profile/profileStore';
import { applyPageMeta } from './site/seo';
import MarketingLayout from './pages/MarketingLayout';
import Home from './pages/Home/Home';
import WorkshopPage from './pages/WorkshopPage';
import PricingPage from './pages/PricingPage';
import ChangelogPage from './pages/ChangelogPage';
import FaqPage from './pages/FaqPage';
import PrivacyPage, { CookiesPage, TermsPage } from './pages/LegalPages';

const WORKSPACE_META: Record<
  'edit' | 'listen' | 'settings' | 'profile',
  { title: string; label: string }
> = {
  edit: { title: 'Synapse · Edit', label: 'Music path · Edit' },
  listen: { title: 'Synapse · Listen', label: 'Music path · Listen' },
  settings: { title: 'Synapse · Settings', label: 'Music path · Settings' },
  profile: { title: 'Synapse · Profile', label: 'Music path · Profile' },
};

function MarketingPage({ route }: { route: AppRoute }) {
  if (route === 'workshop') return <WorkshopPage />;
  if (route === 'pricing') return <PricingPage />;
  if (route === 'changelog') return <ChangelogPage />;
  if (route === 'faq') return <FaqPage />;
  if (route === 'privacy') return <PrivacyPage />;
  if (route === 'terms') return <TermsPage />;
  if (route === 'cookies') return <CookiesPage />;
  return <Home />;
}

function WorkspaceApp({ route }: { route: 'edit' | 'listen' | 'settings' | 'profile' }) {
  const { isPlaying, setIsPlaying, playbackQueue, requestSkip } = usePathStore();
  const avatar = useProfileStore((s) => s.profile.avatarDataUrl);
  const username = useProfileStore((s) => s.profile.username);
  const listen = route === 'listen';
  const settings = route === 'settings';
  const profile = route === 'profile';
  const edit = route === 'edit';

  return (
    <div className="synapse-app w-full h-screen flex flex-col text-[var(--text)]">
      <header className="synapse-topbar">
        <div className="synapse-topbar-brand">
          <div className="synapse-topbar-brand-row">
            <div className="synapse-topbar-title">
              <AppLink to="home" className="synapse-brand-link">
                <div className="synapse-brand">Synapse</div>
              </AppLink>
              <div className="synapse-brand-meta">{WORKSPACE_META[route].label}</div>
            </div>
            <PlaylistSwitcher />
          </div>
        </div>
        <nav className="synapse-mode-toggle" aria-label="App pages">
          <AppLink to="home" className="synapse-mode-btn">
            Home
          </AppLink>
          <AppLink to="edit" className={`synapse-mode-btn ${edit ? 'is-active' : ''}`}>
            Edit
          </AppLink>
          <AppLink to="listen" className={`synapse-mode-btn ${listen ? 'is-active' : ''}`}>
            Listen
          </AppLink>
          <AppLink
            to="settings"
            className={`synapse-mode-btn ${settings ? 'is-active' : ''}`}
          >
            Settings
          </AppLink>
          <AppLink
            to="profile"
            className={`synapse-mode-btn synapse-mode-profile ${profile ? 'is-active' : ''}`}
            title={username ? `@${username}` : 'Profile'}
          >
            {avatar ? (
              <img src={avatar} alt="" className="synapse-mode-avatar" />
            ) : null}
            Profile
          </AppLink>
        </nav>
        {edit ? (
          <div className="synapse-transport">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
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

      {edit ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          <Sidebar />
          <ReactFlowCanvas />
          <InspectorPanel />
        </div>
      ) : null}

      {settings ? <SettingsPage /> : null}
      {profile ? <ProfilePage /> : null}

      <TrackMetadataAutofill />
      <Player />
    </div>
  );
}

export default function App() {
  const route = useAppRoute();

  useEffect(() => {
    usePathStore.getState().setUiMode(routeToUiMode(route));
  }, [route]);

  useEffect(() => {
    if (isMarketingRoute(route)) applyPageMeta(route);
    else if (route === 'edit' || route === 'listen' || route === 'settings' || route === 'profile') {
      document.title = WORKSPACE_META[route].title;
    }
  }, [route]);

  if (isMarketingRoute(route)) {
    return (
      <>
        <ThemeRoot />
        <MarketingLayout>
          <MarketingPage route={route} />
        </MarketingLayout>
      </>
    );
  }

  if (!isWorkspaceRoute(route)) return null;

  return (
    <>
      <ThemeRoot />
      <WorkspaceApp route={route} />
    </>
  );
}
