import { SIMPLE_TUTORIAL_ID } from '../tutorial/tutorialCatalog';

export type FirstUseTipId =
  | 'start'
  | 'end'
  | 'track'
  | 'conditional'
  | 'randomizer'
  | 'transition'
  | 'style'
  | 'comment'
  | 'connect';

export interface FirstUseTip {
  id: FirstUseTipId;
  title: string;
  body: string;
  tutorialId: string;
}

export const FIRST_USE_TIPS_KEY = 'synapse_editor_dismissed_tips';

export const FIRST_USE_TIPS: Record<FirstUseTipId, FirstUseTip> = {
  start: {
    id: 'start',
    title: 'Start',
    body: 'Playback begins from this node.',
    tutorialId: SIMPLE_TUTORIAL_ID,
  },
  end: {
    id: 'end',
    title: 'End',
    body: 'Playback stops here.',
    tutorialId: SIMPLE_TUTORIAL_ID,
  },
  track: {
    id: 'track',
    title: 'Track',
    body: 'A Track is one YouTube song on your music path.',
    tutorialId: 'track-nodes',
  },
  conditional: {
    id: 'conditional',
    title: 'Conditional',
    body: 'Chooses a path from rules you set.',
    tutorialId: 'conditionals',
  },
  randomizer: {
    id: 'randomizer',
    title: 'Randomizer',
    body: 'Chooses one of several next tracks.',
    tutorialId: 'randomizer',
  },
  transition: {
    id: 'transition',
    title: 'Transition',
    body: 'A gap between songs on the path.',
    tutorialId: 'transitions',
  },
  style: {
    id: 'style',
    title: 'Style',
    body: 'Changes the look during playback.',
    tutorialId: 'styles-themes',
  },
  comment: {
    id: 'comment',
    title: 'Comment',
    body: 'A note on the canvas. Comments are not in the queue.',
    tutorialId: 'comments',
  },
  connect: {
    id: 'connect',
    title: 'Connect nodes',
    body: 'Drag from a handle to another node. Playback follows those connections.',
    tutorialId: 'building',
  },
};

const NODE_TIP_IDS: FirstUseTipId[] = [
  'start',
  'end',
  'track',
  'conditional',
  'randomizer',
  'transition',
  'style',
  'comment',
];

export function isFirstUseTipId(value: unknown): value is FirstUseTipId {
  return typeof value === 'string' && value in FIRST_USE_TIPS;
}

export function loadDismissedTips(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(FIRST_USE_TIPS_KEY) || '[]') as unknown;
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function dismissFirstUseTip(id: FirstUseTipId): void {
  const next = loadDismissedTips();
  next.add(id);
  try {
    localStorage.setItem(FIRST_USE_TIPS_KEY, JSON.stringify([...next]));
  } catch {
    /* quota / private mode */
  }
}

export function pickFirstUseTip(args: {
  selectedType?: string | null;
  nodeCount: number;
  edgeCount: number;
  dismissed: Set<string>;
}): FirstUseTip | null {
  const selected = args.selectedType;
  if (selected && NODE_TIP_IDS.includes(selected as FirstUseTipId)) {
    const tip = FIRST_USE_TIPS[selected as FirstUseTipId];
    if (!args.dismissed.has(tip.id)) return tip;
  }
  if (args.nodeCount > 1 && args.edgeCount === 0 && !args.dismissed.has('connect')) {
    return FIRST_USE_TIPS.connect;
  }
  return null;
}
