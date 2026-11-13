import Hero from './components/Hero';
import Benefits from './components/Benefits';
import ValueProposition from './components/ValueProposition';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import UseCases from './components/UseCases';
import WorkshopPreview from './components/WorkshopPreview';
import ThemeShowcase from './components/ThemeShowcase';
import About from './components/About';
import PricingPreview from './components/PricingPreview';
import { HERO_BANNER_SRC } from './heroBanner';
import './Home.css';

export default function Home() {
  return (
    <main id="main" className="synapse-mkt-main">
      <div
        className={`synapse-mkt-banner-stage${HERO_BANNER_SRC ? ' has-banner' : ''}`}
      >
        {HERO_BANNER_SRC ? (
          <div className="synapse-mkt-hero-media" aria-hidden="true">
            <img
              src={HERO_BANNER_SRC}
              alt=""
              width={3168}
              height={1344}
              decoding="async"
              fetchPriority="high"
            />
          </div>
        ) : null}
        <Hero />
        <Benefits />
      </div>
      <ValueProposition />
      <HowItWorks />
      <Features />
      <UseCases />
      <WorkshopPreview />
      <ThemeShowcase />
      <About />
      <PricingPreview />
    </main>
  );
}
