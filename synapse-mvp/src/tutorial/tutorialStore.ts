import { create } from 'zustand';
import {
  APP_PATHS,
  isProtectedRoute,
  navigateApp,
  pathToRoute,
  type AppPath,
  type AppRoute,
} from '../app/routes';
import {
  FULL_TUTORIAL_SECTIONS,
  SIMPLE_TUTORIAL_ID,
  getSection,
} from './tutorialCatalog';
import { actionsMatch } from './tutorialMatch';
import { isIdentityComplete } from '../auth/identity';
import { useAuthStore } from '../auth/authStore';
import { rememberReturnPath } from '../auth/returnPath';
import { useProfileStore } from '../profile/profileStore';
import {
  clearTutorialRun,
  loadProgress,
  loadSessionLater,
  loadTutorialRun,
  markSectionComplete,
  parseProgress,
  saveProgress,
  saveSessionLater,
  saveTutorialRun,
  emptyProgress,
} from './tutorialStorage';
import type {
  TutorialAction,
  TutorialProgress,
  TutorialRunKind,
  TutorialStep,
  TutorialView,
} from './tutorialTypes';

interface TutorialState {
  view: TutorialView;
  runKind: TutorialRunKind;
  sectionId: string | null;
  stepIndex: number;
  progress: TutorialProgress;
  actionSatisfied: boolean;
  praise: string | null;
  openMenu: () => void;
  openTopics: () => void;
  close: () => void;
  askSkip: () => void;
  keepTutorial: () => void;
  confirmSkip: () => void;
  maybeLater: () => void;
  startWelcome: () => void;
  startSimple: (resume?: boolean) => void;
  startFull: (resume?: boolean) => void;
  openFullTutorial: () => void;
  startSection: (sectionId: string, stepIndex?: number) => void;
  next: () => void;
  back: () => void;
  skipSection: () => void;
  exitTour: () => void;
  applyEvent: (event: TutorialAction) => void;
  resetProgress: () => void;
  showWelcomeAgain: () => void;
  resumeSavedRun: () => void;
}

function persist(progress: TutorialProgress): TutorialProgress {
  saveProgress(progress);
  return progress;
}

function currentStep(sectionId: string | null, stepIndex: number): TutorialStep | null {
  if (!sectionId) return null;
  const section = getSection(sectionId);
  return section?.steps[stepIndex] ?? null;
}

export function stepNeedsAccount(step: TutorialStep | null | undefined): boolean {
  return step?.expectedAction?.type === 'account-ready';
}

export function accountReady(): boolean {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  const profile = useProfileStore.getState().profile;
  return isIdentityComplete(profile.username, profile.displayName);
}

export function firstPlayableStepIndex(
  steps: TutorialStep[],
  ready: boolean
): number {
  if (!ready) return 0;
  const index = steps.findIndex((step) => !stepNeedsAccount(step));
  return index < 0 ? 0 : index;
}

export function resolveTutorialNavigation(
  step: TutorialStep | null,
  opts: { accountReady: boolean; currentRoute: AppRoute }
): { path: AppPath; hash: string } | null {
  if (!step) return null;
if (stepNeedsAccount(step) && !opts.accountReady) {
    rememberReturnPath(APP_PATHS.edit);
    if (opts.currentRoute === 'login' || opts.currentRoute === 'signup') return null;
    return { path: APP_PATHS.signup, hash: '' };
  }
  if (stepNeedsAccount(step) && opts.accountReady) return null;
  if (!step.route) return null;
  if (step.route === 'workshopItem' || step.route === 'publicProfile') return null;
  if (isProtectedRoute(step.route) && !opts.accountReady) {
    rememberReturnPath(APP_PATHS[step.route]);
    return { path: APP_PATHS.signup, hash: '' };
  }
  return { path: APP_PATHS[step.route], hash: step.hash ?? '' };
}

function goToStepRoute(step: TutorialStep | null): void {
  const next = resolveTutorialNavigation(step, {
    accountReady: accountReady(),
    currentRoute: pathToRoute(window.location.pathname),
  });
  if (!next) return;
  navigateApp(next.path, next.hash);
}

function syncRunSnapshot(): void {
  const s = useTutorialStore.getState();
  if (s.view === 'tour' && s.sectionId) {
    saveTutorialRun({
      runKind: s.runKind,
      sectionId: s.sectionId,
      stepIndex: s.stepIndex,
    });
    return;
  }
  if (s.view === 'closed' || s.view === 'complete') clearTutorialRun();
}

function finishSection(
  state: Pick<TutorialState, 'runKind' | 'sectionId' | 'progress'>,
  complete: boolean
): Partial<TutorialState> {
  const sectionId = state.sectionId;
  let progress = state.progress;
  if (complete && sectionId) progress = markSectionComplete(progress, sectionId);

  if (state.runKind === 'simple') {
    if (complete) {
      progress = persist({
        ...progress,
        lastSection: null,
        lastStep: 0,
      });
      return {
        view: 'complete',
        progress,
        sectionId: null,
        stepIndex: 0,
        actionSatisfied: false,
        praise: null,
      };
    }
    return {
      view: 'closed',
      progress: persist(progress),
      actionSatisfied: false,
      praise: null,
      sectionId: null,
      stepIndex: 0,
    };
  }

  if (state.runKind === 'section') {
    return {
      view: complete ? 'complete' : 'topics',
      progress: persist(progress),
      actionSatisfied: false,
      praise: null,
    };
  }

  const idx = sectionId ? FULL_TUTORIAL_SECTIONS.indexOf(sectionId) : -1;
  const nextId = idx >= 0 ? FULL_TUTORIAL_SECTIONS[idx + 1] : undefined;
  if (!nextId) {
    progress = persist({
      ...progress,
      completedFull: true,
      lastSection: null,
      lastStep: 0,
    });
    return {
      view: 'complete',
      progress,
      sectionId: null,
      stepIndex: 0,
      actionSatisfied: false,
      praise: null,
    };
  }

  progress = persist({ ...progress, lastSection: nextId, lastStep: 0 });
  const step = currentStep(nextId, 0);
  goToStepRoute(step);
  return {
    view: 'tour',
    sectionId: nextId,
    stepIndex: 0,
    progress,
    actionSatisfied: false,
    praise: null,
  };
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  view: 'closed',
  runKind: 'full',
  sectionId: null,
  stepIndex: 0,
  progress: loadProgress(),
  actionSatisfied: false,
  praise: null,

  openMenu: () =>
    set({
      view: 'menu',
      actionSatisfied: false,
      praise: null,
    }),

  openTopics: () => set({ view: 'topics' }),

  close: () =>
    set((s) => ({
      view: 'closed',
      actionSatisfied: false,
      praise: null,
      progress: persist({
        ...s.progress,
        lastSection: s.sectionId ?? s.progress.lastSection,
        lastStep: s.sectionId ? s.stepIndex : s.progress.lastStep,
      }),
    })),

  askSkip: () => set({ view: 'skip-confirm' }),

  keepTutorial: () => set({ view: 'menu' }),

  confirmSkip: () =>
    set((s) => ({
      view: 'closed',
      sectionId: null,
      stepIndex: 0,
      progress: persist({
        ...s.progress,
        skipped: true,
        dismissedWelcome: true,
      }),
    })),

  maybeLater: () => {
    saveSessionLater();
    set((s) => ({
      view: 'closed',
      progress: persist({ ...s.progress, dismissedWelcome: true }),
    }));
  },

  startWelcome: () => set({ view: 'welcome' }),

  startSimple: (resume = false) => {
    const section = getSection(SIMPLE_TUTORIAL_ID);
    if (!section) return;
    const { progress } = get();
    const stepIndex =
      resume && progress.lastSection === SIMPLE_TUTORIAL_ID
        ? Math.min(Math.max(0, progress.lastStep), section.steps.length - 1)
        : firstPlayableStepIndex(section.steps, accountReady());
    const step = section.steps[stepIndex];
    goToStepRoute(step);
    set({
      view: 'tour',
      runKind: 'simple',
      sectionId: SIMPLE_TUTORIAL_ID,
      stepIndex,
      actionSatisfied: false,
      praise: null,
      progress: persist({
        ...progress,
        skipped: false,
        dismissedWelcome: true,
        lastSection: SIMPLE_TUTORIAL_ID,
        lastStep: stepIndex,
      }),
    });
  },

  startFull: (resume = false) => {
    const { progress } = get();
    const canResumeFull =
      resume &&
      progress.lastSection &&
      FULL_TUTORIAL_SECTIONS.includes(progress.lastSection) &&
      getSection(progress.lastSection);
    const sectionId =
      canResumeFull && progress.lastSection
        ? progress.lastSection
        : FULL_TUTORIAL_SECTIONS[0];
    const firstSection = getSection(sectionId);
    const stepIndex =
      canResumeFull && progress.lastSection === sectionId
        ? progress.lastStep
        : firstPlayableStepIndex(firstSection?.steps ?? [], accountReady());
    const step = currentStep(sectionId, stepIndex);
    goToStepRoute(step);
    set({
      view: 'tour',
      runKind: 'full',
      sectionId,
      stepIndex,
      actionSatisfied: false,
      praise: null,
      progress: persist({
        ...progress,
        skipped: false,
        dismissedWelcome: true,
        lastSection: sectionId,
        lastStep: stepIndex,
      }),
    });
  },

  openFullTutorial: () => {
    const s = get();
    if (s.runKind === 'simple' && s.sectionId) {
      set({
        progress: persist(markSectionComplete(s.progress, s.sectionId)),
      });
    }
    get().startFull(false);
  },

  startSection: (sectionId, stepIndex = 0) => {
    if (sectionId === SIMPLE_TUTORIAL_ID) {
      get().startSimple(false);
      return;
    }
    const section = getSection(sectionId);
    if (!section) return;
    const idx = Math.min(Math.max(0, stepIndex), section.steps.length - 1);
    goToStepRoute(section.steps[idx]);
    set((s) => ({
      view: 'tour',
      runKind: 'section',
      sectionId,
      stepIndex: idx,
      actionSatisfied: false,
      praise: null,
      progress: persist({
        ...s.progress,
        dismissedWelcome: true,
        lastSection: sectionId,
        lastStep: idx,
      }),
    }));
  },

  next: () => {
    const s = get();
    if (!s.sectionId) return;
    const section = getSection(s.sectionId);
    if (!section) return;
    const current = currentStep(s.sectionId, s.stepIndex);
    if (stepNeedsAccount(current) && !accountReady()) {
      goToStepRoute(current);
      return;
    }
    if (s.stepIndex + 1 < section.steps.length) {
      const stepIndex = s.stepIndex + 1;
      goToStepRoute(section.steps[stepIndex]);
      set({
        stepIndex,
        actionSatisfied: false,
        praise: null,
        progress: persist({
          ...s.progress,
          lastSection: s.sectionId,
          lastStep: stepIndex,
        }),
      });
      return;
    }
    set(finishSection(s, true));
  },

  back: () => {
    const s = get();
    if (!s.sectionId) return;
    if (s.stepIndex > 0) {
      const stepIndex = s.stepIndex - 1;
      const section = getSection(s.sectionId);
      goToStepRoute(section?.steps[stepIndex] ?? null);
      set({
        stepIndex,
        actionSatisfied: false,
        praise: null,
        progress: persist({
          ...s.progress,
          lastSection: s.sectionId,
          lastStep: stepIndex,
        }),
      });
      return;
    }
    if (s.runKind !== 'full') return;
    const idx = FULL_TUTORIAL_SECTIONS.indexOf(s.sectionId);
    const prevId = idx > 0 ? FULL_TUTORIAL_SECTIONS[idx - 1] : undefined;
    if (!prevId) return;
    const prev = getSection(prevId);
    if (!prev) return;
    const stepIndex = prev.steps.length - 1;
    goToStepRoute(prev.steps[stepIndex]);
    set({
      sectionId: prevId,
      stepIndex,
      actionSatisfied: false,
      praise: null,
      progress: persist({
        ...s.progress,
        lastSection: prevId,
        lastStep: stepIndex,
      }),
    });
  },

  skipSection: () => {
    const s = get();
    if (!s.sectionId) return;
    set(finishSection(s, false));
  },

  exitTour: () => get().close(),

  applyEvent: (event) => {
    const s = get();
    if (s.view !== 'tour') return;
    const step = currentStep(s.sectionId, s.stepIndex);
    if (!step?.expectedAction) return;
    if (!actionsMatch(step.expectedAction, event)) return;
    if (s.actionSatisfied) return;
    set({
      actionSatisfied: true,
      praise: step.praise ?? 'Nice.',
    });
    window.setTimeout(() => {
      const cur = get();
      if (cur.view !== 'tour' || !cur.actionSatisfied) return;
      cur.next();
    }, 700);
  },

  resetProgress: () =>
    set({
      progress: persist(emptyProgress()),
      sectionId: null,
      stepIndex: 0,
      view: 'closed',
    }),

  showWelcomeAgain: () =>
    set((s) => ({
      view: 'welcome',
      progress: persist({
        ...s.progress,
        dismissedWelcome: false,
        skipped: false,
      }),
    })),

  resumeSavedRun: () => {
    const snap = loadTutorialRun();
    if (!snap) return;
    const section = getSection(snap.sectionId);
    if (!section) {
      clearTutorialRun();
      return;
    }
    const stepIndex = Math.min(
      Math.max(0, snap.stepIndex),
      section.steps.length - 1
    );
    set({
      view: 'tour',
      runKind: snap.runKind,
      sectionId: snap.sectionId,
      stepIndex,
      actionSatisfied: false,
      praise: null,
    });
  },
}));

useTutorialStore.subscribe(() => {
  syncRunSnapshot();
});

/** Home first-run wait. Long enough to let people click where they already meant to go. */
export const FIRST_RUN_HOME_DELAY_MS = 50_000;
export const HOME_BOTTOM_THRESHOLD_PX = 96;

export function shouldPromptFirstRun(
  progress: TutorialProgress,
  sessionLater: boolean
): boolean {
  if (progress.skipped || progress.completedFull || progress.dismissedWelcome) return false;
  return !sessionLater;
}

export function shouldOfferFirstRun(
  route: AppRoute,
  signedIn: boolean
): boolean {
  return route === 'home' && !signedIn;
}

export function isNearDocumentBottom({
  viewportHeight,
  scrollY,
  scrollHeight,
  thresholdPx = HOME_BOTTOM_THRESHOLD_PX,
}: {
  viewportHeight: number;
  scrollY: number;
  scrollHeight: number;
  thresholdPx?: number;
}): boolean {
  if (scrollHeight <= viewportHeight + thresholdPx) return false;
  return viewportHeight + scrollY >= scrollHeight - thresholdPx;
}

export function maybeShowFirstRun(signedIn: boolean): void {
  if (signedIn) return;
  if (loadTutorialRun()) return;
  const { progress, view } = useTutorialStore.getState();
  if (view !== 'closed') return;
  if (!shouldPromptFirstRun(progress, loadSessionLater())) return;
  useTutorialStore.getState().startWelcome();
}

export function replaceTutorialProgress(raw: unknown): void {
  useTutorialStore.setState({ progress: parseProgress(raw) });
}

export function getActiveStep(): TutorialStep | null {
  const { sectionId, stepIndex } = useTutorialStore.getState();
  return currentStep(sectionId, stepIndex);
}

export function currentRouteForStep(): AppRoute | undefined {
  return getActiveStep()?.route;
}
