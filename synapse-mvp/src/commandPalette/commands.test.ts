import { describe, expect, it } from 'vitest';
import { buildCommands, filterCommands, type PaletteCommand } from './commands';
import { matchesCommandQuery, normalizeCommandQuery } from './search';

const commands: PaletteCommand[] = [
  {
    id: 'go-edit',
    group: 'Go',
    label: 'Go to Edit',
    keywords: 'canvas studio',
    run: () => undefined,
  },
  {
    id: 'pause',
    group: 'Playback',
    label: 'Pause',
    keywords: 'hold queue',
    run: () => undefined,
  },
  {
    id: 'add-track',
    group: 'Editor',
    label: 'Add Track node',
    keywords: 'create track rack',
    run: () => undefined,
  },
];

describe('command search', () => {
  it('requires every token to match', () => {
    expect(normalizeCommandQuery('  Add   Track ')).toEqual(['add', 'track']);
    expect(matchesCommandQuery('add track node editor', ['add', 'node'])).toBe(true);
    expect(matchesCommandQuery('add track node editor', ['add', 'theme'])).toBe(false);
  });

  it('filters the catalog by label, group, and keywords', () => {
    expect(filterCommands(commands, 'studio').map((command) => command.id)).toEqual([
      'go-edit',
    ]);
    expect(filterCommands(commands, 'track node').map((command) => command.id)).toEqual([
      'add-track',
    ]);
    expect(filterCommands(commands, 'queue')).toEqual([commands[1]]);
    expect(filterCommands(commands, 'xyzzy')).toEqual([]);
  });
});

describe('buildCommands', () => {
  it('hides workspace commands until the user is signed in', () => {
    const guest = buildCommands({
      route: 'home',
      signedIn: false,
      role: 'user',
      isPlaying: false,
      queueLength: 0,
    });
    expect(guest.some((command) => command.id === 'go-login')).toBe(true);
    expect(guest.some((command) => command.id === 'go-edit')).toBe(false);
    expect(guest.some((command) => command.id === 'play')).toBe(false);
    expect(guest.some((command) => command.id === 'delete-path')).toBe(false);

    const workshopGuest = buildCommands({
      route: 'listen',
      signedIn: false,
      role: 'user',
      isPlaying: true,
      queueLength: 0,
      workshopWorkspace: true,
    });
    expect(workshopGuest.some((command) => command.id === 'go-edit')).toBe(true);
    expect(workshopGuest.some((command) => command.id === 'go-listen')).toBe(true);
    expect(workshopGuest.some((command) => command.id === 'go-settings')).toBe(false);

    const member = buildCommands({
      route: 'edit',
      signedIn: true,
      role: 'user',
      isPlaying: true,
      queueLength: 2,
    });
    expect(member.some((command) => command.id === 'go-edit')).toBe(true);
    expect(member.some((command) => command.id === 'pause')).toBe(true);
    expect(member.some((command) => command.id === 'stop')).toBe(true);
    expect(member.some((command) => command.id === 'delete-path')).toBe(true);
    expect(member.some((command) => command.id === 'go-login')).toBe(false);
  });
});
