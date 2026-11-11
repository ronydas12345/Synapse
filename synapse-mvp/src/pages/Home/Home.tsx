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
import './Home.css';

export default function Home() {
  return (
    <main id="main" className="synapse-mkt-main">
      <Hero />
      <Benefits />
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
