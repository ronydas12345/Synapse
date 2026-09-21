import { signOut } from '../auth/client';

export default function SuspendedPage() {
  return (
    <main className="synapse-staff synapse-staff-suspended">
      <h1>Account suspended</h1>
      <p className="synapse-settings-lead">
        This Synapse account is blocked. Workspace and staff tools stay locked
        until an administrator reactivates it.
      </p>
      <button
        type="button"
        className="synapse-btn synapse-btn-danger"
        onClick={() => void signOut()}
      >
        Sign out
      </button>
    </main>
  );
}
