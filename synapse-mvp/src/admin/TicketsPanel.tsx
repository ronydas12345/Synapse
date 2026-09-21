import { useEffect, useState } from 'react';
import { useAuthStore } from '../auth/authStore';
import { canUse } from './permissions';
import {
  listAdmins,
  listAllTickets,
  listTicketMessages,
  replyToTicket,
  updateTicket,
} from './api';
import { formatWhen } from './dates';
import type {
  StaffRoleDoc,
  SupportTicket,
  TicketMessage,
  TicketPriority,
  TicketStatus,
} from './model';

export default function TicketsPanel() {
  const role = useAuthStore((s) => s.role);
  const canAssign = canUse(role, 'adminManagement');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [admins, setAdmins] = useState<StaffRoleDoc[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const [nextTickets, nextAdmins] = await Promise.all([
        listAllTickets(),
        canAssign ? listAdmins() : Promise.resolve([] as StaffRoleDoc[]),
      ]);
      setTickets(nextTickets);
      setAdmins(nextAdmins);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tickets.');
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    void listTicketMessages(selected.id).then(setMessages).catch(() => setMessages([]));
  }, [selected?.id]);

  return (
    <section className="synapse-staff-section">
      <h2>Support tickets</h2>
      <p className="synapse-settings-lead">
        Assign, reply, and change status. Users file tickets from Settings →
        Support.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-split">
        <div className="synapse-staff-table-wrap">
          <table className="synapse-staff-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>From</th>
                <th>Status</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((row) => (
                <tr
                  key={row.id}
                  className={selected?.id === row.id ? 'is-selected' : ''}
                  onClick={() => setSelected(row)}
                >
                  <td>{row.subject}</td>
                  <td>{row.email}</td>
                  <td>{row.status}</td>
                  <td>{row.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected ? (
          <div className="synapse-staff-card">
            <h3>{selected.subject}</h3>
            <p className="synapse-settings-hint">
              {selected.email} · {formatWhen(selected.createdAt)}
            </p>
            <p>{selected.body}</p>
            <label className="synapse-settings-field">
              <span>Status</span>
              <select
                className="synapse-settings-input"
                value={selected.status}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    status: event.target.value as TicketStatus,
                  })
                }
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="synapse-settings-field">
              <span>Priority</span>
              <select
                className="synapse-settings-input"
                value={selected.priority}
                onChange={(event) =>
                  setSelected({
                    ...selected,
                    priority: event.target.value as TicketPriority,
                  })
                }
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            {canAssign ? (
              <label className="synapse-settings-field">
                <span>Assign</span>
                <select
                  className="synapse-settings-input"
                  value={selected.assignedAdminUid}
                  onChange={(event) =>
                    setSelected({
                      ...selected,
                      assignedAdminUid: event.target.value,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {admins
                    .filter((admin) => admin.active)
                    .map((admin) => (
                      <option key={admin.uid} value={admin.uid}>
                        {admin.email}
                      </option>
                    ))}
                </select>
              </label>
            ) : (
              <p className="synapse-settings-hint">
                Assigned to {selected.assignedAdminUid || 'nobody'}. Only
                superadmin can reassign.
              </p>
            )}
            <button
              type="button"
              className="synapse-btn synapse-btn-play"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void updateTicket(
                  selected.id,
                  canAssign
                    ? {
                        status: selected.status,
                        priority: selected.priority,
                        assignedAdminUid: selected.assignedAdminUid,
                      }
                    : {
                        status: selected.status,
                        priority: selected.priority,
                      }
                )
                  .then(reload)
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : 'Update failed.')
                  )
                  .finally(() => setBusy(false));
              }}
            >
              Save ticket
            </button>
            <ol className="synapse-staff-thread">
              {messages.map((message) => (
                <li key={message.id}>
                  <p className="synapse-settings-hint">
                    {message.uid} · {formatWhen(message.createdAt)}
                  </p>
                  <p>{message.body}</p>
                </li>
              ))}
            </ol>
            <textarea
              className="synapse-settings-input"
              rows={4}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Reply to the user"
            />
            <button
              type="button"
              className="synapse-btn synapse-btn-ghost"
              disabled={busy || reply.trim().length < 1}
              onClick={() => {
                setBusy(true);
                void replyToTicket(selected.id, reply)
                  .then(async () => {
                    setReply('');
                    setMessages(await listTicketMessages(selected.id));
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
      </div>
    </section>
  );
}
