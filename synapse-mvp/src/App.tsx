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
import { AppLink, PathLink, useAppLocation } from './app/AppLink';
import {
  isAuthRoute,
  isMarketingRoute,
  isStaffRoute,
  isWorkspaceRoute,
  listenPath,
  navigateApp,
  routeToUiMode,
  workshopItemPath,
  type AppLocation,
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
import CreationPage from './workshop/CreationPage';
import { usePublishedListen, useSyncOwnWorkshopListings } from './workshop/usePublishedListen';
import PublicProfilePage from './profiles/PublicProfilePage';
import {
  isVisPreview,
  isWorkshopPreview,
  VisPreviewPage,
  WorkshopPreviewPage,
} from './profiles/previewUser';
import ShareLookupPage from './share/ShareLookupPage';
import PricingPage from './pages/PricingPage';
import ChangelogPage from './pages/ChangelogPage';
import FaqPage from './pages/FaqPage';
import PrivacyPage, { CookiesPage, TermsPage } from './pages/LegalPages';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboard from './pages/AdminDashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import TutorialHelpButton from './tutorial/TutorialHelpButton';
import CommandPalette, { CommandPaletteButton } from './commandPalette/CommandPalette';
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

function MarketingPage({ location }: { location: AppLocation }) {
  if (location.route === 'workshopItem' && location.workshopId) {
    return <CreationPage id={location.workshopId} />;
  }
  if (location.route === 'publicProfile' && location.username) {
    if (isVisPreview(location.username)) {
      return <VisPreviewPage />;
    }
    if (isWorkshopPreview(location.username)) {
      return <WorkshopPreviewPage />;
    }
    return <PublicProfilePage username={location.username} />;
  }
  if (location.route === 'shareLookup' && location.shareRef) {
    return <ShareLookupPage shareRef={location.shareRef} />;
  }
  const route = location.route;
  if (route === 'workshop') return <WorkshopPage />;
  if (route === 'pricing') return <PricingPage />;
  if (route === 'changelog') return <ChangelogPage />;
  if (route === 'faq') return <FaqPage />;
  if (route === 'privacy') return <PrivacyPage />;
  if (route === 'terms') return <TermsPage />;
  if (route === 'cookies') return <CookiesPage />;
  return <Home />;
}

function WorkspaceApp({
  route,
  workshopId,
}: {
  route: 'edit' | 'listen' | 'settings' | 'profile';
  workshopId?: string;
}) {
  const { isPlaying, setIsPlaying, playbackQueue, requestSkip, requestStop } = usePathStore();
  const graphLocked = usePathStore((s) => s.graphLocked);
  const listenView = usePathStore((s) => s.listenView);
  const setListenView = usePathStore((s) => s.setListenView);
  const workshopShareKey = usePathStore((s) => s.workshopShareKey);
  const activePathId = usePathStore((s) => s.activePathId);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const avatar = useProfileStore((s) => s.profile.avatarDataUrl);
  const avatarUrl = useProfileStore((s) => s.profile.avatarUrl);
  const username = useProfileStore((s) => s.profile.username);
  const role = useAuthStore((s) => s.role);
  const photo = avatar || avatarUrl;
  const listen = route === 'listen';
  const settings = route === 'settings';
  const profile = route === 'profile';
  const edit = route === 'edit';
  const readOnly = graphLocked;
  const guestListen = listen && readOnly;
  const showGraph = edit || (listen && (!readOnly || listenView === 'graph'));
  const listenHref = listenPath(workshopShareKey ?? workshopId ?? activePathId);
  const listingKey =
    workshopShareKey ||
    workshopId ||
    pathSummaries.find((path) => path.id === activePathId)?.workshopId ||
    '';
  const workshopHref = listingKey ? workshopItemPath(listingKey) : null;

  usePublishedListen(listen ? workshopId : undefined);

  useEffect(() => {
    if (!listen) return;
    if (workshopId) return;
    if (listenHref === '/listen') return;
    navigateApp(listenHref, '', true);
  }, [listen, workshopId, listenHref]);

  return (
    <div
      className="synapse-app w-full flex flex-col text-[var(--text)]"
      data-tutorial="workspace"
      data-listen={listen ? '' : undefined}
      data-readonly={readOnly ? '' : undefined}
      data-listen-view={listen ? (readOnly ? listenView : 'graph') : undefined}
    >
      <a className="synapse-mkt-skip" href="#workspace-main">
        Skip to workspace
      </a>
      <header className="synapse-topbar">
        <div className="synapse-topbar-brand">
          <div className="synapse-topbar-brand-row">
            <AppLink to="home" className="synapse-brand-link">
              <SynapseWordmark />
            </AppLink>
          </div>
        </div>
        <nav className="synapse-mode-toggle" aria-label="App pages" data-tutorial="app-nav">
          <AppLink to="home" className="synapse-mode-btn">
            Home
          </AppLink>
          <AppLink to="edit" className={`synapse-mode-btn ${edit ? 'is-active' : ''}`}>
            Edit
          </AppLink>
          <PathLink
            href={listenHref}
            className={`synapse-mode-btn ${listen ? 'is-active' : ''}`}
          >
            Listen
          </PathLink>
          <AppLink to="workshop" className="synapse-mode-btn">
            Workshop
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
          <TutorialHelpButton />
        </nav>
        <div className="synapse-topbar-playlist">
          <PlaylistSwitcher />
        </div>
        <CommandPaletteButton />
        <AuthControls compact />
        {showGraph || listen ? (
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
            <button
              type="button"
              onClick={() => requestStop()}
              disabled={!isPlaying && playbackQueue.length === 0}
              className="synapse-btn synapse-btn-ghost"
            >
              Stop
            </button>
          </div>
        ) : (
          <div className="synapse-transport" />
        )}
      </header>

      {guestListen || (edit && readOnly) ? (
        <div className="synapse-listen-toolbar">
          {readOnly ? (
            <p className="synapse-workspace-readonly" role="status">
              Published playlist — view only.{' '}
              {workshopHref ? (
                <>
                  <PathLink href={workshopHref}>Workshop page</PathLink>
                  {' · '}
                </>
              ) : null}
              Remix to make your own copy.
            </p>
          ) : null}
          {guestListen ? (
            <div className="synapse-listen-view-toggle" role="group" aria-label="Listen layout">
              <button
                type="button"
                className={listenView === 'graph' ? 'is-active' : ''}
                aria-pressed={listenView === 'graph'}
                onClick={() => setListenView('graph')}
              >
                Graph
              </button>
              <button
                type="button"
                className={listenView === 'list' ? 'is-active' : ''}
                aria-pressed={listenView === 'list'}
                onClick={() => setListenView('list')}
              >
                List
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {showGraph ? (
        <div className="synapse-workspace-shell" id="workspace-main">
          <div
            className="synapse-workspace"
            data-readonly={readOnly ? '' : undefined}
          >
            <Sidebar />
            <ReactFlowCanvas />
            <InspectorPanel />
          </div>
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
  const location = useAppLocation();
  const route = location.route;
  useSyncOwnWorkshopListings();

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
        <MarketingPage location={location} />
      </MarketingLayout>
    );
  } else if (isStaffRoute(route)) {
    page = route === 'superadmin' ? <SuperadminDashboard /> : <AdminDashboard />;
  } else if (isWorkspaceRoute(route)) {
    page = <WorkspaceApp route={route} workshopId={location.workshopId} />;
  }

  return (
    <>
      <ThemeRoot />
      <RequireAuth>{page}</RequireAuth>
      <CommandPalette />
      <CookieNotice />
    </>
  );
}
