import { useEffect, useState } from 'react';
import { listModeration, reviewModeration } from './api';
import { formatWhen } from './dates';
import type { ModerationItem, ModerationStatus } from './model';

export default function ModerationPanel() {
  const [rows, setRows] = useState<ModerationItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const all = await listModeration();
      setRows(all.filter((row) => row.type === 'avatar'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load queue.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const pending = rows.filter((row) => row.status === 'pending');

  return (
    <section className="synapse-staff-section">
      <h2>Moderation</h2>
      <p className="synapse-settings-lead">
        Review profile pictures. New uploads stay off the public profile until a
        staff member approves them. Workshop overlays are not in this queue yet.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      {pending.length === 0 ? (
        <p className="synapse-settings-lead">No profile pictures waiting.</p>
      ) : null}
      {pending.map((row) => (
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
                <td>{formatWhen(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        Profile picture · {item.targetUid}
      </p>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt="Profile picture awaiting review"
          className="synapse-moderation-preview"
        />
      ) : (
        <p className="synapse-settings-lead">No image URL on this item.</p>
      )}
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
