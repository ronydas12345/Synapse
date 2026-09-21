import { useEffect, useState } from 'react';
import { createTicket, listOwnTickets, listTicketMessages, replyToTicket } from './api';
import { formatWhen } from './dates';
import type { SupportTicket, TicketMessage, TicketPriority } from './model';
import { useAuthStore } from '../auth/authStore';

export default function SupportForm() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
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
          void createTicket(subject, body, priority)
            .then(() => {
              setSubject('');
              setBody('');
              return reload();
            })
            .catch((err) =>
              setError(err instanceof Error ? err.message : 'Could not send.')
            )
            .finally(() => setBusy(false));
        }}
      >
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
        <button type="submit" className="synapse-btn synapse-btn-play" disabled={busy}>
          Send ticket
        </button>
      </form>
      <ul className="synapse-staff-thread">
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <button
              type="button"
              className="synapse-auth-switch"
              onClick={() => setOpenId(ticket.id === openId ? null : ticket.id)}
            >
              {ticket.subject} · {ticket.status}
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
