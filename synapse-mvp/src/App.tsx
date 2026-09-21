import { useEffect, type ReactNode } from 'react';
import ReactFlowCanvas from './components/ReactFlowCanvas';
import Sidebar from './components/Sidebar';
import InspectorPanel from './components/InspectorPanel';
import Player from './Player';
import TrackMetadataAutofill from './TrackMetadataAutofill';
import SettingsPage from './components/SettingsPage';
import ProfilePage from './components/ProfilePage';
import ThemeRoot from './theme/ThemeRoot';
import PlaylistSwitcher from './components/PlaylistSwitcher';
import { SynapseWordmark } from './pages/chrome/SynapseMark';
import { usePathStore } from './store';
import { AppLink, useAppRoute } from './app/AppLink';
import {
  isAuthRoute,
  isMarketingRoute,
  isStaffRoute,
  isWorkspaceRoute,
  routeToUiMode,
  type AppRoute,
} from './app/routes';
import { useProfileStore } from './profile/profileStore';
import AuthControls from './auth/AuthControls';
import { useAuthStore } from './auth/authStore';
import RequireAuth from './auth/RequireAuth';
import { useAppSettings } from './settings/settingsStore';
import { applyPageMeta } from './site/seo';
import MarketingLayout from './pages/MarketingLayout';
import AuthLayout from './pages/AuthLayout';
import Home from './pages/Home/Home';
import WorkshopPage from './pages/WorkshopPage';
import PricingPage from './pages/PricingPage';
import ChangelogPage from './pages/ChangelogPage';
import FaqPage from './pages/FaqPage';
import PrivacyPage, { CookiesPage, TermsPage } from './pages/LegalPages';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import TutorialHelpButton from './tutorial/TutorialHelpButton';
import CookieNotice from './pages/chrome/CookieNotice';

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
  const avatarUrl = useProfileStore((s) => s.profile.avatarUrl);
  const username = useProfileStore((s) => s.profile.username);
  const role = useAuthStore((s) => s.role);
  const photo = avatar || avatarUrl;
  const listen = route === 'listen';
  const settings = route === 'settings';
  const profile = route === 'profile';
  const edit = route === 'edit';

  return (
    <div className="synapse-app w-full flex flex-col text-[var(--text)]" data-tutorial="workspace">
      <a className="synapse-mkt-skip" href="#workspace-main">
        Skip to workspace
      </a>
      <header className="synapse-topbar">
        <div className="synapse-topbar-brand">
          <div className="synapse-topbar-brand-row">
            <AppLink to="home" className="synapse-brand-link">
              <SynapseWordmark />
            </AppLink>
            <PlaylistSwitcher />
          </div>
        </div>
        <nav className="synapse-mode-toggle" aria-label="App pages" data-tutorial="app-nav">
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
            {photo ? (
              <img
                src={photo}
                alt=""
                className="synapse-mode-avatar"
                width={18}
                height={18}
              />
            ) : null}
            Profile
          </AppLink>
          {role === 'admin' ? (
            <AppLink to="admin" className="synapse-mode-btn">
              Admin
            </AppLink>
          ) : null}
          {role === 'superadmin' ? (
            <AppLink to="superadmin" className="synapse-mode-btn">
              Superadmin
            </AppLink>
          ) : null}
        </nav>
        <TutorialHelpButton />
        <AuthControls compact />
        {edit ? (
          <div className="synapse-transport" data-tutorial="header-transport">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`synapse-btn ${isPlaying ? 'synapse-btn-ghost' : 'synapse-btn-play'}`}
              data-tutorial="header-play"
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
        <div id="workspace-main" className="synapse-workspace">
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
    if (route === 'edit' || route === 'listen') {
      if (useAppSettings.getState().general.lastWorkspace !== route) {
        useAppSettings.getState().updateGeneral({ lastWorkspace: route });
      }
    }
  }, [route]);

  useEffect(() => {
    if (isAuthRoute(route)) applyPageMeta(route);
    else if (isMarketingRoute(route)) applyPageMeta(route);
    else if (route === 'edit' || route === 'listen' || route === 'settings' || route === 'profile') {
      document.title = WORKSPACE_META[route].title;
    } else if (isStaffRoute(route)) {
      applyPageMeta(route);
    }
  }, [route]);

  let page: ReactNode = null;
  if (isAuthRoute(route)) {
    page = (
      <AuthLayout>{route === 'signup' ? <SignupPage /> : <LoginPage />}</AuthLayout>
    );
  } else if (isMarketingRoute(route)) {
    page = (
      <MarketingLayout>
        <MarketingPage route={route} />
      </MarketingLayout>
    );
  } else if (isStaffRoute(route)) {
    page = route === 'superadmin' ? <SuperadminDashboard /> : <AdminDashboard />;
  } else if (isWorkspaceRoute(route)) {
    page = <WorkspaceApp route={route} />;
  }

  return (
    <>
      <ThemeRoot />
      <RequireAuth>{page}</RequireAuth>
      <CookieNotice />
    </>
  );
}
