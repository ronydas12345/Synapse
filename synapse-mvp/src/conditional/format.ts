import { calendarParts, type CalendarParts } from './dateMatch';
import {
  CALENDAR_FIELD_LABELS,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  WEATHER_STATE_LABELS,
  type CalendarField,
  type DateClause,
  type DateRule,
  type WeatherState,
} from './types';

function fieldVal(field: CalendarField, value: number): string {
  if (field === 'weekday') return WEEKDAY_LABELS[value] ?? String(value);
  if (field === 'month') return MONTH_LABELS[value - 1] ?? String(value);
  if (field === 'quarter') return `Q${value}`;
  if (field === 'hour') return `${String(value).padStart(2, '0')}:00`;
  return String(value);
}

export function formatDateClause(clause: DateClause): string {
  switch (clause.kind) {
    case 'catchAll':
      return 'Any other day';
    case 'equals':
      return `${CALENDAR_FIELD_LABELS[clause.field]} is ${fieldVal(clause.field, clause.value)}`;
    case 'in':
      return `${CALENDAR_FIELD_LABELS[clause.field]}: ${clause.values.map((v) => fieldVal(clause.field, v)).join(', ') || '—'}`;
    case 'range':
      return `${CALENDAR_FIELD_LABELS[clause.field]} ${fieldVal(clause.field, clause.start)}–${fieldVal(clause.field, clause.end)}`;
    case 'dateEquals':
      return clause.date || 'Date';
    case 'dateRange':
      return `${clause.start}–${clause.end}`;
    case 'annualRange': {
      const a = `${MONTH_LABELS[clause.startMonth - 1] ?? clause.startMonth} ${clause.startDay}`;
      const b = `${MONTH_LABELS[clause.endMonth - 1] ?? clause.endMonth} ${clause.endDay}`;
      return `${a}–${b} each year`;
    }
    default:
      return '';
  }
}

export function formatDateRule(rule: DateRule): string {
  const parts = (rule.clauses || []).map(formatDateClause).filter(Boolean);
  if (parts.length === 0) return 'No filter';
  const join = rule.join === 'all' ? ' and ' : ' or ';
  return parts.join(join);
}

export function formatDatePath(rules: DateRule[] | undefined): string {
  if (!rules || rules.length === 0) return 'Never (no rules)';
  return rules.map(formatDateRule).join(' · ');
}

export function formatWeatherPath(states: WeatherState[] | undefined): string {
  if (!states || states.length === 0) return 'None';
  return states.map((s) => WEATHER_STATE_LABELS[s] || s).join(', ');
}

export function formatCalendarNow(now: Date): string {
  const p: CalendarParts = calendarParts(now);
  return `${WEEKDAY_LABELS[p.weekday]} ${p.date}`;
}
