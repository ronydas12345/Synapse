import { create } from 'zustand';
import { APP_PATHS, isAuthRoute, navigateApp, pathToRoute } from '../app/routes';
import { setEditorExperience } from '../editorExperience/useEditorExperience';
import type { EditorExperienceMode } from '../settings/types';
import { saveProgress } from '../tutorial/tutorialStorage';
import { useTutorialStore } from '../tutorial/tutorialStore';
import type { TutorialProgress } from '../tutorial/tutorialTypes';
import { isIdentityComplete } from '../auth/identity';
import { useAuthStore } from '../auth/authStore';
import { useProfileStore } from '../profile/profileStore';
import { isNewUserTestMode } from '../dev/testModeFlag';
import { openExamplePlaylist } from './examplePlaylist';
import { needsOnboarding, ONBOARDING_VERSION } from './onboardingProgress';

export type OnboardingStage = 'welcome' | 'concept' | 'start-path' | 'experience';
export type OnboardingIntent = 'quickstart' | 'explore' | 'example';

const STAGES: OnboardingStage[] = ['welcome', 'concept', 'start-path', 'experience'];

interface OnboardingState {
  open: boolean;
  stage: OnboardingStage;
  intent: OnboardingIntent | null;
  experience: EditorExperienceMode;
  openOnboarding: () => void;
  closeWithoutCompleting: () => void;
  skipToApp: () => void;
  setIntent: (intent: OnboardingIntent) => void;
  setExperience: (experience: EditorExperienceMode) => void;
  next: () => void;
  back: () => void;
  finish: () => void;
}

function writeOnboardingProgress(patch: Partial<TutorialProgress>): void {
  const progress = { ...useTutorialStore.getState().progress, ...patch };
  saveProgress(progress);
  useTutorialStore.setState({ progress });
}

function markOnboardingComplete(): void {
  writeOnboardingProgress({
    onboardingCompleted: true,
    onboardingVersion: ONBOARDING_VERSION,
    onboardingLastStep: STAGES.length - 1,
    dismissedWelcome: true,
  });
}

function rememberStage(stage: OnboardingStage): void {
  writeOnboardingProgress({
    onboardingLastStep: Math.max(0, STAGES.indexOf(stage)),
    onboardingVersion: ONBOARDING_VERSION,
  });
}

function applyFinish(intent: OnboardingIntent, experience: EditorExperienceMode): void {
  markOnboardingComplete();
  setEditorExperience(experience);
  navigateApp(APP_PATHS.edit);
  if (intent === 'example') openExamplePlaylist();
  if (intent === 'quickstart') {
    window.setTimeout(() => useTutorialStore.getState().startSimple(false), 40);
  }
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  open: false,
  stage: 'welcome',
  intent: null,
  experience: 'basic',

  openOnboarding: () => {
    rememberStage('welcome');
    set({
      open: true,
      stage: 'welcome',
      intent: null,
      experience: 'basic',
    });
  },

  closeWithoutCompleting: () => set({ open: false }),

  skipToApp: () => {
    markOnboardingComplete();
    set({ open: false, stage: 'welcome', intent: null });
    navigateApp(APP_PATHS.edit);
  },

  setIntent: (intent) => {
    rememberStage('experience');
    set({ intent, stage: 'experience' });
  },

  setExperience: (experience) => set({ experience }),

  next: () => {
    const { stage, intent } = get();
    const index = STAGES.indexOf(stage);
    if (stage === 'start-path' && !intent) return;
    if (stage === 'experience') {
      get().finish();
      return;
    }
    const nextStage = STAGES[index + 1];
    if (nextStage) {
      rememberStage(nextStage);
      set({ stage: nextStage });
    }
  },

  back: () => {
    const { stage } = get();
    const index = STAGES.indexOf(stage);
    if (index <= 0) return;
    const prev = STAGES[index - 1];
    rememberStage(prev);
    set({ stage: prev });
  },

  finish: () => {
    const { intent, experience } = get();
    set({ open: false, stage: 'welcome' });
    applyFinish(intent ?? 'explore', experience);
  },
}));

export function maybeOfferOnboarding(): void {
  const user = useAuthStore.getState().user;
  if (!user) return;
  if (isAuthRoute(pathToRoute(window.location.pathname))) return;
  const profile = useProfileStore.getState().profile;
  if (!isIdentityComplete(profile.username, profile.displayName)) return;
  const store = useOnboardingStore.getState();
  if (store.open) return;
  if (useTutorialStore.getState().view === 'tour') return;
  const progress = useTutorialStore.getState().progress;
  if (isNewUserTestMode()) {
    if (progress.onboardingCompleted) return;
    store.openOnboarding();
    return;
  }
  if (needsOnboarding(progress)) store.openOnboarding();
}
