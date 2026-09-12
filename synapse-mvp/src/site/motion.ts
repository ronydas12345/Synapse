import { useEffect, useState } from 'react';
import { documentPrefersReducedMotion, osPrefersReducedMotion } from '../settings/motion';
import { useAppSettings } from '../settings/settingsStore';

export function usePrefersReducedMotion(): boolean {
  const preference = useAppSettings((s) => s.general.motion);
  const [reduced, setReduced] = useState(() => documentPrefersReducedMotion());

  useEffect(() => {
    const sync = () => setReduced(documentPrefersReducedMotion());
    sync();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [preference]);

  return reduced;
}

export { osPrefersReducedMotion };
