'use client';

import React, { Component, ErrorInfo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useMarkdownRenderer } from './markdown/useMarkdownRenderer';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  fontSize?: 'sm' | 'base' | 'lg';
}

class ErrorBoundary extends Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Markdown rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '',
  fontSize = 'base'
}) => {
  const proseSize = {
    sm: 'prose-sm',
    base: 'prose-base',
    lg: 'prose-lg'
  }[fontSize];

  const { processedContent, remarkPlugins, rehypePlugins, components } = useMarkdownRenderer(content);

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-2 border border-red-200 rounded bg-red-50 text-sm">渲染内容出错，请查看控制台</div>}>
      <div className={`markdown-wrapper ${className} prose ${proseSize} prose-slate dark:prose-invert max-w-none break-words
          prose-headings:font-bold
          prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h1:pb-2
          prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:font-bold
          prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4 prose-h3:font-semibold
          prose-p:leading-relaxed prose-p:my-3
          prose-li:my-1
          prose-strong:font-semibold
          prose-pre:p-0 prose-pre:my-4
          prose-table:border-collapse prose-table:w-full prose-table:my-6 prose-table:text-sm
          prose-th:bg-gray-50 dark:prose-th:bg-gray-900/40 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-gray-200 dark:prose-th:border-gray-700
          prose-td:p-3 prose-td:border-b prose-td:border-gray-100 dark:prose-td:border-gray-800 prose-td:align-top
          prose-tr:hover:bg-gray-50/50 dark:prose-tr:hover:bg-gray-900/30 prose-tr:transition-colors
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:my-4
          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-2`}>
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={components}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(MarkdownRenderer);
