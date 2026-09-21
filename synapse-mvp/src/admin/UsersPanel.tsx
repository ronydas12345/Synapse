import { useEffect, useMemo, useState } from 'react';
import {
  listUsers,
  sendUserPasswordReset,
  updateManagedUser,
} from './api';
import { formatWhen } from './dates';
import type { AccountStatus, PlatformUser } from './model';

export default function UsersPanel() {
  const [rows, setRows] = useState<PlatformUser[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PlatformUser | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    setError('');
    try {
      setRows(await listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.username.includes(q) ||
        row.displayName.toLowerCase().includes(q) ||
        row.email.includes(q) ||
        row.uid.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <section className="synapse-staff-section">
      <h2>User management</h2>
      <p className="synapse-settings-lead">
        Search accounts, edit identity, suspend, and send a password reset
        email. Auth passwords are not stored in the profile table.
      </p>
      <input
        className="synapse-settings-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search username, name, or email"
      />
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Status</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.uid}
                className={selected?.uid === row.uid ? 'is-selected' : ''}
                onClick={() => setSelected(row)}
              >
                <td>
                  @{row.username}
                  <div className="synapse-settings-hint">{row.displayName}</div>
                </td>
                <td>{row.email}</td>
                <td>{row.status}</td>
                <td>{formatWhen(row.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <UserEditor
          user={selected}
          busy={busy}
          onChange={setSelected}
          onSave={async (next) => {
            setBusy(true);
            setError('');
            try {
              await updateManagedUser(selected.uid, next);
              await reload();
              setSelected((current) =>
                current ? { ...current, ...next, username: next.username ?? current.username, displayName: next.displayName ?? current.displayName, photoURL: next.photoURL ?? current.photoURL, status: next.status ?? current.status } : current
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Save failed.');
            } finally {
              setBusy(false);
            }
          }}
          onReset={async () => {
            setBusy(true);
            setError('');
            try {
              await sendUserPasswordReset(selected.email);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Reset failed.');
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : (
        <p className="synapse-settings-hint">Select a user to edit.</p>
      )}
    </section>
  );
}

function UserEditor({
  user,
  busy,
  onChange,
  onSave,
  onReset,
}: {
  user: PlatformUser;
  busy: boolean;
  onChange: (user: PlatformUser) => void;
  onSave: (patch: {
    username: string;
    displayName: string;
    photoURL: string;
    status: AccountStatus;
  }) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  return (
    <form
      className="synapse-staff-card"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          username: user.username,
          displayName: user.displayName,
          photoURL: user.photoURL,
          status: user.status,
        });
      }}
    >
      <h3>@{user.username}</h3>
      <p className="synapse-settings-hint">{user.uid}</p>
      <label className="synapse-settings-field">
        <span>Username</span>
        <input
          className="synapse-settings-input"
          value={user.username}
          onChange={(event) => onChange({ ...user, username: event.target.value })}
        />
      </label>
      <label className="synapse-settings-field">
        <span>Display name</span>
        <input
          className="synapse-settings-input"
          value={user.displayName}
          onChange={(event) =>
            onChange({ ...user, displayName: event.target.value })
          }
        />
      </label>
      <label className="synapse-settings-field">
        <span>Profile picture URL</span>
        <input
          className="synapse-settings-input"
          value={user.photoURL}
          onChange={(event) => onChange({ ...user, photoURL: event.target.value })}
          placeholder="https://"
        />
      </label>
      <label className="synapse-settings-field">
        <span>Status</span>
        <select
          className="synapse-settings-input"
          value={user.status}
          onChange={(event) =>
            onChange({ ...user, status: event.target.value as AccountStatus })
          }
        >
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      <div className="synapse-theme-actions">
        <button type="submit" className="synapse-btn synapse-btn-play" disabled={busy}>
          Save
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={busy}
          onClick={() => void onReset()}
        >
          Send password reset
        </button>
      </div>
    </form>
  );
}
