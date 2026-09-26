import { useState } from 'react';
import { BADGE_CATALOG } from '../badges/catalog';
import { DECORATION_CATALOG } from '../decorations/catalog';
import { staffAwardBadge, staffRevokeBadge } from '../badges/api';
import { staffGrantDecoration } from '../decorations/api';
import { writeAudit } from './api';

export default function BadgeManagerPanel() {
  const [uid, setUid] = useState('');
  const [badgeId, setBadgeId] = useState(BADGE_CATALOG[0]?.id || '');
  const [decorationId, setDecorationId] = useState(DECORATION_CATALOG[0]?.id || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
      setMessage(ok);
      void writeAudit('badge.manage', 'user', uid, ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="synapse-staff-section">
      <h2>Badges and decorations</h2>
      <p className="synapse-settings-lead">
        Most badges are awarded automatically from account age, Workshop
        publishes, followers, and staff roles. Superadmin can repair or grant
        decorations. Users cannot write badge rows themselves.
      </p>
      <label className="synapse-settings-field">
        Account uid
        <input
          className="synapse-settings-input"
          value={uid}
          onChange={(event) => setUid(event.target.value.trim())}
          placeholder="uuid"
        />
      </label>
      <label className="synapse-settings-field">
        Badge
        <select
          className="synapse-settings-input"
          value={badgeId}
          onChange={(event) => setBadgeId(event.target.value)}
        >
          {BADGE_CATALOG.map((badge) => (
            <option key={badge.id} value={badge.id}>
              {badge.name}
            </option>
          ))}
        </select>
      </label>
      <div className="synapse-theme-actions">
        <button
          type="button"
          className="synapse-btn synapse-btn-play"
          disabled={busy || !uid}
          onClick={() =>
            void run(() => staffAwardBadge(uid, badgeId), 'Badge awarded.')
          }
        >
          Award badge
        </button>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          disabled={busy || !uid}
          onClick={() =>
            void run(() => staffRevokeBadge(uid, badgeId), 'Badge revoked.')
          }
        >
          Revoke badge
        </button>
      </div>
      <label className="synapse-settings-field">
        Decoration
        <select
          className="synapse-settings-input"
          value={decorationId}
          onChange={(event) => setDecorationId(event.target.value)}
        >
          {DECORATION_CATALOG.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="synapse-btn synapse-btn-ghost"
        disabled={busy || !uid}
        onClick={() =>
          void run(
            () => staffGrantDecoration(uid, decorationId),
            'Decoration unlocked.'
          )
        }
      >
        Grant decoration
      </button>
      {message ? <p className="synapse-settings-lead">{message}</p> : null}
      {error ? <p className="synapse-settings-error">{error}</p> : null}
      <ul className="synapse-settings-lead">
        {BADGE_CATALOG.map((badge) => (
          <li key={badge.id}>
            <strong>{badge.name}</strong> — {badge.description}
          </li>
        ))}
      </ul>
    </section>
  );
}
