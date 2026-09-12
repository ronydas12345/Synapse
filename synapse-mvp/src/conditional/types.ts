/** Normalized weather. Engine never sees provider-specific strings. */
export const WEATHER_STATES = [
  'clear',
  'partlyCloudy',
  'cloudy',
  'drizzle',
  'rain',
  'thunderstorm',
  'snow',
  'sleet',
  'fog',
  'windy',
  'other',
] as const;

export type WeatherState = (typeof WEATHER_STATES)[number];

export const WEATHER_STATE_LABELS: Record<WeatherState, string> = {
  clear: 'Clear / Sunny',
  partlyCloudy: 'Partly cloudy',
  cloudy: 'Cloudy / Overcast',
  drizzle: 'Drizzle',
  rain: 'Rain',
  thunderstorm: 'Thunderstorm',
  snow: 'Snow',
  sleet: 'Sleet / Freezing',
  fog: 'Fog / Mist',
  windy: 'Windy / Severe',
  other: 'Other / Unknown',
};

export const CALENDAR_FIELDS = [
  'weekday',
  'dayOfMonth',
  'month',
  'quarter',
  'year',
  'weekOfYear',
  'hour',
] as const;

export type CalendarField = (typeof CALENDAR_FIELDS)[number];

export const CALENDAR_FIELD_LABELS: Record<CalendarField, string> = {
  weekday: 'Day of week',
  dayOfMonth: 'Day of month',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  weekOfYear: 'Week of year',
  hour: 'Hour of day',
};

export const FIELD_BOUNDS: Record<CalendarField, { min: number; max: number }> = {
  weekday: { min: 0, max: 6 },
  dayOfMonth: { min: 1, max: 31 },
  month: { min: 1, max: 12 },
  quarter: { min: 1, max: 4 },
  year: { min: 1970, max: 2100 },
  weekOfYear: { min: 1, max: 53 },
  hour: { min: 0, max: 23 },
};

export function defaultFieldValue(field: CalendarField): number {
  if (field === 'year') return new Date().getFullYear();
  if (field === 'hour') return 9;
  if (field === 'weekday') return 1;
  return FIELD_BOUNDS[field].min;
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export type DateClause =
  | { kind: 'equals'; field: CalendarField; value: number }
  | { kind: 'in'; field: CalendarField; values: number[] }
  | { kind: 'range'; field: CalendarField; start: number; end: number }
  | { kind: 'dateEquals'; date: string }
  | { kind: 'dateRange'; start: string; end: string }
  | {
      kind: 'annualRange';
      startMonth: number;
      startDay: number;
      endMonth: number;
      endDay: number;
    }
  | { kind: 'catchAll' };

export type DateRule = {
  join: 'all' | 'any';
  clauses: DateClause[];
};

export const CONDITIONAL_MODES = ['random', 'timeRange', 'weather', 'day'] as const;
export type ConditionalModeValue = (typeof CONDITIONAL_MODES)[number];
