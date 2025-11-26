'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface TableData {
  headers: string[];
  rows: string[][];
  aligns?: Array<'left'|'center'|'right'>;
}

interface TableRendererProps {
  content: string;
}

const parseMarkdownTable = (content: string): TableData | null => {
  const tableRegex = /^\s*\|(.+)\|\s*\n\s*\|([\-\s\|:]+)\|\s*\n((?:\s*\|.+\|\s*\n?)*)/gm;
  const match = tableRegex.exec(content);
  
  if (!match) return null;
  
  const [, headerLine, alignLine, rowsSection] = match;
  
  // 解析表头
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);
  
  const aligns = alignLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0)
    .map(seg => {
      const left = seg.startsWith(':');
      const right = seg.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      if (left) return 'left';
      return 'left';
    });

  // 解析行数据
  const rows = rowsSection
    .trim()
    .split('\n')
    .map(row => {
      if (!row.trim()) return [];
      return row.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
    })
    .filter(row => row.length > 0);
  
  // 验证表格数据的有效性
  if (headers.length === 0 || rows.length === 0) return null;
  
  while (aligns.length < headers.length) aligns.push('left');
  if (aligns.length > headers.length) aligns.length = headers.length;
  return { headers, rows, aligns };
};

// 表格组件
const Table: React.FC<{ data: TableData }> = ({ data }) => {
  return (
    <div className="overflow-x-auto my-4 rounded-lg shadow-md border border-gray-200">
      <table className="w-full border-collapse bg-white">
        <thead className="bg-blue-100">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-sm font-bold text-gray-800 border border-gray-300 ${
                  data.aligns?.[index] === 'center' ? 'text-center' : data.aligns?.[index] === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50 transition-colors duration-200`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-4 py-3 text-sm text-gray-700 border border-gray-300 whitespace-pre-wrap ${
                    data.aligns?.[cellIndex] === 'center' ? 'text-center' : data.aligns?.[cellIndex] === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {cell}
                </td>
              />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const mdComponents = {
  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '')
    const lang = match?.[1] || ''
    if (inline) {
      return <code className="bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 font-mono text-[0.85em]" {...props}>{children}</code>
    }
    const text = String(children || '')
    const copy = () => navigator.clipboard?.writeText(text).catch(()=>{})
    return (
      <div className="relative group my-3">
        <div className="absolute top-2 left-2 text-[10px] uppercase tracking-wider text-slate-500">{lang || 'text'}</div>
        <button type="button" onClick={copy} className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 opacity-0 group-hover:opacity-100 transition">复制</button>
        <pre className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 overflow-x-auto text-slate-800 dark:text-slate-200 text-sm">
          <code className={`font-mono whitespace-pre`}>{children}</code>
        </pre>
      </div>
    )
  }
} as any

const normalizeOutsideCode = (text: string) => {
  let s = text
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/^[\t ]*[•\-–—·◦▪]\s?/gm, '- ')

  // 中文编号标题：一、二、三、 → 转为二级标题
  s = s.replace(/^\s*(?:[一二三四五六七八九十百千]+)[、．\.]\s*(.+)$/gm, '## $1')

  // 中文序号列表：（1）（2）→ 1. 2.
  s = s.replace(/^\s*（(\d+)）\s*/gm, (m, d) => `${d}. `)

  // 全角符号归一
  s = s.replace(/，/g, ', ').replace(/。/g, '. ')

  // 为块级标记补空行，防止粘连
  s = s.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
  s = s.replace(/([^\n])\n(>\s)/g, '$1\n\n$2')
  s = s.replace(/([^\n])\n([-*+]\s)/g, '$1\n\n$2')
  s = s.replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2')
  return s
}

const normalizeMarkdownSpacing = (content: string) => {
  const parts = content.split(/```/)
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = normalizeOutsideCode(parts[i])
  }
  return parts.join('```')
}

const TableRenderer: React.FC<TableRendererProps> = ({ content }) => {
  const normalizedContent = normalizeMarkdownSpacing(content)
  const tableData = parseMarkdownTable(normalizedContent);
  
  if (!tableData) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={mdComponents}>
          {normalizedContent}
        </ReactMarkdown>
      </div>
    );
  }
  
  // 改进的表格前后内容分离逻辑
  const tableRegex = /^\s*\|(.+)\|\s*\n\s*\|[-\s|:]+\|\s*\n((?:\s*\|.+\|\s*\n?)*)/gm;
  const match = tableRegex.exec(normalizedContent);
  
  if (!match) {
    return (
      <div className="whitespace-pre-wrap">
        {content}
      </div>
    );
  }
  
  const tableStart = match.index;
  const tableEnd = tableStart + match[0].length;
  
  const beforeTable = normalizedContent.substring(0, tableStart).trim();
  const afterTable = normalizedContent.substring(tableEnd).trim();
  
  return (
    <div>
      {/* 表格前的内容 */}
      {beforeTable && (
        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={mdComponents}>
            {beforeTable}
          </ReactMarkdown>
        </div>
      )}
      
      {/* 渲染表格 */}
      <Table data={tableData} />
      
      {/* 表格后的内容 */}
      {afterTable && (
        <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed mt-4">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={mdComponents}>
            {afterTable}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default TableRenderer;
export { parseMarkdownTable, Table };
export type { TableData };
