import { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { PathLink } from '../app/AppLink';
import {
  APP_PATHS,
  navigateApp,
  publicProfilePath,
  workshopItemPath,
} from '../app/routes';
import { useAuthStore } from '../auth/authStore';
import SharePanel from '../share/SharePanel';
import { usePathStore } from '../store';
import { useThemeStore } from '../theme/themeStore';
import {
  addWorkshopComment,
  deleteWorkshopComment,
  getWorkshopCreation,
  likedCreationIds,
  listWorkshopComments,
  reportWorkshopCreation,
  remixWorkshopCreation,
  savedCreationIds,
  setCreationSocial,
  setWorkshopTags,
  setWorkshopVisibility,
  toggleWorkshopLike,
  toggleWorkshopSave,
  type WorkshopComment,
} from './api';
import TagChips from './TagChips';
import TagPicker from './TagPicker';
import type { ReportReason, WorkshopCreation, WorkshopVisibility } from './types';

export default function CreationPage({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const [item, setItem] = useState<WorkshopCreation | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState<WorkshopComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDetails, setReportDetails] = useState('');

  async function reload() {
    const next = await getWorkshopCreation(id);
    setItem(next);
    if (!next) {
      setError('This creation is private, removed, or does not exist.');
      return;
    }
    setError('');
    const [likedIds, savedIds, thread] = await Promise.all([
      user ? likedCreationIds([next.id]) : Promise.resolve(new Set<string>()),
      user ? savedCreationIds([next.id]) : Promise.resolve(new Set<string>()),
      listWorkshopComments(next.id),
    ]);
    setLiked(likedIds.has(next.id));
    setSaved(savedIds.has(next.id));
    setComments(thread);
  }

  useEffect(() => {
    void reload().catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load this creation.');
    });
  }, [id, user]);

  const own = Boolean(user && item && user.uid === item.creatorUid);
  const shareKey = item?.shareCode || item?.id || id;

  async function run(label: string, fn: () => Promise<void>) {
    if (!user) {
      navigateApp(APP_PATHS.login);
      return;
    }
    setBusy(label);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That action failed.');
    } finally {
      setBusy('');
    }
  }

  async function openRemix(listen: boolean) {
    const creationId = item?.id;
    if (!creationId) return;
    await run('remix', async () => {
      const remix = await remixWorkshopCreation(creationId);
      if (remix.kind === 'theme') {
        if (!remix.theme) throw new Error('This theme could not be imported.');
        const id = useThemeStore.getState().addCustomTheme(remix.theme);
        if (id) useThemeStore.getState().setActiveId(id);
        navigateApp(APP_PATHS.settings, 'settings-themes');
        return;
      }
      usePathStore.getState().importWorkshopGraph(
        `Remix of ${remix.title}`,
        remix.payload.nodes as Node[],
        remix.payload.edges as Edge[]
      );
      navigateApp(listen ? APP_PATHS.listen : APP_PATHS.edit);
    });
  }

  async function useTheme() {
    if (!item?.theme) return;
    await run('theme', async () => {
      const id = useThemeStore.getState().addCustomTheme(item.theme!);
      if (id) useThemeStore.getState().setActiveId(id);
      navigateApp(APP_PATHS.settings, 'settings-themes');
    });
  }

  if (!item) {
    return (
      <main id="main" className="synapse-mkt-main synapse-mkt-page">
        <p className="synapse-settings-lead">{error || 'Loading…'}</p>
      </main>
    );
  }

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page synapse-workshop-creation">
      <p className="synapse-mkt-kicker">
        {item.featured
          ? 'Featured creation'
          : item.kind === 'theme'
            ? 'Workshop theme'
            : 'Workshop playlist'}
      </p>
      <h1>{item.title}</h1>
      <p className="synapse-mkt-lead">
        {item.description ||
          (item.kind === 'theme' ? 'A published theme.' : 'A published Music Path.')}
      </p>
      <p className="synapse-workshop-meta">
        {item.creatorUsername ? (
          <PathLink href={publicProfilePath(item.creatorUsername)}>
            @{item.creatorUsername}
          </PathLink>
        ) : (
          item.creatorDisplayName
        )}
        {item.remixOf ? (
          <>
            {' · '}
            <PathLink href={workshopItemPath(item.remixOf)}>Remixed from</PathLink>
          </>
        ) : null}
      </p>
      <TagChips kind={item.kind} ids={item.tags} />
      <p className="synapse-mkt-tags">
        {item.likesEnabled ? `${item.likeCount} likes · ` : 'Likes off · '}
        {item.saveCount} saves · {item.remixCount} remixes
        {item.commentsEnabled ? ` · ${item.commentCount} comments` : ' · comments off'}
        {item.visibility !== 'public' ? ` · ${item.visibility}` : ''}
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-workshop-actions">
        {item.kind === 'theme' ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-play"
            disabled={Boolean(busy) || !item.theme}
            onClick={() => void useTheme()}
          >
            Use theme
          </button>
        ) : (
          <button
            type="button"
            className="synapse-btn synapse-btn-play"
            disabled={Boolean(busy)}
            onClick={() => void openRemix(true)}
          >
            Play
          </button>
        )}
        {item.likesEnabled || own ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            disabled={Boolean(busy) || (!item.likesEnabled && !own)}
            onClick={() =>
              void run('like', async () => {
                const on = await toggleWorkshopLike(item.id);
                setLiked(on);
                await reload();
              })
            }
          >
            {liked ? 'Liked' : 'Like'}
          </button>
        ) : null}
        {item.savesEnabled || own ? (
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            disabled={Boolean(busy) || (!item.savesEnabled && !own)}
            onClick={() =>
              void run('save', async () => {
                const on = await toggleWorkshopSave(item.id);
                setSaved(on);
                await reload();
              })
            }
          >
            {saved ? 'Saved' : 'Save'}
          </button>
        ) : null}
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={Boolean(busy)}
          onClick={() => void openRemix(false)}
        >
          {item.kind === 'theme' ? 'Remix theme' : 'Remix'}
        </button>
      </div>
      {(item.visibility === 'public' || item.visibility === 'unlisted' || own) && item.shareCode ? (
        <SharePanel
          shareCode={item.shareCode}
          path={workshopItemPath(shareKey)}
          label={item.kind === 'theme' ? 'Workshop theme' : 'Workshop playlist'}
        />
      ) : null}
      {own ? (
        <>
          <label className="synapse-settings-field">
            Visibility
            <select
              className="synapse-settings-input"
              value={item.visibility}
              onChange={(event) => {
                const next = event.target.value as WorkshopVisibility;
                void run('visibility', async () => {
                  await setWorkshopVisibility(item.id, next);
                  await reload();
                });
              }}
            >
              <option value="private">Private — only you</option>
              <option value="unlisted">Unlisted — anyone with the ID or link</option>
              <option value="public">Public — listed in Workshop</option>
            </select>
          </label>
          <fieldset className="synapse-workshop-toggles">
            <legend>On this {item.kind === 'theme' ? 'theme' : 'playlist'}</legend>
            <label>
              <input
                type="checkbox"
                checked={item.likesEnabled}
                onChange={(event) =>
                  void run('social', async () => {
                    await setCreationSocial(
                      item.id,
                      event.target.checked,
                      item.commentsEnabled,
                      item.savesEnabled
                    );
                    await reload();
                  })
                }
              />
              Allow likes
            </label>
            <label>
              <input
                type="checkbox"
                checked={item.commentsEnabled}
                onChange={(event) =>
                  void run('social', async () => {
                    await setCreationSocial(
                      item.id,
                      item.likesEnabled,
                      event.target.checked,
                      item.savesEnabled
                    );
                    await reload();
                  })
                }
              />
              Allow comments
            </label>
            <label>
              <input
                type="checkbox"
                checked={item.savesEnabled}
                onChange={(event) =>
                  void run('social', async () => {
                    await setCreationSocial(
                      item.id,
                      item.likesEnabled,
                      item.commentsEnabled,
                      event.target.checked
                    );
                    await reload();
                  })
                }
              />
              Allow saves
            </label>
          </fieldset>
          <TagPicker
            kind={item.kind}
            value={item.tags}
            onChange={(next) =>
              void run('tags', async () => {
                await setWorkshopTags(item.id, next);
                await reload();
              })
            }
            label="Tags on this creation"
          />
        </>
      ) : (
        <form
          className="synapse-workshop-report"
          onSubmit={(event) => {
            event.preventDefault();
            void run('report', async () => {
              await reportWorkshopCreation(item.id, reportReason, reportDetails);
              setReportDetails('');
              setError('Report sent to staff.');
            });
          }}
        >
          <h2>Report</h2>
          <select
            className="synapse-settings-input"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value as ReportReason)}
          >
            <option value="spam">Spam</option>
            <option value="abuse">Abuse</option>
            <option value="overlay">Overlay / image issue</option>
            <option value="copyright">Copyright</option>
            <option value="other">Other</option>
          </select>
          <input
            className="synapse-settings-input"
            value={reportDetails}
            onChange={(event) => setReportDetails(event.target.value)}
            placeholder="Optional details"
            maxLength={500}
          />
          <button type="submit" className="synapse-btn synapse-btn-ghost" disabled={Boolean(busy)}>
            Send report
          </button>
        </form>
      )}
      {item.visibility === 'public' && (item.commentsEnabled || comments.length > 0) ? (
        <section className="synapse-workshop-comments">
          <h2>Comments</h2>
          {!item.commentsEnabled ? (
            <p className="synapse-settings-lead">Comments are turned off for this playlist.</p>
          ) : (
            <form
              className="synapse-workshop-comment-form"
              onSubmit={(event) => {
                event.preventDefault();
                void run('comment', async () => {
                  await addWorkshopComment(item.id, commentBody);
                  setCommentBody('');
                  await reload();
                });
              }}
            >
              <textarea
                className="synapse-settings-input"
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder={user ? 'Write a comment' : 'Log in to comment'}
                disabled={!user}
              />
              <button
                type="submit"
                className="synapse-btn synapse-btn-ghost"
                disabled={!user || Boolean(busy) || !commentBody.trim()}
              >
                Post comment
              </button>
            </form>
          )}
          {comments.length === 0 ? (
            <p className="synapse-settings-lead">No comments yet.</p>
          ) : (
            <ul className="synapse-workshop-comment-list">
              {comments.map((comment) => (
                <li key={comment.id} className="synapse-workshop-comment">
                  <p>
                    {comment.username ? (
                      <PathLink href={publicProfilePath(comment.username)}>
                        @{comment.username}
                      </PathLink>
                    ) : (
                      'Someone'
                    )}
                    {comment.createdAt ? (
                      <span className="synapse-profile-muted">
                        {' '}
                        · {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    ) : null}
                  </p>
                  <p>{comment.body}</p>
                  {user && (user.uid === comment.uid || own) ? (
                    <button
                      type="button"
                      className="synapse-btn synapse-btn-ghost"
                      disabled={Boolean(busy)}
                      onClick={() =>
                        void run('delete-comment', async () => {
                          await deleteWorkshopComment(comment.id);
                          await reload();
                        })
                      }
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </main>
  );
}
