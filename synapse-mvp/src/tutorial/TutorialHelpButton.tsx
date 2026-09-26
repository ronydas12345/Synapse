import { HelpCircle } from 'lucide-react';
import { useAuthStore } from '../auth/authStore';
import { useTutorialStore } from './tutorialStore';

export default function TutorialHelpButton({ className = '' }: { className?: string }) {
  const signedIn = Boolean(useAuthStore((s) => s.user));
  const openMenu = useTutorialStore((s) => s.openMenu);
  const view = useTutorialStore((s) => s.view);

  if (signedIn) return null;

  return (
    <button
      type="button"
      className={`synapse-help-btn ${className}`.trim()}
      data-tutorial="help"
      aria-label="Help & Tutorial"
      title="Help & Tutorial"
      aria-haspopup="dialog"
      aria-expanded={view !== 'closed' && view !== 'tour'}
      onClick={() => openMenu()}
    >
      <HelpCircle size={16} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
