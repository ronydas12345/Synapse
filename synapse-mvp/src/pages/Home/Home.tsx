import Hero from './components/Hero';
import ValueProposition from './components/ValueProposition';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import About from './components/About';
import Philosophy from './components/Philosophy';
import WorkshopPreview from './components/WorkshopPreview';
import ThemeShowcase from './components/ThemeShowcase';
import BuiltForCreators from './components/BuiltForCreators';
import PricingPreview from './components/PricingPreview';
import FinalCTA from './components/FinalCTA';
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
      <Philosophy />
      <WorkshopPreview />
      <ThemeShowcase />
      <BuiltForCreators />
      <PricingPreview />
      <FinalCTA />
    </main>
  );
}
