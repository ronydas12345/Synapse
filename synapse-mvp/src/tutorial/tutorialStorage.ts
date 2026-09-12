import type { TutorialProgress } from './tutorialTypes';

export const TUTORIAL_STORAGE_KEY = 'synapse_tutorial_progress';
export const TUTORIAL_SESSION_KEY = 'synapse_tutorial_session';

export const emptyProgress = (): TutorialProgress => ({
  version: 1,
  skipped: false,
  completedFull: false,
  completedSections: [],
  lastSection: null,
  lastStep: 0,
  dismissedWelcome: false,
});

export function parseProgress(raw: unknown): TutorialProgress {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const v = raw as Record<string, unknown>;
  const sections = Array.isArray(v.completedSections)
    ? v.completedSections.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    version: 1,
    skipped: Boolean(v.skipped),
    completedFull: Boolean(v.completedFull),
    completedSections: [...new Set(sections)],
    lastSection: typeof v.lastSection === 'string' ? v.lastSection : null,
    lastStep: Number.isFinite(Number(v.lastStep))
      ? Math.max(0, Math.floor(Number(v.lastStep)))
      : 0,
    dismissedWelcome: Boolean(v.dismissedWelcome),
  };
}

export function loadProgress(): TutorialProgress {
  if (typeof localStorage === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) return emptyProgress();
    return parseProgress(JSON.parse(raw));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: TutorialProgress): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* quota / private mode */
  }
}

export function loadSessionLater(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(TUTORIAL_SESSION_KEY) === 'later';
  } catch {
    return false;
  }
}

export function saveSessionLater(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(TUTORIAL_SESSION_KEY, 'later');
  } catch {
    /* ignore */
  }
}

export function markSectionComplete(
  progress: TutorialProgress,
  sectionId: string
): TutorialProgress {
  const completedSections = progress.completedSections.includes(sectionId)
    ? progress.completedSections
    : [...progress.completedSections, sectionId];
  return { ...progress, completedSections };
}
