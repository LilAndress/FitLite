import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  return (
    <div className="markdown-content text-sm leading-relaxed text-[var(--text-primary)] font-inter">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-base font-bold font-space text-[var(--text-primary)] mt-3 mb-1.5" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-sm font-bold font-space text-[var(--text-primary)] mt-3 mb-1.5" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-sm font-bold font-space text-[var(--accent-primary)] mt-2.5 mb-1 flex items-center gap-1.5" {...props} />
          ),
          h4: ({ ...props }) => (
            <h4 className="text-xs font-semibold font-space text-[var(--text-primary)] mt-2 mb-1" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-[var(--text-primary)]" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-[var(--text-primary)]" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-[var(--text-primary)]" {...props} />
          ),
          li: ({ ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          hr: ({ ...props }) => (
            <hr className="my-3 border-[var(--border)]" {...props} />
          ),
          strong: ({ ...props }) => (
            <strong className="font-bold text-[var(--accent-primary)]" {...props} />
          ),
          em: ({ ...props }) => (
            <em className="italic text-[var(--text-secondary)]" {...props} />
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-mono text-[var(--accent-secondary)]" {...props}>
                {children}
              </code>
            ) : (
              <code className="block p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-x-auto text-xs font-mono text-[var(--accent-secondary)] my-2" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-2 border-[var(--accent-primary)] pl-3 italic my-2 text-xs text-[var(--text-secondary)]" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-[var(--border)]">
              <table className="w-full text-xs border-collapse text-left" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)]" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="px-3 py-2 text-xs font-semibold font-space text-[var(--text-primary)]" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="px-3 py-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]" {...props} />
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-primary)] underline hover:opacity-80 font-medium transition-opacity"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
