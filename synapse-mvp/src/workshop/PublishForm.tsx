import { useEffect, useMemo, useState } from 'react';
import { navigateApp, workshopItemPath } from '../app/routes';
import { SettingsToggle } from '../components/settings/Fields';
import { asPathVisibility } from '../playlists/library';
import { usePathStore } from '../store';
import { builtinThemePublishError, isBuiltinThemeClone } from '../theme/isPresetTheme';
import { allThemes, useThemeStore } from '../theme/themeStore';
import { themeToJson } from '../theme/parseTheme';
import type { SynapseTheme } from '../theme/types';
import {
  getWorkshopCreation,
  listOwnWorkshop,
  publishWorkshopCreation,
  setCreationSocial,
} from './api';
import TagPicker from './TagPicker';
import type { WorkshopCreation, WorkshopKind, WorkshopVisibility } from './types';

function namesRelated(pathName: string, title: string): boolean {
  const name = pathName.trim().toLowerCase();
  const listed = title.trim().toLowerCase();
  if (!name || !listed) return false;
  return name === listed || name === `${listed} copy` || name.startsWith(`${listed} copy `);
}

function matchingOwnListing(
  rows: WorkshopCreation[],
  kind: WorkshopKind,
  pathId: string,
  themeId: string,
  workshopId?: string,
  pathName?: string
): WorkshopCreation | undefined {
  const themeSource = themeId ? `theme:${themeId}` : '';
  const exact = rows.find((row) => {
    if (row.kind !== kind) return false;
    if (workshopId && (row.id === workshopId || row.shareCode === workshopId)) return true;
    if (kind === 'playlist' && pathId && row.sourcePathId === pathId) return true;
    if (kind === 'theme' && themeSource && row.sourcePathId === themeSource) return true;
    return false;
  });
  if (exact) return exact;
  if (kind !== 'playlist' || !pathName) return undefined;
  const related = rows.filter(
    (row) => row.kind === 'playlist' && namesRelated(pathName, row.title)
  );
  return related.length === 1 ? related[0] : undefined;
}

export default function PublishForm({
  localOnly = false,
  extraThemes = [],
}: {
  localOnly?: boolean;
  extraThemes?: SynapseTheme[];
}) {
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const setPlaylistTags = usePathStore((s) => s.setPlaylistTags);
  const customThemes = useThemeStore((s) => s.customThemes);
  const themeTags = useThemeStore((s) => s.themeTags);
  const setThemeTags = useThemeStore((s) => s.setThemeTags);
  const themes = useMemo(() => {
    const base = allThemes(customThemes);
    const extra = extraThemes.filter((theme) => !base.some((item) => item.id === theme.id));
    return [...base, ...extra];
  }, [customThemes, extraThemes]);
  const publishableThemes = useMemo(
    () => themes.filter((theme) => !isBuiltinThemeClone(theme)),
    [themes]
  );
  const [kind, setKind] = useState<WorkshopKind>('playlist');
  const [pathId, setPathId] = useState(activePathId);
  const [themeId, setThemeId] = useState(publishableThemes[0]?.id || themes[0]?.id || '');
  const [title, setTitle] = useState(
    pathSummaries.find((path) => path.id === activePathId)?.name || ''
  );
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<WorkshopVisibility>('public');
  const [likesEnabled, setLikesEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [savesEnabled, setSavesEnabled] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const [ownListings, setOwnListings] = useState<WorkshopCreation[]>([]);

  const selectedTheme = themes.find((theme) => theme.id === themeId) || publishableThemes[0] || themes[0];
  const selectedPath = pathSummaries.find((path) => path.id === pathId);
  const tags =
    kind === 'theme'
      ? themeTags[selectedTheme?.id || ''] || []
      : selectedPath?.tags || [];
  const themeBlockReason = selectedTheme ? builtinThemePublishError(selectedTheme) : null;
  const canPublishTheme = Boolean(selectedTheme) && !themeBlockReason;
  const existing = matchingOwnListing(
    ownListings,
    kind,
    pathId,
    selectedTheme?.id || themeId,
    selectedPath?.workshopId,
    selectedPath?.name
  );

  useEffect(() => {
    if (localOnly) return;
    let cancelled = false;
    void listOwnWorkshop()
      .then((rows) => {
        if (cancelled) return;
        setOwnListings(rows);
        const sync = usePathStore.getState().syncWorkshopListing;
        for (const row of rows) {
          if (row.kind !== 'playlist') continue;
          sync(row.id, asPathVisibility(row.visibility), row.sourcePathId || undefined);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [localOnly]);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setVisibility(existing.visibility);
      setLikesEnabled(existing.likesEnabled);
      setCommentsEnabled(existing.commentsEnabled);
      setSavesEnabled(existing.savesEnabled);
      return;
    }
    setDescription('');
    setVisibility('public');
    setLikesEnabled(true);
    setCommentsEnabled(true);
    setSavesEnabled(true);
    if (kind === 'theme') setTitle(selectedTheme?.name || '');
    else setTitle(selectedPath?.name || '');
  }, [existing?.id, kind, pathId, selectedTheme?.id, selectedPath?.name]);

  async function publish() {
    setBusy(true);
    setError('');
    setDone('');
    try {
      let id = '';
      if (kind === 'theme') {
        if (!selectedTheme) throw new Error('Pick a theme to publish.');
        const blocked = builtinThemePublishError(selectedTheme);
        if (blocked) throw new Error(blocked);
        const payload = JSON.parse(themeToJson({ ...selectedTheme, builtin: false })) as Record<
          string,
          unknown
        >;
        if (localOnly) {
          setDone(
            `Would ${existing ? 'update' : 'publish'} “${title.trim() || selectedTheme.name}” as ${visibility}. Nothing was sent to the server.`
          );
          return;
        }
        id = await publishWorkshopCreation({
          sourcePathId: existing?.sourcePathId || `theme:${selectedTheme.id}`,
          title: title.trim() || selectedTheme.name,
          description: description.trim(),
          visibility,
          payload,
          kind: 'theme',
          tags,
          id: existing?.id,
        });
      } else {
        if (localOnly) {
          setDone(
            `Would ${existing ? 'update' : 'publish'} “${title.trim() || selectedPath?.name || 'Untitled'}” as ${visibility}. Nothing was sent to the server.`
          );
          return;
        }
        const current = usePathStore.getState();
        current.setNodes(current.nodes);
        current.switchPlaylist(pathId);
        const state = usePathStore.getState();
        const name =
          title.trim() ||
          pathSummaries.find((path) => path.id === pathId)?.name ||
          'Untitled';
        id = await publishWorkshopCreation({
          sourcePathId: existing?.sourcePathId || pathId,
          title: name,
          description: description.trim(),
          visibility,
          payload: {
            name,
            nodes: state.nodes,
            edges: state.edges,
            portalPolicy: state.pathSummaries.find((path) => path.id === pathId)?.portalPolicy,
          },
          kind: 'playlist',
          tags,
          id: existing?.id,
        });
        state.syncWorkshopListing(id, visibility, pathId);
      }
      if (!likesEnabled || !commentsEnabled || !savesEnabled) {
        await setCreationSocial(id, likesEnabled, commentsEnabled, savesEnabled);
      }
      const created = await getWorkshopCreation(id);
      if (created?.kind === 'playlist') {
        usePathStore
          .getState()
          .syncWorkshopListing(created.id, created.visibility, pathId);
      }
      navigateApp(workshopItemPath(created?.shareCode || id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="synapse-workshop-publish">
      {localOnly ? (
        <p className="synapse-settings-hint">
          Local preview: Publish stays on this page and does not write to Workshop.
        </p>
      ) : null}
      <p className="synapse-settings-lead">
        Publishing copies a Music Path or a theme to Workshop. If you already
        listed this path, publish updates that same page instead of making a
        copy. Private stays off the catalog. Unlisted is reachable by ID or
        link. Public appears on Home, New, Featured, and Search. Add tags here
        or in Playlists / Themes before you publish. Tags come from the curated
        list only. Default themes and renamed copies of them cannot be
        published.
      </p>
      <label className="synapse-settings-field">
        Type
        <select
          className="synapse-settings-input"
          value={kind}
          onChange={(event) => {
            const next = event.target.value as WorkshopKind;
            setKind(next);
            if (next === 'theme') {
              const nextTheme =
                themes.find((theme) => theme.id === themeId) ||
                publishableThemes[0] ||
                themes[0];
              setTitle(nextTheme?.name || '');
            } else {
              setTitle(pathSummaries.find((path) => path.id === pathId)?.name || '');
            }
          }}
        >
          <option value="playlist">Playlist</option>
          <option value="theme">Theme</option>
        </select>
      </label>
      {kind === 'playlist' ? (
        <label className="synapse-settings-field">
          Path
          <select
            className="synapse-settings-input"
            value={pathId}
            onChange={(event) => {
              const id = event.target.value;
              setPathId(id);
              const name = pathSummaries.find((path) => path.id === id)?.name || '';
              setTitle(name);
            }}
          >
            {pathSummaries.map((path) => (
              <option key={path.id} value={path.id}>
                {path.name}
                {path.workshopId ? ' · listed' : ''}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="synapse-settings-field">
          Theme
          <select
            className="synapse-settings-input"
            value={selectedTheme?.id || ''}
            onChange={(event) => {
              const id = event.target.value;
              setThemeId(id);
              const theme = themes.find((item) => item.id === id);
              if (theme) setTitle(theme.name);
            }}
          >
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id} disabled={isBuiltinThemeClone(theme)}>
                {theme.name}
                {isBuiltinThemeClone(theme) ? ' (default — cannot publish)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}
      {kind === 'theme' && themeBlockReason ? (
        <p className="synapse-settings-error">{themeBlockReason}</p>
      ) : null}
      {existing ? (
        <p className="synapse-settings-hint">
          This already has a Workshop listing. Publish will update that page.
        </p>
      ) : null}
      <label className="synapse-settings-field">
        Title
        <input
          className="synapse-settings-input"
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="synapse-settings-field">
        Description
        <textarea
          className="synapse-settings-input"
          value={description}
          maxLength={500}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <TagPicker
        kind={kind}
        value={tags}
        onChange={(next) => {
          if (kind === 'theme') {
            if (selectedTheme) setThemeTags(selectedTheme.id, next);
            return;
          }
          if (pathId) setPlaylistTags(pathId, next);
        }}
        label={kind === 'theme' ? 'Theme tags' : 'Playlist tags'}
      />
      <label className="synapse-settings-field">
        Visibility
        <select
          className="synapse-settings-input"
          value={visibility}
          onChange={(event) => setVisibility(event.target.value as WorkshopVisibility)}
        >
          <option value="private">Private</option>
          <option value="unlisted">Unlisted</option>
          <option value="public">Public</option>
        </select>
      </label>
      <SettingsToggle
        label="Allow likes"
        checked={likesEnabled}
        onChange={setLikesEnabled}
      />
      <SettingsToggle
        label="Allow comments"
        hint="Comments only appear when the creation is public."
        checked={commentsEnabled}
        onChange={setCommentsEnabled}
      />
      <SettingsToggle
        label="Allow saves"
        checked={savesEnabled}
        onChange={setSavesEnabled}
      />
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {done ? <p className="synapse-settings-hint">{done}</p> : null}
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        disabled={
          busy ||
          (kind === 'playlist' ? !pathId : !canPublishTheme)
        }
        onClick={() => void publish()}
      >
        {busy
          ? existing
            ? 'Updating…'
            : 'Publishing…'
          : existing
            ? 'Update Workshop listing'
            : 'Publish to Workshop'}
      </button>
    </div>
  );
}
