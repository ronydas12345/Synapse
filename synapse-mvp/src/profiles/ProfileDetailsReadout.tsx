import { PathLink } from '../app/AppLink';
import { workshopItemPath } from '../app/routes';
import ListenActivityHeatmap, { ListenStatsNumbers } from '../profile/ListenActivityHeatmap';
import { osmEmbedUrl } from '../profile/geocode';
import {
  OPTIONAL_SECTIONS,
  SECTION_LABELS,
  type OptionalSectionId,
  type ProfilePlaylist,
  type UserProfile,
} from '../profile/types';
import SavedCollections from '../workshop/SavedCollections';
import type { WorkshopCard } from '../workshop/types';

function publicPlaylistHref(
  path: ProfilePlaylist,
  listings: Pick<WorkshopCard, 'id' | 'shareCode' | 'title' | 'kind'>[]
): string | null {
  if (path.visibility !== 'public') return null;
  const playlists = listings.filter((card) => card.kind === 'playlist');
  const named = playlists.filter((card) => card.title === path.name);
  const hit =
    playlists.find(
      (card) =>
        card.id === path.workshopId ||
        card.shareCode === path.workshopId ||
        card.id === path.id ||
        card.shareCode === path.id
    ) || (named.length === 1 ? named[0] : undefined);
  const key = hit?.shareCode || hit?.id || path.workshopId;
  return key ? workshopItemPath(key) : null;
}

function visibleSections(profile: UserProfile): OptionalSectionId[] {
  return (profile.sectionOrder.length ? profile.sectionOrder : [...OPTIONAL_SECTIONS]).filter(
    (id) => !profile.hiddenSections.includes(id)
  );
}

function sectionIsEmpty(
  id: OptionalSectionId,
  profile: UserProfile,
  playlists: ProfilePlaylist[]
): boolean {
  if (id === 'location') return !profile.location.trim();
  if (id === 'bio') return !profile.bio.trim();
  if (id === 'genres') return profile.favoriteGenres.length === 0;
  if (id === 'songs') return profile.favoriteSongs.length === 0;
  if (id === 'playlists') return playlists.length === 0;
  if (id === 'stats' || id === 'activity') {
    return profile.totalListens === 0 && Object.keys(profile.listensByDay).length === 0;
  }
  return false;
}

function LocationReadout({ profile }: { profile: UserProfile }) {
  const mapUrl =
    profile.locationLat != null && profile.locationLon != null
      ? osmEmbedUrl(profile.locationLat, profile.locationLon)
      : null;
  if (!profile.location.trim()) {
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

export default function ProfileDetailsReadout({
  profile,
  playlists,
  listings = [],
  showSaved = false,
  showEmpty = false,
}: {
  profile: UserProfile;
  playlists: ProfilePlaylist[];
  listings?: Pick<WorkshopCard, 'id' | 'shareCode' | 'title' | 'kind'>[];
  showSaved?: boolean;
  showEmpty?: boolean;
}) {
  const statsVisible = !profile.hiddenSections.includes('stats');
  const order = visibleSections(profile).filter(
    (id) => showEmpty || !sectionIsEmpty(id, profile, playlists)
  );

  return (
    <>
      {showSaved ? (
        <section className="synapse-profile-section">
          <h2>Saved</h2>
          <p className="synapse-settings-lead">
            Bookmarked Workshop playlists and creator profiles live on this account.
          </p>
          <SavedCollections />
        </section>
      ) : null}
      {order.map((id) => {
        if (id === 'location') {
          return (
            <section key={id} className="synapse-profile-section">
              <h2>{SECTION_LABELS[id]}</h2>
              <LocationReadout profile={profile} />
            </section>
          );
        }
        if (id === 'bio') {
          return (
            <section key={id} className="synapse-profile-section">
              <h2>{SECTION_LABELS[id]}</h2>
              {profile.bio ? (
                <p className="synapse-profile-bio-text">{profile.bio}</p>
              ) : (
                <p className="synapse-settings-lead">No bio yet.</p>
              )}
            </section>
          );
        }
        if (id === 'genres') {
          return (
            <section key={id} className="synapse-profile-section">
              <h2>{SECTION_LABELS[id]}</h2>
              {profile.favoriteGenres.length === 0 ? (
                <p className="synapse-settings-lead">No favorite genres yet.</p>
              ) : (
                <div className="synapse-profile-chips">
                  {profile.favoriteGenres.map((genre) => (
                    <span key={genre} className="synapse-profile-chip">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </section>
          );
        }
        if (id === 'songs') {
          return (
            <section key={id} className="synapse-profile-section">
              <h2>{SECTION_LABELS[id]}</h2>
              {profile.favoriteSongs.length === 0 ? (
                <p className="synapse-settings-lead">No favorite songs yet.</p>
              ) : (
                <div className="synapse-song-grid">
                  {profile.favoriteSongs.map((song) => (
                    <article key={song.id || song.videoId} className="synapse-song-card">
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
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        }
        if (id === 'playlists') {
          return (
            <section key={id} className="synapse-profile-section">
              <h2>{SECTION_LABELS[id]}</h2>
              {playlists.length === 0 ? (
                <p className="synapse-settings-lead">No playlists yet.</p>
              ) : (
                <ul className="synapse-profile-list">
                  {playlists.map((path) => {
                    const href = publicPlaylistHref(path, listings);
                    return (
                      <li key={path.id || path.name}>
                        <span>
                          {href ? (
                            <PathLink href={href}>{path.name}</PathLink>
                          ) : (
                            <strong>{path.name}</strong>
                          )}
                          <span className="synapse-profile-muted"> · {path.visibility}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        }
        if (id === 'stats') {
          return (
            <section key={id} className="synapse-profile-section">
              <h2>{SECTION_LABELS[id]}</h2>
              <ListenStatsNumbers profile={profile} />
              <ListenActivityHeatmap profile={profile} />
            </section>
          );
        }
        return (
          <section key={id} className="synapse-profile-section">
            <h2>{SECTION_LABELS[id]}</h2>
            {statsVisible ? (
              <p className="synapse-settings-lead">
                The full listen calendar is in Listening stats.
              </p>
            ) : (
              <ListenActivityHeatmap profile={profile} />
            )}
          </section>
        );
      })}
    </>
  );
}
