import type { TutorialAction } from './tutorialTypes';

export function actionsMatch(
  expected: TutorialAction,
  event: TutorialAction
): boolean {
  if (expected.type !== event.type) return false;
  switch (expected.type) {
    case 'node-created':
      return event.type === 'node-created' && expected.nodeType === event.nodeType;
    case 'node-selected':
      return (
        event.type === 'node-selected' &&
        (!expected.nodeType || expected.nodeType === event.nodeType)
      );
    case 'node-data':
      return (
        event.type === 'node-data' &&
        expected.nodeType === event.nodeType &&
        (!expected.field || expected.field === event.field)
      );
    case 'route':
      return event.type === 'route' && expected.route === event.route;
    case 'settings-section':
      return event.type === 'settings-section' && expected.id === event.id;
    case 'node-count':
      return (
        event.type === 'node-count' &&
        expected.nodeType === event.nodeType &&
        event.min >= expected.min
      );
    case 'track-url':
      return (
        event.type === 'track-url' &&
        (event.min ?? 1) >= (expected.min ?? 1)
      );
    case 'track-parked':
      return (
        event.type === 'track-parked' &&
        (event.min ?? 1) >= (expected.min ?? 1)
      );
    case 'nodes-connected':
      return (
        event.type === 'nodes-connected' &&
        (!expected.sourceType || expected.sourceType === event.sourceType) &&
        (!expected.targetType || expected.targetType === event.targetType)
      );
    case 'viewport-changed':
      return (
        event.type === 'viewport-changed' &&
        (!expected.kind || expected.kind === event.kind)
      );
    default:
      return true;
  }
}

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+/]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}
