'use client';

import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

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

// 兼容层：直接复用 MarkdownRenderer
const TableRenderer: React.FC<TableRendererProps> = ({ content }) => {
  return <MarkdownRenderer content={content} />;
};

export default TableRenderer;
