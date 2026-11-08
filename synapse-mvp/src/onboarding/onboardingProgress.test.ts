import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../tutorial/tutorialStorage';
import { needsOnboarding } from './onboardingProgress';

describe('needsOnboarding', () => {
  it('offers onboarding to a brand-new signed-in account', () => {
    expect(needsOnboarding(emptyProgress())).toBe(true);
  });

  it('does not offer after onboarding is recorded', () => {
    expect(
      needsOnboarding({ ...emptyProgress(), onboardingCompleted: true })
    ).toBe(false);
  });

  it('grandfathers returning users who already used tutorials or skipped welcome', () => {
    expect(
      needsOnboarding({ ...emptyProgress(), dismissedWelcome: true })
    ).toBe(false);
    expect(needsOnboarding({ ...emptyProgress(), skipped: true })).toBe(false);
    expect(needsOnboarding({ ...emptyProgress(), completedFull: true })).toBe(false);
    expect(
      needsOnboarding({ ...emptyProgress(), completedSections: ['getting-started'] })
    ).toBe(false);
  });
});
