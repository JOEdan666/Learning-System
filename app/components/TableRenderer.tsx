'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface TableRendererProps {
  content: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  aligns: Array<'left' | 'center' | 'right'>;
}

// 兼容旧逻辑的表格解析，供其它组件检测/拆分表格
export const parseMarkdownTable = (content: string): TableData | null => {
  const tableRegex = /^\s*\|(.+)\|\s*\n\s*\|([\-\s\|:]+)\|\s*\n((?:\s*\|.+\|\s*\n?)*)/m;
  const match = tableRegex.exec(content);
  if (!match) return null;

  const [, headerLine, alignLine, rowsSection] = match;
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(Boolean);

  const aligns = alignLine
    .split('|')
    .map(cell => cell.trim())
    .filter(Boolean)
    .map(seg => {
      const left = seg.startsWith(':');
      const right = seg.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      if (left) return 'left';
      return 'left';
    });

  const rows = rowsSection
    .trim()
    .split('\n')
    .map(row =>
      row
        .split('|')
        .map(cell => cell.trim())
        .filter(Boolean)
    )
    .filter(r => r.length > 0);

  if (!headers.length || !rows.length) return null;
  while (aligns.length < headers.length) aligns.push('left');
  if (aligns.length > headers.length) aligns.length = headers.length;

  return { headers, rows, aligns };
};

// 统一的 Markdown 渲染（表格、代码块、数学公式、换行）
const components = {
  pre: ({ children }: any) => {
    const codeChild = React.Children.toArray(children).find(
      (child: any) => child?.type === 'code' || child?.props?.node?.tagName === 'code'
    ) as React.ReactElement | undefined;

    if (codeChild && codeChild.props) {
      const className = codeChild.props.className || '';
      const match = /language-(\w+)/.exec(className);
      const lang = match?.[1] || '';
      const text = String(codeChild.props.children || '').replace(/\n$/, '');
      const copy = () => navigator.clipboard?.writeText(text).catch(() => {});

      return (
        <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
            <span className="font-mono uppercase">{lang || 'TEXT'}</span>
            <button type="button" onClick={copy} className="hover:text-blue-600 transition-colors">复制</button>
          </div>
          <div className="bg-white p-4 overflow-x-auto">
            <pre className="text-sm font-mono text-gray-800 leading-relaxed m-0 whitespace-pre-wrap">
              <code>{text}</code>
            </pre>
          </div>
        </div>
      );
    }

    return <pre>{children}</pre>;
  },
  code: ({ children }: any) => (
    <code className="bg-gray-100 text-red-500 rounded px-1.5 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-7 text-gray-800 whitespace-pre-wrap">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-3 space-y-1 text-gray-800">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-3 space-y-1 text-gray-800">{children}</ol>,
  li: ({ children }: any) => <li className="leading-7">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 pb-2 border-b border-gray-100">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900">{children}</h3>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-4 bg-blue-50 rounded-r text-gray-700 italic">{children}</blockquote>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{children}</a>,
} as any;

const TableRenderer: React.FC<TableRendererProps> = ({ content }) => {
  const safeContent = content || '';

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
};

export default TableRenderer;
