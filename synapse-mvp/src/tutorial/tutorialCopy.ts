import type { EditorExperienceMode } from '../settings/types';
import type { TutorialStep } from './tutorialTypes';

export function stepBody(
  step: TutorialStep,
  mode: EditorExperienceMode
): string {
  if (mode === 'basic' && step.basicBody) return step.basicBody;
  if (mode === 'advanced' && step.advancedBody) return step.advancedBody;
  return step.body;
}

export function spotlightPad(mode: EditorExperienceMode): number {
  if (mode === 'basic') return 14;
  if (mode === 'advanced') return 6;
  return 8;
}

export function showHintByDefault(mode: EditorExperienceMode): boolean {
  return mode === 'basic';
}

export function playlistLooksNamed(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  return trimmed.length > 0 && !trimmed.startsWith('untitled');
}
