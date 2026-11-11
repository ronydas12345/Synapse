import type { EditorExperienceMode } from '../settings/types';
import type { CanvasNodeType } from '../canvas/addNode';

export type { EditorExperienceMode };

export type TrackDetailLevel = 'simple' | 'balanced' | 'full';

export interface EditorExperienceConfig {
  mode: EditorExperienceMode;
  label: string;
  summary: string;
  leftDragPans: boolean;
  restoreViewportOnOpen: boolean;
  focusStartOnOpen: boolean;
  readableOpenZoom: number;
  rackDescriptions: boolean;
  nodeCaptions: boolean;
  firstUseTips: boolean;
  trackDetail: TrackDetailLevel;
}

export const EDITOR_EXPERIENCE_OPTIONS: {
  mode: EditorExperienceMode;
  label: string;
  summary: string;
}[] = [
  {
    mode: 'basic',
    label: 'Basic',
    summary: 'Simplified presentation and guidance.',
  },
  {
    mode: 'intermediate',
    label: 'Intermediate',
    summary: 'Balanced workspace and contextual help.',
  },
  {
    mode: 'advanced',
    label: 'Advanced',
    summary: 'Full interface and maximum information density.',
  },
];

const BY_MODE: Record<EditorExperienceMode, Omit<EditorExperienceConfig, 'mode'>> = {
  basic: {
    label: 'Basic',
    summary: 'Simplified presentation and guidance.',
    leftDragPans: true,
    restoreViewportOnOpen: true,
    focusStartOnOpen: true,
    readableOpenZoom: 1,
    rackDescriptions: true,
    nodeCaptions: true,
    firstUseTips: true,
    trackDetail: 'simple',
  },
  intermediate: {
    label: 'Intermediate',
    summary: 'Balanced workspace and contextual help.',
    leftDragPans: false,
    restoreViewportOnOpen: true,
    focusStartOnOpen: true,
    readableOpenZoom: 0.9,
    rackDescriptions: true,
    nodeCaptions: false,
    firstUseTips: false,
    trackDetail: 'balanced',
  },
  advanced: {
    label: 'Advanced',
    summary: 'Full interface and maximum information density.',
    leftDragPans: false,
    restoreViewportOnOpen: true,
    focusStartOnOpen: false,
    readableOpenZoom: 0.8,
    rackDescriptions: false,
    nodeCaptions: false,
    firstUseTips: false,
    trackDetail: 'full',
  },
};

export function experienceConfig(mode: EditorExperienceMode): EditorExperienceConfig {
  return { mode, ...BY_MODE[mode] };
}

export const NODE_CAPTIONS: Record<string, string> = {
  start: 'Playback begins from this node.',
  end: 'Playback stops here.',
  track: 'A YouTube song on your music path.',
  conditional: 'Chooses a path from rules you set, or a Choice popup.',
  randomizer: 'Chooses one of several next tracks.',
  transition: 'A gap between songs.',
  style: 'Changes the look during playback.',
  comment: 'A note on the canvas. Not in the queue.',
};

export const NODE_BLURBS: Record<CanvasNodeType, string> = {
  start: 'Playback begins here.',
  track: 'Add a song to your music path.',
  conditional: 'Choose a path using rules, or let the listener pick.',
  randomizer: 'Choose between multiple possible next tracks.',
  transition: 'Add a gap between songs.',
  style: 'Change the look during playback.',
  comment: 'Leave a note on the canvas.',
  end: 'Playback stops here.',
};

export type OpenViewportPlan =
  | { type: 'restore'; x: number; y: number; zoom: number }
  | { type: 'start'; x: number; y: number; zoom: number }
  | { type: 'fit' }
  | { type: 'keep' };

export function resolveOpenViewport(args: {
  saved: { x: number; y: number; zoom: number } | null;
  start: { x: number; y: number; width: number; height: number } | null;
  config: Pick<
    EditorExperienceConfig,
    'restoreViewportOnOpen' | 'focusStartOnOpen' | 'readableOpenZoom'
  >;
  fitOnSwitch: boolean;
}): OpenViewportPlan {
  if (args.saved && args.config.restoreViewportOnOpen) {
    return {
      type: 'restore',
      x: args.saved.x,
      y: args.saved.y,
      zoom: args.saved.zoom,
    };
  }
  if (args.config.focusStartOnOpen && args.start) {
    return {
      type: 'start',
      x: args.start.x + args.start.width / 2,
      y: args.start.y + args.start.height / 2,
      zoom: args.config.readableOpenZoom,
    };
  }
  if (args.fitOnSwitch) return { type: 'fit' };
  return { type: 'keep' };
}
