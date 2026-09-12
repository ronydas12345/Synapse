import type { ReactNode } from 'react';

const INLINE =
  /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function safeHref(href: string): string | null {
  const t = href.trim();
  if (/^https?:\/\//i.test(t) || t.startsWith('/') || t.startsWith('#')) {
    return t;
  }
  return null;
}

export function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const parts = text.split(INLINE).filter((p) => p !== '');
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = safeHref(link[2]);
      if (!href) return <span key={key}>{link[1]}</span>;
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={key}
          href={href}
          {...(external ? { rel: 'noreferrer', target: '_blank' } : {})}
        >
          {link[1]}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

type Block =
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] };

export function parseChangelogBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    const text = para.join(' ').trim();
    para = [];
    if (text) out.push({ kind: 'p', text });
  };
  const flushList = () => {
    if (list.length) {
      out.push({ kind: 'ul', items: list });
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }
    const heading = trimmed.match(/^#{3,6}\s+(.+)$/);
    if (heading) {
      flushPara();
      flushList();
      out.push({ kind: 'h3', text: heading[1].trim() });
      continue;
    }
    const item = trimmed.match(/^[-*]\s+(.+)$/);
    if (item) {
      flushPara();
      list.push(item[1]);
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  return out;
}

export function renderChangelogBody(md: string): ReactNode {
  const blocks = parseChangelogBlocks(md);
  return blocks.map((block, i) => {
    if (block.kind === 'h3') {
      return <h3 key={`h-${i}`}>{renderInline(block.text, `h${i}`)}</h3>;
    }
    if (block.kind === 'ul') {
      return (
        <ul key={`u-${i}`}>
          {block.items.map((item, j) => (
            <li key={`u-${i}-${j}`}>{renderInline(item, `u${i}-${j}`)}</li>
          ))}
        </ul>
      );
    }
    return <p key={`p-${i}`}>{renderInline(block.text, `p${i}`)}</p>;
  });
}

export function splitChangelogVersions(raw: string): { title: string; body: string }[] {
  return raw
    .split(/^## /m)
    .slice(1)
    .filter(Boolean)
    .map((block) => {
      const [titleLine, ...rest] = block.trim().split('\n');
      return { title: titleLine.trim(), body: rest.join('\n').trim() };
    });
}
