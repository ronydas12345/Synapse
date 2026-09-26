import { useEffect, useMemo, useState } from 'react';
import { listAllTickets, listUsers } from './api';
import { staffGamificationStats } from '../gamification/api';
import type { PlatformUser, SupportTicket } from './model';

export default function StatsPanel() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [play, setPlay] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([listUsers(), listAllTickets(), staffGamificationStats().catch(() => null)])
      .then(([nextUsers, nextTickets, nextPlay]) => {
        setUsers(nextUsers);
        setTickets(nextTickets);
        setPlay(nextPlay);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load stats.')
      );
  }, []);

  const stats = useMemo(() => computeStats(users, tickets), [users, tickets]);

  return (
    <section className="synapse-staff-section">
      <h2>Usage statistics</h2>
      <p className="synapse-settings-lead">
        Counts come from account and ticket records. Cloud storage is not
        metered in this build.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-stats">
        <Stat label="Total users" value={stats.totalUsers} />
        <Stat label="Active (30d)" value={stats.mau} />
        <Stat label="Active (7d)" value={stats.active7} />
        <Stat label="Suspended" value={stats.suspended} />
        <Stat label="Open tickets" value={stats.openTickets} />
        <Stat label="Ticket volume" value={stats.ticketVolume} />
        <Stat label="Cloud / storage" value="Not metered" />
        {play ? (
          <>
            <Stat label="Playground users" value={String(play.playgroundUsers)} />
            <Stat label="Games today" value={String(play.gamesToday)} />
            <Stat label="Tokens earned" value={String(play.tokensEarned)} />
          </>
        ) : null}
      </div>
      <h3>Last 14 days · new tickets</h3>
      <div className="synapse-staff-bars" role="img" aria-label="Tickets by day">
        {stats.ticketBars.map((bar) => (
          <div key={bar.label} className="synapse-staff-bar">
            <span
              style={{ height: `${Math.max(8, bar.ratio * 100)}%` }}
              title={`${bar.label}: ${bar.count}`}
            />
            <em>{bar.label.slice(5)}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <article className="synapse-staff-stat">
      <p className="synapse-section-label">{label}</p>
      <p className="synapse-staff-stat-value">{value}</p>
    </article>
  );
}

function computeStats(users: PlatformUser[], tickets: SupportTicket[]) {
  const now = Date.now();
  const day = 86_400_000;
  const mau = users.filter(
    (user) => user.lastSeenAt && now - user.lastSeenAt.getTime() <= 30 * day
  ).length;
  const active7 = users.filter(
    (user) => user.lastSeenAt && now - user.lastSeenAt.getTime() <= 7 * day
  ).length;
  const ticketBars = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    const count = tickets.filter(
      (ticket) => ticket.createdAt?.toISOString().slice(0, 10) === key
    ).length;
    return { label: key, count };
  });
  const max = Math.max(1, ...ticketBars.map((bar) => bar.count));
  return {
    totalUsers: users.length,
    mau,
    active7,
    suspended: users.filter((user) => user.status === 'suspended').length,
    openTickets: tickets.filter(
      (ticket) => ticket.status === 'open' || ticket.status === 'pending'
    ).length,
    ticketVolume: tickets.length,
    ticketBars: ticketBars.map((bar) => ({ ...bar, ratio: bar.count / max })),
  };
}
