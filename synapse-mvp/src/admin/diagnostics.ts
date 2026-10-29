import { RELEASE_ID } from '../release/notes';
import { getSaveSnapshot } from '../cloud/persistGate';
import { pathToRoute } from '../app/routes';

export const FEEDBACK_CATEGORIES = [
  'Bug',
  'Playback',
  'Music Path editor',
  'Account and access',
  'Workshop',
  'Performance',
  'User interface',
  'Feature suggestion',
  'Other',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export function clientDiagnostics(): string {
  const save = getSaveSnapshot();
  const nav = typeof navigator === 'undefined' ? null : navigator;
  const path = typeof window === 'undefined' ? '' : window.location.pathname;
  return [
    `App ${RELEASE_ID}`,
    `Section ${pathToRoute(path) || path || 'unknown'}`,
    `Save ${save.status}${save.error ? ` (${save.error})` : ''}`,
    nav ? `Browser ${nav.userAgent.slice(0, 180)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
