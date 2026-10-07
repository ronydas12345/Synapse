import { useState } from 'react';
import { AppLink } from '../../app/AppLink';
import { COOKIE_NOTICE_KEY } from '../../site/legal';

function readChoice(): boolean {
  try {
    return localStorage.getItem(COOKIE_NOTICE_KEY) === 'ok';
  } catch {
    return false;
  }
}

export default function CookieNotice() {
  const [hidden, setHidden] = useState(readChoice);

  if (hidden) return null;

  return (
    <div className="synapse-cookie-notice" role="dialog" aria-label="Cookie notice">
      <p>
        Some browser storage is necessary for Synapse to function. Playing a
        track may load YouTube, which can set its own cookies. See the{' '}
        <AppLink to="cookies">Cookie Policy</AppLink> and{' '}
        <AppLink to="privacy">Privacy Policy</AppLink>.
      </p>
      <button
        type="button"
        className="synapse-btn synapse-btn-play"
        onClick={() => {
          try {
            localStorage.setItem(COOKIE_NOTICE_KEY, 'ok');
          } catch {
            /* private mode */
          }
          setHidden(true);
        }}
      >
        OK
      </button>
    </div>
  );
}
