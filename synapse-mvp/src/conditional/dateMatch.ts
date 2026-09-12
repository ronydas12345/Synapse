import type { CalendarField, DateClause, DateRule } from './types';

export interface CalendarParts {
  weekday: number;
  dayOfMonth: number;
  month: number;
  quarter: number;
  year: number;
  weekOfYear: number;
  hour: number;
  date: string;
}

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ISO week (1–53) from the local calendar date. */
export function isoWeekLocal(d: Date): number {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = t.getDay() || 7;
  t.setDate(t.getDate() + 4 - day);
  const yearStart = new Date(t.getFullYear(), 0, 1);
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function calendarParts(now: Date): CalendarParts {
  const month = now.getMonth() + 1;
  return {
    weekday: now.getDay(),
    dayOfMonth: now.getDate(),
    month,
    quarter: Math.floor((month - 1) / 3) + 1,
    year: now.getFullYear(),
    weekOfYear: isoWeekLocal(now),
    hour: now.getHours(),
    date: toISODateLocal(now),
  };
}

function fieldValue(parts: CalendarParts, field: CalendarField): number {
  return parts[field];
}

function inWrappedRange(value: number, start: number, end: number): boolean {
  if (start <= end) return value >= start && value <= end;
  return value >= start || value <= end;
}

function parseISODate(iso: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  return iso;
}

function monthDayKey(month: number, day: number): number {
  return month * 100 + day;
}

export function clauseMatches(clause: DateClause, parts: CalendarParts): boolean {
  switch (clause.kind) {
    case 'catchAll':
      return true;
    case 'equals':
      return fieldValue(parts, clause.field) === clause.value;
    case 'in':
      return clause.values.includes(fieldValue(parts, clause.field));
    case 'range':
      return inWrappedRange(
        fieldValue(parts, clause.field),
        clause.start,
        clause.end
      );
    case 'dateEquals': {
      const date = parseISODate(clause.date);
      return date != null && parts.date === date;
    }
    case 'dateRange': {
      const start = parseISODate(clause.start);
      const end = parseISODate(clause.end);
      if (!start || !end) return false;
      if (start <= end) return parts.date >= start && parts.date <= end;
      return parts.date >= start || parts.date <= end;
    }
    case 'annualRange': {
      const t = monthDayKey(parts.month, parts.dayOfMonth);
      const start = monthDayKey(clause.startMonth, clause.startDay);
      const end = monthDayKey(clause.endMonth, clause.endDay);
      return inWrappedRange(t, start, end);
    }
    default:
      return false;
  }
}

export function ruleMatches(rule: DateRule, parts: CalendarParts): boolean {
  const clauses = Array.isArray(rule.clauses) ? rule.clauses : [];
  if (clauses.length === 0) return false;
  if (rule.join === 'all') return clauses.every((c) => clauseMatches(c, parts));
  return clauses.some((c) => clauseMatches(c, parts));
}

export function pathDateMatches(rules: DateRule[] | undefined, parts: CalendarParts): boolean {
  if (!rules || rules.length === 0) return false;
  return rules.some((rule) => ruleMatches(rule, parts));
}

export function selectDatePathIndex(
  pathDateRules: DateRule[][],
  now: Date
): number {
  const parts = calendarParts(now);
  for (let i = 0; i < pathDateRules.length; i++) {
    if (pathDateMatches(pathDateRules[i], parts)) return i;
  }
  for (let i = 0; i < pathDateRules.length; i++) {
    if ((pathDateRules[i] || []).some((r) => r.clauses?.some((c) => c.kind === 'catchAll'))) {
      return i;
    }
  }
  return 0;
}
