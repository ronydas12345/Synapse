import { useEffect, useMemo, useRef, useState } from 'react';
import { averageListens } from './profileStore';
import {
  activityRangeStart,
  buildListenHeatmap,
  computeStreaks,
  formatListenDay,
  formatMemberSince,
  listenDayTitle,
  localDayKey,
  rollingWindowStart,
  yearBounds,
} from './listenStats';
import type { UserProfile } from './types';

const WEEKDAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function HeatmapCells({
  weeks,
  months,
}: {
  weeks: ReturnType<typeof buildListenHeatmap>['weeks'];
  months: ReturnType<typeof buildListenHeatmap>['months'];
}) {
  return (
    <div className="synapse-heatmap-board">
      <div
        className="synapse-heatmap-months"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, 0.72rem)` }}
      >
        {weeks.map((_, weekIndex) => {
          const month = months.find((item) => item.weekIndex === weekIndex);
          return (
            <span key={weekIndex} className="synapse-heatmap-month">
              {month?.label ?? ''}
            </span>
          );
        })}
      </div>
      <div className="synapse-heatmap-body">
        <div className="synapse-heatmap-weekdays" aria-hidden="true">
          {WEEKDAYS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div
          className="synapse-heatmap-weeks"
          role="grid"
          aria-label="Listen activity by day"
        >
          {weeks.map((week) => (
            <div key={week.days[0]?.date} className="synapse-heatmap-week" role="row">
              {week.days.map((cell) => (
                <span
                  key={cell.date}
                  role="gridcell"
                  className="synapse-heatmap-cell"
                  data-level={cell.level}
                  data-out={!cell.inRange ? 'true' : undefined}
                  title={listenDayTitle(cell)}
                  aria-label={listenDayTitle(cell)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ListenActivityHeatmap({ profile }: { profile: UserProfile }) {
  const today = localDayKey();
  const rangeStart = activityRangeStart(profile.createdAt, profile.listensByDay);
  const recentStart = rollingWindowStart(today);
  const accountYears = useMemo(() => {
    const years: number[] = [];
    const startYear = Number(rangeStart.slice(0, 4));
    const endYear = Number(today.slice(0, 4));
    for (let year = startYear; year <= endYear; year++) years.push(year);
    return years;
  }, [rangeStart, today]);
  const historySpansYears = rangeStart < recentStart || accountYears.length > 1;
  const [view, setView] = useState<number | 'recent' | 'all'>('recent');
  const scrollRef = useRef<HTMLDivElement>(null);
  const heatmap = useMemo(() => {
    if (view === 'all') {
      const start = rangeStart < recentStart ? rangeStart : recentStart;
      return buildListenHeatmap(profile.listensByDay, start, today, rangeStart);
    }
    if (view === 'recent') {
      return buildListenHeatmap(profile.listensByDay, recentStart, today, rangeStart);
    }
    const bounds = yearBounds(view, `${view}-01-01`, today);
    return buildListenHeatmap(
      profile.listensByDay,
      `${view}-01-01`,
      bounds.end,
      rangeStart
    );
  }, [view, profile.listensByDay, rangeStart, recentStart, today]);
  const streaks = useMemo(
    () => computeStreaks(profile.listensByDay, today),
    [profile.listensByDay, today]
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollLeft = node.scrollWidth;
  }, [heatmap.weeks.length, view]);

  const rangeLabel =
    heatmap.startDay === heatmap.endDay
      ? formatListenDay(heatmap.endDay)
      : `${formatListenDay(heatmap.startDay)} – ${formatListenDay(heatmap.endDay)}`;
  const summarySuffix =
    view === 'all'
      ? ' since this profile started'
      : typeof view === 'number'
        ? ` in ${view}`
        : ' in the last year';

  return (
    <div className="synapse-heatmap">
      <div className="synapse-heatmap-head">
        <p className="synapse-heatmap-summary">
          {heatmap.totalInRange} listen{heatmap.totalInRange === 1 ? '' : 's'}
          {summarySuffix}
        </p>
        {historySpansYears ? (
          <div className="synapse-heatmap-years" role="tablist" aria-label="Activity year">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'recent'}
              className={view === 'recent' ? 'is-active' : ''}
              onClick={() => setView('recent')}
            >
              Last year
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'all'}
              className={view === 'all' ? 'is-active' : ''}
              onClick={() => setView('all')}
            >
              All
            </button>
            {accountYears.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={view === item}
                className={view === item ? 'is-active' : ''}
                onClick={() => setView(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="synapse-heatmap-scroll" ref={scrollRef}>
        <HeatmapCells weeks={heatmap.weeks} months={heatmap.months} />
      </div>
      <div className="synapse-heatmap-foot">
        <p className="synapse-heatmap-range">{rangeLabel}</p>
        <p className="synapse-heatmap-legend" aria-hidden="true">
          Less
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span key={level} className="synapse-heatmap-cell" data-level={level} />
          ))}
          More
        </p>
      </div>
      {streaks.bestDay ? (
        <p className="synapse-settings-hint">
          Busiest day: {streaks.bestDayCount} listen
          {streaks.bestDayCount === 1 ? '' : 's'} on {formatListenDay(streaks.bestDay)}.
        </p>
      ) : null}
    </div>
  );
}

export function ListenStatsNumbers({ profile }: { profile: UserProfile }) {
  const today = localDayKey();
  const streaks = computeStreaks(profile.listensByDay, today);
  const avg = averageListens(profile);

  return (
    <dl className="synapse-profile-stats is-rich">
      <div>
        <dt>Total listens</dt>
        <dd>{profile.totalListens}</dd>
      </div>
      <div>
        <dt>Current streak</dt>
        <dd>
          {streaks.current}
          <span className="synapse-profile-stat-unit">
            {streaks.current === 1 ? ' day' : ' days'}
          </span>
        </dd>
      </div>
      <div>
        <dt>Longest streak</dt>
        <dd>
          {streaks.longest}
          <span className="synapse-profile-stat-unit">
            {streaks.longest === 1 ? ' day' : ' days'}
          </span>
        </dd>
      </div>
      <div>
        <dt>Active days</dt>
        <dd>{streaks.activeDays}</dd>
      </div>
      <div>
        <dt>Average / day</dt>
        <dd>{avg.toFixed(1)}</dd>
      </div>
      <div>
        <dt>Listening since</dt>
        <dd className="is-date">{formatMemberSince(profile.createdAt)}</dd>
      </div>
    </dl>
  );
}
