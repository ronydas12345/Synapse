import { useEffect, useState } from 'react';
import { formatWhen } from './dates';
import { listModeration, reviewModeration } from './api';
import {
  listStaffWorkshop,
  listWorkshopReports,
  reviewWorkshopReport,
  setWorkshopFeatured,
  setWorkshopStatus,
} from '../workshop/api';
import type { WorkshopCreation, WorkshopStatus } from '../workshop/types';
import type { ModerationItem, ModerationStatus } from './model';
import { workshopItemPath } from '../app/routes';

type Queue = 'avatar' | 'overlay' | 'workshop' | 'reports';

export default function ModerationPanel() {
  const [queue, setQueue] = useState<Queue>('avatar');

  return (
    <section className="synapse-staff-section">
      <h2>Moderation</h2>
      <p className="synapse-settings-lead">
        Profile pictures wait here until staff approve them. Overlay reports and
        Workshop reports use the same queue. Removing a Workshop creation hides
        it from the catalog.
      </p>
      <div className="synapse-workshop-tabs">
        {(['avatar', 'overlay', 'workshop', 'reports'] as Queue[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`synapse-btn ${queue === id ? 'synapse-btn-play' : 'synapse-btn-ghost'}`}
            onClick={() => setQueue(id)}
          >
            {id === 'avatar'
              ? 'Profile pictures'
              : id === 'overlay'
                ? 'Overlays'
                : id === 'workshop'
                  ? 'Workshop'
                  : 'Reports'}
          </button>
        ))}
      </div>
      {queue === 'avatar' || queue === 'overlay' ? (
        <ImageQueue type={queue} />
      ) : null}
      {queue === 'workshop' ? <WorkshopQueue /> : null}
      {queue === 'reports' ? <ReportQueue /> : null}
    </section>
  );
}

function ImageQueue({ type }: { type: 'avatar' | 'overlay' }) {
  const [rows, setRows] = useState<ModerationItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const all = await listModeration();
      setRows(all.filter((row) => row.type === type));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load queue.');
    }
  }

  useEffect(() => {
    void reload();
  }, [type]);

  const pending = rows.filter((row) => row.status === 'pending');

  return (
    <>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {pending.length === 0 ? (
        <p className="synapse-settings-lead">
          {type === 'avatar' ? 'No profile pictures waiting.' : 'No overlay items waiting.'}
        </p>
      ) : null}
      {pending.map((row) => (
        <div key={row.id} className="synapse-staff-card">
          <p>
            {type === 'avatar' ? 'Profile picture' : 'Overlay'} · {row.targetUid}
            {row.targetId ? ` · ${row.targetId}` : ''}
          </p>
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={type === 'avatar' ? 'Profile picture awaiting review' : 'Overlay awaiting review'}
              className="synapse-moderation-preview"
            />
          ) : (
            <p className="synapse-settings-lead">{row.note || 'No image URL on this item.'}</p>
          )}
          <ReviewButtons
            busy={busy}
            onReview={async (status, note) => {
              setBusy(true);
              try {
                await reviewModeration(
                  row.id,
                  status,
                  note,
                  status === 'removed' ? '' : undefined
                );
                await reload();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Review failed.');
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      ))}
      <HistoryTable rows={rows} />
    </>
  );
}

function WorkshopQueue() {
  const [rows, setRows] = useState<WorkshopCreation[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setRows(await listStaffWorkshop());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load Workshop.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Creator</th>
              <th>Visibility</th>
              <th>Status</th>
              <th>Featured</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <a href={workshopItemPath(row.id)}>{row.title}</a>
                </td>
                <td>@{row.creatorUsername || row.creatorUid.slice(0, 8)}</td>
                <td>{row.visibility}</td>
                <td>{row.status}</td>
                <td>{row.featured ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    type="button"
                    className="synapse-btn synapse-btn-ghost"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void setWorkshopFeatured(row.id, !row.featured)
                        .then(reload)
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : 'Update failed.')
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    {row.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <select
                    className="synapse-settings-input"
                    disabled={busy}
                    value={row.status}
                    onChange={(event) => {
                      const status = event.target.value as WorkshopStatus;
                      setBusy(true);
                      void setWorkshopStatus(row.id, status)
                        .then(reload)
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : 'Update failed.')
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="rejected">rejected</option>
                    <option value="removed">removed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReportQueue() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listWorkshopReports>>>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setRows(await listWorkshopReports());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reports.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Reason</th>
              <th>Creation</th>
              <th>Details</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.createdAt ? formatWhen(new Date(row.createdAt)) : '—'}</td>
                <td>{row.reason}</td>
                <td>
                  <a href={workshopItemPath(row.creationId)}>{row.creationId.slice(0, 8)}</a>
                </td>
                <td>{row.details || '—'}</td>
                <td>{row.status}</td>
                <td>
                  {row.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="synapse-btn synapse-btn-ghost"
                        disabled={busy}
                        onClick={() => {
                          setBusy(true);
                          void reviewWorkshopReport(row.id, 'reviewed')
                            .then(reload)
                            .finally(() => setBusy(false));
                        }}
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        className="synapse-btn synapse-btn-ghost"
                        disabled={busy}
                        onClick={() => {
                          setBusy(true);
                          void reviewWorkshopReport(row.id, 'dismissed')
                            .then(reload)
                            .finally(() => setBusy(false));
                        }}
                      >
                        Dismiss
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ReviewButtons({
  busy,
  onReview,
}: {
  busy: boolean;
  onReview: (status: Exclude<ModerationStatus, 'pending'>, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  return (
    <>
      <input
        className="synapse-settings-input"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Reviewer note"
      />
      <div className="synapse-theme-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-play"
          disabled={busy}
          onClick={() => void onReview('approved', note)}
        >
          Approve
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={busy}
          onClick={() => void onReview('rejected', note)}
        >
          Reject
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={busy}
          onClick={() => void onReview('removed', note)}
        >
          Remove
        </button>
      </div>
    </>
  );
}

function HistoryTable({ rows }: { rows: ModerationItem[] }) {
  return (
    <div className="synapse-staff-table-wrap">
      <table className="synapse-staff-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Target</th>
            <th>Reviewer</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.status}</td>
              <td>{row.targetUid}</td>
              <td>{row.reviewerUid || '—'}</td>
              <td>{row.createdAt ? formatWhen(row.createdAt) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
