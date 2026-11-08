import { useAuthStore } from '../auth/authStore';
import {
  isVerifiedSuperadmin,
  parseSuperadminEmails,
  type SessionUser,
} from '../auth/session';
import {
  flushWorkspaceNow,
  setCloudPersistEnabled,
} from '../cloud/persistGate';
import {
  emptyLibrary,
  libraryHasUserContent,
  uniquePathName,
  addImportedPath,
  makePathId,
  type PathLibrary,
} from '../playlists/library';
import { snapshotPathLibrary, usePathStore } from '../store';
import { replaceSettings, snapshotSettings } from '../settings/settingsStore';
import { defaultSettings } from '../settings/parse';
import type { AppSettings } from '../settings/types';
import {
  emptyProgress,
  saveProgress,
  clearTutorialRun,
} from '../tutorial/tutorialStorage';
import { useTutorialStore } from '../tutorial/tutorialStore';
import { requestConfirm } from '../ui/confirmStore';
import { maybeOfferOnboarding, useOnboardingStore } from '../onboarding/onboardingStore';
import { APP_PATHS, navigateApp } from '../app/routes';
import { isNewUserTestMode, setNewUserTestMode } from './testModeFlag';

export { isNewUserTestMode } from './testModeFlag';

interface TestModeSnapshot {
  library: PathLibrary;
  settings: AppSettings;
  tutorial: ReturnType<typeof emptyProgress>;
}

let snapshot: TestModeSnapshot | null = null;

function cloneLibrary(lib: PathLibrary): PathLibrary {
  return JSON.parse(JSON.stringify(lib)) as PathLibrary;
}

export function isNewUserTestModeEnvEnabled(
  env: { DEV?: boolean; VITE_NEW_USER_TEST_MODE?: string } = import.meta.env
): boolean {
  return Boolean(env.DEV) || env.VITE_NEW_USER_TEST_MODE === '1';
}

export function canUseNewUserTestMode(
  user: SessionUser | null = useAuthStore.getState().user,
  env: { DEV?: boolean; VITE_NEW_USER_TEST_MODE?: string } = import.meta.env
): boolean {
  if (!user) return false;
  if (!isNewUserTestModeEnvEnabled(env)) return false;
  return isVerifiedSuperadmin(
    user,
    parseSuperadminEmails(import.meta.env.VITE_SUPERADMIN_EMAILS)
  );
}

export function testModeHasWork(lib: PathLibrary = snapshotPathLibrary()): boolean {
  return libraryHasUserContent(lib);
}

export function mergeTestLibrary(real: PathLibrary, test: PathLibrary): PathLibrary {
  let next = cloneLibrary(real);
  for (const path of test.paths) {
    if (!libraryHasUserContent({ schemaVersion: 1, activeId: path.id, paths: [path] })) {
      continue;
    }
    const labeled = path.name.startsWith('Test: ') ? path.name : `Test: ${path.name}`;
    const name = uniquePathName(
      next.paths.map((item) => item.name),
      labeled
    );
    next = addImportedPath(
      next,
      { ...path, id: makePathId(), name },
      { persist: false, keepName: true }
    );
  }
  return next;
}

function applyFreshUserState(): void {
  replaceSettings(defaultSettings());
  useTutorialStore.setState({
    view: 'closed',
    runKind: 'simple',
    sectionId: null,
    stepIndex: 0,
    actionSatisfied: false,
    praise: null,
    recovery: null,
    progress: emptyProgress(),
  });
  clearTutorialRun();
  usePathStore.getState().replaceLibrary(emptyLibrary(), { dropHold: true });
}

export async function enterNewUserTestMode(): Promise<boolean> {
  if (!canUseNewUserTestMode() || isNewUserTestMode()) return false;
  const ok = await requestConfirm({
    title: 'Enter New User Test Mode?',
    body: 'This will temporarily simulate a brand-new Synapse user experience. Your account, existing playlists, and saved settings will remain intact.',
    confirmLabel: 'Enter Test Mode',
    danger: false,
  });
  if (!ok) return false;
  await flushWorkspaceNow();
  snapshot = {
    library: cloneLibrary(snapshotPathLibrary()),
    settings: snapshotSettings(),
    tutorial: { ...useTutorialStore.getState().progress },
  };
  setCloudPersistEnabled(false);
  setNewUserTestMode(true);
  applyFreshUserState();
  navigateApp(APP_PATHS.edit);
  maybeOfferOnboarding();
  return true;
}

export function discardNewUserTestMode(): void {
  snapshot = null;
  useOnboardingStore.getState().closeWithoutCompleting();
  setNewUserTestMode(false);
}

export async function exitNewUserTestMode(preserve: boolean): Promise<void> {
  if (!isNewUserTestMode() || !snapshot) {
    discardNewUserTestMode();
    return;
  }
  const testLib = cloneLibrary(snapshotPathLibrary());
  useOnboardingStore.getState().closeWithoutCompleting();
  useTutorialStore.setState({
    view: 'closed',
    sectionId: null,
    stepIndex: 0,
    actionSatisfied: false,
    praise: null,
    recovery: null,
    progress: snapshot.tutorial,
  });
  clearTutorialRun();
  replaceSettings(snapshot.settings);
  let restored = cloneLibrary(snapshot.library);
  if (preserve) restored = mergeTestLibrary(restored, testLib);
  setNewUserTestMode(false);
  snapshot = null;
  usePathStore.getState().replaceLibrary(restored, { dropHold: true });
  saveProgress(useTutorialStore.getState().progress);
  setCloudPersistEnabled(true);
  await flushWorkspaceNow();
}

export function resetNewUserTestModeStoreForTests(): void {
  discardNewUserTestMode();
}
