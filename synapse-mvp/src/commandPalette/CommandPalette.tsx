import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppRoute } from '../app/AppLink';
import { useAuthStore } from '../auth/authStore';
import { usePathStore } from '../store';
import { useThemeStore } from '../theme/themeStore';
import { hasWorkshopGuestSession } from '../workshop/guestSession';
import {
  buildCommands,
  COMMAND_GROUPS,
  filterCommands,
  type PaletteCommand,
} from './commands';
import { paletteShortcutLabel, usePaletteStore } from './paletteStore';
import { readRecentCommandIds, rememberCommandId } from './recent';

function grouped(commands: PaletteCommand[]): { group: string; items: PaletteCommand[] }[] {
  return COMMAND_GROUPS.map((group) => ({
    group,
    items: commands.filter((command) => command.group === group),
  })).filter((entry) => entry.items.length);
}

export function CommandPaletteButton({ className = '' }: { className?: string }) {
  const openPalette = usePaletteStore((s) => s.openPalette);
  return (
    <button
      type="button"
      className={`synapse-command-btn ${className}`.trim()}
      aria-label={`Command palette (${paletteShortcutLabel()})`}
      title={`Commands (${paletteShortcutLabel()})`}
      onClick={() => openPalette()}
    >
      <span className="synapse-command-btn-label">Commands</span>
      <kbd className="synapse-command-kbd">{paletteShortcutLabel()}</kbd>
    </button>
  );
}

export default function CommandPalette() {
  const route = useAppRoute();
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const role = useAuthStore((s) => s.role);
  const isPlaying = usePathStore((s) => s.isPlaying);
  const queueLength = usePathStore((s) => s.playbackQueue.length);
  const graphLocked = usePathStore((s) => s.graphLocked);
  const workshopWorkspace = graphLocked || hasWorkshopGuestSession();
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const activeThemeId = useThemeStore((s) => s.activeId);
  const customThemes = useThemeStore((s) => s.customThemes);
  const open = usePaletteStore((s) => s.open);
  const query = usePaletteStore((s) => s.query);
  const setQuery = usePaletteStore((s) => s.setQuery);
  const closePalette = usePaletteStore((s) => s.closePalette);
  const togglePalette = usePaletteStore((s) => s.togglePalette);
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);

  const commands = useMemo(
    () =>
      buildCommands({
        route,
        signedIn,
        role,
        isPlaying,
        queueLength,
        workshopWorkspace,
      }),
    [
      route,
      signedIn,
      role,
      isPlaying,
      queueLength,
      workshopWorkspace,
      pathSummaries,
      activePathId,
      activeThemeId,
      customThemes,
    ]
  );

  const sections = useMemo(() => {
    const matched = filterCommands(commands, query);
    if (query.trim()) return grouped(matched);
    const recentIds = readRecentCommandIds();
    const recentSet = new Set(recentIds);
    const recentItems = recentIds
      .map((id) => matched.find((command) => command.id === id))
      .filter((command): command is PaletteCommand => Boolean(command));
    const rest = matched.filter((command) => !recentSet.has(command.id));
    return [
      ...(recentItems.length ? [{ group: 'Recent', items: recentItems }] : []),
      ...grouped(rest),
    ];
  }, [commands, query]);
  const flat = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections]
  );

  useEffect(() => {
    setActive(0);
  }, [query, open, flat.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && !event.altKey && key === 'k') {
        event.preventDefault();
        togglePalette();
        return;
      }
      if (!usePaletteStore.getState().open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closePalette();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closePalette, togglePalette]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  function run(command: PaletteCommand) {
    rememberCommandId(command.id);
    closePalette();
    command.run();
  }

  function onInputKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = flat[active];
      if (command) run(command);
    }
  }

  let cursor = -1;

  return createPortal(
    <div
      className="synapse-command-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closePalette();
      }}
    >
      <div
        className="synapse-command-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <input
          ref={inputRef}
          className="synapse-command-input"
          value={query}
          placeholder={`Search commands (${paletteShortcutLabel()})`}
          aria-label="Search commands"
          aria-controls="synapse-command-list"
          aria-activedescendant={flat[active] ? `cmd-${flat[active].id}` : undefined}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onInputKey}
        />
        <div id="synapse-command-list" className="synapse-command-list" role="listbox">
          {flat.length === 0 ? (
            <p className="synapse-command-empty">No matching commands</p>
          ) : (
            sections.map((section) => (
              <div key={section.group} className="synapse-command-group">
                <p className="synapse-command-group-label">{section.group}</p>
                {section.items.map((command) => {
                  cursor += 1;
                  const index = cursor;
                  const selected = index === active;
                  return (
                    <button
                      key={command.id}
                      id={`cmd-${command.id}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`synapse-command-item${selected ? ' is-active' : ''}`}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => run(command)}
                    >
                      <span>{command.label}</span>
                      {command.shortcut ? (
                        <kbd className="synapse-command-kbd">{command.shortcut}</kbd>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
