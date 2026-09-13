export function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function shiftDayKey(key: string, days: number): string {
  const date = parseLocalDay(key);
  date.setDate(date.getDate() + days);
  return localDayKey(date);
}

export function compareDayKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function activityRangeStart(
  createdAt: string,
  listensByDay: Record<string, number>
): string {
  const created = Number.isFinite(Date.parse(createdAt))
    ? localDayKey(new Date(createdAt))
    : localDayKey();
  const earliest = Object.keys(listensByDay)
    .filter((key) => (listensByDay[key] || 0) > 0)
    .sort()[0];
  if (!earliest) return created;
  return earliest < created ? earliest : created;
}

export function listenCount(listensByDay: Record<string, number>, day: string): number {
  return Math.max(0, Math.floor(Number(listensByDay[day]) || 0));
}

export interface ListenStreaks {
  current: number;
  longest: number;
  activeDays: number;
  lastListenDay: string | null;
  bestDay: string | null;
  bestDayCount: number;
}

/** A listen day is any local calendar day with at least one track start. */
export function computeStreaks(
  listensByDay: Record<string, number>,
  today = localDayKey()
): ListenStreaks {
  const active = Object.keys(listensByDay)
    .filter((key) => listenCount(listensByDay, key) > 0)
    .sort();

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of active) {
    if (prev && shiftDayKey(prev, 1) === day) run += 1;
    else run = 1;
    if (run > longest) longest = run;
    prev = day;
  }

  let current = 0;
  const todayCount = listenCount(listensByDay, today);
  const cursor = todayCount > 0 ? today : shiftDayKey(today, -1);
  if (listenCount(listensByDay, cursor) > 0) {
    let day = cursor;
    while (listenCount(listensByDay, day) > 0) {
      current += 1;
      day = shiftDayKey(day, -1);
    }
  }

  let bestDay: string | null = null;
  let bestDayCount = 0;
  for (const day of active) {
    const count = listenCount(listensByDay, day);
    if (count > bestDayCount) {
      bestDay = day;
      bestDayCount = count;
    }
  }

  return {
    current,
    longest,
    activeDays: active.length,
    lastListenDay: active[active.length - 1] ?? null,
    bestDay,
    bestDayCount,
  };
}

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatmapCell {
  date: string;
  count: number;
  level: HeatmapLevel;
  inRange: boolean;
}

export interface HeatmapWeek {
  days: HeatmapCell[];
}

export interface HeatmapMonthLabel {
  label: string;
  weekIndex: number;
}

export interface ListenHeatmap {
  startDay: string;
  endDay: string;
  weeks: HeatmapWeek[];
  months: HeatmapMonthLabel[];
  years: number[];
  totalInRange: number;
}

export function heatmapLevel(count: number, peak: number): HeatmapLevel {
  if (count <= 0) return 0;
  if (peak <= 1) return 1;
  const t = count / peak;
  if (t <= 0.25) return 1;
  if (t <= 0.5) return 2;
  if (t <= 0.75) return 3;
  return 4;
}

function sundayOnOrBefore(key: string): string {
  return shiftDayKey(key, -parseLocalDay(key).getDay());
}

function padPartialWeek(days: HeatmapCell[]): HeatmapCell[] {
  const last = days[days.length - 1];
  if (!last || days.length >= 7) return days;
  const extra: HeatmapCell[] = [];
  for (let i = days.length; i < 7; i++) {
    extra.push({
      date: shiftDayKey(last.date, i - days.length + 1),
      count: 0,
      level: 0,
      inRange: false,
    });
  }
  return [...days, ...extra];
}

export function rollingWindowStart(today: string, weeks = 53): string {
  return shiftDayKey(today, -(weeks - 1) * 7);
}

export function buildListenHeatmap(
  listensByDay: Record<string, number>,
  startDay: string,
  endDay: string,
  activeStart = startDay
): ListenHeatmap {
  const start = compareDayKeys(startDay, endDay) <= 0 ? startDay : endDay;
  const end = compareDayKeys(startDay, endDay) <= 0 ? endDay : startDay;
  let peak = 1;
  for (let day = start; compareDayKeys(day, end) <= 0; day = shiftDayKey(day, 1)) {
    peak = Math.max(peak, listenCount(listensByDay, day));
  }

  const weeks: HeatmapWeek[] = [];
  let column: HeatmapCell[] = [];
  const first = sundayOnOrBefore(start);
  for (let day = first; compareDayKeys(day, end) <= 0; day = shiftDayKey(day, 1)) {
    const inRange =
      compareDayKeys(day, start) >= 0 &&
      compareDayKeys(day, end) <= 0 &&
      compareDayKeys(day, activeStart) >= 0;
    const count = inRange ? listenCount(listensByDay, day) : 0;
    column.push({
      date: day,
      count,
      level: inRange ? heatmapLevel(count, peak) : 0,
      inRange,
    });
    if (column.length === 7) {
      weeks.push({ days: column });
      column = [];
    }
  }
  if (column.length) weeks.push({ days: padPartialWeek(column) });

  const months: HeatmapMonthLabel[] = [];
  weeks.forEach((week, weekIndex) => {
    const monthStart = week.days.find((cell) => parseLocalDay(cell.date).getDate() === 1);
    const labelDay = monthStart ?? (weekIndex === 0 ? week.days[0] : null);
    if (!labelDay) return;
    months.push({
      label: parseLocalDay(labelDay.date).toLocaleString(undefined, { month: 'short' }),
      weekIndex,
    });
  });

  const years: number[] = [];
  const startYear = parseLocalDay(start).getFullYear();
  const endYear = parseLocalDay(end).getFullYear();
  for (let year = startYear; year <= endYear; year++) years.push(year);

  let totalInRange = 0;
  for (const week of weeks) {
    for (const cell of week.days) {
      if (cell.inRange) totalInRange += cell.count;
    }
  }

  return { startDay: start, endDay: end, weeks, months, years, totalInRange };
}

export function yearBounds(year: number, rangeStart: string, rangeEnd: string): {
  start: string;
  end: string;
} {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const start = compareDayKeys(yearStart, rangeStart) < 0 ? rangeStart : yearStart;
  const end = compareDayKeys(yearEnd, rangeEnd) > 0 ? rangeEnd : yearEnd;
  return { start, end };
}

export function formatListenDay(key: string): string {
  return parseLocalDay(key).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMemberSince(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function listenDayTitle(cell: HeatmapCell): string {
  const when = formatListenDay(cell.date);
  if (!cell.inRange) return when;
  if (cell.count === 1) return `${when}: 1 listen`;
  return `${when}: ${cell.count} listens`;
}
