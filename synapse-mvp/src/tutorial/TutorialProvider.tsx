import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAppRoute } from '../app/AppLink';
import { useAuthStore } from '../auth/authStore';
import './tutorial.css';
import TutorialMenu from './TutorialMenu';
import TutorialTour from './TutorialTour';
import {
  FIRST_RUN_HOME_DELAY_MS,
  isNearDocumentBottom,
  maybeShowFirstRun,
  shouldOfferFirstRun,
  useTutorialStore,
} from './tutorialStore';
import { useTutorialObservers } from './useTutorialObservers';

function isSignedIn(): boolean {
  return Boolean(useAuthStore.getState().user);
}

function offerHomeFirstRun(): void {
  maybeShowFirstRun(isSignedIn());
}

export default function TutorialProvider({ children }: { children: ReactNode }) {
  const route = useAppRoute();
  const signedIn = Boolean(useAuthStore((s) => s.user));
  useTutorialObservers(route);
  const offer = shouldOfferFirstRun(route, signedIn);

  useEffect(() => {
    useTutorialStore.getState().resumeSavedRun();
  }, []);

  useEffect(() => {
    if (!offer) return;
    const id = window.setTimeout(offerHomeFirstRun, FIRST_RUN_HOME_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [offer]);

  useEffect(() => {
    if (!offer) return;
    const onScroll = () => {
      const scrolling = document.scrollingElement || document.documentElement;
      if (
        !isNearDocumentBottom({
          viewportHeight: window.innerHeight,
          scrollY: window.scrollY || scrolling.scrollTop,
          scrollHeight: scrolling.scrollHeight,
        })
      ) {
        return;
      }
      offerHomeFirstRun();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offer]);

  return (
    <>
      {children}
      <TutorialMenu />
      <TutorialTour />
    </>
  );
}
