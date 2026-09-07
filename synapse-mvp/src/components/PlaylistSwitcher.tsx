import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { usePathStore } from '../store';

export function PlaylistNameField({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const renamePlaylist = usePathStore((s) => s.renamePlaylist);
  const [draft, setDraft] = useState(name);

  useEffect(() => {
    setDraft(name);
  }, [id, name]);

  const commit = () => {
    const next = draft.trim().slice(0, 60);
    if (!next) {
      setDraft(name);
      return;
    }
    if (next !== name) renamePlaylist(id, next);
    else setDraft(name);
  };

  return (
    <input
      className={className}
      value={draft}
      maxLength={60}
      aria-label="Playlist name"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(name);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export default function PlaylistSwitcher() {
  const activePathId = usePathStore((s) => s.activePathId);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const switchPlaylist = usePathStore((s) => s.switchPlaylist);
  const createPlaylist = usePathStore((s) => s.createPlaylist);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const active = pathSummaries.find((p) => p.id === activePathId) || pathSummaries[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      {active ? (
        <PlaylistNameField
          id={active.id}
          name={active.name}
          className="synapse-playlist-name"
        />
      ) : null}
      <div className="synapse-playlist-switcher" ref={rootRef}>
        <button
          type="button"
          className="synapse-playlist-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Switch playlist"
          title="Switch playlist"
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
        {open ? (
          <div className="synapse-playlist-menu" role="listbox" aria-label="Playlists">
            {pathSummaries.map((path) => {
              const selected = path.id === activePathId;
              return (
                <button
                  key={path.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`synapse-playlist-option ${selected ? 'is-active' : ''}`}
                  onClick={() => {
                    switchPlaylist(path.id);
                    setOpen(false);
                  }}
                >
                  <span className="synapse-playlist-option-copy">
                    <span className="synapse-playlist-option-name">{path.name}</span>
                    <span className="synapse-playlist-option-meta">{path.visibility}</span>
                  </span>
                  {selected ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
                </button>
              );
            })}
            <button
              type="button"
              className="synapse-playlist-option synapse-playlist-new"
              onClick={() => {
                createPlaylist();
                setOpen(false);
              }}
            >
              <span className="synapse-playlist-plus" aria-hidden="true">
                <Plus className="w-3.5 h-3.5" />
              </span>
              <span className="synapse-playlist-option-copy">
                <span className="synapse-playlist-option-name">New playlist</span>
                <span className="synapse-playlist-option-meta">Start empty</span>
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}
