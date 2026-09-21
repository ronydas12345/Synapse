import { useEffect, useState } from 'react';
import { listModeration, queueModeration, reviewModeration } from './api';
import { formatWhen } from './dates';
import type { ModerationItem, ModerationStatus, ModerationType } from './model';

export default function ModerationPanel() {
  const [rows, setRows] = useState<ModerationItem[]>([]);
  const [targetUid, setTargetUid] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState<ModerationType>('avatar');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setRows(await listModeration());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load queue.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <section className="synapse-staff-section">
      <h2>Moderation</h2>
      <p className="synapse-settings-lead">
        Review profile pictures and Workshop overlay URLs. Overlay hosting is
        not shipped, so this queue is staff-created until Workshop uploads
        exist.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <form
        className="synapse-staff-card"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          void queueModeration({ type, targetUid: targetUid.trim(), imageUrl, note })
            .then(() => {
              setTargetUid('');
              setImageUrl('');
              setNote('');
              return reload();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Queue failed.')
            )
            .finally(() => setBusy(false));
        }}
      >
        <h3>Queue item</h3>
        <label className="synapse-settings-field">
          <span>Type</span>
          <select
            className="synapse-settings-input"
            value={type}
            onChange={(event) => setType(event.target.value as ModerationType)}
          >
            <option value="avatar">Profile picture</option>
            <option value="overlay">Workshop overlay</option>
          </select>
        </label>
        <label className="synapse-settings-field">
          <span>Target user uid</span>
          <input
            className="synapse-settings-input"
            value={targetUid}
            onChange={(event) => setTargetUid(event.target.value)}
            required
          />
        </label>
        <label className="synapse-settings-field">
          <span>Image URL</span>
          <input
            className="synapse-settings-input"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://"
          />
        </label>
        <label className="synapse-settings-field">
          <span>Note</span>
          <input
            className="synapse-settings-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button type="submit" className="synapse-btn synapse-btn-play" disabled={busy}>
          Add to queue
        </button>
      </form>
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Target</th>
              <th>Status</th>
              <th>Reviewer</th>
              <th>When</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.type}</td>
                <td>{row.targetUid}</td>
                <td>{row.status}</td>
                <td>{row.reviewerUid || '—'}</td>
                <td>{formatWhen(row.createdAt)}</td>
                <td>
                  {row.imageUrl ? (
                    <a href={row.imageUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows
        .filter((row) => row.status === 'pending')
        .map((row) => (
          <ReviewRow
            key={row.id}
            item={row}
            busy={busy}
            onReview={async (status, reviewNote) => {
              setBusy(true);
              try {
                await reviewModeration(
                  row.id,
                  status,
                  reviewNote,
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
        ))}
    </section>
  );
}

function ReviewRow({
  item,
  busy,
  onReview,
}: {
  item: ModerationItem;
  busy: boolean;
  onReview: (
    status: Exclude<ModerationStatus, 'pending'>,
    note: string
  ) => Promise<void>;
}) {
  const [note, setNote] = useState(item.note);
  return (
    <div className="synapse-staff-card">
      <p>
        {item.type} · {item.targetUid}
      </p>
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
    </div>
  );
}
