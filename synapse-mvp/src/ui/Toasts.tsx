import { useToastStore } from './toastStore';

export default function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  if (toasts.length === 0) return null;

  return (
    <div className="synapse-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={[
            'synapse-toast',
            `is-${item.tone}`,
            item.quiet ? 'is-quiet' : '',
            item.leaving ? 'is-leaving' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="status"
        >
          <p>{item.message}</p>
          {!item.quiet && (item.action || item.tone === 'error') ? (
            <div className="synapse-toast-actions">
              {item.action ? (
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  onClick={() => {
                    item.action?.onClick();
                    dismiss(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              ) : null}
              {item.tone === 'error' ? (
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  aria-label="Dismiss"
                  onClick={() => dismiss(item.id)}
                >
                  Close
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
