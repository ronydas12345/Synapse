import { useEffect, useState } from 'react';
import { PathLink } from '../app/AppLink';
import { APP_PATHS, publicProfilePath } from '../app/routes';
import PublishForm from '../workshop/PublishForm';
import { emptyTheme } from '../theme/parseTheme';
import { BUILTIN_THEMES } from '../theme/presets';
import type { SynapseTheme } from '../theme/types';
import type { ProfileVisibility } from '../profile/types';
import type { PublicCreator } from './api';
import ProfileVisibilityField from './ProfileVisibilityField';
import {
  isVisPreview,
  localPublicPreviewCreators,
  readPreviewVisibility,
  VIS_PREVIEW_EVENT,
  VIS_PREVIEW_USERNAME,
  visPreviewCreator,
  writePreviewVisibility,
} from './previewCatalog';

export const PREVIEW_USERNAME = 'workshop_preview';
export { isVisPreview, VIS_PREVIEW_USERNAME, visPreviewCreator, localPublicPreviewCreators };

export function isPreviewProfile(username: string): boolean {
  const handle = username.trim().toLowerCase();
  return handle === PREVIEW_USERNAME || handle === VIS_PREVIEW_USERNAME;
}

export function isWorkshopPreview(username: string): boolean {
  return username.trim().toLowerCase() === PREVIEW_USERNAME;
}

export function previewCreator(): PublicCreator {
  return {
    uid: '00000000-0000-4000-a000-000000000002',
    username: PREVIEW_USERNAME,
    displayName: 'Workshop Preview',
    photoUrl: '',
    bio: 'Local test profile for Workshop publish. Default themes and renamed copies should be blocked. An original palette should be allowed. Nothing on this page writes to the server.',
    equippedDecoration: 'default',
    featuredBadge: '',
    followerCount: 0,
    shareCode: 'workshoppv',
    followsEnabled: true,
    savesEnabled: true,
    visibility: 'public',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

export function previewPublishThemes(): SynapseTheme[] {
  const ocean = BUILTIN_THEMES.find((theme) => theme.id === 'ocean-blue') ?? BUILTIN_THEMES[0];
  const renamed: SynapseTheme = {
    ...ocean,
    id: 'custom-ocean-copy',
    name: 'Sea breeze',
    builtin: false,
  };
  const original = emptyTheme('custom-preview-unique', 'My original');
  original.colors = {
    ...original.colors,
    workspaceBackground: '#112233',
    accent: '#ff00aa',
    nodeStart: '#00ffcc',
  };
  return [renamed, original];
}

export function WorkshopPreviewPage() {
  const creator = previewCreator();
  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-public-profile">
      <div className="synapse-public-profile-hero">
        <div className="synapse-profile-hero-copy">
          <h1>{creator.displayName}</h1>
          <p className="synapse-profile-handle">@{creator.username}</p>
          <p className="synapse-settings-lead">{creator.bio}</p>
        </div>
      </div>
      <section className="synapse-profile-section">
        <h2>Publish (local)</h2>
        <p className="synapse-settings-hint">
          Switch Type to Theme. Built-in palettes and “Sea breeze” (Ocean Blue
          renamed) stay disabled. “My original” can be published here as a dry run.
        </p>
        <PublishForm localOnly extraThemes={previewPublishThemes()} />
      </section>
    </main>
  );
}

export function VisPreviewPage() {
  const [visibility, setVisibility] = useState<ProfileVisibility>(readPreviewVisibility);
  const creator = visPreviewCreator(visibility);

  useEffect(() => {
    const sync = () => setVisibility(readPreviewVisibility());
    window.addEventListener(VIS_PREVIEW_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(VIS_PREVIEW_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-public-profile">
      <div className="synapse-public-profile-hero">
        <div className="synapse-profile-hero-copy">
          <h1>{creator.displayName}</h1>
          <p className="synapse-profile-handle">@{creator.username}</p>
          <p className="synapse-settings-lead">{creator.bio}</p>
        </div>
      </div>
      <section className="synapse-profile-section">
        <h2>Profile settings (local)</h2>
        <ProfileVisibilityField
          value={visibility}
          onChange={(next) => {
            writePreviewVisibility(next);
            setVisibility(next);
          }}
        />
        <p className="synapse-settings-hint">
          {visibility === 'public'
            ? 'Public — this test user should appear under Workshop → Users (and All types).'
            : visibility === 'unlisted'
              ? 'Unlisted — reachable at this URL, but not listed in Workshop.'
              : 'Private — hidden from Workshop.'}
        </p>
        <p className="synapse-profile-nav">
          <PathLink href={`${APP_PATHS.workshop}`}>Open Workshop</PathLink>
          {' · '}
          <PathLink href={publicProfilePath(VIS_PREVIEW_USERNAME)}>This profile</PathLink>
        </p>
      </section>
    </main>
  );
}
