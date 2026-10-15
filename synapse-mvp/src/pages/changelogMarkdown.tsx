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

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

export type MarkdownBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'h4'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'hr' };

type Block = MarkdownBlock;

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isSepRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function parseMarkdownBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let fence: { lang: string; lines: string[] } | null = null;
  let table: string[] | null = null;

  const flushPara = () => {
    const text = para.join(' ').trim();
    para = [];
    if (text) out.push({ kind: 'p', text });
  };
  const flushList = () => {
    if (list?.items.length) {
      out.push({ kind: list.ordered ? 'ol' : 'ul', items: list.items });
    }
    list = null;
  };
  const flushTable = () => {
    if (!table?.length) {
      table = null;
      return;
    }
    const rows = table.map(splitCells);
    table = null;
    if (!rows.length) return;
    const headers = rows[0];
    const body = rows.slice(1).filter((row) => !isSepRow(row));
    out.push({ kind: 'table', headers, rows: body });
  };

  for (const raw of lines) {
    if (fence) {
      if (raw.trimStart().startsWith('```')) {
        out.push({ kind: 'code', lang: fence.lang, text: fence.lines.join('\n') });
        fence = null;
      } else {
        fence.lines.push(raw);
      }
      continue;
    }

    const trimmed = raw.trim();
    if (trimmed.startsWith('```')) {
      flushPara();
      flushList();
      flushTable();
      fence = { lang: trimmed.slice(3).trim(), lines: [] };
      continue;
    }
    if (!trimmed) {
      flushPara();
      flushList();
      flushTable();
      continue;
    }
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushPara();
      flushList();
      flushTable();
      out.push({ kind: 'hr' });
      continue;
    }
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushPara();
      flushList();
      (table ??= []).push(trimmed);
      continue;
    }
    flushTable();

    const heading = trimmed.match(/^(#{2,6})\s+(.+)$/);
    if (heading) {
      flushPara();
      flushList();
      const text = heading[2].trim();
      const hashes = heading[1].length;
      if (hashes === 2) out.push({ kind: 'h2', text });
      else if (hashes === 3) out.push({ kind: 'h3', text });
      else out.push({ kind: 'h4', text });
      continue;
    }
    const ol = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }
    const ul = trimmed.match(/^[-*]\s+(.+)$/);
    if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    flushList();
    para.push(trimmed);
  }
  flushPara();
  flushList();
  flushTable();
  if (fence) {
    out.push({ kind: 'code', lang: fence.lang, text: fence.lines.join('\n') });
  }
  return out;
}

/** @deprecated alias — changelog and docs share the same parser */
export const parseChangelogBlocks = parseMarkdownBlocks;

export function renderMarkdownBody(md: string): ReactNode {
  const blocks = parseMarkdownBlocks(md);
  return blocks.map((block, i) => {
    if (block.kind === 'h2' || block.kind === 'h3' || block.kind === 'h4') {
      const Tag = block.kind;
      const id = headingId(block.text);
      return (
        <Tag key={`h-${i}`} id={id}>
          {renderInline(block.text, `h${i}`)}
        </Tag>
      );
    }
    if (block.kind === 'ul' || block.kind === 'ol') {
      const Tag = block.kind;
      return (
        <Tag key={`l-${i}`}>
          {block.items.map((item, j) => (
            <li key={`l-${i}-${j}`}>{renderInline(item, `l${i}-${j}`)}</li>
          ))}
        </Tag>
      );
    }
    if (block.kind === 'code') {
      return (
        <pre key={`c-${i}`}>
          <code className={block.lang ? `language-${block.lang}` : undefined}>
            {block.text}
          </code>
        </pre>
      );
    }
    if (block.kind === 'table') {
      return (
        <div key={`t-${i}`} className="synapse-md-table-wrap">
          <table>
            <thead>
              <tr>
                {block.headers.map((header, j) => (
                  <th key={`t-${i}-h-${j}`}>{renderInline(header, `th${i}-${j}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={`t-${i}-r-${r}`}>
                  {row.map((cell, c) => (
                    <td key={`t-${i}-r-${r}-c-${c}`}>
                      {renderInline(cell, `td${i}-${r}-${c}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (block.kind === 'hr') {
      return <hr key={`hr-${i}`} />;
    }
    return <p key={`p-${i}`}>{renderInline(block.text, `p${i}`)}</p>;
  });
}

export const renderChangelogBody = renderMarkdownBody;

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

export function docsToc(md: string): { id: string; label: string }[] {
  return parseMarkdownBlocks(md).flatMap((block) =>
    block.kind === 'h2'
      ? [{ id: headingId(block.text), label: block.text }]
      : []
  );
}
