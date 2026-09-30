import AuthPanel from '../auth/AuthPanel';
import AuthSwitchLink from '../auth/AuthSwitchLink';

export default function LoginPage() {
  return (
    <main id="main" className="synapse-auth-screen-main">
      <h1>Log in</h1>
      <p className="synapse-mkt-lead">
        Use Google sign-in or email.
      </p>
      <p className="synapse-auth-alt">
        Need an account? <AuthSwitchLink to="signup">Create account</AuthSwitchLink>
      </p>
      <div className="synapse-auth-card" data-tutorial="auth-panel">
        <AuthPanel variant="login" />
      </div>
    </main>
  );
}
