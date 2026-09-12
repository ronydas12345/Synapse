import { CALENDAR_FIELDS, WEATHER_STATES, type CalendarField, type DateClause, type DateRule, type WeatherState } from './types';

function isWeather(value: unknown): value is WeatherState {
  return typeof value === 'string' && (WEATHER_STATES as readonly string[]).includes(value);
}

function isField(value: unknown): value is CalendarField {
  return typeof value === 'string' && (CALENDAR_FIELDS as readonly string[]).includes(value);
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function parsePathWeather(raw: unknown, numPaths: number): WeatherState[][] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: numPaths }, (_, i) => {
    const row = list[i];
    if (!Array.isArray(row)) return [];
    return row.filter(isWeather);
  });
}

export function parseDateClause(raw: unknown): DateClause | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  switch (c.kind) {
    case 'catchAll':
      return { kind: 'catchAll' };
    case 'equals':
      if (!isField(c.field)) return null;
      return { kind: 'equals', field: c.field, value: num(c.value) };
    case 'in':
      if (!isField(c.field) || !Array.isArray(c.values)) return null;
      return { kind: 'in', field: c.field, values: c.values.map((v) => num(v)) };
    case 'range':
      if (!isField(c.field)) return null;
      return { kind: 'range', field: c.field, start: num(c.start), end: num(c.end) };
    case 'dateEquals':
      return { kind: 'dateEquals', date: String(c.date || '') };
    case 'dateRange':
      return { kind: 'dateRange', start: String(c.start || ''), end: String(c.end || '') };
    case 'annualRange':
      return {
        kind: 'annualRange',
        startMonth: Math.min(12, Math.max(1, num(c.startMonth, 1))),
        startDay: Math.min(31, Math.max(1, num(c.startDay, 1))),
        endMonth: Math.min(12, Math.max(1, num(c.endMonth, 1))),
        endDay: Math.min(31, Math.max(1, num(c.endDay, 1))),
      };
    default:
      return null;
  }
}

export function parseDateRule(raw: unknown): DateRule | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const clauses = Array.isArray(r.clauses)
    ? r.clauses.map(parseDateClause).filter((c): c is DateClause => c != null)
    : [];
  return {
    join: r.join === 'all' ? 'all' : 'any',
    clauses,
  };
}

export function parsePathDateRules(raw: unknown, numPaths: number): DateRule[][] {
  const list = Array.isArray(raw) ? raw : [];
  return Array.from({ length: numPaths }, (_, i) => {
    const row = list[i];
    if (!Array.isArray(row)) return [];
    return row.map(parseDateRule).filter((r): r is DateRule => r != null);
  });
}
