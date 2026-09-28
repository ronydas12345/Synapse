import { useState } from 'react';
import { absoluteShareUrl, copyText } from './ids';

export default function ShareBox({
  id,
  path,
  hint,
}: {
  id: string;
  path: string;
  hint?: string;
}) {
  const url = absoluteShareUrl(path);
  const [copied, setCopied] = useState<'id' | 'link' | ''>('');

  async function copy(kind: 'id' | 'link', value: string) {
    await copyText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(''), 1500);
  }

  if (!id) return null;

  return (
    <div className="synapse-share-box">
      <p className="synapse-settings-hint">{hint || 'Share this page as an ID or a link.'}</p>
      <div className="synapse-share-row">
        <code>{id}</code>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => void copy('id', id)}
        >
          {copied === 'id' ? 'ID copied' : 'Copy ID'}
        </button>
      </div>
      <div className="synapse-share-row">
        <code>{url}</code>
        <button
          type="button"
          className="synapse-btn synapse-btn-ghost"
          onClick={() => void copy('link', url)}
        >
          {copied === 'link' ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
