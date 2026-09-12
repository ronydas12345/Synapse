import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppRoute } from '../app/AppLink';
import './tutorial.css';
import TutorialMenu from './TutorialMenu';
import TutorialTour from './TutorialTour';
import { maybeShowFirstRun } from './tutorialStore';
import { useTutorialObservers } from './useTutorialObservers';

export default function TutorialProvider({ children }: { children: ReactNode }) {
  const route = useAppRoute();
  useTutorialObservers(route);

  useEffect(() => {
    maybeShowFirstRun();
  }, []);

  return (
    <>
      {children}
      <TutorialMenu />
      <TutorialTour />
    </>
  );
}
