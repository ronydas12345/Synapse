import {
  CALENDAR_FIELDS,
  CALENDAR_FIELD_LABELS,
  FIELD_BOUNDS,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  defaultFieldValue,
  type CalendarField,
  type DateClause,
  type DateRule,
} from '../../conditional/types';
import { defaultCatchAllRule } from '../../conditional/defaults';

const CLAUSE_KINDS = [
  { value: 'in', label: 'Is one of' },
  { value: 'equals', label: 'Equals' },
  { value: 'range', label: 'Range' },
  { value: 'dateEquals', label: 'Specific date' },
  { value: 'dateRange', label: 'Date range' },
  { value: 'annualRange', label: 'Annual range (repeats)' },
  { value: 'catchAll', label: 'Any other day' },
] as const;

function fieldChoices(field: CalendarField): { value: number; label: string }[] {
  if (field === 'weekday') return WEEKDAY_LABELS.map((label, value) => ({ label, value }));
  if (field === 'month') return MONTH_LABELS.map((label, i) => ({ label, value: i + 1 }));
  if (field === 'quarter') {
    return [1, 2, 3, 4].map((value) => ({ value, label: `Q${value}` }));
  }
  if (field === 'hour') {
    return Array.from({ length: 24 }, (_, value) => ({
      value,
      label: `${String(value).padStart(2, '0')}:00`,
    }));
  }
  return [];
}

function emptyClause(kind: DateClause['kind']): DateClause {
  switch (kind) {
    case 'equals':
      return { kind: 'equals', field: 'weekday', value: defaultFieldValue('weekday') };
    case 'in':
      return { kind: 'in', field: 'weekday', values: [1, 2, 3, 4, 5] };
    case 'range':
      return { kind: 'range', field: 'month', start: 6, end: 8 };
    case 'dateEquals':
      return { kind: 'dateEquals', date: '' };
    case 'dateRange':
      return { kind: 'dateRange', start: '', end: '' };
    case 'annualRange':
      return { kind: 'annualRange', startMonth: 12, startDay: 1, endMonth: 12, endDay: 31 };
    default:
      return { kind: 'catchAll' };
  }
}

function withField(clause: DateClause, field: CalendarField): DateClause {
  if (clause.kind === 'equals') return { kind: 'equals', field, value: defaultFieldValue(field) };
  if (clause.kind === 'in') {
    const preset =
      field === 'weekday' ? [1, 2, 3, 4, 5] : field === 'month' ? [6, 7, 8] : [];
    return { kind: 'in', field, values: preset };
  }
  if (clause.kind === 'range') {
    const bounds = FIELD_BOUNDS[field];
    return { kind: 'range', field, start: bounds.min, end: bounds.max };
  }
  return clause;
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex-1 text-xs text-[var(--text-muted)]">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        className="w-full mt-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function FieldSelect({
  value,
  onChange,
}: {
  value: CalendarField;
  onChange: (field: CalendarField) => void;
}) {
  return (
    <select
      className="w-full p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as CalendarField)}
    >
      {CALENDAR_FIELDS.map((field) => (
        <option key={field} value={field}>
          {CALENDAR_FIELD_LABELS[field]}
        </option>
      ))}
    </select>
  );
}

function MultiToggle({
  options,
  selected,
  onToggle,
}: {
  options: { value: number; label: string }[];
  selected: number[];
  onToggle: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {options.map((opt) => {
        const on = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onToggle(opt.value)}
            className={`px-2 py-1 rounded text-xs ${
              on ? 'bg-[var(--accent)] text-[var(--bg-void)]' : 'bg-[var(--bg-hover)] text-[var(--text)]'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ClauseEditor({
  clause,
  onChange,
  onRemove,
}: {
  clause: DateClause;
  onChange: (next: DateClause) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-[var(--bg-deep)] p-2 rounded space-y-2">
      <div className="flex gap-2">
        <select
          className="flex-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
          value={clause.kind}
          onChange={(e) => onChange(emptyClause(e.target.value as DateClause['kind']))}
        >
          {CLAUSE_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-2 bg-[color-mix(in_srgb,var(--danger)_22%,transparent)] hover:bg-[color-mix(in_srgb,var(--danger)_28%,transparent)] rounded text-[var(--text)] text-xs font-semibold"
        >
          ✕
        </button>
      </div>

      {(clause.kind === 'equals' || clause.kind === 'in' || clause.kind === 'range') && (
        <FieldSelect
          value={clause.field}
          onChange={(field) => onChange(withField(clause, field))}
        />
      )}

      {clause.kind === 'equals' && (
        fieldChoices(clause.field).length > 0 ? (
          <select
            className="w-full p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
            value={clause.value}
            onChange={(e) => onChange({ ...clause, value: Number(e.target.value) })}
          >
            {fieldChoices(clause.field).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <NumberField
            label={CALENDAR_FIELD_LABELS[clause.field]}
            min={FIELD_BOUNDS[clause.field].min}
            max={FIELD_BOUNDS[clause.field].max}
            value={clause.value}
            onChange={(value) => onChange({ ...clause, value })}
          />
        )
      )}

      {clause.kind === 'in' && fieldChoices(clause.field).length > 0 && (
        <MultiToggle
          options={fieldChoices(clause.field)}
          selected={clause.values}
          onToggle={(value) => {
            const values = clause.values.includes(value)
              ? clause.values.filter((v) => v !== value)
              : [...clause.values, value].sort((a, b) => a - b);
            onChange({ ...clause, values });
          }}
        />
      )}

      {clause.kind === 'in' && fieldChoices(clause.field).length === 0 && (
        <label className="text-xs text-[var(--text-muted)] block">
          Values (comma-separated)
          <input
            className="w-full mt-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
            value={clause.values.join(', ')}
            onChange={(e) =>
              onChange({
                ...clause,
                values: e.target.value
                  .split(/[,\s]+/)
                  .map((p) => Number(p))
                  .filter((n) => Number.isFinite(n)),
              })
            }
          />
        </label>
      )}

      {clause.kind === 'range' && (
        fieldChoices(clause.field).length > 0 ? (
          <div className="flex gap-2">
            <label className="flex-1 text-xs text-[var(--text-muted)]">
              Start
              <select
                className="w-full mt-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
                value={clause.start}
                onChange={(e) => onChange({ ...clause, start: Number(e.target.value) })}
              >
                {fieldChoices(clause.field).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-xs text-[var(--text-muted)]">
              End
              <select
                className="w-full mt-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
                value={clause.end}
                onChange={(e) => onChange({ ...clause, end: Number(e.target.value) })}
              >
                {fieldChoices(clause.field).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="flex gap-2">
            <NumberField
              label="Start"
              min={FIELD_BOUNDS[clause.field].min}
              max={FIELD_BOUNDS[clause.field].max}
              value={clause.start}
              onChange={(start) => onChange({ ...clause, start })}
            />
            <NumberField
              label="End"
              min={FIELD_BOUNDS[clause.field].min}
              max={FIELD_BOUNDS[clause.field].max}
              value={clause.end}
              onChange={(end) => onChange({ ...clause, end })}
            />
          </div>
        )
      )}
      {clause.kind === 'range' ? (
        <p className="text-xs text-[var(--text-faint)] m-0">
          Inclusive. Ranges may wrap (Fri–Mon, Dec–Feb).
        </p>
      ) : null}

      {clause.kind === 'dateEquals' && (
        <input
          type="date"
          className="w-full p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
          value={clause.date}
          onChange={(e) => onChange({ ...clause, date: e.target.value })}
        />
      )}

      {clause.kind === 'dateRange' && (
        <div className="flex gap-2">
          <input
            type="date"
            className="flex-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
            value={clause.start}
            onChange={(e) => onChange({ ...clause, start: e.target.value })}
          />
          <input
            type="date"
            className="flex-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
            value={clause.end}
            onChange={(e) => onChange({ ...clause, end: e.target.value })}
          />
        </div>
      )}

      {clause.kind === 'annualRange' && (
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="Start month"
            min={1}
            max={12}
            value={clause.startMonth}
            onChange={(startMonth) => onChange({ ...clause, startMonth })}
          />
          <NumberField
            label="Start day"
            min={1}
            max={31}
            value={clause.startDay}
            onChange={(startDay) => onChange({ ...clause, startDay })}
          />
          <NumberField
            label="End month"
            min={1}
            max={12}
            value={clause.endMonth}
            onChange={(endMonth) => onChange({ ...clause, endMonth })}
          />
          <NumberField
            label="End day"
            min={1}
            max={31}
            value={clause.endDay}
            onChange={(endDay) => onChange({ ...clause, endDay })}
          />
        </div>
      )}
    </div>
  );
}

export default function DayPathEditor({
  pathDateRules,
  onChange,
}: {
  pathDateRules: DateRule[][];
  onChange: (next: DateRule[][]) => void;
}) {
  const setPath = (pathIdx: number, rules: DateRule[]) => {
    const next = pathDateRules.map((row) => row.map((r) => ({ ...r, clauses: [...r.clauses] })));
    next[pathIdx] = rules;
    onChange(next);
  };

  return (
    <>
      {pathDateRules.map((rules, pathIdx) => (
        <div key={`day-${pathIdx}`} className="border-t border-[var(--border)] pt-3 space-y-2">
          <label className="text-[var(--text)] block font-semibold text-sm">
            Path {String.fromCharCode(65 + pathIdx)} day / date
          </label>
          <p className="text-xs text-[var(--text-muted)] m-0">
            This branch plays if any rule matches. Use one value, several values,
            or a range — weekday, month, year, specific dates, or a repeating
            annual window. Add a catch-all for everything else.
          </p>
          {rules.map((rule, ruleIdx) => (
            <div key={ruleIdx} className="space-y-2 border border-[var(--border)] rounded p-2">
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 p-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded text-[var(--text)] text-sm"
                  value={rule.join}
                  onChange={(e) => {
                    const next = [...rules];
                    next[ruleIdx] = { ...rule, join: e.target.value === 'all' ? 'all' : 'any' };
                    setPath(pathIdx, next);
                  }}
                >
                  <option value="any">Match any clause</option>
                  <option value="all">Match all clauses</option>
                </select>
                <button
                  type="button"
                  className="px-2 py-2 bg-[color-mix(in_srgb,var(--danger)_22%,transparent)] hover:bg-[color-mix(in_srgb,var(--danger)_28%,transparent)] rounded text-[var(--text)] text-xs"
                  onClick={() => setPath(pathIdx, rules.filter((_, i) => i !== ruleIdx))}
                >
                  Remove rule
                </button>
              </div>
              {rule.clauses.map((clause, clauseIdx) => (
                <ClauseEditor
                  key={clauseIdx}
                  clause={clause}
                  onChange={(nextClause) => {
                    const next = [...rules];
                    const clauses = [...rule.clauses];
                    clauses[clauseIdx] = nextClause;
                    next[ruleIdx] = { ...rule, clauses };
                    setPath(pathIdx, next);
                  }}
                  onRemove={() => {
                    const clauses = rule.clauses.filter((_, i) => i !== clauseIdx);
                    const next = [...rules];
                    if (clauses.length === 0) setPath(pathIdx, rules.filter((_, i) => i !== ruleIdx));
                    else {
                      next[ruleIdx] = { ...rule, clauses };
                      setPath(pathIdx, next);
                    }
                  }}
                />
              ))}
              <button
                type="button"
                className="w-full py-1.5 bg-[var(--bg-hover)] hover:bg-[var(--bg-elevated)] rounded text-[var(--text)] text-xs"
                onClick={() => {
                  const next = [...rules];
                  next[ruleIdx] = {
                    ...rule,
                    clauses: [...rule.clauses, emptyClause('in')],
                  };
                  setPath(pathIdx, next);
                }}
              >
                + Add clause
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-elevated)] rounded text-[var(--text)] text-xs font-semibold"
              onClick={() =>
                setPath(pathIdx, [...rules, { join: 'any', clauses: [emptyClause('in')] }])
              }
            >
              + Add rule
            </button>
            <button
              type="button"
              className="flex-1 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-elevated)] rounded text-[var(--text)] text-xs font-semibold"
              onClick={() => setPath(pathIdx, [...rules, defaultCatchAllRule()])}
            >
              + Catch-all
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
