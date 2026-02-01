'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface TableData {
  headers: string[];
  rows: string[][];
  aligns: Array<'left' | 'center' | 'right'>;
}

interface TableRendererProps {
  content: string;
}

// 解析Markdown表格的函数（支持对齐）
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
  
  // 解析对齐
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
  
  // 对齐列数与表头列数对齐
  while (aligns.length < headers.length) aligns.push('left');
  if (aligns.length > headers.length) aligns.length = headers.length;

  return { headers, rows, aligns };
};

// 表格组件
const Table: React.FC<{ data: TableData }> = ({ data }) => {
  return (
    <div className="overflow-x-auto my-4 rounded-lg shadow-sm border border-gray-200">
      <table className="w-full border-collapse bg-white text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={index}
                className={`px-4 py-3 font-semibold text-gray-700 ${
                  data.aligns[index] === 'center' ? 'text-center' : data.aligns[index] === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-4 py-2 text-gray-600 whitespace-pre-wrap ${
                    data.aligns[cellIndex] === 'center' ? 'text-center' : data.aligns[cellIndex] === 'right' ? 'text-right' : 'text-left'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: cell.replace(/\n/g, '<br>')
                  }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 简易代码渲染组件集
const mdComponents = {
  // pre 组件处理代码块（包含 code 子元素的情况）
  pre: ({ children, ...props }: any) => {
    // 提取 code 子元素的信息
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

    // 如果不是代码块，使用默认渲染
    return <pre {...props}>{children}</pre>;
  },
  // code 组件仅处理内联代码（不在 pre 中的情况）
  code: ({ className, children, ...props }: any) => {
    // react-markdown v10+ 不再传递 inline 属性
    // 内联代码会直接渲染 code 元素，而代码块会先渲染 pre 再嵌套 code
    // 因此这里只处理内联代码的样式
    return (
      <code
        className="bg-gray-100 text-red-500 rounded px-1.5 py-0.5 font-mono text-[0.9em]"
        {...props}
      >
        {children}
      </code>
    );
  },
  // 自定义其他 Markdown 元素样式
  p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-7 text-gray-800">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-800">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-800">{children}</ol>,
  li: ({ children }: any) => <li className="leading-7">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 pb-2 border-b border-gray-100">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900">{children}</h3>,
  blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-200 pl-4 py-1 my-4 bg-blue-50 rounded-r text-gray-700 italic">{children}</blockquote>,
  a: ({ href, children }: any) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{children}</a>,
} as any

// 主要的表格渲染器组件
const TableRenderer: React.FC<TableRendererProps> = ({ content }) => {
  // 移除之前过于激进的 normalizeLogic，只保留必要的空行处理
  const normalizedContent = content;

  // 检查内容是否包含表格
  const tableData = parseMarkdownTable(normalizedContent);
  
  if (!tableData) {
    return (
      <div className="markdown-body">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
          rehypePlugins={[rehypeKatex]} 
          components={mdComponents}
        >
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
    <div className="markdown-body">
      {/* 表格前的内容 */}
      {beforeTable && (
        <div className="mb-4">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
            rehypePlugins={[rehypeKatex]} 
            components={mdComponents}
          >
            {beforeTable}
          </ReactMarkdown>
        </div>
      )}
      
      {/* 渲染表格 */}
      <Table data={tableData} />
      
      {/* 表格后的内容 */}
      {afterTable && (
        <div className="mt-4">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]} 
            rehypePlugins={[rehypeKatex]} 
            components={mdComponents}
          >
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
