import { useEffect, useState } from 'react';
import { navigateApp } from '../app/routes';
import { resolveShare } from '../workshop/api';

export default function ShareLookupPage({ shareRef }: { shareRef: string }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void resolveShare(shareRef)
      .then((hit) => {
        if (cancelled) return;
        if (hit?.path) navigateApp(hit.path, '', true);
        else setError('Nothing public or unlisted matches that ID.');
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not open that ID.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [shareRef]);

  return (
    <main id="main" className="synapse-mkt-main synapse-mkt-page">
      <p className="synapse-mkt-kicker">Share</p>
      <h1>Opening {shareRef}</h1>
      <p className="synapse-settings-lead">{error || 'Looking up that ID…'}</p>
    </main>
  );
}
