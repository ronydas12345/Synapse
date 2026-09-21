import { useEffect, useRef, useState } from 'react';
import { AppLink } from '../app/AppLink';
import {
  completeAccountIdentity,
  createAccountWithEmail,
  messageFromAuthError,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from './client';
import { useAuthStore } from './authStore';
import {
  TEST_ACCOUNT,
  identityFromFields,
  isIdentityComplete,
} from './identity';
import {
  displayNameError,
  usernameError,
  useProfileStore,
} from '../profile/profileStore';
import { roleLabel } from '../admin/model';

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.26-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function AuthPanel({
  variant,
  onSignedIn,
}: {
  variant: 'login' | 'signup' | 'account';
  onSignedIn?: () => void;
}) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const error = useAuthStore((s) => s.error);
  const busy = useAuthStore((s) => s.busy);
  const setBusy = useAuthStore((s) => s.setBusy);
  const setError = useAuthStore((s) => s.setError);
  const profile = useProfileStore((s) => s.profile);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const hadUser = useRef(Boolean(user));

  useEffect(() => {
    if (hadUser.current && !user) {
      setUsername('');
      setDisplayName('');
      setEmail('');
      setPassword('');
    }
    hadUser.current = Boolean(user);
  }, [user]);

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setError(null);
    setBusy(true);
    try {
      await action();
      after?.();
    } catch (err) {
      setError(messageFromAuthError(err));
    }
  };

  const finishIfComplete = () => {
    const current = useProfileStore.getState().profile;
    if (isIdentityComplete(current.username, current.displayName)) {
      onSignedIn?.();
    }
  };

  if (status === 'loading') {
    return <p className="synapse-settings-lead">Checking sign-in…</p>;
  }

  if (variant === 'account' && !user) {
    return (
      <div className="synapse-auth-panel">
        <p className="synapse-settings-lead">
          Log in to use your workspace. Username and display name are required
          when you create an account.
        </p>
        <div className="synapse-theme-actions">
          <AppLink to="login" className="synapse-btn synapse-btn-play">
            Log in
          </AppLink>
          <AppLink to="signup" className="synapse-btn synapse-btn-ghost">
            Create account
          </AppLink>
        </div>
      </div>
    );
  }

  if (user && !isIdentityComplete(profile.username, profile.displayName)) {
    const userErr = usernameError(username);
    const nameErr = displayNameError(displayName);
    return (
      <div className="synapse-auth-panel">
        <p className="synapse-settings-lead">
          Username and display name are required to finish this account.
        </p>
        <form
          className="synapse-auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            const identity = identityFromFields(username, displayName);
            if (!identity) return;
            void run(() => completeAccountIdentity(identity), onSignedIn);
          }}
        >
          <label className="synapse-settings-field">
            Username
            <input
              className="synapse-settings-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_name"
              autoComplete="username"
              required
            />
          </label>
          {userErr ? <p className="synapse-settings-error">{userErr}</p> : null}
          <label className="synapse-settings-field">
            Display name
            <input
              className="synapse-settings-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you appear"
              autoComplete="name"
              required
            />
          </label>
          {nameErr ? <p className="synapse-settings-error">{nameErr}</p> : null}
          {error ? <p className="synapse-settings-error">{error}</p> : null}
          <button
            type="submit"
            className="synapse-btn synapse-btn-play"
            disabled={busy || Boolean(userErr || nameErr)}
          >
            Save name
          </button>
        </form>
        <button
          type="button"
          className="synapse-btn synapse-btn-danger"
          disabled={busy}
          onClick={() => run(() => signOut())}
        >
          Sign out
        </button>
      </div>
    );
  }

  if (user) {
    const label =
      user.displayName || profile.displayName || user.email || 'Signed in';
    return (
      <div className="synapse-auth-panel">
        <div className="synapse-auth-identity">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="synapse-auth-photo" />
          ) : null}
          <div>
            <p className="synapse-auth-name">{label}</p>
            <p className="synapse-settings-hint">
              {profile.username ? `@${profile.username}` : ''}
              {user.email ? ` · ${user.email}` : ''}
            </p>
            <p className="synapse-auth-role">
              {roleLabel(role)}
              {user.providers.includes('google.com') ? ' · Google' : ''}
              {user.providers.includes('password') ? ' · Email' : ''}
            </p>
          </div>
        </div>
        {role === 'superadmin' ? (
          <AppLink to="superadmin" className="synapse-btn synapse-btn-play">
            Superadmin
          </AppLink>
        ) : null}
        {role === 'admin' ? (
          <AppLink to="admin" className="synapse-btn synapse-btn-play">
            Admin
          </AppLink>
        ) : null}
        {error ? <p className="synapse-settings-error">{error}</p> : null}
        <button
          type="button"
          className="synapse-btn synapse-btn-danger"
          disabled={busy}
          onClick={() => run(() => signOut())}
        >
          Sign out
        </button>
      </div>
    );
  }

  const signupIdentity = identityFromFields(username, displayName);
  const signupReady =
    Boolean(signupIdentity) &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    acceptLegal;
  const isSignup = variant === 'signup';

  return (
    <div className="synapse-auth-panel">
      <button
        type="button"
        className="synapse-btn synapse-btn-play synapse-auth-google"
        disabled={busy}
        onClick={() => run(() => signInWithGoogle())}
      >
        <GoogleMark />
        Continue with Google
      </button>
      <p className="synapse-auth-divider">or email</p>
      <form
        className="synapse-auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (isSignup) {
            if (!signupIdentity) return;
            void run(
              () =>
                createAccountWithEmail(email.trim(), password, signupIdentity),
              onSignedIn
            );
            return;
          }
          void run(
            () => signInWithEmail(email.trim(), password),
            finishIfComplete
          );
        }}
      >
        <label className="synapse-settings-field">
          Email
          <input
            className="synapse-settings-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="synapse-settings-field">
          Password
          <input
            className="synapse-settings-input"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        {isSignup ? (
          <>
            <label className="synapse-settings-field">
              Username
              <input
                className="synapse-settings-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_name"
                autoComplete="username"
                required
              />
            </label>
            {usernameError(username) ? (
              <p className="synapse-settings-error">{usernameError(username)}</p>
            ) : null}
            <label className="synapse-settings-field">
              Display name
              <input
                className="synapse-settings-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you appear"
                autoComplete="name"
                required
              />
            </label>
            {displayNameError(displayName) ? (
              <p className="synapse-settings-error">
                {displayNameError(displayName)}
              </p>
            ) : null}
            <label className="synapse-auth-consent">
              <input
                type="checkbox"
                checked={acceptLegal}
                onChange={(event) => setAcceptLegal(event.target.checked)}
                required
              />
              <span>
                I agree to the <AppLink to="terms">Terms</AppLink> and{' '}
                <AppLink to="privacy">Privacy Policy</AppLink>.
              </span>
            </label>
          </>
        ) : null}
        {error ? <p className="synapse-settings-error">{error}</p> : null}
        <button
          type="submit"
          className="synapse-btn synapse-btn-play"
          disabled={
            busy ||
            (isSignup ? !signupReady : !email.trim() || password.length < 6)
          }
        >
          {isSignup ? 'Create account' : 'Log in'}
        </button>
        {!isSignup ? (
          <button
            type="button"
            className="synapse-auth-switch"
            onClick={() => {
              setEmail(TEST_ACCOUNT.email);
              setPassword(TEST_ACCOUNT.password);
              setError(null);
            }}
          >
            Fill test login
          </button>
        ) : null}
      </form>
      <p className="synapse-auth-switch-row">
        By continuing with Google you agree to the{' '}
        <AppLink to="terms">Terms</AppLink> and{' '}
        <AppLink to="privacy">Privacy Policy</AppLink>.
      </p>
      <p className="synapse-auth-switch-row">
        {isSignup ? (
          <>
            Already have an account? <AppLink to="login">Log in</AppLink>
          </>
        ) : (
          <>
            Need an account? <AppLink to="signup">Create one</AppLink>
          </>
        )}
      </p>
    </div>
  );
}
