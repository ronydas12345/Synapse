import type { TutorialProgress } from '../tutorial/tutorialTypes';

export const ONBOARDING_VERSION = 1;

export function needsOnboarding(progress: TutorialProgress): boolean {
  if (progress.onboardingCompleted) return false;
  if (
    progress.dismissedWelcome ||
    progress.skipped ||
    progress.completedFull ||
    progress.completedSections.length > 0
  ) {
    return false;
  }
  return true;
}
