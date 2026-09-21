import { useEffect, useState } from 'react';
import { listAudit } from './api';
import { formatWhen } from './dates';
import type { AuditEntry } from './model';

export default function AuditPanel() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void listAudit()
      .then(setRows)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load history.')
      );
  }, []);

  return (
    <section className="synapse-staff-section">
      <h2>Admin edit history</h2>
      <p className="synapse-settings-lead">
        Superadmin-only log of administrative writes. Frontend hiding is not
        the access control; row-level security denies this table to admins.
      </p>
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <div className="synapse-staff-table-wrap">
        <table className="synapse-staff-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{formatWhen(row.createdAt)}</td>
                <td>{row.actorEmail}</td>
                <td>{row.action}</td>
                <td>
                  {row.targetType}/{row.targetId}
                </td>
                <td>{row.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
