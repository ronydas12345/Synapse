import { useEffect, useId, useRef } from 'react';
import {
  formatPathKeyHint,
  pathKeyMatches,
} from '../conditional/pathMeta';
import { isTypingTarget } from '../ui/isTypingTarget';

export interface ChoiceDialogOption {
  index: number;
  name: string;
  key: string;
  targetTitle: string;
  connected: boolean;
}

export default function ChoiceDialog({
  title,
  options,
  onPick,
}: {
  title: string;
  options: ChoiceDialogOption[];
  onPick: (index: number) => void;
}) {
  const titleId = useId();
  const bodyId = useId();
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const match = options.find(
        (option) =>
          option.connected && option.key && pathKeyMatches(option.key, event)
      );
      if (!match) return;
      event.preventDefault();
      event.stopPropagation();
      onPick(match.index);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey, true);
    };
  }, [options, onPick]);

  const firstConnected = options.findIndex((option) => option.connected);

  return (
    <div
      className="synapse-tutorial-dialog-layer synapse-choice-layer"
      role="presentation"
    >
      <div
        className="synapse-tutorial-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={bodyId} className="synapse-confirm-body">
          Pick a path to continue. You can click an option or press its key.
        </p>
        <div className="synapse-choice-options">
          {options.map((option, i) => {
            const hint = formatPathKeyHint(option.key);
            return (
              <button
                key={option.index}
                ref={i === firstConnected ? firstRef : undefined}
                type="button"
                className="synapse-choice-option"
                disabled={!option.connected}
                onClick={() => {
                  if (option.connected) onPick(option.index);
                }}
              >
                <span>
                  <span className="synapse-choice-option-name">{option.name}</span>
                  <span className="synapse-choice-option-target">
                    {option.connected ? option.targetTitle : 'Not connected'}
                  </span>
                </span>
                {hint ? (
                  <kbd className="synapse-choice-option-key">{hint}</kbd>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
