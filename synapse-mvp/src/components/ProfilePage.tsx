import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { GripVertical, Plus, Trash2, UserRound, X } from 'lucide-react';
import { lookupTrackCredits } from '../metadata';
import { extractYouTubeId } from '../playback';
import { osmEmbedUrl, suggestPlaces, type PlaceSuggestion } from '../profile/geocode';
import {
  activitySeries,
  averageListens,
  displayNameError,
  usernameError,
  useProfileStore,
} from '../profile/profileStore';
import {
  GENRE_PRESETS,
  OPTIONAL_SECTIONS,
  SECTION_LABELS,
  type OptionalSectionId,
} from '../profile/types';
import { cropAndFitAvatar, clampPan, coverScale, cropFromViewport } from '../profile/avatarImage';
import { usePathStore } from '../store';

type DropEdge = 'before' | 'after';

interface SectionDragApi {
  editing: boolean;
  draggingId: OptionalSectionId | null;
  dropHint: { id: OptionalSectionId; edge: DropEdge } | null;
  beginDrag: (id: OptionalSectionId) => void;
  endDrag: () => void;
  hintDrop: (hint: { id: OptionalSectionId; edge: DropEdge } | null) => void;
  commitDrop: (
    fromId: OptionalSectionId,
    toId: OptionalSectionId,
    edge: DropEdge
  ) => void;
}

const SectionDragContext = createContext<SectionDragApi | null>(null);

function SectionDragProvider({
  editing,
  children,
  onReorder,
}: {
  editing: boolean;
  children: ReactNode;
  onReorder: (
    fromId: OptionalSectionId,
    toId: OptionalSectionId,
    edge: DropEdge
  ) => void;
}) {
  const [draggingId, setDraggingId] = useState<OptionalSectionId | null>(null);
  const [dropHint, setDropHint] = useState<{
    id: OptionalSectionId;
    edge: DropEdge;
  } | null>(null);

  const value = useMemo<SectionDragApi>(
    () => ({
      editing,
      draggingId,
      dropHint,
      beginDrag: (id) => setDraggingId(id),
      endDrag: () => {
        setDraggingId(null);
        setDropHint(null);
      },
      hintDrop: setDropHint,
      commitDrop: (fromId, toId, edge) => {
        onReorder(fromId, toId, edge);
        setDraggingId(null);
        setDropHint(null);
      },
    }),
    [editing, draggingId, dropHint, onReorder]
  );

  return (
    <SectionDragContext.Provider value={value}>
      <div
        className="synapse-profile-grid"
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDropHint(null);
          }
        }}
      >
        {children}
      </div>
    </SectionDragContext.Provider>
  );
}

function makeSectionGhost(section: HTMLElement): HTMLElement {
  const frameHeights = [...section.querySelectorAll('iframe')].map(
    (frame) => frame.getBoundingClientRect().height
  );
  const ghost = section.cloneNode(true) as HTMLElement;
  ghost.removeAttribute('data-section');
  ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  ghost.querySelectorAll('iframe').forEach((frame, i) => {
    const ph = document.createElement('div');
    ph.className = 'synapse-profile-ghost-frame';
    ph.style.height = `${frameHeights[i] || 120}px`;
    frame.replaceWith(ph);
  });
  ghost.classList.add('is-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.width = `${section.offsetWidth}px`;
  ghost.style.position = 'fixed';
  ghost.style.top = '-12000px';
  ghost.style.left = '0';
  ghost.style.margin = '0';
  ghost.style.pointerEvents = 'none';
  document.body.appendChild(ghost);
  return ghost;
}

function SectionChrome({
  id,
  children,
  onHide,
}: {
  id: OptionalSectionId;
  children: ReactNode;
  onHide: (id: OptionalSectionId) => void;
}) {
  const drag = useContext(SectionDragContext);
  const sectionRef = useRef<HTMLElement>(null);
  const ghostRef = useRef<HTMLElement | null>(null);
  const editing = drag?.editing ?? false;
  const dragging = drag?.draggingId === id;
  const hint =
    drag?.dropHint?.id === id && drag.draggingId !== id ? drag.dropHint.edge : null;

  const clearGhost = () => {
    ghostRef.current?.remove();
    ghostRef.current = null;
  };

  useEffect(() => () => clearGhost(), []);

  const onHandleDragStart = (event: DragEvent<HTMLElement>) => {
    if (!drag || !editing) {
      event.preventDefault();
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
    const rect = section.getBoundingClientRect();
    const ghost = makeSectionGhost(section);
    ghostRef.current = ghost;
    event.dataTransfer.setDragImage(
      ghost,
      event.clientX - rect.left,
      event.clientY - rect.top
    );
    requestAnimationFrame(() => drag.beginDrag(id));
  };

  const onHandleDragEnd = () => {
    clearGhost();
    drag?.endDrag();
  };

  return (
    <section
      ref={sectionRef}
      className={[
        'synapse-profile-section',
        dragging ? 'is-dragging' : '',
        hint === 'before' ? 'is-drop-before' : '',
        hint === 'after' ? 'is-drop-after' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-section={id}
      aria-labelledby={`profile-${id}`}
      onDragOver={(event) => {
        if (!drag?.editing || !drag.draggingId) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (drag.draggingId === id) {
          drag.hintDrop(null);
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        const edge: DropEdge =
          event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        if (drag.dropHint?.id !== id || drag.dropHint.edge !== edge) {
          drag.hintDrop({ id, edge });
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (!drag) return;
        const from = (event.dataTransfer.getData('text/plain') ||
          drag.draggingId) as OptionalSectionId | null;
        const edge = drag.dropHint?.id === id ? drag.dropHint.edge : 'before';
        if (from) drag.commitDrop(from, id, edge);
        clearGhost();
      }}
    >
      {hint ? (
        <span
          className={`synapse-profile-drop-line is-${hint}`}
          aria-hidden="true"
        />
      ) : null}
      <div className="synapse-profile-section-head">
        <div className="synapse-profile-section-title">
          {editing ? (
            <span
              className="synapse-profile-drag"
              role="button"
              tabIndex={0}
              aria-label={`Drag to reorder ${SECTION_LABELS[id]}`}
              title="Drag to reorder"
              draggable
              onDragStart={onHandleDragStart}
              onDragEnd={onHandleDragEnd}
            >
              <GripVertical className="w-4 h-4" />
            </span>
          ) : null}
          <h2 id={`profile-${id}`}>{SECTION_LABELS[id]}</h2>
        </div>
        {editing ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-danger"
            onClick={() => onHide(id)}
          >
            Remove
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function LocationSection({ editing }: { editing: boolean }) {
  const profile = useProfileStore((s) => s.profile);
  const patch = useProfileStore((s) => s.patch);
  const listId = useId();
  const [query, setQuery] = useState(profile.location);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const skipSuggest = useRef(false);

  useEffect(() => {
    setQuery(profile.location);
  }, [profile.location]);

  useEffect(() => {
    if (!editing) return;
    if (skipSuggest.current) {
      skipSuggest.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    if (q === profile.location.trim() && profile.locationLat != null) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void suggestPlaces(q).then((places) => {
        setSuggestions(places);
        setOpen(places.length > 0);
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, editing, profile.location, profile.locationLat]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const mapUrl =
    profile.locationLat != null && profile.locationLon != null
      ? osmEmbedUrl(profile.locationLat, profile.locationLon)
      : null;

  const choose = (place: PlaceSuggestion) => {
    skipSuggest.current = true;
    setQuery(place.label);
    setSuggestions([]);
    setOpen(false);
    patch({
      location: place.label,
      locationLat: place.lat,
      locationLon: place.lon,
    });
  };

  if (!editing) {
    if (!profile.location) {
      return <p className="synapse-settings-lead">No location yet.</p>;
    }
    return (
      <>
        <p className="synapse-profile-place-label">{profile.location}</p>
        {mapUrl ? (
          <div className="synapse-map-preview">
            <iframe title="Location map preview" src={mapUrl} loading="lazy" />
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="synapse-place-suggest" ref={boxRef}>
      <label className="synapse-settings-field">
        Search a place
        <input
          className="synapse-settings-input"
          value={query}
          onChange={(e) => {
            const value = e.target.value.slice(0, 120);
            setQuery(value);
            setOpen(true);
            if (!value.trim()) {
              patch({ location: '', locationLat: null, locationLon: null });
            } else {
              patch({ location: value });
            }
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="City, neighborhood, venue"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
        />
      </label>
      {open && suggestions.length > 0 ? (
        <ul id={listId} className="synapse-place-list" role="listbox">
          {suggestions.map((place) => (
            <li key={`${place.label}-${place.lat}-${place.lon}`}>
              <button type="button" role="option" onClick={() => choose(place)}>
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {mapUrl ? (
        <div className="synapse-map-preview">
          <iframe title="Location map preview" src={mapUrl} loading="lazy" />
        </div>
      ) : (
        <p className="synapse-settings-hint">
          Pick a suggestion to pin a map preview.
        </p>
      )}
    </div>
  );
}

function fileFromDrop(event: DragEvent<HTMLElement>): File | undefined {
  const files = event.dataTransfer?.files;
  if (!files?.length) return undefined;
  return [...files].find((file) => file.type.startsWith('image/')) ?? files[0];
}

function revokeIfBlob(url: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

function AvatarModal({
  error,
  onClose,
  onApply,
  onRemove,
}: {
  error: string;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const profile = useProfileStore((s) => s.profile);
  const fileId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState(256);
  const [cropBusy, setCropBusy] = useState(false);
  const [cropError, setCropError] = useState('');

  const clearCrop = () => {
    setCropSrc((current) => {
      revokeIfBlob(current);
      return null;
    });
    setNatural(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCropBusy(false);
    setCropError('');
  };

  useEffect(() => {
    return () => revokeIfBlob(cropSrc);
  }, [cropSrc]);

  useLayoutEffect(() => {
    if (!cropSrc || !stageRef.current) return;
    const stage = stageRef.current;
    const update = () => setStageSize(stage.clientWidth || 256);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [cropSrc]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (cropSrc) {
        clearCrop();
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cropSrc, onClose]);

  const clampedPan = (nextZoom: number, nextPan: { x: number; y: number }) => {
    if (!natural) return nextPan;
    const scale = coverScale(natural.w, natural.h, stageSize) * nextZoom;
    return {
      x: clampPan(nextPan.x, natural.w * scale, stageSize),
      y: clampPan(nextPan.y, natural.h * scale, stageSize),
    };
  };

  const beginCrop = (src: string) => {
    revokeIfBlob(cropSrc);
    setCropSrc(src);
    setNatural(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCropError('');
  };

  const takeFile = (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      setCropError('Choose an image file.');
      return;
    }
    beginCrop(URL.createObjectURL(file));
  };

  const applyCrop = async () => {
    const image = imageRef.current;
    if (!image || !natural) return;
    setCropBusy(true);
    setCropError('');
    try {
      const viewport = stageRef.current?.clientWidth || stageSize;
      const crop = cropFromViewport({
        naturalWidth: natural.w,
        naturalHeight: natural.h,
        viewport,
        zoom,
        panX: pan.x,
        panY: pan.y,
      });
      const dataUrl = await cropAndFitAvatar(image, crop);
      onApply(dataUrl);
      clearCrop();
    } catch (caught) {
      setCropError(
        caught instanceof Error ? caught.message : 'Could not crop that image.'
      );
    } finally {
      setCropBusy(false);
    }
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan(
      clampedPan(zoom, {
        x: drag.panX + (event.clientX - drag.x),
        y: drag.panY + (event.clientY - drag.y),
      })
    );
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  const onWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nextZoom = Math.min(4, Math.max(1, zoom + (event.deltaY > 0 ? -0.12 : 0.12)));
    setZoom(nextZoom);
    setPan((current) => clampedPan(nextZoom, current));
  };

  const cropScale = natural
    ? coverScale(natural.w, natural.h, stageSize) * zoom
    : 1;
  const cropStyle = natural
    ? {
        width: natural.w * cropScale,
        height: natural.h * cropScale,
        transform: `translate(${(stageSize - natural.w * cropScale) / 2 + pan.x}px, ${(stageSize - natural.h * cropScale) / 2 + pan.y}px)`,
      }
    : undefined;

  const onDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    dragDepth.current += 1;
    if (event.dataTransfer?.types.includes('Files')) setDragOver(true);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    takeFile(fileFromDrop(event));
  };

  return (
    <div
      className="synapse-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (cropSrc) clearCrop();
        else onClose();
      }}
    >
      <div
        className={`synapse-modal${cropSrc ? ' is-crop' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-picture-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="synapse-modal-head">
          <h2 id="profile-picture-title">
            {cropSrc ? 'Crop picture' : 'Profile picture'}
          </h2>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {cropSrc ? (
          <>
            <div
              ref={stageRef}
              className="synapse-crop-stage"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
              onWheel={onWheel}
            >
              <img
                ref={imageRef}
                className="synapse-crop-image"
                src={cropSrc}
                alt=""
                draggable={false}
                onLoad={(event) => {
                  const el = event.currentTarget;
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                onError={() => {
                  revokeIfBlob(cropSrc);
                  setCropSrc(null);
                  setNatural(null);
                  setCropError('Could not read that image.');
                }}
                style={cropStyle}
              />
              <div className="synapse-crop-frame" aria-hidden="true" />
            </div>
            <label className="synapse-crop-zoom">
              Zoom
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                disabled={!natural || cropBusy}
                onChange={(event) => {
                  const nextZoom = Number(event.target.value);
                  setZoom(nextZoom);
                  setPan((current) => clampedPan(nextZoom, current));
                }}
              />
            </label>
            {cropError ? <p className="synapse-settings-error">{cropError}</p> : null}
            <p className="synapse-settings-hint">
              Drag to reposition. Use the slider or scroll to zoom. The circle is
              what people will see.
            </p>
            <div className="synapse-modal-actions">
              <button
                type="button"
                className="synapse-btn synapse-btn-ghost"
                disabled={cropBusy}
                onClick={clearCrop}
              >
                Cancel
              </button>
              <button
                type="button"
                className="synapse-btn synapse-btn-play"
                disabled={!natural || cropBusy}
                onClick={() => void applyCrop()}
              >
                {cropBusy ? 'Saving…' : 'Apply crop'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="synapse-modal-avatar">
              {profile.avatarDataUrl ? (
                <img src={profile.avatarDataUrl} alt="" />
              ) : (
                <UserRound className="w-12 h-12" />
              )}
            </div>
            <label
              className={`synapse-dropzone${dragOver ? ' is-hover' : ''}`}
              htmlFor={fileId}
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                id={fileId}
                className="synapse-sr-only"
                type="file"
                accept="image/*"
                onChange={(e) => takeFile(e.target.files?.[0])}
              />
              <span className="synapse-dropzone-copy">
                Drop an image here, or{' '}
                <span className="synapse-dropzone-browse">browse</span>
              </span>
            </label>
            {error || cropError ? (
              <p className="synapse-settings-error">{error || cropError}</p>
            ) : null}
            <p className="synapse-settings-hint">
              JPEG, PNG, or WebP. Crop after you add a picture. Files over 400 KB
              are scaled down.
            </p>
            <div className="synapse-modal-actions">
              {profile.avatarDataUrl ? (
                <>
                  <button
                    type="button"
                    className="synapse-btn synapse-btn-ghost"
                    onClick={() => beginCrop(profile.avatarDataUrl as string)}
                  >
                    Crop picture
                  </button>
                  <button
                    type="button"
                    className="synapse-btn synapse-btn-danger"
                    onClick={onRemove}
                  >
                    Remove picture
                  </button>
                </>
              ) : null}
              <button type="button" className="synapse-btn synapse-btn-play" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const setPlaylistVisibility = usePathStore((s) => s.setPlaylistVisibility);
  const {
    setUsername,
    setDisplayName,
    setVisibility,
    setAvatarDataUrl,
    patch,
    addGenre,
    removeGenre,
    addSong,
    removeSong,
    hideSection,
    showSection,
    reorderSections,
  } = useProfileStore();

  const needsSetup = !profile.username || !profile.displayName.trim();
  const [editing, setEditing] = useState(needsSetup);
  const [genreDraft, setGenreDraft] = useState('');
  const [songDraft, setSongDraft] = useState('');
  const [songBusy, setSongBusy] = useState(false);
  const [songError, setSongError] = useState('');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const userErr = usernameError(profile.username);
  const nameErr = displayNameError(profile.displayName);
  const canSave = !userErr && !nameErr;
  const avg = averageListens(profile);
  const series = activitySeries(profile.listensByDay, 84);
  const peak = Math.max(1, ...series);

  const visibleOrder = profile.sectionOrder.filter(
    (id) => !profile.hiddenSections.includes(id)
  );
  const hiddenOrder = OPTIONAL_SECTIONS.filter((id) =>
    profile.hiddenSections.includes(id)
  );

  const handleAvatar = (dataUrl: string) => {
    setAvatarError('');
    setAvatarDataUrl(dataUrl);
  };

  const addFavoriteSong = async () => {
    const videoId = extractYouTubeId(songDraft);
    if (!videoId) {
      setSongError('Paste a YouTube URL or 11-character id.');
      return;
    }
    setSongBusy(true);
    setSongError('');
    try {
      const credits = await lookupTrackCredits(videoId);
      addSong({
        videoId,
        title: credits?.songTitle || 'YouTube track',
        artist: credits?.artist || '',
        album: credits?.album || '',
      });
      setSongDraft('');
    } catch {
      setSongError('Could not look up that video. Try another id.');
    } finally {
      setSongBusy(false);
    }
  };

  const publicPaths = pathSummaries.filter((p) => p.visibility === 'public');
  const shownPaths =
    profile.visibility === 'public' && !editing ? publicPaths : pathSummaries;

  return (
    <div className="synapse-profile">
      <div className="synapse-profile-hero">
        <div className="synapse-profile-identity">
          <button
            type="button"
            className="synapse-profile-avatar"
            onClick={() => {
              setAvatarError('');
              setAvatarOpen(true);
            }}
            aria-label="Edit profile picture"
          >
            {profile.avatarDataUrl ? (
              <img src={profile.avatarDataUrl} alt="" />
            ) : (
              <UserRound className="w-10 h-10" />
            )}
          </button>
          <div>
            <p className="synapse-section-label">
              {profile.visibility === 'public' ? 'Public profile' : 'Private profile'}
            </p>
            <h1 className="synapse-profile-title">
              {profile.displayName.trim() || 'Your profile'}
            </h1>
            <p className="synapse-profile-handle">
              {profile.username ? `@${profile.username}` : 'Choose a username'}
            </p>
          </div>
        </div>
        <div className="synapse-profile-actions">
          {editing ? (
            <button
              type="button"
              className="synapse-btn synapse-btn-play"
              disabled={!canSave}
              onClick={() => canSave && setEditing(false)}
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              className="synapse-btn synapse-btn-play"
              onClick={() => setEditing(true)}
            >
              Edit profile
            </button>
          )}
        </div>
      </div>

      <div className="synapse-profile-body">
      {needsSetup && editing ? (
        <p className="synapse-settings-lead">
          Username and display name are required. Everything else is optional
          and can be hidden.
        </p>
      ) : null}

      <section className="synapse-profile-section synapse-profile-identity-card" data-section="identity">
        <h2>Identity</h2>
        {editing ? (
          <>
            <label className="synapse-settings-field">
              Username
              <input
                className="synapse-settings-input"
                value={profile.username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_name"
                autoComplete="username"
              />
            </label>
            {userErr ? <p className="synapse-settings-error">{userErr}</p> : null}
            <label className="synapse-settings-field">
              Display name
              <input
                className="synapse-settings-input"
                value={profile.displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you appear"
                autoComplete="nickname"
              />
            </label>
            {nameErr ? <p className="synapse-settings-error">{nameErr}</p> : null}
            <label className="synapse-settings-field">
              Profile visibility
              <select
                className="synapse-settings-input"
                value={profile.visibility}
                onChange={(e) =>
                  setVisibility(e.target.value === 'public' ? 'public' : 'private')
                }
              >
                <option value="private">Private — only you</option>
                <option value="public">Public — shareable later</option>
              </select>
            </label>
            <p className="synapse-settings-hint">
              Cloud sharing is not live yet. Visibility is saved locally so it
              is ready when accounts exist.
            </p>
          </>
        ) : (
          <p className="synapse-settings-lead">
            {profile.visibility === 'public'
              ? 'This profile is marked public. Workshop discovery is not live yet.'
              : 'This profile is private. Optional sections below are only on this device.'}
          </p>
        )}
      </section>

      <SectionDragProvider editing={editing} onReorder={reorderSections}>
        {visibleOrder.map((id) => {
          if (id === 'location') {
            return (
              <SectionChrome key={id} id={id} onHide={hideSection}>
                <LocationSection editing={editing} />
              </SectionChrome>
            );
          }

          if (id === 'bio') {
            return (
              <SectionChrome key={id} id={id} onHide={hideSection}>
                {editing ? (
                  <label className="synapse-settings-field">
                    Bio
                    <textarea
                      className="synapse-settings-input synapse-profile-bio"
                      value={profile.bio}
                      onChange={(e) => patch({ bio: e.target.value.slice(0, 280) })}
                      rows={4}
                      maxLength={280}
                      placeholder="What you listen to, what you make"
                    />
                  </label>
                ) : profile.bio ? (
                  <p className="synapse-profile-bio-text">{profile.bio}</p>
                ) : (
                  <p className="synapse-settings-lead">No bio yet.</p>
                )}
              </SectionChrome>
            );
          }

          if (id === 'genres') {
            return (
              <SectionChrome key={id} id={id} onHide={hideSection}>
                <div className="synapse-profile-chips">
                  {profile.favoriteGenres.map((genre) => (
                    <span key={genre} className="synapse-profile-chip">
                      {genre}
                      {editing ? (
                        <button
                          type="button"
                          aria-label={`Remove ${genre}`}
                          onClick={() => removeGenre(genre)}
                        >
                          ×
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
                {!editing && profile.favoriteGenres.length === 0 ? (
                  <p className="synapse-settings-lead">No favorite genres yet.</p>
                ) : null}
                {editing ? (
                  <div className="synapse-profile-add-row">
                    <select
                      className="synapse-settings-input"
                      value=""
                      onChange={(e) => {
                        if (e.target.value) addGenre(e.target.value);
                      }}
                      aria-label="Add a preset genre"
                    >
                      <option value="">Add a genre</option>
                      {GENRE_PRESETS.filter(
                        (g) => !profile.favoriteGenres.includes(g)
                      ).map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <input
                      className="synapse-settings-input"
                      value={genreDraft}
                      onChange={(e) => setGenreDraft(e.target.value)}
                      placeholder="Or type one"
                    />
                    <button
                      type="button"
                      className="synapse-btn synapse-btn-ok"
                      onClick={() => {
                        addGenre(genreDraft);
                        setGenreDraft('');
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                ) : null}
              </SectionChrome>
            );
          }

          if (id === 'songs') {
            return (
              <SectionChrome key={id} id={id} onHide={hideSection}>
                {profile.favoriteSongs.length === 0 ? (
                  <p className="synapse-settings-lead">
                    No favorite songs yet. Paste a YouTube URL or video id to add
                    one.
                  </p>
                ) : null}
                <div className="synapse-song-grid">
                  {profile.favoriteSongs.map((song) => (
                    <article key={song.id} className="synapse-song-card">
                      <div className="synapse-song-embed">
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.videoId)}`}
                          title={song.title || 'Favorite song'}
                          loading="lazy"
                          allow="encrypted-media; picture-in-picture"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                      <div className="synapse-song-meta">
                        <h3>{song.title || 'YouTube track'}</h3>
                        <p>{song.artist || 'Unknown artist'}</p>
                        <p className="synapse-profile-muted">
                          {song.album || 'Unknown album'}
                        </p>
                      </div>
                      {editing ? (
                        <button
                          type="button"
                          className="synapse-btn synapse-btn-danger synapse-song-remove"
                          aria-label={`Remove ${song.title}`}
                          onClick={() => removeSong(song.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </article>
                  ))}
                </div>
                {editing ? (
                  <div className="synapse-profile-add-row is-single">
                    <input
                      className="synapse-settings-input"
                      value={songDraft}
                      placeholder="dQw4w9wgVcQ or youtube.com/watch?v=…"
                      onChange={(e) => {
                        const raw = e.target.value;
                        const id = extractYouTubeId(raw);
                        setSongDraft(id || raw);
                      }}
                      onBlur={(e) => {
                        const id = extractYouTubeId(e.target.value);
                        if (id) setSongDraft(id);
                      }}
                    />
                    <button
                      type="button"
                      className="synapse-btn synapse-btn-ok"
                      disabled={songBusy}
                      onClick={() => void addFavoriteSong()}
                    >
                      <Plus className="w-4 h-4" />
                      {songBusy ? 'Adding…' : 'Add'}
                    </button>
                  </div>
                ) : null}
                {songError ? <p className="synapse-settings-error">{songError}</p> : null}
              </SectionChrome>
            );
          }

          if (id === 'playlists') {
            return (
              <SectionChrome key={id} id={id} onHide={hideSection}>
                <p className="synapse-settings-hint">
                  Switch playlists from the menu next to Synapse. New playlists
                  start empty.
                </p>
                {shownPaths.length === 0 ? (
                  <p className="synapse-settings-lead">No playlists yet.</p>
                ) : null}
                <ul className="synapse-profile-list">
                  {shownPaths.map((pl) => (
                    <li key={pl.id}>
                      <span>
                        <strong>{pl.name}</strong>
                        <span className="synapse-profile-muted"> · {pl.visibility}</span>
                      </span>
                      {editing ? (
                        <select
                          className="synapse-settings-input"
                          value={pl.visibility}
                          onChange={(e) =>
                            setPlaylistVisibility(
                              pl.id,
                              e.target.value === 'public' ? 'public' : 'private'
                            )
                          }
                          aria-label={`${pl.name} visibility`}
                        >
                          <option value="private">Private</option>
                          <option value="public">Public</option>
                        </select>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </SectionChrome>
            );
          }

          if (id === 'stats') {
            return (
              <SectionChrome key={id} id={id} onHide={hideSection}>
                <dl className="synapse-profile-stats">
                  <div>
                    <dt>Total listens</dt>
                    <dd>{profile.totalListens}</dd>
                  </div>
                  <div>
                    <dt>Average / day</dt>
                    <dd>{avg.toFixed(1)}</dd>
                  </div>
                </dl>
                <p className="synapse-settings-hint">
                  Counts tracks started in this browser. Cloud totals arrive with
                  accounts.
                </p>
              </SectionChrome>
            );
          }

          return (
            <SectionChrome key={id} id={id} onHide={hideSection}>
              <div className="synapse-profile-activity" aria-label="Listens over the last 12 weeks">
                {series.map((count, i) => (
                  <span
                    key={i}
                    className="synapse-profile-activity-bar"
                    style={{ height: `${Math.max(8, (count / peak) * 100)}%` }}
                    title={`${count} listen${count === 1 ? '' : 's'}`}
                  />
                ))}
              </div>
            </SectionChrome>
          );
        })}
      </SectionDragProvider>

      {editing && hiddenOrder.length > 0 ? (
        <section className="synapse-profile-section synapse-profile-restore">
          <h2>Add optional sections</h2>
          <div className="synapse-profile-chips">
            {hiddenOrder.map((id) => (
              <button
                key={id}
                type="button"
                className="synapse-profile-chip is-add"
                onClick={() => showSection(id)}
              >
                <Plus className="w-3.5 h-3.5" />
                {SECTION_LABELS[id]}
              </button>
            ))}
          </div>
        </section>
      ) : null}
      </div>

      {avatarOpen ? (
        <AvatarModal
          error={avatarError}
          onClose={() => setAvatarOpen(false)}
          onApply={handleAvatar}
          onRemove={() => setAvatarDataUrl(null)}
        />
      ) : null}
    </div>
  );
}
