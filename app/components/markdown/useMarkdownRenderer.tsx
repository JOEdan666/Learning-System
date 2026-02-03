'use client';

import React, { useMemo, useState } from 'react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BlockMath } from 'react-katex';
import remarkTypographyFixes from './remarkTypographyFixes';
import remarkHtmlBrToBreak from './remarkHtmlBrToBreak';
import SafeImage from './SafeImage';

const preprocessContent = (text: string) => {
  if (!text) return '';

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ');
  const lines = normalized.split('\n');
  const out: string[] = [];
  let inFence = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    while (line.includes('```') && !line.trimStart().startsWith('```')) {
      const idx = line.indexOf('```');
      const before = line.slice(0, idx);
      const rest = line.slice(idx);
      if (before.length > 0) out.push(before);
      line = rest;
    }

    if (!inFence) {
      line = line.replace(/<br\s*\/?>/gi, '<br />');
      line = line.replace(/^(\s{0,3}#{1,6})(?!#|\s)/, '$1 ');
      line = line.replace(/^(\s*[-*+]|\s*\d+\.)(?!\s)/, '$1 ');
      line = line.replace(/(\d+)\.(\*\*)/g, '$1. $2');
      line = line.replace(/\|\s*\|\|\s*(?=:?-{2,})/g, '|\n|');
      if (line.trimStart().startsWith('|')) {
        line = line.replace(/\|\|\s{2,}(?=[^|\s].*\|)/g, '|\n| ');
      }
      const isLikelyTableLine =
        line.trimStart().startsWith('|') &&
        (line.match(/\|/g) || []).length >= 2;

      if (!isLikelyTableLine) {
        line = line.replace(/([。！？；:：)）\]])\s*(#{1,6})(?!#)\s*/g, '$1\n\n$2 ');
        line = line.replace(/([。！？；:：)）\]])\s*-(\S)/g, '$1\n- $2');
        line = line.replace(/([。！？；:：)）\]])\s*(\d+\.)(\S)/g, '$1\n$2 $3');
      }

      if (/^```/.test(line)) {
        const m = line.match(/^```(\w+)?\s*(\S.*)$/);
        if (m) {
          const lang = m[1] || '';
          const rest = m[2] || '';
          line = `\`\`\`${lang}`.trimEnd();
          out.push(line);
          out.push(rest);
          inFence = true;
          continue;
        }
      }
    } else {
      if (line.includes('```') && !line.trimStart().startsWith('```')) {
        const idx = line.indexOf('```');
        out.push(line.slice(0, idx));
        line = line.slice(idx);
      }
    }

    const parts = line.split('\n');
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      const partTrimmed = part.trim();
      const pipeCount = (partTrimmed.match(/\|/g) || []).length;

      const isTableSeparator = (value: string) => {
        const t = value.trim();
        if (!t) return false;
        const stripped = t.replace(/^\|/, '').replace(/\|$/, '');
        const cells = stripped.split('|');
        if (cells.length < 2) return false;
        return cells.every(cell => /^\s*:?-{2,}:?\s*$/.test(cell));
      };

      const peekNext = () => {
        if (p + 1 < parts.length) return parts[p + 1];
        return lines[i + 1] ?? '';
      };

      const isTableHeaderCandidate = !inFence && pipeCount >= 2 && !isTableSeparator(partTrimmed);
      const isTableStart = isTableHeaderCandidate && isTableSeparator(peekNext());
      const isTableRow = !inFence && pipeCount >= 2;

      if (isTableStart) {
        const last = out[out.length - 1] ?? '';
        if (last.trim() !== '') out.push('');
        inTable = true;
      } else if (inTable && !isTableRow && partTrimmed !== '') {
        const last = out[out.length - 1] ?? '';
        if (last.trim() !== '') out.push('');
        inTable = false;
      }

      out.push(part);
    }

    if (/^```/.test(line.trim())) {
      inFence = !inFence;
    }
  }

  return out.join('\n')
    .replace(/([^\n])\s*(\$\$|\\\[)/g, '$1\n\n$2')
    .replace(/(\$\$|\\\])\s*([^\n])/g, '$1\n\n$2');
};

const isMathCodeBlock = (value: string, language: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^(math|latex|tex)$/i.test(language)) return true;
  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) return true;
  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) return true;
  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) return true;
  if (/^\\begin\{/.test(trimmed) && /\\end\{/.test(trimmed)) return true;
  return false;
};

const extractMath = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return trimmed.slice(2, -2).trim();
  }
  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) {
    return trimmed.slice(2, -2).trim();
  }
  return trimmed;
};

const shouldInlineShortCode = (value: string, language: string) => {
  const trimmed = value.trim();
  if (language) return false;
  if (!trimmed) return false;
  if (trimmed.includes('\n')) return false;
  if (trimmed.length > 24) return false;
  if (/[{};]/.test(trimmed)) return false;
  return true;
};

const InlineCode: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <code
    className={`${className || ''} font-mono text-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700`}
  >
    {children}
  </code>
);

const CodeBlock: React.FC<any> = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const content = String(children).replace(/\n$/, '');
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  if (inline) {
    return <InlineCode className={className}>{children}</InlineCode>;
  }

  if (isMathCodeBlock(content, language)) {
    return (
      <div className="my-4">
        <BlockMath math={extractMath(content)} />
      </div>
    );
  }

  if (shouldInlineShortCode(content, language)) {
    return <InlineCode className={className}>{content.trim()}</InlineCode>;
  }

  return (
    <div className="relative group my-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 text-xs bg-gray-50 dark:bg-gray-950/30 border-b border-gray-200 dark:border-gray-700">
        <span className="font-mono text-gray-500 dark:text-gray-400 uppercase">
          {language || 'CODE'}
        </span>
        <button
          onClick={copyToClipboard}
          className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <SyntaxHighlighter
        {...props}
        style={isDark ? oneDark : oneLight}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.875rem',
          lineHeight: '1.6'
        }}
        wrapLongLines={true}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

export const useMarkdownRenderer = (content: string) => {
  const processedContent = useMemo(() => preprocessContent(typeof content === 'string' ? content : ''), [content]);

  const remarkPlugins = useMemo(
    () => [remarkGfm, remarkMath, remarkBreaks, remarkHtmlBrToBreak, remarkTypographyFixes],
    []
  );

  const rehypePlugins = useMemo(
    () => [rehypeKatex],
    []
  );

  const components = useMemo(
    () => ({
      code: CodeBlock,
      img: SafeImage,
      a: ({ node, ...props }: any) => (
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5"
          {...props}
        />
      ),
      table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/30">
          <table className="w-full min-w-max text-sm text-left border-collapse" {...props} />
        </div>
      ),
      p: ({ node, children, ...props }: any) => {
        const hasImage = node?.children?.length === 1 && node.children[0]?.tagName === 'img';
        if (hasImage) {
          return <div className="my-6 flex justify-center">{children}</div>;
        }
        return <p className="leading-relaxed my-3" {...props}>{children}</p>;
      },
    }),
    []
  );

  return { processedContent, remarkPlugins, rehypePlugins, components };
};
