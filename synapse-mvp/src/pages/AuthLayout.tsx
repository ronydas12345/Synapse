import { useEffect, type ReactNode } from 'react';
import { AppLink } from '../app/AppLink';
import { SynapseWordmark } from './chrome/SynapseMark';
import './marketing.css';

export default function AuthLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="synapse-mkt synapse-auth-screen">
      <a className="synapse-mkt-skip" href="#main">
        Skip to login
      </a>
      <header className="synapse-auth-screen-brand">
        <AppLink to="home" className="synapse-mkt-logo">
          <SynapseWordmark />
        </AppLink>
      </header>
      {children}
    </div>
  );
}
