import { useState } from 'react';
import { navigateApp, workshopItemPath } from '../app/routes';
import { SettingsToggle } from '../components/settings/Fields';
import { usePathStore } from '../store';
import { getWorkshopCreation, publishWorkshopCreation, setCreationSocial } from './api';
import type { WorkshopVisibility } from './types';

export default function PublishForm() {
  const pathSummaries = usePathStore((s) => s.pathSummaries);
  const activePathId = usePathStore((s) => s.activePathId);
  const [pathId, setPathId] = useState(activePathId);
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

  async function publish() {
    setBusy(true);
    setError('');
    try {
      const current = usePathStore.getState();
      current.setNodes(current.nodes);
      current.switchPlaylist(pathId);
      const state = usePathStore.getState();
      const name =
        title.trim() ||
        pathSummaries.find((path) => path.id === pathId)?.name ||
        'Untitled';
      const id = await publishWorkshopCreation({
        sourcePathId: pathId,
        title: name,
        description: description.trim(),
        visibility,
        payload: { name, nodes: state.nodes, edges: state.edges },
      });
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
        Publishing copies the selected Music Path to Workshop. Private stays
        off the catalog. Unlisted is reachable by ID or link. Public appears on Home,
        New, Featured, and Search. Upload badges are awarded by the server.
      </p>
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
        disabled={busy || !pathId}
        onClick={() => void publish()}
      >
        {busy ? 'Publishing…' : 'Publish to Workshop'}
      </button>
    </div>
  );
}
