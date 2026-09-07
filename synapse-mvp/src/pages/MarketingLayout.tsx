import { useEffect, type ReactNode } from 'react';
import { useAppRoute } from '../app/AppLink';
import { usePrefersReducedMotion } from '../site/motion';
import SiteHeader from './chrome/SiteHeader';
import SiteFooter from './chrome/SiteFooter';
import './marketing.css';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const route = useAppRoute();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
    if (!id) {
      window.scrollTo(0, 0);
      return;
    }
    const go = () => {
      document.getElementById(id)?.scrollIntoView({
        block: 'start',
        behavior: reduced ? 'auto' : 'smooth',
      });
    };
    const frame = window.requestAnimationFrame(go);
    return () => window.cancelAnimationFrame(frame);
  }, [route, reduced]);

  useEffect(() => {
    const onHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({
        block: 'start',
        behavior: reduced ? 'auto' : 'smooth',
      });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [reduced]);

  return (
    <div className="synapse-mkt">
      <a className="synapse-mkt-skip" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
