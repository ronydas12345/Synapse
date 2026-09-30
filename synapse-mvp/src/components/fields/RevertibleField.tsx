import {
  useEffect,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { commitNumberOrRevert, commitOrRevert } from '../../ui/commitOrRevert';

type TextProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onBlur' | 'defaultValue'
> & {
  value: string;
  onCommit: (next: string) => void;
};

export function RevertibleTextInput({ value, onCommit, onKeyDown, ...rest }: TextProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const next = commitOrRevert(draft, value);
    setDraft(next);
    if (next !== value) onCommit(next);
  };

  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(value);
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
    />
  );
}

type AreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'onBlur' | 'defaultValue'
> & {
  value: string;
  onCommit: (next: string) => void;
  allowEmpty?: boolean;
};

export function RevertibleTextarea({
  value,
  onCommit,
  allowEmpty = false,
  onKeyDown,
  ...rest
}: AreaProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    if (allowEmpty && draft.trim() === '') {
      if (value !== '') onCommit('');
      setDraft('');
      return;
    }
    const next = commitOrRevert(draft, value);
    setDraft(next);
    if (next !== value) onCommit(next);
  };

  return (
    <textarea
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setDraft(value);
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
    />
  );
}

type NumberProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'onBlur' | 'defaultValue' | 'type'
> & {
  value: number;
  onCommit: (next: number) => void;
  min?: number;
  max?: number;
};

export function RevertibleNumberInput({
  value,
  onCommit,
  min,
  max,
  onKeyDown,
  ...rest
}: NumberProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const next = commitNumberOrRevert(draft, value, min, max);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  return (
    <input
      {...rest}
      type="number"
      min={min}
      max={max}
      value={draft}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw.trim() === '') return;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return;
        let next = parsed;
        if (min != null) next = Math.max(min, next);
        if (max != null) next = Math.min(max, next);
        if (next !== value) onCommit(next);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          setDraft(String(value));
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
    />
  );
}
