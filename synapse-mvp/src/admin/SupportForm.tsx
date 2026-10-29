import { useEffect, useState } from 'react';
import { createTicket, listOwnTickets, listTicketMessages, replyToTicket } from './api';
import { formatWhen } from './dates';
import type { SupportTicket, TicketMessage, TicketPriority } from './model';
import { useAuthStore } from '../auth/authStore';
import NavNotice from './NavNotice';
import { useTicketNoticeStore } from './ticketNoticeStore';
import {
  clientDiagnostics,
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
} from './diagnostics';

export default function SupportForm() {
  const uid = useAuthStore((s) => s.user?.uid);
  const markSeen = useTicketNoticeStore((s) => s.markSeen);
  const unreadIds = useTicketNoticeStore((s) => s.unreadIds);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [steps, setSteps] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('Bug');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    if (!uid) return;
    try {
      setTickets(await listOwnTickets(uid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tickets.');
    }
  }

  useEffect(() => {
    void reload();
  }, [uid]);

  useEffect(() => {
    if (!openId) {
      setMessages([]);
      return;
    }
    void listTicketMessages(openId).then(setMessages).catch(() => setMessages([]));
  }, [openId]);

  return (
    <div className="synapse-staff-card">
      <h3>Contact support</h3>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <form
        className="synapse-auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          setBusy(true);
          const composed = [
            `Category: ${category}`,
            body.trim(),
            steps.trim() ? `Steps to reproduce:\n${steps.trim()}` : '',
            includeDiagnostics ? `Diagnostics:\n${clientDiagnostics()}` : '',
          ]
            .filter(Boolean)
            .join('\n\n');
          void createTicket(`[${category}] ${subject}`, composed, priority)
            .then(() => {
              setSubject('');
              setBody('');
              setSteps('');
              return reload();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Could not send.')
            )
            .finally(() => setBusy(false));
        }}
      >
        <label className="synapse-settings-field">
          <span>Category</span>
          <select
            className="synapse-settings-input"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as FeedbackCategory)
            }
          >
            {FEEDBACK_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="synapse-settings-field">
          <span>Subject</span>
          <input
            className="synapse-settings-input"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            minLength={3}
            required
          />
        </label>
        <label className="synapse-settings-field">
          <span>Priority</span>
          <select
            className="synapse-settings-input"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as TicketPriority)
            }
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="synapse-settings-field">
          <span>Message</span>
          <textarea
            className="synapse-settings-input"
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
          />
        </label>
        <label className="synapse-settings-field">
          <span>Steps to reproduce (optional)</span>
          <textarea
            className="synapse-settings-input"
            rows={3}
            value={steps}
            onChange={(event) => setSteps(event.target.value)}
          />
        </label>
        <label className="synapse-settings-field synapse-settings-check">
          <input
            type="checkbox"
            checked={includeDiagnostics}
            onChange={(event) => setIncludeDiagnostics(event.target.checked)}
          />
          <span>Include app version, page, and save status (no Music Path contents)</span>
        </label>
        <button type="submit" className="synapse-btn synapse-btn-play" disabled={busy}>
          {busy ? 'Sending…' : 'Send ticket'}
        </button>
      </form>
      <ul className="synapse-staff-thread">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <button
              type="button"
              className={`synapse-auth-switch${ticket.unreadStaffReply || unreadIds.includes(ticket.id) ? ' has-notice' : ''}`}
              onClick={() => {
                const next = ticket.id === openId ? null : ticket.id;
                setOpenId(next);
                if (next) void markSeen(next).then(() => void reload());
              }}
            >
              {ticket.subject} · {ticket.status}
              {ticket.unreadStaffReply || unreadIds.includes(ticket.id) ? (
                <NavNotice />
              ) : null}
            </button>
            <p className="synapse-settings-hint">{formatWhen(ticket.createdAt)}</p>
            {openId === ticket.id ? (
              <div>
                <p>{ticket.body}</p>
                {messages.map((message) => (
                  <p key={message.id}>
                    <span className="synapse-settings-hint">
                      {formatWhen(message.createdAt)} ·{' '}
                    </span>
                    {message.body}
                  </p>
                ))}
                <textarea
                  className="synapse-settings-input"
                  rows={3}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                />
                <button
                  type="button"
                  className="synapse-btn synapse-btn-ghost"
                  disabled={busy || !reply.trim()}
                  onClick={() => {
                    setBusy(true);
                    void replyToTicket(ticket.id, reply)
                      .then(async () => {
                        setReply('');
                        setMessages(await listTicketMessages(ticket.id));
                      })
                      .catch((err) =>
                        setError(err instanceof Error ? err.message : 'Reply failed.')
                      )
                      .finally(() => setBusy(false));
                  }}
                >
                  Reply
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
