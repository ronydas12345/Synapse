import { useEffect, useState } from 'react';
import {
  formatPathKeyHint,
  isBindablePathKey,
  pathKeyFromEvent,
} from '../../conditional/pathMeta';

export default function PathKeyBind({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!listening) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'Escape') {
        setListening(false);
        return;
      }
      if (event.key === 'Backspace' || event.key === 'Delete') {
        onChange('');
        setListening(false);
        return;
      }
      if (!isBindablePathKey(event)) return;
      onChange(pathKeyFromEvent(event));
      setListening(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, onChange]);

  const hint = formatPathKeyHint(value);

  return (
    <button
      type="button"
      className={`synapse-path-key-bind${listening ? ' is-listening' : ''}`}
      aria-pressed={listening}
      onClick={() => setListening((on) => !on)}
    >
      {listening ? 'Press a key…' : hint || 'No key'}
    </button>
  );
}
