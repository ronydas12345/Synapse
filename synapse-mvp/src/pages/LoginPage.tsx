import AuthPanel from '../auth/AuthPanel';

export default function LoginPage() {
  return (
    <main id="main" className="synapse-auth-screen-main">
      <h1>Log in</h1>
      <div className="synapse-auth-card" data-tutorial="auth-panel">
        <AuthPanel variant="login" />
      </div>
    </main>
  );
}
