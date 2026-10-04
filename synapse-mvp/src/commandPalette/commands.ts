/**
 * Command catalog for Ctrl/Cmd+K.
 * Audit notes this palette is meant to cover: unclear current page,
 * Workshop buried off the workspace nav, Pause vs Stop, and settings
 * sections that were only reachable by scrolling.
 */
import { APP_PATHS, listenPath, navigateApp, pathToRoute, workshopItemPath, type AppRoute } from '../app/routes';
import { signOut } from '../auth/client';
import type { AuthRole } from '../auth/session';
import { addCanvasNode, CANVAS_NODE_TYPES } from '../canvas/addNode';
import { FIT_VIEW_EVENT } from '../canvas/fitEvents';
import { confirmDestructive } from '../settings/settingsStore';
import { usePathStore } from '../store';
import { allThemes, useThemeStore } from '../theme/themeStore';
import { useTutorialStore } from '../tutorial/tutorialStore';
import { commandHaystack, matchesCommandQuery, normalizeCommandQuery } from './search';

export type CommandGroup =
  | 'Go'
  | 'Playback'
  | 'Path'
  | 'Editor'
  | 'Settings'
  | 'Account'
  | 'Help';

export interface CommandContext {
  route: AppRoute;
  signedIn: boolean;
  role: AuthRole;
  isPlaying: boolean;
  queueLength: number;
  workshopWorkspace?: boolean;
}

export interface PaletteCommand {
  id: string;
  group: CommandGroup;
  label: string;
  keywords?: string;
  shortcut?: string;
  when?: (ctx: CommandContext) => boolean;
  run: () => void;
}

const SETTINGS: { id: string; label: string; keywords: string }[] = [
  { id: 'themes', label: 'Themes', keywords: 'appearance color font preset' },
  { id: 'appearance', label: 'Appearance', keywords: 'motion reduce animation' },
  { id: 'playlists', label: 'Playlists', keywords: 'library rename tags delete remove' },
  { id: 'general', label: 'General', keywords: 'language startup confirm' },
  { id: 'canvas', label: 'Canvas / Workspace', keywords: 'grid snap minimap zoom' },
  { id: 'connections', label: 'Connections / Arrows', keywords: 'edge bezier' },
  { id: 'nodes', label: 'Nodes', keywords: 'volume play count speed defaults' },
  { id: 'playback', label: 'Playback', keywords: 'volume skip youtube' },
  { id: 'visualizer', label: 'Visualizer', keywords: 'spectrum fft' },
  { id: 'environment', label: 'Environment', keywords: 'weather location' },
  { id: 'import', label: 'Import / Export', keywords: 'json file package' },
  { id: 'workshop', label: 'Workshop publish', keywords: 'share tags publish' },
  { id: 'account', label: 'Account', keywords: 'login username email' },
  { id: 'privacy', label: 'Privacy / Data', keywords: 'cache erase local' },
  { id: 'support', label: 'Support', keywords: 'faq help ticket' },
];

export { FIT_VIEW_EVENT, FIT_NODES_EVENT } from '../canvas/fitEvents';

function go(path: string, hash = ''): void {
  navigateApp(path, hash);
}

function onEdit(run: () => void): void {
  if (pathToRoute(window.location.pathname) !== 'edit') {
    go(APP_PATHS.edit);
    window.setTimeout(run, 40);
    return;
  }
  run();
}

export function buildCommands(ctx: CommandContext): PaletteCommand[] {
  const commands: PaletteCommand[] = [
    {
      id: 'go-home',
      group: 'Go',
      label: 'Go to Home',
      keywords: 'marketing landing',
      run: () => go(APP_PATHS.home),
    },
    {
      id: 'go-edit',
      group: 'Go',
      label: 'Go to Edit',
      keywords: 'canvas studio editor workspace path',
      when: (c) => c.signedIn || Boolean(c.workshopWorkspace),
      run: () => go(APP_PATHS.edit),
    },
    {
      id: 'go-listen',
      group: 'Go',
      label: 'Go to Listen',
      keywords: 'player now playing',
      when: (c) => c.signedIn || Boolean(c.workshopWorkspace),
      run: () => {
        const s = usePathStore.getState();
        go(listenPath(s.workshopShareKey ?? s.activePathId));
      },
    },
    {
      id: 'go-workshop',
      group: 'Go',
      label: 'Go to Workshop',
      keywords: 'catalog community public remix',
      run: () => go(APP_PATHS.workshop),
    },
    {
      id: 'go-workshop-listing',
      group: 'Go',
      label: 'Open this Workshop page',
      keywords: 'public listing playlist page share published',
      when: () => {
        const s = usePathStore.getState();
        const summary = s.pathSummaries.find((path) => path.id === s.activePathId);
        return Boolean(s.workshopShareKey || summary?.workshopId);
      },
      run: () => {
        const s = usePathStore.getState();
        const summary = s.pathSummaries.find((path) => path.id === s.activePathId);
        const key = s.workshopShareKey || summary?.workshopId;
        if (key) go(workshopItemPath(key));
      },
    },
    {
      id: 'go-settings',
      group: 'Go',
      label: 'Go to Settings',
      keywords: 'preferences',
      when: (c) => c.signedIn,
      run: () => go(APP_PATHS.settings),
    },
    {
      id: 'go-profile',
      group: 'Go',
      label: 'Go to Profile',
      keywords: 'account avatar badges',
      when: (c) => c.signedIn,
      run: () => go(APP_PATHS.profile),
    },
    {
      id: 'go-login',
      group: 'Go',
      label: 'Log in',
      keywords: 'sign in account',
      when: (c) => !c.signedIn,
      run: () => go(APP_PATHS.login),
    },
    {
      id: 'go-signup',
      group: 'Go',
      label: 'Create account',
      keywords: 'sign up register',
      when: (c) => !c.signedIn,
      run: () => go(APP_PATHS.signup),
    },
    {
      id: 'go-faq',
      group: 'Go',
      label: 'Go to FAQ',
      keywords: 'help questions',
      run: () => go(APP_PATHS.faq),
    },
    {
      id: 'go-changelog',
      group: 'Go',
      label: 'Go to Changelog',
      keywords: 'updates history',
      run: () => go(APP_PATHS.changelog),
    },
    {
      id: 'go-admin',
      group: 'Go',
      label: 'Go to Admin',
      when: (c) => c.role === 'admin' || c.role === 'superadmin',
      run: () => go(APP_PATHS.admin),
    },
    {
      id: 'go-superadmin',
      group: 'Go',
      label: 'Go to Superadmin',
      when: (c) => c.role === 'superadmin',
      run: () => go(APP_PATHS.superadmin),
    },
    {
      id: 'play',
      group: 'Playback',
      label: 'Play',
      keywords: 'start resume path',
      when: (c) => c.signedIn && !c.isPlaying,
      run: () => {
        onEdit(() => usePathStore.getState().setIsPlaying(true));
      },
    },
    {
      id: 'pause',
      group: 'Playback',
      label: 'Pause',
      keywords: 'hold keep queue',
      when: (c) => c.signedIn && c.isPlaying,
      run: () => usePathStore.getState().setIsPlaying(false),
    },
    {
      id: 'stop',
      group: 'Playback',
      label: 'Stop',
      keywords: 'end session clear queue',
      when: (c) => c.signedIn && (c.isPlaying || c.queueLength > 0),
      run: () => usePathStore.getState().requestStop(),
    },
    {
      id: 'skip',
      group: 'Playback',
      label: 'Skip to next',
      keywords: 'forward next track',
      when: (c) => c.signedIn && c.queueLength > 0,
      run: () => usePathStore.getState().requestSkip(),
    },
    {
      id: 'previous',
      group: 'Playback',
      label: 'Previous track',
      keywords: 'back rewind',
      when: (c) => c.signedIn && c.queueLength > 0,
      run: () => usePathStore.getState().requestPrevious(),
    },
    {
      id: 'new-path',
      group: 'Path',
      label: 'New playlist',
      keywords: 'create path library',
      when: (c) => c.signedIn,
      run: () => {
        usePathStore.getState().createPlaylist('Untitled');
        go(APP_PATHS.edit);
      },
    },
    {
      id: 'delete-path',
      group: 'Path',
      label: 'Delete playlist…',
      keywords: 'remove library erase',
      when: (c) => c.signedIn,
      run: () => go(APP_PATHS.settings, 'settings-playlists'),
    },
    {
      id: 'fit-view',
      group: 'Editor',
      label: 'Fit path in view',
      keywords: 'zoom canvas overview',
      when: (c) => c.signedIn,
      run: () =>
        onEdit(() => window.dispatchEvent(new Event(FIT_VIEW_EVENT))),
    },
    {
      id: 'bring-selected',
      group: 'Editor',
      label: 'Bring selected onto page',
      keywords: 'layout gather selected sequence name',
      when: (c) => c.signedIn,
      run: () => onEdit(() => usePathStore.getState().bringNodesOntoPage('selected')),
    },
    {
      id: 'bring-all',
      group: 'Editor',
      label: 'Bring all onto page',
      keywords: 'layout gather named travel childhood techno',
      when: (c) => c.signedIn,
      run: () => onEdit(() => usePathStore.getState().bringNodesOntoPage('all')),
    },
    {
      id: 'normalize',
      group: 'Editor',
      label: 'Normalize conditionals',
      keywords: 'flatten splitter',
      when: (c) => c.signedIn,
      run: () =>
        onEdit(() => usePathStore.getState().normalizeSplitters()),
    },
    {
      id: 'delete-selected',
      group: 'Editor',
      label: 'Delete selected node',
      keywords: 'remove backspace',
      when: (c) => c.signedIn,
      run: () =>
        onEdit(() => {
          const { selectedNodeId, selectedNodeIds, deleteNode } =
            usePathStore.getState();
          const ids = selectedNodeIds.length
            ? selectedNodeIds
            : selectedNodeId
              ? [selectedNodeId]
              : [];
          if (!ids.length) return;
          if (!confirmDestructive('Delete the selected node(s)?')) return;
          ids.forEach((id) => deleteNode(id));
        }),
    },
    {
      id: 'remove-all',
      group: 'Editor',
      label: 'Remove all nodes',
      keywords: 'clear canvas empty',
      when: (c) => c.signedIn,
      run: () =>
        onEdit(() => {
          if (!confirmDestructive('Remove all nodes and connections?')) return;
          const store = usePathStore.getState();
          store.setNodes([]);
          store.setEdges([]);
          store.setSelection([]);
          store.setPlaybackStartNode(null);
        }),
    },
    {
      id: 'help',
      group: 'Help',
      label: 'Help & tutorial',
      keywords: 'tour guide learn',
      run: () => useTutorialStore.getState().openMenu(),
    },
    {
      id: 'sign-out',
      group: 'Account',
      label: 'Sign out',
      keywords: 'logout log out',
      when: (c) => c.signedIn,
      run: () => void signOut(),
    },
  ];

  for (const type of CANVAS_NODE_TYPES) {
    commands.push({
      id: `add-${type.type}`,
      group: 'Editor',
      label: `Add ${type.label} node`,
      keywords: `create ${type.type} rack`,
      when: (c) => c.signedIn,
      run: () => onEdit(() => addCanvasNode(type.type)),
    });
  }

  for (const section of SETTINGS) {
    commands.push({
      id: `settings-${section.id}`,
      group: 'Settings',
      label: `Settings · ${section.label}`,
      keywords: section.keywords,
      when: (c) => c.signedIn,
      run: () => go(APP_PATHS.settings, `settings-${section.id}`),
    });
  }

  const path = usePathStore.getState();
  for (const summary of path.pathSummaries) {
    const current = summary.id === path.activePathId;
    commands.push({
      id: `path-${summary.id}`,
      group: 'Path',
      label: current ? `Current playlist: ${summary.name}` : `Switch to ${summary.name}`,
      keywords: `playlist library ${summary.visibility}`,
      when: (c) => c.signedIn && !current,
      run: () => {
        usePathStore.getState().switchPlaylist(summary.id);
        go(APP_PATHS.edit);
      },
    });
  }

  const themeState = useThemeStore.getState();
  for (const theme of allThemes(themeState.customThemes)) {
    const current = theme.id === themeState.activeId;
    commands.push({
      id: `theme-${theme.id}`,
      group: 'Settings',
      label: current ? `Current theme: ${theme.name}` : `Use theme ${theme.name}`,
      keywords: 'appearance preset custom',
      when: (c) => c.signedIn && !current,
      run: () => useThemeStore.getState().setActiveId(theme.id),
    });
  }

  return commands.filter((command) => !command.when || command.when(ctx));
}

export function filterCommands(
  commands: PaletteCommand[],
  query: string
): PaletteCommand[] {
  const tokens = normalizeCommandQuery(query);
  return commands.filter((command) =>
    matchesCommandQuery(
      commandHaystack(command.label, command.group, command.keywords),
      tokens
    )
  );
}

export const COMMAND_GROUPS: CommandGroup[] = [
  'Go',
  'Playback',
  'Path',
  'Editor',
  'Settings',
  'Account',
  'Help',
];
