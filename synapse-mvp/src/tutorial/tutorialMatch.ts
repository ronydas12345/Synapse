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
