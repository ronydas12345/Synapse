import type { ReactNode } from 'react';

export function SettingsToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="synapse-settings-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="synapse-settings-toggle-title">{label}</span>
        {hint ? <span className="synapse-settings-toggle-hint">{hint}</span> : null}
      </span>
    </label>
  );
}

export function SettingsSelect({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="synapse-settings-field">
      <span>{label}</span>
      <select
        className="synapse-settings-input"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

export function SettingsRange({
  label,
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="synapse-settings-field">
      <span>
        {label}
        <span className="synapse-settings-range-value">
          {value}
          {suffix ?? ''}
        </span>
      </span>
      <input
        className="synapse-settings-range"
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
