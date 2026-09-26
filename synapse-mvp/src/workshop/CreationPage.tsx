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
import { usePathStore } from '../store';
import {
  getWorkshopCreation,
  reportWorkshopCreation,
  remixWorkshopCreation,
  setWorkshopVisibility,
  toggleWorkshopLike,
  toggleWorkshopSave,
} from './api';
import type { ReportReason, WorkshopCreation, WorkshopVisibility } from './types';

async function copyShareLink(id: string): Promise<void> {
  const url = `${window.location.origin}${workshopItemPath(id)}`;
  await navigator.clipboard.writeText(url);
}

export default function CreationPage({ id }: { id: string }) {
  const user = useAuthStore((s) => s.user);
  const [item, setItem] = useState<WorkshopCreation | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [copied, setCopied] = useState(false);

  async function reload() {
    const next = await getWorkshopCreation(id);
    setItem(next);
    if (!next) setError('This creation is private, removed, or does not exist.');
    else setError('');
  }

  useEffect(() => {
    void reload().catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load this creation.');
    });
  }, [id]);

  const own = Boolean(user && item && user.uid === item.creatorUid);

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
    await run('remix', async () => {
      const remix = await remixWorkshopCreation(id);
      usePathStore.getState().importWorkshopGraph(
        `Remix of ${remix.title}`,
        remix.payload.nodes as Node[],
        remix.payload.edges as Edge[]
      );
      navigateApp(listen ? APP_PATHS.listen : APP_PATHS.edit);
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
      <p className="synapse-mkt-kicker">{item.featured ? 'Featured creation' : 'Workshop'}</p>
      <h1>{item.title}</h1>
      <p className="synapse-mkt-lead">{item.description || 'A published Music Path.'}</p>
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
      <p className="synapse-mkt-tags">
        {item.likeCount} likes · {item.saveCount} saves · {item.remixCount} remixes
        {item.visibility !== 'public' ? ` · ${item.visibility}` : ''}
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-workshop-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-play"
          disabled={Boolean(busy)}
          onClick={() => void openRemix(true)}
        >
          Play
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={Boolean(busy)}
          onClick={() =>
            void run('like', async () => {
              const on = await toggleWorkshopLike(id);
              setLiked(on);
              await reload();
            })
          }
        >
          {liked ? 'Liked' : 'Like'}
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={Boolean(busy)}
          onClick={() =>
            void run('save', async () => {
              const on = await toggleWorkshopSave(id);
              setSaved(on);
              await reload();
            })
          }
        >
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={Boolean(busy)}
          onClick={() => void openRemix(false)}
        >
          Remix
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => {
            void copyShareLink(id).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
        >
          {copied ? 'Link copied' : 'Share'}
        </button>
      </div>
      {own ? (
        <label className="synapse-settings-field">
          Visibility
          <select
            className="synapse-settings-input"
            value={item.visibility}
            onChange={(event) => {
              const next = event.target.value as WorkshopVisibility;
              void run('visibility', async () => {
                await setWorkshopVisibility(id, next);
                await reload();
              });
            }}
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted — anyone with the link</option>
            <option value="public">Public — listed in Workshop</option>
          </select>
        </label>
      ) : (
        <form
          className="synapse-workshop-report"
          onSubmit={(event) => {
            event.preventDefault();
            void run('report', async () => {
              await reportWorkshopCreation(id, reportReason, reportDetails);
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
    </main>
  );
}
