import AuthPanel from '../auth/AuthPanel';
import AuthSwitchLink from '../auth/AuthSwitchLink';

export default function SignupPage() {
  return (
    <main id="main" className="synapse-auth-screen-main">
      <h1>Create account</h1>
      <p className="synapse-mkt-lead">
        Username and display name are required. Your paths and profile save to
        this account.
      </p>
      <p className="synapse-auth-alt">
        Already have an account? <AuthSwitchLink to="login">Log in</AuthSwitchLink>
      </p>
      <div className="synapse-auth-card">
        <AuthPanel variant="signup" />
      </div>
    </main>
  );
}
