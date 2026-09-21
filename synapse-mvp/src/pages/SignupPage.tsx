import AuthPanel from '../auth/AuthPanel';

export default function SignupPage() {
  return (
    <main id="main" className="synapse-auth-screen-main">
      <h1>Create account</h1>
      <p className="synapse-mkt-lead">
        Username and display name are required. Paths still save in this
        browser until cloud sync ships.
      </p>
      <div className="synapse-auth-card">
        <AuthPanel variant="signup" />
      </div>
    </main>
  );
}
