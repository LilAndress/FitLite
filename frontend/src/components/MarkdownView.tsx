import React from 'react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  // Simple, safe & robust markdown-to-JSX renderer
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-2 space-y-1 text-sm text-[var(--text-primary)]">
            {listItems}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-2 space-y-1 text-sm text-[var(--text-primary)]">
            {listItems}
          </ol>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    // Reemplaza **texto** con <strong>, `code` con <code>, etc.
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-bold text-[var(--accent-primary)]">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} className="italic text-[var(--text-secondary)]">{token.slice(1, -1)}</em>);
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-mono text-[var(--accent-secondary)]">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('[') && token.includes('](')) {
        const linkText = token.substring(1, token.indexOf(']('));
        const linkUrl = token.substring(token.indexOf('](') + 2, token.length - 1);
        parts.push(
          <a
            key={match.index}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent-primary)] underline hover:opacity-80 font-medium"
          >
            {linkText}
          </a>
        );
      } else {
        parts.push(token);
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={i} className="text-base font-bold text-[var(--text-primary)] font-space mt-3 mb-1">
          {formatInline(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg font-bold text-[var(--accent-primary)] font-space mt-4 mb-2">
          {formatInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl font-extrabold text-[var(--text-primary)] font-space mt-4 mb-2">
          {formatInline(trimmed.substring(2))}
        </h2>
      );
    }
    // Bullet list (- o * o •)
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(
        <li key={i} className="leading-relaxed">
          {formatInline(trimmed.substring(2))}
        </li>
      );
    }
    // Numbered list (1. 2. etc)
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      const textAfterNumber = trimmed.replace(/^\d+\.\s/, '');
      listItems.push(
        <li key={i} className="leading-relaxed">
          {formatInline(textAfterNumber)}
        </li>
      );
    }
    // Callouts / Blockquotes
    else if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={i} className="border-l-4 border-[var(--accent-primary)] pl-3 my-2 text-xs italic text-[var(--text-secondary)] bg-[var(--surface-hover)]/30 py-1.5 rounded-r">
          {formatInline(trimmed.substring(2))}
        </blockquote>
      );
    }
    // Regular paragraph
    else {
      flushList();
      elements.push(
        <p key={i} className="text-sm leading-relaxed my-1.5 text-[var(--text-primary)]">
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
};
