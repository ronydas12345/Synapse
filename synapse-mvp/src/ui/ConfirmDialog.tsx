import { useEffect, useId, useRef } from 'react';
import { useConfirmStore } from './confirmStore';

export default function ConfirmDialog() {
  const current = useConfirmStore((s) => s.current);
  const close = useConfirmStore((s) => s.close);
  const titleId = useId();
  const bodyId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!current) return;
    confirmRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey, true);
    };
  }, [current, close]);

  if (!current) return null;

  return (
    <div
      className="synapse-tutorial-dialog-layer synapse-confirm-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close(false);
      }}
    >
      <div
        className="synapse-tutorial-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <h2 id={titleId}>{current.title}</h2>
        <p id={bodyId} className="synapse-confirm-body">
          {current.body}
        </p>
        <div className="synapse-tutorial-actions">
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => close(false)}
          >
            {current.cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={
              current.danger === false
                ? 'synapse-btn synapse-btn-play'
                : 'synapse-btn synapse-btn-danger'
            }
            onClick={() => close(true)}
          >
            {current.confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
