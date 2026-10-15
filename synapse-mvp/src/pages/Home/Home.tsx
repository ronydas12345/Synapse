import Hero from './components/Hero';
import ValueProposition from './components/ValueProposition';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import About from './components/About';
import WorkshopPreview from './components/WorkshopPreview';
import ThemeShowcase from './components/ThemeShowcase';
import PricingPreview from './components/PricingPreview';
import './Home.css';

export default function Home() {
  return (
    <main id="main" className="synapse-mkt-main">
      <Hero />
      <ValueProposition />
      <Features />
      <HowItWorks />
      <UseCases />
      <About />
      <WorkshopPreview />
      <ThemeShowcase />
      <PricingPreview />
    </main>
  );
}
