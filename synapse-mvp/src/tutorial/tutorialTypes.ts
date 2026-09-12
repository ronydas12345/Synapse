import type { AppRoute } from '../app/routes';

export type TutorialStepType =
  | 'info'
  | 'highlight'
  | 'action'
  | 'demo'
  | 'nav'
  | 'complete';

export type TutorialAction =
  | { type: 'node-created'; nodeType: string }
  | { type: 'nodes-connected' }
  | { type: 'node-selected'; nodeType?: string }
  | { type: 'node-deleted' }
  | { type: 'edge-deleted' }
  | { type: 'playing' }
  | { type: 'paused' }
  | { type: 'skip' }
  | { type: 'route'; route: AppRoute }
  | { type: 'track-url' }
  | { type: 'node-data'; nodeType: string; field?: string }
  | { type: 'settings-section'; id: string }
  | { type: 'theme-changed' };

export interface TutorialStep {
  id: string;
  title: string;
  body: string;
  type: TutorialStepType;
  /** Stable `data-tutorial` id on the target element. */
  target?: string;
  route?: AppRoute;
  hash?: string;
  expectedAction?: TutorialAction;
  praise?: string;
}

export interface TutorialSection {
  id: string;
  title: string;
  summary: string;
  keywords: string;
  group: TutorialGroupId;
  steps: TutorialStep[];
}

export type TutorialGroupId =
  | 'getting-started'
  | 'building'
  | 'customization'
  | 'play'
  | 'community'
  | 'advanced';

export interface TutorialGroup {
  id: TutorialGroupId;
  label: string;
  sectionIds: string[];
}

export interface TutorialProgress {
  version: 1;
  skipped: boolean;
  completedFull: boolean;
  completedSections: string[];
  lastSection: string | null;
  lastStep: number;
  dismissedWelcome: boolean;
}

export type TutorialView =
  | 'closed'
  | 'welcome'
  | 'menu'
  | 'topics'
  | 'skip-confirm'
  | 'tour'
  | 'complete';
