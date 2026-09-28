import { useMemo, useState } from 'react';
import { navigateApp, workshopItemPath } from '../app/routes';
import { SettingsToggle } from '../components/settings/Fields';
import { usePathStore } from '../store';
import { allThemes, useThemeStore } from '../theme/themeStore';
import { themeToJson } from '../theme/parseTheme';
import { getWorkshopCreation, publishWorkshopCreation, setCreationSocial } from './api';
import TagPicker from './TagPicker';
import type { WorkshopKind, WorkshopVisibility } from './types';

export default function PublishForm() {
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const setPlaylistTags = usePathStore((s) => s.setPlaylistTags);
  const customThemes = useThemeStore((s) => s.customThemes);
  const themeTags = useThemeStore((s) => s.themeTags);
  const setThemeTags = useThemeStore((s) => s.setThemeTags);
  const themes = useMemo(() => allThemes(customThemes), [customThemes]);
  const [kind, setKind] = useState<WorkshopKind>('playlist');
  const [pathId, setPathId] = useState(activePathId);
  const [themeId, setThemeId] = useState(themes[0]?.id || '');
  const [title, setTitle] = useState(
    pathSummaries.find((path) => path.id === activePathId)?.name || ''
  );
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<WorkshopVisibility>('public');
  const [likesEnabled, setLikesEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [savesEnabled, setSavesEnabled] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedTheme = themes.find((theme) => theme.id === themeId) || themes[0];
  const selectedPath = pathSummaries.find((path) => path.id === pathId);
  const tags =
    kind === 'theme'
      ? themeTags[selectedTheme?.id || ''] || []
      : selectedPath?.tags || [];

  async function publish() {
    setBusy(true);
    setError('');
    try {
      let id = '';
      if (kind === 'theme') {
        if (!selectedTheme) throw new Error('Pick a theme to publish.');
        const payload = JSON.parse(themeToJson({ ...selectedTheme, builtin: false })) as Record<
          string,
          unknown
        >;
        id = await publishWorkshopCreation({
          sourcePathId: `theme:${selectedTheme.id}`,
          title: title.trim() || selectedTheme.name,
          description: description.trim(),
          visibility,
          payload,
          kind: 'theme',
          tags,
        });
      } else {
        const current = usePathStore.getState();
        current.setNodes(current.nodes);
        current.switchPlaylist(pathId);
        const state = usePathStore.getState();
        const name =
          title.trim() ||
          pathSummaries.find((path) => path.id === pathId)?.name ||
          'Untitled';
        id = await publishWorkshopCreation({
          sourcePathId: pathId,
          title: name,
          description: description.trim(),
          visibility,
          payload: { name, nodes: state.nodes, edges: state.edges },
          kind: 'playlist',
          tags,
        });
      }
      if (!likesEnabled || !commentsEnabled || !savesEnabled) {
        await setCreationSocial(id, likesEnabled, commentsEnabled, savesEnabled);
      }
      const created = await getWorkshopCreation(id);
      navigateApp(workshopItemPath(created?.shareCode || id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="synapse-workshop-publish">
      <p className="synapse-settings-lead">
        Publishing copies a Music Path or a theme to Workshop. Private stays
        off the catalog. Unlisted is reachable by ID or link. Public appears on
        Home, New, Featured, and Search. Add tags here or in Playlists / Themes
        before you publish. Tags come from the curated list only.
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
              setTitle(selectedTheme?.name || '');
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
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
      )}
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
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        disabled={busy || (kind === 'playlist' ? !pathId : !selectedTheme)}
        onClick={() => void publish()}
      >
        {busy ? 'Publishing…' : 'Publish to Workshop'}
      </button>
    </div>
  );
}
