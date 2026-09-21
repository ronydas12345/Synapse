import { useEffect, useState } from 'react';
import {
  createAdminAccount,
  deleteAdmin,
  listAdmins,
  listUsers,
  promoteAdmin,
} from './api';
import { formatWhen } from './dates';
import type { PlatformUser, StaffRoleDoc } from './model';

export default function AdminsPanel() {
  const [admins, setAdmins] = useState<StaffRoleDoc[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [promoteUid, setPromoteUid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const [nextAdmins, nextUsers] = await Promise.all([listAdmins(), listUsers()]);
      setAdmins(nextAdmins);
      setUsers(nextUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admins.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const promoteUser = users.find((user) => user.uid === promoteUid);

  return (
    <section className="synapse-staff-section">
      <h2>Admin management</h2>
      <p className="synapse-settings-lead">
        Superadmin-only. Promote an existing account or create a new email
        admin. Superadmin stays the verified owner email and is not stored in
        the roles collection.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Uid</th>
              <th>Active</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.uid}>
                <td>{admin.email}</td>
                <td>{admin.uid}</td>
                <td>{admin.active ? 'yes' : 'no'}</td>
                <td>{formatWhen(admin.updatedAt)}</td>
                <td>
                  <div className="synapse-theme-actions">
                    <button
                      type="button"
                      className="synapse-btn synapse-btn-ghost"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        void promoteAdmin(admin.uid, admin.email, !admin.active)
                          .then(reload)
                          .catch((err) =>
                            setError(err instanceof Error ? err.message : 'Update failed.')
                          )
                          .finally(() => setBusy(false));
                      }}
                    >
                      {admin.active ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button
                      type="button"
                      className="synapse-btn synapse-btn-ghost"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        void deleteAdmin(admin.uid)
                          .then(reload)
                          .catch((err) =>
                            setError(err instanceof Error ? err.message : 'Delete failed.')
                          )
                          .finally(() => setBusy(false));
                      }}
                    >
                      Delete role
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="synapse-staff-card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!promoteUser) return;
          setBusy(true);
          void promoteAdmin(promoteUser.uid, promoteUser.email, true)
            .then(() => {
              setPromoteUid('');
              return reload();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Promote failed.')
            )
            .finally(() => setBusy(false));
        }}
      >
        <h3>Promote existing user</h3>
        <label className="synapse-settings-field">
          <span>User</span>
          <select
            className="synapse-settings-input"
            value={promoteUid}
            onChange={(event) => setPromoteUid(event.target.value)}
          >
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                @{user.username} · {user.email}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="synapse-btn synapse-btn-play" disabled={busy || !promoteUser}>
          Promote to admin
        </button>
      </form>
      <form
        className="synapse-staff-card"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          void createAdminAccount({ email, password, username, displayName })
            .then(() => {
              setEmail('');
              setPassword('');
              setUsername('');
              setDisplayName('');
              return reload();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Create failed.')
            )
            .finally(() => setBusy(false));
        }}
      >
        <h3>Create admin account</h3>
        <label className="synapse-settings-field">
          <span>Email</span>
          <input
            className="synapse-settings-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="synapse-settings-field">
          <span>Password</span>
          <input
            className="synapse-settings-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>
        <label className="synapse-settings-field">
          <span>Username</span>
          <input
            className="synapse-settings-input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>
        <label className="synapse-settings-field">
          <span>Display name</span>
          <input
            className="synapse-settings-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="synapse-btn synapse-btn-play" disabled={busy}>
          Create admin
        </button>
      </form>
    </section>
  );
}
