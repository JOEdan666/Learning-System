'use client';

import React, { useMemo, useState } from 'react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore - style modules lack type declarations
import oneLight from 'react-syntax-highlighter/dist/esm/styles/prism/one-light';
// @ts-ignore - style modules lack type declarations
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';
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

  const isListLike = (value: string) =>
    /^(\s*[-*+]\s+|\s*\d+\.\s+)/.test(value);

  const isHeading = (value: string) => /^#{1,6}\s+/.test(value.trim());

  const isPlainLine = (value: string) => {
    const t = value.trim();
    if (!t) return false;
    if (isHeading(value)) return false;
    if (isListLike(value)) return false;
    if (/^>\s*/.test(t)) return false;
    if (/^```/.test(t)) return false;
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return false;
    return true;
  };

  const isKeyValueLine = (value: string) => {
    const t = value.trim();
    if (!t) return false;
    if (isListLike(value) || isHeading(value)) return false;
    // e.g. "时间：xxxx" / "领导者：xxx"
    return /^.{1,12}：\S/.test(t);
  };

  const stripTrailingAsterisk = (value: string) => value.replace(/([\u4e00-\u9fa5A-Za-z0-9）)】\]])\s*\*+(\s*:)?$/g, '$1$2');

  let inAutoList = false;

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
      // 清理孤立星号（如 "核心要点：*")
      line = line.replace(/：\s*\*$/g, '：');
      line = stripTrailingAsterisk(line);
      line = line.replace(/<br\s*\/?>/gi, '<br />');
      line = line.replace(/^(\s{0,3}#{1,6})(?!#|\s)/, '$1 ');
      line = line.replace(/^(\s*[-*+]|\s*\d+\.)(?!\s)/, '$1 ');
      line = line.replace(/(\d+)\.(\*\*)/g, '$1. $2');
      // 修复 "*2. 内容" 格式 -> "2. 内容" (AI 常见错误输出)
      line = line.replace(/^\s*\*(\d+\.)\s*/g, '$1 ');
      // 修复 "* 2. 内容" 格式 -> "2. 内容"
      line = line.replace(/^\s*\*\s+(\d+\.)\s*/g, '$1 ');
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

    // 自动将“字段：内容”渲染为列表项（常见于 AI 输出）
    if (!inFence && !inTable) {
      const nextLine = lines[i + 1] ?? '';
      if (line.trim().endsWith('：') && isPlainLine(nextLine) && !isListLike(nextLine)) {
        inAutoList = true;
      }
      if (inAutoList && !line.trim()) {
        inAutoList = false;
      }

      if (isKeyValueLine(line) && !isListLike(line)) {
        line = `- ${line.trim()}`;
        inAutoList = false;
      } else if (inAutoList && isPlainLine(line) && !isListLike(line)) {
        line = `- ${line.trim()}`;
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
  if (trimmed.length > 60) return false;
  if (/[{};]/.test(trimmed)) return false;
  if (/(->|→|=>)/.test(trimmed)) return true;
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
      // 链接组件 - 外链自动新窗口打开，蓝色高亮
      a: ({ node, href, children, ...props }: any) => {
        const isExternal = href?.startsWith('http') || href?.startsWith('//');
        return (
          <a
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors duration-150 font-medium"
            {...props}
          >
            {children}
            {isExternal && (
              <svg className="inline-block w-3.5 h-3.5 ml-0.5 -mt-0.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </a>
        );
      },
      // 表格组件
      table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900/30">
          <table className="w-full min-w-max text-sm text-left border-collapse" {...props} />
        </div>
      ),
      thead: ({ node, ...props }: any) => (
        <thead className="bg-slate-50 dark:bg-slate-800/50" {...props} />
      ),
      th: ({ node, ...props }: any) => (
        <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 border-b border-gray-200 dark:border-gray-700" {...props} />
      ),
      td: ({ node, ...props }: any) => (
        <td className="px-4 py-3 border-b border-gray-100 dark:border-gray-800" {...props} />
      ),
      // 段落组件
      p: ({ node, children, ...props }: any) => {
        const hasImage = node?.children?.length === 1 && node.children[0]?.tagName === 'img';
        if (hasImage) {
          return <div className="my-6 flex justify-center">{children}</div>;
        }
        return <p className="leading-[1.75] my-3" {...props}>{children}</p>;
      },
      // 无序列表 - Notion 风格
      ul: ({ node, depth = 0, ...props }: any) => (
        <ul
          className="my-3 pl-6 space-y-1.5 list-disc marker:text-slate-400 dark:marker:text-slate-500"
          {...props}
        />
      ),
      // 有序列表
      ol: ({ node, ...props }: any) => (
        <ol
          className="my-3 pl-6 space-y-1.5 list-decimal marker:text-slate-500 dark:marker:text-slate-400 marker:font-medium"
          {...props}
        />
      ),
      // 列表项
      li: ({ node, children, ...props }: any) => (
        <li className="pl-1.5 leading-[1.75] text-slate-700 dark:text-slate-300" {...props}>
          {children}
        </li>
      ),
      // 引用块
      blockquote: ({ node, ...props }: any) => (
        <blockquote
          className="my-5 pl-4 py-3 pr-4 border-l-4 border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded-r-lg text-slate-700 dark:text-slate-300 italic"
          {...props}
        />
      ),
      // 标题组件
      h1: ({ node, ...props }: any) => (
        <h1 className="text-2xl font-bold mt-8 mb-4 text-slate-900 dark:text-slate-50 leading-tight tracking-tight" {...props} />
      ),
      h2: ({ node, ...props }: any) => (
        <h2 className="text-xl font-bold mt-7 mb-3 text-slate-800 dark:text-slate-100 leading-snug tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2" {...props} />
      ),
      h3: ({ node, ...props }: any) => (
        <h3 className="text-lg font-semibold mt-6 mb-2.5 text-slate-800 dark:text-slate-100 leading-snug" {...props} />
      ),
      h4: ({ node, ...props }: any) => (
        <h4 className="text-base font-semibold mt-5 mb-2 text-slate-700 dark:text-slate-200" {...props} />
      ),
      // 水平分割线
      hr: ({ node, ...props }: any) => (
        <hr className="my-8 border-slate-200 dark:border-slate-700" {...props} />
      ),
      // 强调文本
      strong: ({ node, ...props }: any) => (
        <strong className="font-semibold text-slate-900 dark:text-slate-100" {...props} />
      ),
      // 任务列表支持 (GFM)
      input: ({ node, ...props }: any) => {
        if (props.type === 'checkbox') {
          return (
            <input
              {...props}
              disabled
              className="mr-2 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-default"
            />
          );
        }
        return <input {...props} />;
      },
      // 软换行 - remark-breaks 生成的 break 节点
      br: () => <br className="block" />,
    }),
    []
  );

  return { processedContent, remarkPlugins, rehypePlugins, components };
};
