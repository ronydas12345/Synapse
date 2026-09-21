import AuthPanel from '../auth/AuthPanel';
import { TEST_ACCOUNT } from '../auth/identity';
import AuthSwitchLink from '../auth/AuthSwitchLink';

export default function LoginPage() {
  return (
    <main id="main" className="synapse-auth-screen-main">
      <h1>Log in</h1>
      <p className="synapse-mkt-lead">
        Use Google or email. After sign-in, users go to the workspace; admins
        and the owner go to their dashboards. Marketing pages stay public.
      </p>
      <p className="synapse-auth-alt">
        Need an account? <AuthSwitchLink to="signup">Create account</AuthSwitchLink>
      </p>
      <aside className="synapse-auth-test">
        <p className="synapse-auth-test-label">Test user</p>
        <p>
          Email <code>{TEST_ACCOUNT.email}</code>
        </p>
        <p>
          Password <code>{TEST_ACCOUNT.password}</code>
        </p>
      </aside>
      <div className="synapse-auth-card">
        <AuthPanel variant="login" />
      </div>
    </main>
  );
}
