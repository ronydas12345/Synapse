import AuthPanel from '../auth/AuthPanel';

export default function SignupPage() {
  return (
    <main id="main" className="synapse-auth-screen-main">
      <h1>Create account</h1>
      <div className="synapse-auth-card" data-tutorial="auth-panel">
        <AuthPanel variant="signup" />
      </div>
    </main>
  );
}
