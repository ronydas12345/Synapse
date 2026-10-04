import { useState } from 'react';
import { PathLink } from '../app/AppLink';
import { absoluteShareUrl, copyText } from './ids';

export default function SharePanel({
  shareCode,
  path,
  label,
  compact = false,
}: {
  shareCode: string;
  path: string;
  label: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState<'id' | 'link' | ''>('');
  if (!shareCode && !path) return null;
  const url = absoluteShareUrl(path);

  async function copy(kind: 'id' | 'link', value: string) {
    await copyText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(''), 1600);
  }

  return (
    <div className={`synapse-share-panel${compact ? ' is-compact' : ''}`}>
      {compact ? null : (
        <p className="synapse-settings-hint">
          Share this {label} with the ID or the link. Public listings also appear
          in Workshop. Unlisted stays off the catalog.
        </p>
      )}
      {shareCode ? (
        <p className="synapse-share-row">
          <span>
            ID{' '}
            <code className="synapse-share-id">{shareCode}</code>
          </span>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => void copy('id', shareCode)}
          >
            {copied === 'id' ? (compact ? 'Copied' : 'ID copied') : compact ? 'Copy' : 'Copy ID'}
          </button>
        </p>
      ) : null}
      {path ? (
        <p className="synapse-share-row">
          <span>
            Link{' '}
            <PathLink href={path} className="synapse-share-link">
              {path}
            </PathLink>
          </span>
          <button
            type="button"
            className="synapse-btn synapse-btn-ghost"
            onClick={() => void copy('link', url)}
          >
            {copied === 'link' ? (compact ? 'Copied' : 'Link copied') : compact ? 'Copy' : 'Copy link'}
          </button>
        </p>
      ) : null}
    </div>
  );
}
