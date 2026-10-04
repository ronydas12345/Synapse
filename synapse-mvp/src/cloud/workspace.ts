import { supabase, throwIfError } from '../supabase/client';
import { useAuthStore } from '../auth/authStore';
import {
  registerWorkspaceFlush,
  setCloudPersistEnabled,
  flushWorkspaceNow,
} from './persistGate';
import {
  emptyLibrary,
  parseLibrary,
  preferStoredLibrary,
  readLegacyLibrary,
  LIBRARY_KEY,
  LEGACY_GRAPH_KEY,
  type PathLibrary,
} from '../playlists/library';
import { snapshotPathLibrary, usePathStore } from '../store';
import {
  readLegacySettings,
  replaceSettings,
  snapshotSettings,
} from '../settings/settingsStore';
import { defaultSettings } from '../settings/parse';
import {
  readLegacyTheme,
  replaceThemeState,
  snapshotThemeState,
} from '../theme/themeStore';
import { DEFAULT_THEME_ID } from '../theme/presets';
import {
  profileForCloud,
  readStashedProfile,
  useProfileStore,
} from '../profile/profileStore';
import { emptyProfile, type UserProfile } from '../profile/types';
import { ACCOUNT_CACHE_KEY } from '../auth/identity';
import { mergeWorkspaceProfile } from './workspaceProfile';
import { syncOwnPlaylistListings } from '../workshop/syncListings';
import {
  parseProgress,
  readLegacyProgress,
  TUTORIAL_STORAGE_KEY,
} from '../tutorial/tutorialStorage';
import { replaceTutorialProgress, useTutorialStore } from '../tutorial/tutorialStore';
import { applyAvatarStateToProfile, submitAvatarUrl } from './avatar';
import { SETTINGS_STORAGE_KEY } from '../settings/types';
import { THEME_STORAGE_KEY } from '../theme/themeStore';
import { PROFILE_ACCOUNTS_KEY, PROFILE_STORAGE_KEY } from '../profile/profileStore';
import { httpsPhoto } from '../admin/model';

interface WorkspaceRow {
  library: unknown;
  settings: unknown;
  theme: unknown;
  profile: unknown;
  tutorial: unknown;
}

function isBlankJson(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== 'object') return false;
  return Object.keys(value as object).length === 0;
}

const LEGACY_PRODUCT_KEYS = [
  LIBRARY_KEY,
  LEGACY_GRAPH_KEY,
  SETTINGS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  PROFILE_ACCOUNTS_KEY,
  TUTORIAL_STORAGE_KEY,
  ACCOUNT_CACHE_KEY,
] as const;

function wipeLegacyProductKeys(): void {
  for (const key of LEGACY_PRODUCT_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

function readLegacySnapshot(uid: string): Partial<WorkspaceRow> {
  const out: Partial<WorkspaceRow> = {};
  const library = readLegacyLibrary();
  if (library) out.library = library;
  const settings = readLegacySettings();
  if (settings) out.settings = settings;
  const theme = readLegacyTheme();
  if (theme && (theme.customThemes.length || theme.activeId !== DEFAULT_THEME_ID)) {
    out.theme = theme;
  }
  const profile =
    readStashedProfile(uid) ||
    (() => {
      try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as unknown) : null;
      } catch {
        return null;
      }
    })();
  if (profile) out.profile = profile;
  const tutorial = readLegacyProgress();
  if (tutorial) out.tutorial = tutorial;
  return out;
}

function applyWorkspace(
  uid: string,
  row: WorkspaceRow,
  identity?: UserProfile,
  server?: { visibility?: unknown; bio?: unknown; extras?: unknown } | null
): void {
  usePathStore.getState().replaceLibrary(parseLibrary(row.library));
  replaceSettings(isBlankJson(row.settings) ? defaultSettings() : row.settings);
  replaceThemeState(row.theme);
  const current = useProfileStore.getState().profile;
  const fromCloud = isBlankJson(row.profile) ? emptyProfile() : row.profile;
  useProfileStore.getState().hydrateAccount(
    uid,
    mergeWorkspaceProfile(fromCloud, identity, current, server)
  );
  replaceTutorialProgress(row.tutorial);
}

async function pushWorkspace(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) return;
  if (usePathStore.getState().graphLocked) return;
  const payload = {
    uid: user.uid,
    library: snapshotPathLibrary(),
    settings: snapshotSettings(),
    theme: snapshotThemeState(),
    profile: profileForCloud(useProfileStore.getState().profile),
    tutorial: useTutorialStore.getState().progress,
  };
  const { error } = await supabase.from('user_workspaces').upsert(payload, {
    onConflict: 'uid',
  });
  if (error) console.error('Could not save workspace', error.message);
}

registerWorkspaceFlush(() => pushWorkspace());

function bindFlushEvents(): void {
  if (typeof window === 'undefined' || bindFlushEvents.bound) return;
  bindFlushEvents.bound = true;
  window.addEventListener('beforeunload', () => {
    void flushWorkspaceNow();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushWorkspaceNow();
  });
}
bindFlushEvents.bound = false;

export async function hydrateUserWorkspace(): Promise<void> {
  const user = useAuthStore.getState().user;
  if (!user) {
    setCloudPersistEnabled(false);
    useAuthStore.getState().setWorkspaceStatus('ready');
    return;
  }

  setCloudPersistEnabled(false);
  useAuthStore.getState().setWorkspaceStatus('loading');
  bindFlushEvents();

  try {
    const [workspace, serverProfile] = await Promise.all([
      supabase
        .from('user_workspaces')
        .select('library, settings, theme, profile, tutorial')
        .eq('uid', user.uid)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('visibility, bio, profile_extras')
        .eq('uid', user.uid)
        .maybeSingle(),
    ]);
    throwIfError(workspace.error);
    let serverFields: { visibility?: unknown; bio?: unknown; extras?: unknown } | null =
      null;
    if (serverProfile.error) {
      if (/profile_extras/i.test(serverProfile.error.message || '')) {
        const fallback = await supabase
          .from('profiles')
          .select('visibility, bio')
          .eq('uid', user.uid)
          .maybeSingle();
        if (fallback.error) {
          console.error('Could not load profile visibility', fallback.error);
        } else {
          serverFields = fallback.data;
        }
      } else {
        console.error('Could not load profile visibility', serverProfile.error);
      }
    } else if (serverProfile.data) {
      serverFields = {
        visibility: serverProfile.data.visibility,
        bio: serverProfile.data.bio,
        extras: (serverProfile.data as { profile_extras?: unknown }).profile_extras,
      };
    }

    const data = workspace.data;
    const legacy = readLegacySnapshot(user.uid);
    const row: WorkspaceRow = {
      library: preferStoredLibrary(data?.library, legacy.library),
      settings: data && !isBlankJson(data.settings) ? data.settings : legacy.settings ?? {},
      theme: data && !isBlankJson(data.theme) ? data.theme : legacy.theme ?? {},
      profile: data && !isBlankJson(data.profile) ? data.profile : legacy.profile ?? {},
      tutorial: data && !isBlankJson(data.tutorial) ? data.tutorial : legacy.tutorial ?? {},
    };

    applyWorkspace(
      user.uid,
      row,
      useProfileStore.getState().profile,
      serverFields
    );
    await syncOwnPlaylistListings().catch(() => {});

    await supabase.from('user_workspaces').upsert(
      {
        uid: user.uid,
        library: snapshotPathLibrary(),
        settings: snapshotSettings(),
        theme: snapshotThemeState(),
        profile: profileForCloud(useProfileStore.getState().profile),
        tutorial: useTutorialStore.getState().progress,
      },
      { onConflict: 'uid' }
    );

    wipeLegacyProductKeys();
    await applyAvatarStateToProfile();

    const googlePhoto = httpsPhoto(user.photoURL);
    const avatar = useProfileStore.getState().profile;
    if (googlePhoto && avatar.avatarStatus === 'none' && !avatar.avatarUrl) {
      try {
        await submitAvatarUrl(googlePhoto);
        await applyAvatarStateToProfile();
      } catch {
        /* Google photos still need staff review; ignore if the RPC is missing. */
      }
    }
  } catch (err) {
    console.error('Could not load workspace', err);
    usePathStore.getState().replaceLibrary(emptyLibrary());
  } finally {
    setCloudPersistEnabled(true);
    useAuthStore.getState().setWorkspaceStatus('ready');
  }
}

export async function resetUserWorkspace(): Promise<void> {
  setCloudPersistEnabled(false);
  usePathStore.getState().replaceLibrary(emptyLibrary());
  replaceSettings(defaultSettings());
  replaceThemeState({});
  useProfileStore.getState().clearAccount();
  replaceTutorialProgress({});
  useAuthStore.getState().setWorkspaceStatus('ready');
}

export function snapshotWorkspaceForExport(): {
  library: PathLibrary;
  settings: ReturnType<typeof snapshotSettings>;
  theme: ReturnType<typeof snapshotThemeState>;
  profile: UserProfile;
  tutorial: ReturnType<typeof parseProgress>;
} {
  return {
    library: snapshotPathLibrary(),
    settings: snapshotSettings(),
    theme: snapshotThemeState(),
    profile: profileForCloud(useProfileStore.getState().profile),
    tutorial: useTutorialStore.getState().progress,
  };
}
